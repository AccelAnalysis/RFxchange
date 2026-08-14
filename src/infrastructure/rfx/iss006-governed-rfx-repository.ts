import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  PerformanceLocation,
  RfxAggregate,
  RfxCommandReceipt,
  RfxId,
} from "../../domain/rfx/model.ts";
import {
  RfxPersistenceConflictError,
  type RfxPersistenceBundle,
  type RfxPublicationPersistenceBundle,
  type RfxRepository,
} from "../../domain/rfx/repository.ts";
import { FIRESTORE_SCHEMA_VERSION } from "../firestore/schema.ts";

const AGGREGATES = "rfxAggregates";
const EVENTS = "rfxEvents";
const COMMANDS = "rfxCommands";
const AUDITS = "organizationAuditEvents";
const GEOGRAPHIES = "geographies";

function immutable(value: object) {
  return Object.freeze({
    ...value,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    persistedAt: FieldValue.serverTimestamp(),
  });
}

function mutable(value: object) {
  return Object.freeze({
    ...value,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
    persistedAt: FieldValue.serverTimestamp(),
    persistenceUpdatedAt: FieldValue.serverTimestamp(),
  });
}

function exactReplay(
  prior: RfxCommandReceipt,
  command: RfxCommandReceipt,
): boolean {
  return (
    prior.issuerOrganizationId === command.issuerOrganizationId &&
    prior.rfxId === command.rfxId &&
    prior.action === command.action &&
    prior.requestFingerprint === command.requestFingerprint &&
    prior.resultingVersion === command.resultingVersion
  );
}

function localityIds(location: PerformanceLocation | null): readonly string[] {
  if (!location) return Object.freeze([]);
  if (location.mode === "multiple") {
    return Object.freeze([
      ...new Set(location.locations.map((item) => item.localityId)),
    ]);
  }
  return Object.freeze([location.localityId]);
}

/**
 * Packet-owned repository adapter for ISS-006 package saves.
 *
 * All non-package operations delegate unchanged to the canonical Firestore RFx
 * repository. Package persistence mirrors its existing atomic save semantics,
 * adding only current `released` geography reads in the same transaction. The
 * command receipt is read first so exact replay can return without consulting
 * geography that may legitimately have changed after the original commit.
 */
export class Iss006GovernedRfxRepository implements RfxRepository {
  constructor(
    private readonly db: Firestore,
    private readonly base: RfxRepository,
  ) {}

  getById(id: RfxId) {
    return this.base.getById(id);
  }

  listByIssuerOrganizationId(organizationId: OrganizationId) {
    return this.base.listByIssuerOrganizationId(organizationId);
  }

  getCommand(id: string) {
    return this.base.getCommand(id);
  }

  getPublicationSnapshot(id: string) {
    return this.base.getPublicationSnapshot(id);
  }

  getProjection(reference: string) {
    return this.base.getProjection(reference);
  }

  publish(bundle: RfxPublicationPersistenceBundle) {
    return this.base.publish(bundle);
  }

  async save(bundle: RfxPersistenceBundle): Promise<"created" | "replayed"> {
    if (
      bundle.event.kind !== "rfx-package-saved" ||
      bundle.command.action !== "save-package" ||
      bundle.expectedVersion === null
    ) {
      return this.base.save(bundle);
    }

    const aggregateRef = this.db.collection(AGGREGATES).doc(bundle.aggregate.id);
    const eventRef = this.db.collection(EVENTS).doc(bundle.event.id);
    const commandRef = this.db.collection(COMMANDS).doc(bundle.command.id);
    const auditRef = this.db.collection(AUDITS).doc(bundle.audit.id);
    const geographyRefs = localityIds(
      bundle.aggregate.package?.performanceLocation ?? null,
    ).map((id) => this.db.collection(GEOGRAPHIES).doc(id));

    return this.db.runTransaction(async (transaction) => {
      // Replay recovery intentionally precedes current geography reads.
      const commandSnapshot = await transaction.get(commandRef);
      if (commandSnapshot.exists) {
        const prior = commandSnapshot.data() as RfxCommandReceipt;
        if (exactReplay(prior, bundle.command)) return "replayed" as const;
        throw new RfxPersistenceConflictError("RFx command identity collision.");
      }

      const records = await transaction.getAll(
        aggregateRef,
        eventRef,
        auditRef,
        ...geographyRefs,
      );
      const [aggregateSnapshot, eventSnapshot, auditSnapshot, ...geographySnapshots] =
        records;

      if (eventSnapshot.exists || auditSnapshot.exists) {
        throw new RfxPersistenceConflictError("RFx evidence identity collision.");
      }
      if (!aggregateSnapshot.exists) {
        throw new RfxPersistenceConflictError(
          "RFx draft is unavailable for this change.",
        );
      }
      const current = aggregateSnapshot.data() as RfxAggregate;
      if (
        current.issuerOrganizationId !== bundle.aggregate.issuerOrganizationId ||
        current.version !== bundle.expectedVersion ||
        bundle.aggregate.version !== bundle.expectedVersion + 1
      ) {
        throw new RfxPersistenceConflictError(
          `RFx changed; current version is ${current.version}.`,
        );
      }

      for (const geographySnapshot of geographySnapshots) {
        const geography = geographySnapshot.data() as
          | { releaseState?: string }
          | undefined;
        if (
          !geographySnapshot.exists ||
          !geography ||
          geography.releaseState !== "released"
        ) {
          throw new RfxPersistenceConflictError(
            "RFx package performance locality authority changed.",
          );
        }
      }

      transaction.set(aggregateRef, mutable(bundle.aggregate));
      transaction.create(eventRef, immutable(bundle.event));
      transaction.create(commandRef, immutable(bundle.command));
      transaction.create(auditRef, immutable(bundle.audit));
      return "created" as const;
    });
  }
}
