import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  RfxAggregate,
  RfxCommandReceipt,
  RfxId,
} from "../../domain/rfx/model.ts";
import type {
  ResponderOpportunityProjection,
  RfxPublicationSnapshot,
} from "../../domain/rfx/publication.ts";
import {
  RfxPersistenceConflictError,
  type RfxPersistenceBundle,
  type RfxPublicationPersistenceBundle,
  type RfxRepository,
} from "../../domain/rfx/repository.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";
import { getFirestoreRecordById, listFirestoreRecords } from "./support.ts";

const AGGREGATES = "rfxAggregates";
const EVENTS = "rfxEvents";
const COMMANDS = "rfxCommands";
const AUDITS = "organizationAuditEvents";
const SNAPSHOTS = "rfxPublicationSnapshots";
const PROJECTIONS = "rfxOpportunityProjections";
const GEOGRAPHIES = "geographies";
const ORGANIZATIONS = "organizations";
const MEMBERSHIPS = "organizationMemberships";
const AUTHORIZATIONS = "organizationAuthorizations";
const RESTRICTIONS = "accessRestrictions";

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

function currentAggregate(record: RfxAggregate): RfxAggregate {
  return record.package === undefined || record.definition === undefined
    ? Object.freeze({
        ...record,
        package: record.package ?? null,
        definition: record.definition ?? null,
      })
    : record;
}

function definitionGeographyQualifierIds(aggregate: RfxAggregate): readonly string[] {
  if (!aggregate.definition) return Object.freeze([]);
  return Object.freeze([
    ...new Set(
      aggregate.definition.requirements.flatMap((requirement) =>
        requirement.qualifiers.flatMap((qualifier) =>
          qualifier.kind === "geography" ? [...qualifier.localityIds] : [],
        ),
      ),
    ),
  ]);
}

function assertReleasedQualifierGeographies(
  snapshots: readonly FirebaseFirestore.DocumentSnapshot[],
): void {
  for (const snapshot of snapshots) {
    if (!snapshot.exists || snapshot.get("releaseState") !== "released") {
      throw new RfxPersistenceConflictError(
        "RFx definition geography qualifier authority changed.",
      );
    }
  }
}

function comparableTimestamp(value: unknown): string | null {
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return null;
}

