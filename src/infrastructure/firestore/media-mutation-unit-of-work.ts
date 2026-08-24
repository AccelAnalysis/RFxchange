import {
  FieldValue,
  Timestamp,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
} from "firebase-admin/firestore";

import type {
  GovernedMediaMutationBundle,
  GovernedMediaMutationCommand,
} from "../../domain/media/mutation.ts";
import type { GovernedMediaMutationUnitOfWork } from "../../domain/media/repository.ts";
import type {
  OrganizationIntroductionMedia,
  PublicMediaProjection,
  RfxAttachmentReference,
} from "../../domain/media/model.ts";
import { FIRESTORE_SCHEMA_VERSION, firestoreDocumentPath } from "./schema.ts";
import { governedMediaDocumentPath } from "./media-schema.ts";

function normalize(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, normalize(nested)]),
    );
  }
  return value;
}

function record<T extends object>(snapshot: DocumentSnapshot): T | null {
  if (!snapshot.exists) return null;
  const data = normalize(snapshot.data()) as Record<string, unknown> | undefined;
  if (!data) return null;
  delete data.schemaVersion;
  delete data.persistedAt;
  delete data.createdAtServer;
  return data as T;
}

function payload(value: object) {
  return {
    ...value,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    persistedAt: FieldValue.serverTimestamp(),
  };
}

function immutablePayload(value: object) {
  return {
    ...value,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    createdAtServer: FieldValue.serverTimestamp(),
  };
}

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertImmutable(
  existing: Readonly<Record<string, unknown>>,
  next: Readonly<Record<string, unknown>>,
  fields: readonly string[],
  label: string,
): void {
  for (const field of fields) {
    if (!same(existing[field], next[field])) {
      throw new Error(`${label} cannot change immutable field ${field}.`);
    }
  }
}

function assertStatusTransition(previous: string, next: string, label: string): void {
  if (previous === next) return;
  const allowed = previous === "draft"
    ? ["published", "withdrawn"]
    : previous === "published"
      ? ["withdrawn"]
      : [];
  if (!allowed.includes(next)) {
    throw new Error(`${label} has an invalid ${previous} to ${next} transition.`);
  }
}

function targetRef(db: Firestore, bundle: GovernedMediaMutationBundle): DocumentReference {
  const { record: mutationRecord } = bundle;
  const key = mutationRecord.kind === "public-media"
    ? "publicMediaProjections"
    : mutationRecord.kind === "introduction"
      ? "organizationIntroductionMedia"
      : "rfxAttachmentReferences";
  return db.doc(governedMediaDocumentPath(key, mutationRecord.value.id));
}

function commandMatches(
  prior: GovernedMediaMutationCommand,
  next: GovernedMediaMutationCommand,
): boolean {
  return prior.organizationId === next.organizationId
    && prior.action === next.action
    && prior.targetId === next.targetId
    && prior.requestFingerprint === next.requestFingerprint
    && prior.actorUserId === next.actorUserId
    && prior.actorMembershipId === next.actorMembershipId;
}

