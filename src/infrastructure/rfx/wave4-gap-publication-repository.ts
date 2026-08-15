import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { ConfirmedOrganizationLocation } from "../../domain/organization-location/model.ts";
import type { OrganizationId, OrganizationProfile } from "../../domain/organizations/model.ts";
import {
  performanceLocationFromConfirmed,
  type PerformanceLocation,
  type PerformanceLocationItem,
  type RfxAggregate,
  type RfxCommandReceipt,
  type RfxId,
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
const SNAPSHOTS = "rfxPublicationSnapshots";
const PROJECTIONS = "rfxOpportunityProjections";
const GEOGRAPHIES = "geographies";
const ORGANIZATIONS = "organizations";
const ORGANIZATION_PROFILES = "organizationProfiles";
const ORGANIZATION_LOCATIONS = "organizationLocations";
const MEMBERSHIPS = "organizationMemberships";
const AUTHORIZATIONS = "organizationAuthorizations";
const RESTRICTIONS = "accessRestrictions";

type OrganizationLocationBoundItem = Exclude<
  PerformanceLocationItem,
  Readonly<{ mode: "locality" }>
>;

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

function exactReplay(prior: RfxCommandReceipt, command: RfxCommandReceipt): boolean {
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

function locationItems(location: PerformanceLocation | null): readonly PerformanceLocationItem[] {
  if (!location) return Object.freeze([]);
  return location.mode === "multiple" ? location.locations : Object.freeze([location]);
}

function organizationLocationItems(
  location: PerformanceLocation | null,
): readonly OrganizationLocationBoundItem[] {
  return Object.freeze(
    locationItems(location).filter(
      (item): item is OrganizationLocationBoundItem => item.mode !== "locality",
    ),
  );
}

function sameOrganizationLocationProjection(
  item: OrganizationLocationBoundItem,
  current: ConfirmedOrganizationLocation,
): boolean {
  const expected = performanceLocationFromConfirmed({
    mode: item.mode,
    organizationLocationId: String(current.id),
    geographyId: String(current.geographyId),
    coordinate: current.coordinate,
    physicalAddress: current.physicalAddress,
    provenance: current.geocodeProvenance,
  });
  if (
    expected.mode !== item.mode ||
    expected.localityId !== item.localityId ||
    expected.point.longitude !== item.point.longitude ||
    expected.point.latitude !== item.point.latitude ||
    expected.geocodeProvenance.provider !== item.geocodeProvenance.provider ||
    expected.geocodeProvenance.providerReference !== item.geocodeProvenance.providerReference ||
    expected.geocodeProvenance.benchmark !== item.geocodeProvenance.benchmark ||
    expected.geocodeProvenance.retrievedAt !== item.geocodeProvenance.retrievedAt
  ) return false;
  if (expected.mode === "exact-address" && item.mode === "exact-address") {
    return expected.normalizedAddress === item.normalizedAddress;
  }
  if (expected.mode !== "exact-address" && item.mode !== "exact-address") {
    return expected.organizationLocationId === item.organizationLocationId;
  }
  return false;
}

export class Wave4GapPublicationRepository implements RfxRepository {
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

  save(bundle: RfxPersistenceBundle) {
    return this.base.save(bundle);
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
    const organizationRef = this.db
      .collection(ORGANIZATIONS)
      .doc(bundle.aggregate.issuerOrganizationId);
    const membershipRef = this.db
      .collection(MEMBERSHIPS)
      .doc(bundle.event.actorMembershipId);
    const authorizationRef = this.db
      .collection(AUTHORIZATIONS)
      .doc(bundle.event.actorMembershipId);
    const profileQuery = this.db
      .collection(ORGANIZATION_PROFILES)
      .where("organizationId", "==", bundle.aggregate.issuerOrganizationId)
      .limit(2);
    const boundLocationItems = organizationLocationItems(
      bundle.aggregate.package?.performanceLocation ?? null,
    );
    const organizationLocationRef = boundLocationItems.length
      ? this.db
          .collection(ORGANIZATION_LOCATIONS)
          .doc(String(bundle.aggregate.issuerOrganizationId))
      : null;

    return this.db.runTransaction(async (transaction) => {
      // Exact replay remains recoverable even if mutable publication inputs later change.
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
        snapshotRef,
        projectionRef,
        organizationRef,
        membershipRef,
        authorizationRef,
        ...geographyRefs,
      );
      const [
        aggregateSnapshot,
        eventSnapshot,
        auditSnapshot,
        publicationSnapshot,
        projectionSnapshot,
        organizationSnapshot,
        membershipSnapshot,
        authorizationSnapshot,
        ...geographySnapshots
      ] = records;
      const [
        organizationRestrictions,
        membershipRestrictions,
        profileSnapshots,
        organizationLocationSnapshot,
      ] = await Promise.all([
        transaction.get(
          this.db
            .collection(RESTRICTIONS)
            .where("target.kind", "==", "organization")
            .where("target.organizationId", "==", bundle.aggregate.issuerOrganizationId),
        ),
        transaction.get(
          this.db
            .collection(RESTRICTIONS)
            .where("target.kind", "==", "membership")
            .where("target.membershipId", "==", bundle.event.actorMembershipId),
        ),
        transaction.get(profileQuery),
        organizationLocationRef ? transaction.get(organizationLocationRef) : Promise.resolve(null),
      ]);

      if (
        eventSnapshot.exists ||
        auditSnapshot.exists ||
        publicationSnapshot.exists ||
        projectionSnapshot.exists
      ) {
        throw new RfxPersistenceConflictError(
          "RFx publication evidence identity collision.",
        );
      }
      if (!aggregateSnapshot.exists) {
        throw new RfxPersistenceConflictError(
          "RFx draft is unavailable for publication.",
        );
      }

      const current = currentAggregate(aggregateSnapshot.data() as RfxAggregate);
      const membership = membershipSnapshot.data() as
        | { id?: string; userId?: string; organizationId?: string; status?: string }
        | undefined;
      const authorization = authorizationSnapshot.data() as
        | {
            membershipId?: string;
            userId?: string;
            organizationId?: string;
            permissions?: readonly string[];
          }
        | undefined;
      const restricted = [
        ...organizationRestrictions.docs,
        ...membershipRestrictions.docs,
      ].some((record) => record.get("state") !== "none");
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
      ) {
        throw new RfxPersistenceConflictError("RFx publication authority changed.");
      }
      if (
        current.issuerOrganizationId !== bundle.aggregate.issuerOrganizationId ||
        current.lifecycleState !== "draft" ||
        current.version !== bundle.expectedVersion ||
        bundle.aggregate.lifecycleState !== "published" ||
        bundle.aggregate.version !== bundle.expectedVersion + 1
      ) {
        throw new RfxPersistenceConflictError(
          `RFx changed; current version is ${current.version}.`,
        );
      }

      if (profileSnapshots.size !== 1) {
        throw new RfxPersistenceConflictError("RFx publication organization profile changed.");
      }
      const profile = profileSnapshots.docs[0]?.data() as OrganizationProfile | undefined;
      if (
        !profile ||
        profile.organizationId !== bundle.aggregate.issuerOrganizationId ||
        !profile.displayName?.trim() ||
        profile.displayName.trim() !== bundle.projection.payload.issuerDisplayName.trim()
      ) {
        throw new RfxPersistenceConflictError("RFx publication organization profile changed.");
      }

      if (boundLocationItems.length) {
        if (!organizationLocationSnapshot?.exists) {
          throw new RfxPersistenceConflictError("RFx publication organization location changed.");
        }
        const location = organizationLocationSnapshot.data() as ConfirmedOrganizationLocation;
        if (
          String(location.organizationId) !== String(bundle.aggregate.issuerOrganizationId) ||
          !boundLocationItems.every((item) =>
            sameOrganizationLocationProjection(item, location),
          )
        ) {
          throw new RfxPersistenceConflictError("RFx publication organization location changed.");
        }
      }

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
        ) {
          throw new RfxPersistenceConflictError("RFx publication geography changed.");
        }
      }

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