export class FirestoreRfxRepository implements RfxRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  getById(id: RfxId) {
    return getFirestoreRecordById<RfxAggregate>(
      this.db,
      "rfxAggregates",
      id,
    ).then((record) => (record ? currentAggregate(record) : null));
  }

  listByIssuerOrganizationId(organizationId: OrganizationId) {
    return listFirestoreRecords<RfxAggregate>(
      this.db
        .collection(AGGREGATES)
        .where("issuerOrganizationId", "==", organizationId),
      "rfxAggregates",
    ).then((records) =>
      Object.freeze(
        [...records]
          .map(currentAggregate)
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
      ),
    );
  }

  getCommand(id: string) {
    return getFirestoreRecordById<RfxCommandReceipt>(
      this.db,
      "rfxCommands",
      id,
    );
  }

  getPublicationSnapshot(id: string) {
    return getFirestoreRecordById<RfxPublicationSnapshot>(
      this.db,
      SNAPSHOTS,
      id,
    );
  }

  getProjection(reference: string) {
    return getFirestoreRecordById<ResponderOpportunityProjection>(
      this.db,
      PROJECTIONS,
      reference,
    );
  }

  async save(bundle: RfxPersistenceBundle): Promise<"created" | "replayed"> {
    const aggregateRef = this.db
      .collection(AGGREGATES)
      .doc(bundle.aggregate.id);
    const eventRef = this.db.collection(EVENTS).doc(bundle.event.id);
    const commandRef = this.db.collection(COMMANDS).doc(bundle.command.id);
    const auditRef = this.db.collection(AUDITS).doc(bundle.audit.id);
    const qualifierGeographyRefs = definitionGeographyQualifierIds(bundle.aggregate).map((id) =>
      this.db.collection(GEOGRAPHIES).doc(id),
    );

    return this.db.runTransaction(async (transaction) => {
      const records = await transaction.getAll(
        commandRef,
        aggregateRef,
        eventRef,
        auditRef,
        ...qualifierGeographyRefs,
      );
      const [commandSnapshot, aggregateSnapshot, eventSnapshot, auditSnapshot, ...qualifierGeographySnapshots] = records;

      if (commandSnapshot.exists) {
        const prior = commandSnapshot.data() as RfxCommandReceipt;
        if (exactReplay(prior, bundle.command)) return "replayed" as const;
        throw new RfxPersistenceConflictError(
          "RFx command identity collision.",
        );
      }
      if (eventSnapshot.exists || auditSnapshot.exists) {
        throw new RfxPersistenceConflictError(
          "RFx evidence identity collision.",
        );
      }

      assertReleasedQualifierGeographies(qualifierGeographySnapshots);

      if (bundle.expectedVersion === null) {
        if (
          aggregateSnapshot.exists ||
          bundle.aggregate.version !== 1 ||
          bundle.event.kind !== "rfx-draft-created"
        ) {
          throw new RfxPersistenceConflictError(
            "RFx draft identity already exists.",
          );
        }
        transaction.create(aggregateRef, mutable(bundle.aggregate));
      } else {
        if (!aggregateSnapshot.exists) {
          throw new RfxPersistenceConflictError(
            "RFx draft is unavailable for this change.",
          );
        }
        const current = aggregateSnapshot.data() as RfxAggregate;
        if (
          current.issuerOrganizationId !==
            bundle.aggregate.issuerOrganizationId ||
          current.version !== bundle.expectedVersion ||
          bundle.aggregate.version !== bundle.expectedVersion + 1
        ) {
          throw new RfxPersistenceConflictError(
            `RFx changed; current version is ${current.version}.`,
          );
        }
        transaction.set(aggregateRef, mutable(bundle.aggregate));
      }

      transaction.create(eventRef, immutable(bundle.event));
      transaction.create(commandRef, immutable(bundle.command));
      transaction.create(auditRef, immutable(bundle.audit));
      return "created" as const;
    });
  }

  async publish(
    bundle: RfxPublicationPersistenceBundle,
  ): Promise<"created" | "replayed"> {
    const aggregateRef = this.db.collection(AGGREGATES).doc(bundle.aggregate.id);
    const eventRef = this.db.collection(EVENTS).doc(bundle.event.id);
    const commandRef = this.db.collection(COMMANDS).doc(bundle.command.id);
    const auditRef = this.db.collection(AUDITS).doc(bundle.audit.id);
    const snapshotRef = this.db.collection(SNAPSHOTS).doc(bundle.snapshot.id);
    const projectionRef = this.db.collection(PROJECTIONS).doc(bundle.projection.reference);
    const geographyRefs = bundle.expectedGeographies.map((item) =>
      this.db.collection(GEOGRAPHIES).doc(item.id),
    );
    const qualifierGeographyRefs = definitionGeographyQualifierIds(bundle.aggregate).map((id) =>
      this.db.collection(GEOGRAPHIES).doc(id),
    );
    const organizationRef = this.db.collection(ORGANIZATIONS).doc(bundle.aggregate.issuerOrganizationId);
    const membershipRef = this.db.collection(MEMBERSHIPS).doc(bundle.event.actorMembershipId);
    const authorizationRef = this.db.collection(AUTHORIZATIONS).doc(bundle.event.actorMembershipId);

    return this.db.runTransaction(async (transaction) => {
      const records = await transaction.getAll(
        commandRef,
        aggregateRef,
        eventRef,
        auditRef,
        snapshotRef,
        projectionRef,
        organizationRef,
        membershipRef,
        authorizationRef,
        ...geographyRefs,
        ...qualifierGeographyRefs,
      );
      const coreCount = 9;
      const [commandSnapshot, aggregateSnapshot, eventSnapshot, auditSnapshot,
        publicationSnapshot, projectionSnapshot, organizationSnapshot,
        membershipSnapshot, authorizationSnapshot] = records.slice(0, coreCount);
      const geographySnapshots = records.slice(coreCount, coreCount + geographyRefs.length);
      const qualifierGeographySnapshots = records.slice(coreCount + geographyRefs.length);
      const [organizationRestrictions, membershipRestrictions] = await Promise.all([
        transaction.get(
          this.db.collection(RESTRICTIONS)
            .where("target.kind", "==", "organization")
            .where("target.organizationId", "==", bundle.aggregate.issuerOrganizationId),
        ),
        transaction.get(
          this.db.collection(RESTRICTIONS)
            .where("target.kind", "==", "membership")
            .where("target.membershipId", "==", bundle.event.actorMembershipId),
        ),
      ]);
      if (commandSnapshot.exists) {
        const prior = commandSnapshot.data() as RfxCommandReceipt;
        if (exactReplay(prior, bundle.command)) return "replayed" as const;
        throw new RfxPersistenceConflictError("RFx command identity collision.");
      }
      if (
        eventSnapshot.exists ||
        auditSnapshot.exists ||
        publicationSnapshot.exists ||
        projectionSnapshot.exists
      ) throw new RfxPersistenceConflictError("RFx publication evidence identity collision.");
      if (!aggregateSnapshot.exists)
        throw new RfxPersistenceConflictError("RFx draft is unavailable for publication.");
      const current = currentAggregate(aggregateSnapshot.data() as RfxAggregate);
      const membership = membershipSnapshot.data() as
        | { id?: string; userId?: string; organizationId?: string; status?: string }
        | undefined;
      const authorization = authorizationSnapshot.data() as
        | { membershipId?: string; userId?: string; organizationId?: string; permissions?: readonly string[] }
        | undefined;
      const restricted = [...organizationRestrictions.docs, ...membershipRestrictions.docs]
        .some((record) => record.get("state") !== "none");
      if (
        !organizationSnapshot.exists ||
        !membershipSnapshot.exists ||
        !authorizationSnapshot.exists ||
        !membership ||
        membership.userId !== bundle.event.actorUserId ||
        membership.organizationId !== bundle.aggregate.issuerOrganizationId ||
        membership.status !== "active" ||
        !authorization ||
        authorization.membershipId !== bundle.event.actorMembershipId ||
        authorization.userId !== bundle.event.actorUserId ||
        authorization.organizationId !== bundle.aggregate.issuerOrganizationId ||
        !authorization.permissions?.includes("rfx.publish") ||
        restricted
      ) throw new RfxPersistenceConflictError("RFx publication authority changed.");
      if (
        current.issuerOrganizationId !== bundle.aggregate.issuerOrganizationId ||
        current.lifecycleState !== "draft" ||
        current.version !== bundle.expectedVersion ||
        bundle.aggregate.lifecycleState !== "published" ||
        bundle.aggregate.version !== bundle.expectedVersion + 1
      ) throw new RfxPersistenceConflictError(`RFx changed; current version is ${current.version}.`);
      for (const [index, geographySnapshot] of geographySnapshots.entries()) {
        const expected = bundle.expectedGeographies[index];
        const geography = geographySnapshot.data() as
          | { releaseState?: string; updatedAt?: unknown }
          | undefined;
        if (
          !geographySnapshot.exists ||
          !geography ||
          geography.releaseState !== "released" ||
          comparableTimestamp(geography.updatedAt) !==
            comparableTimestamp(expected.authorityUpdatedAt)
        ) throw new RfxPersistenceConflictError("RFx publication geography changed.");
      }
      assertReleasedQualifierGeographies(qualifierGeographySnapshots);

      transaction.set(aggregateRef, mutable(bundle.aggregate));
      transaction.create(snapshotRef, immutable(bundle.snapshot));
      transaction.create(projectionRef, immutable(bundle.projection));
      transaction.create(eventRef, immutable(bundle.event));
      transaction.create(commandRef, immutable(bundle.command));
      transaction.create(auditRef, immutable(bundle.audit));
      return "created" as const;
    });
  }
}