export class FirestoreGovernedMediaMutationUnitOfWork
  implements GovernedMediaMutationUnitOfWork
{
  constructor(private readonly db: Firestore) {}

  async getCommand(id: string): Promise<GovernedMediaMutationCommand | null> {
    return record<GovernedMediaMutationCommand>(
      await this.db.doc(governedMediaDocumentPath("mediaMutationCommands", id)).get(),
    );
  }

  async commit(bundle: GovernedMediaMutationBundle): Promise<"created" | "replayed"> {
    const commandRef = this.db.doc(
      governedMediaDocumentPath("mediaMutationCommands", bundle.command.id),
    );
    const eventRef = this.db.doc(
      governedMediaDocumentPath("mediaMutationEvents", bundle.event.id),
    );
    const auditRef = this.db.doc(
      firestoreDocumentPath("organizationAuditEvents", bundle.audit.id),
    );
    const recordRef = targetRef(this.db, bundle);
    const slotRef = bundle.record.kind === "introduction"
      ? this.db.doc(
          governedMediaDocumentPath(
            "organizationIntroductionPublishedSlots",
            bundle.record.value.organizationId,
          ),
        )
      : null;

    return this.db.runTransaction(async (transaction) => {
      const snapshots = await transaction.getAll(
        commandRef,
        eventRef,
        auditRef,
        recordRef,
        ...(slotRef ? [slotRef] : []),
      );
      const [commandSnapshot, eventSnapshot, auditSnapshot, targetSnapshot, slotSnapshot] = snapshots;
      const priorCommand = record<GovernedMediaMutationCommand>(commandSnapshot);
      if (priorCommand) {
        if (commandMatches(priorCommand, bundle.command)) return "replayed" as const;
        throw new Error("Governed media command identity collision.");
      }
      if (eventSnapshot.exists || auditSnapshot.exists) {
        throw new Error("Governed media event or audit identity collision.");
      }
      if (
        bundle.event.organizationId !== bundle.command.organizationId
        || bundle.audit.organizationId !== bundle.command.organizationId
        || bundle.record.value.organizationId !== bundle.command.organizationId
        || bundle.event.commandId !== bundle.command.id
        || bundle.event.targetId !== bundle.command.targetId
        || bundle.record.value.id !== bundle.command.targetId
      ) {
        throw new Error("Governed media mutation inputs have mismatched identity or Organization scope.");
      }

      if (bundle.record.mode === "create") {
        if (targetSnapshot.exists) {
          throw new Error("Governed media target already exists without matching command evidence.");
        }
        transaction.create(recordRef, payload(bundle.record.value));
      } else {
        if (!targetSnapshot.exists) {
          throw new Error("Governed media target disappeared before mutation.");
        }
        if (bundle.record.kind === "public-media") {
          const existing = record<PublicMediaProjection>(targetSnapshot)!;
          const next = bundle.record.value;
          assertImmutable(
            existing as unknown as Record<string, unknown>,
            next as unknown as Record<string, unknown>,
            [
              "id", "organizationId", "kind", "sourceAssetId", "sourceAssetSha256",
              "contentType", "sizeBytes", "createdByUserId", "createdAt",
            ],
            "Public media projection",
          );
          assertStatusTransition(existing.status, next.status, "Public media projection");
        } else if (bundle.record.kind === "introduction") {
          const existing = record<OrganizationIntroductionMedia>(targetSnapshot)!;
          const next = bundle.record.value;
          assertImmutable(
            existing as unknown as Record<string, unknown>,
            next as unknown as Record<string, unknown>,
            ["id", "organizationId", "source", "createdByUserId", "createdAt"],
            "Organization introduction media",
          );
          assertStatusTransition(existing.status, next.status, "Organization introduction media");
        } else {
          const existing = record<RfxAttachmentReference>(targetSnapshot)!;
          const next = bundle.record.value;
          assertImmutable(
            existing as unknown as Record<string, unknown>,
            next as unknown as Record<string, unknown>,
            [
              "id", "organizationId", "rfxId", "assetId", "assetSha256", "displayName",
              "purpose", "audience", "createdByUserId", "createdAt",
            ],
            "RFx attachment reference",
          );
          if (
            !(existing.status === "attached"
              && next.status === "removed"
              && next.revision === existing.revision + 1)
          ) {
            throw new Error("RFx attachment reference requires one attached-to-removed revision.");
          }
        }
        transaction.set(recordRef, payload(bundle.record.value));
      }

      if (bundle.record.kind === "introduction" && slotRef) {
        const media = bundle.record.value;
        const slot = slotSnapshot?.exists
          ? normalize(slotSnapshot.data()) as { organizationId?: string; mediaId?: string }
          : null;
        if (media.status === "published") {
          if (slot?.mediaId && slot.mediaId !== media.id) {
            throw new Error("Organization already has another published introduction media record.");
          }
          transaction.set(slotRef, payload({
            id: media.organizationId,
            organizationId: media.organizationId,
            mediaId: media.id,
          }));
        } else if (media.status === "withdrawn" && slot?.mediaId === media.id) {
          transaction.delete(slotRef);
        }
      }

      transaction.create(eventRef, immutablePayload(bundle.event));
      transaction.create(auditRef, immutablePayload(bundle.audit));
      transaction.create(commandRef, immutablePayload(bundle.command));
      return "created" as const;
    });
  }
}
