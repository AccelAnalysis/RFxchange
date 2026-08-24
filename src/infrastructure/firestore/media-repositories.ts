import {
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
  type Firestore,
} from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  OrganizationIntroductionMedia,
  OrganizationIntroductionMediaId,
  PublicMediaProjection,
  PublicMediaProjectionId,
  RfxAttachmentReference,
  RfxAttachmentReferenceId,
} from "../../domain/media/model.ts";
import type {
  OrganizationIntroductionMediaRepository,
  PublicMediaProjectionRepository,
  RfxAttachmentReferenceRepository,
} from "../../domain/media/repository.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";
import {
  governedMediaCollectionName,
  governedMediaDocumentPath,
} from "./media-schema.ts";

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

function record<T extends object>(snapshot: DocumentSnapshot, label: string): T | null {
  if (!snapshot.exists) return null;
  const data = normalize(snapshot.data()) as Record<string, unknown> | undefined;
  if (!data) return null;
  delete data.schemaVersion;
  delete data.persistedAt;
  if (data.id !== snapshot.id) {
    throw new Error(`${label} Firestore identity is inconsistent.`);
  }
  return data as T;
}

function payload(value: object) {
  return {
    ...value,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    persistedAt: FieldValue.serverTimestamp(),
  };
}

function same(value: unknown): string {
  return JSON.stringify(value);
}

function assertImmutable(
  existing: Readonly<Record<string, unknown>>,
  next: Readonly<Record<string, unknown>>,
  fields: readonly string[],
  label: string,
): void {
  for (const field of fields) {
    if (same(existing[field]) !== same(next[field])) {
      throw new Error(`${label} cannot change immutable field ${field}.`);
    }
  }
}

function assertStatusTransition(
  previous: string,
  next: string,
  label: string,
): void {
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

export class FirestorePublicMediaProjectionRepository
  implements PublicMediaProjectionRepository
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getById(id: PublicMediaProjectionId): Promise<PublicMediaProjection | null> {
    return record<PublicMediaProjection>(
      await this.db.doc(governedMediaDocumentPath("publicMediaProjections", id)).get(),
      "Public media projection",
    );
  }

  async listByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<readonly PublicMediaProjection[]> {
    const snapshot = await this.db
      .collection(governedMediaCollectionName("publicMediaProjections"))
      .where("organizationId", "==", organizationId)
      .get();
    return Object.freeze(
      snapshot.docs.map((document) => {
        const value = record<PublicMediaProjection>(document, "Public media projection");
        if (!value) throw new Error("Public media projection disappeared during read.");
        return value;
      }),
    );
  }

  async create(projection: PublicMediaProjection): Promise<void> {
    await this.db
      .doc(governedMediaDocumentPath("publicMediaProjections", projection.id))
      .create(payload(projection));
  }

  async save(projection: PublicMediaProjection): Promise<void> {
    const ref = this.db.doc(
      governedMediaDocumentPath("publicMediaProjections", projection.id),
    );
    await this.db.runTransaction(async (transaction) => {
      const existing = record<PublicMediaProjection>(
        await transaction.get(ref),
        "Public media projection",
      );
      if (!existing) throw new Error("Public media projection does not exist.");
      assertImmutable(
        existing as unknown as Record<string, unknown>,
        projection as unknown as Record<string, unknown>,
        [
          "id",
          "organizationId",
          "kind",
          "sourceAssetId",
          "sourceAssetSha256",
          "contentType",
          "sizeBytes",
          "createdByUserId",
          "createdAt",
        ],
        "Public media projection",
      );
      assertStatusTransition(existing.status, projection.status, "Public media projection");
      transaction.set(ref, payload(projection));
    });
  }
}

export class FirestoreOrganizationIntroductionMediaRepository
  implements OrganizationIntroductionMediaRepository
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getById(
    id: OrganizationIntroductionMediaId,
  ): Promise<OrganizationIntroductionMedia | null> {
    return record<OrganizationIntroductionMedia>(
      await this.db
        .doc(governedMediaDocumentPath("organizationIntroductionMedia", id))
        .get(),
      "Organization introduction media",
    );
  }

  async getPublishedByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationIntroductionMedia | null> {
    const slot = await this.db.doc(
      governedMediaDocumentPath("organizationIntroductionPublishedSlots", organizationId),
    ).get();
    if (slot.exists) {
      const slotData = normalize(slot.data()) as { mediaId?: string } | undefined;
      if (!slotData?.mediaId) {
        throw new Error("Organization introduction publication slot is inconsistent.");
      }
      return this.getById(slotData.mediaId as OrganizationIntroductionMediaId);
    }
    const snapshot = await this.db
      .collection(governedMediaCollectionName("organizationIntroductionMedia"))
      .where("organizationId", "==", organizationId)
      .where("status", "==", "published")
      .limit(2)
      .get();
    if (snapshot.size > 1) {
      throw new Error("Organization has more than one published introduction media record.");
    }
    return snapshot.empty
      ? null
      : record<OrganizationIntroductionMedia>(
          snapshot.docs[0],
          "Organization introduction media",
        );
  }

  async create(media: OrganizationIntroductionMedia): Promise<void> {
    await this.db
      .doc(governedMediaDocumentPath("organizationIntroductionMedia", media.id))
      .create(payload(media));
  }

  async save(media: OrganizationIntroductionMedia): Promise<void> {
    const ref = this.db.doc(
      governedMediaDocumentPath("organizationIntroductionMedia", media.id),
    );
    const slotRef = this.db.doc(
      governedMediaDocumentPath("organizationIntroductionPublishedSlots", media.organizationId),
    );
    await this.db.runTransaction(async (transaction) => {
      const [recordSnapshot, slotSnapshot] = await transaction.getAll(ref, slotRef);
      const existing = record<OrganizationIntroductionMedia>(
        recordSnapshot,
        "Organization introduction media",
      );
      if (!existing) throw new Error("Organization introduction media does not exist.");
      assertImmutable(
        existing as unknown as Record<string, unknown>,
        media as unknown as Record<string, unknown>,
        ["id", "organizationId", "source", "createdByUserId", "createdAt"],
        "Organization introduction media",
      );
      assertStatusTransition(existing.status, media.status, "Organization introduction media");
      const slot = slotSnapshot.exists
        ? normalize(slotSnapshot.data()) as { mediaId?: string }
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
      transaction.set(ref, payload(media));
    });
  }
}

export class FirestoreRfxAttachmentReferenceRepository
  implements RfxAttachmentReferenceRepository
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getById(
    id: RfxAttachmentReferenceId,
  ): Promise<RfxAttachmentReference | null> {
    return record<RfxAttachmentReference>(
      await this.db.doc(governedMediaDocumentPath("rfxAttachmentReferences", id)).get(),
      "RFx attachment reference",
    );
  }

  async listByRfxId(
    organizationId: OrganizationId,
    rfxId: string,
  ): Promise<readonly RfxAttachmentReference[]> {
    const snapshot = await this.db
      .collection(governedMediaCollectionName("rfxAttachmentReferences"))
      .where("organizationId", "==", organizationId)
      .where("rfxId", "==", rfxId)
      .get();
    return Object.freeze(
      snapshot.docs.map((document) => {
        const value = record<RfxAttachmentReference>(document, "RFx attachment reference");
        if (!value) throw new Error("RFx attachment reference disappeared during read.");
        return value;
      }),
    );
  }

  async create(reference: RfxAttachmentReference): Promise<void> {
    await this.db
      .doc(governedMediaDocumentPath("rfxAttachmentReferences", reference.id))
      .create(payload(reference));
  }

  async save(reference: RfxAttachmentReference): Promise<void> {
    const ref = this.db.doc(
      governedMediaDocumentPath("rfxAttachmentReferences", reference.id),
    );
    await this.db.runTransaction(async (transaction) => {
      const existing = record<RfxAttachmentReference>(
        await transaction.get(ref),
        "RFx attachment reference",
      );
      if (!existing) throw new Error("RFx attachment reference does not exist.");
      assertImmutable(
        existing as unknown as Record<string, unknown>,
        reference as unknown as Record<string, unknown>,
        [
          "id",
          "organizationId",
          "rfxId",
          "assetId",
          "assetSha256",
          "displayName",
          "purpose",
          "audience",
          "createdByUserId",
          "createdAt",
        ],
        "RFx attachment reference",
      );
      if (
        existing.status === "removed"
        && reference.status === "removed"
        && existing.revision === reference.revision
        && same(existing) === same(reference)
      ) {
        return;
      }
      if (
        reference.revision !== existing.revision + 1
        || existing.status !== "attached"
        || reference.status !== "removed"
      ) {
        throw new Error("RFx attachment reference requires one attached-to-removed revision.");
      }
      transaction.set(ref, payload(reference));
    });
  }
}
