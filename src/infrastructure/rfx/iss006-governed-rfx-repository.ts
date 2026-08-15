import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { GeographyDefinition } from "../../domain/geography/model.ts";
import type { ConfirmedOrganizationLocation } from "../../domain/organization-location/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
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
const GEOGRAPHIES = "geographies";
const ORGANIZATION_LOCATIONS = "organizationLocations";

type LocalityBoundItem = Extract<
  PerformanceLocationItem,
  Readonly<{ mode: "locality" }>
>;
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

function locationItems(location: PerformanceLocation | null): readonly PerformanceLocationItem[] {
  if (!location) return Object.freeze([]);
  return location.mode === "multiple"
    ? location.locations
    : Object.freeze([location]);
}

function localityIds(location: PerformanceLocation | null): readonly string[] {
  return Object.freeze([
    ...new Set(locationItems(location).map((item) => item.localityId)),
  ]);
}

function localitySnapshotItems(
  location: PerformanceLocation | null,
): readonly LocalityBoundItem[] {
  return Object.freeze(
    locationItems(location).filter(
      (item): item is LocalityBoundItem => item.mode === "locality",
    ),
  );
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

function sameBounds(
  left: LocalityBoundItem["localityBounds"],
  right: GeographyDefinition["bounds"],
): boolean {
  return (
    left.west === right.west &&
    left.south === right.south &&
    left.east === right.east &&
    left.north === right.north
  );
}

function sameLocalityProjection(
  item: LocalityBoundItem,
  current: GeographyDefinition,
): boolean {
  return (
    String(current.id) === item.localityId &&
    current.releaseState === "released" &&
    current.name === item.localityLabel &&
    sameBounds(item.localityBounds, current.bounds)
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

/**
 * Packet-owned repository adapter for ISS-006 package saves.
 *
 * All non-package operations delegate unchanged to the canonical Firestore RFx
 * repository. Package persistence mirrors its existing atomic save semantics,
 * adding current `released` geography reads plus exact locality label/bounds
 * binding and, when the package uses an organization-derived performance
 * location, a current organization-location snapshot read in the same
 * transaction. The command receipt is read first so exact replay can return
 * without consulting authority that may legitimately have changed after the
 * original commit.
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
    const performanceLocation = bundle.aggregate.package?.performanceLocation ?? null;
    const geographyRefs = localityIds(performanceLocation).map((id) =>
      this.db.collection(GEOGRAPHIES).doc(id),
    );
    const localityItems = localitySnapshotItems(performanceLocation);
    const boundLocationItems = organizationLocationItems(performanceLocation);
    const organizationLocationRef = boundLocationItems.length > 0
      ? this.db.collection(ORGANIZATION_LOCATIONS).doc(String(bundle.aggregate.issuerOrganizationId))
      : null;

    return this.db.runTransaction(async (transaction) => {
      // Replay recovery intentionally precedes current geography/location reads.
      const commandSnapshot = await transaction.get(commandRef);
      if (commandSnapshot.exists) {
        const prior = commandSnapshot.data() as RfxCommandReceipt;
        if (exactReplay(prior, bundle.command)) return "replayed" as const;
        throw new RfxPersistenceConflictError("RFx command identity collision.");
      }

      const organizationLocationSnapshot = organizationLocationRef
        ? await transaction.get(organizationLocationRef)
        : null;
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
        const geography = geographySnapshot.data() as GeographyDefinition | undefined;
        if (
          !geographySnapshot.exists ||
          !geography ||
          geography.releaseState !== "released"
        ) {
          throw new RfxPersistenceConflictError(
            "RFx package performance locality authority changed.",
          );
        }
        const packageLocalities = localityItems.filter(
          (item) => item.localityId === String(geography.id),
        );
        if (
          packageLocalities.length > 0 &&
          !packageLocalities.every((item) => sameLocalityProjection(item, geography))
        ) {
          throw new RfxPersistenceConflictError(
            "RFx package performance locality snapshot changed.",
          );
        }
      }

      if (boundLocationItems.length > 0) {
        if (!organizationLocationSnapshot?.exists) {
          throw new RfxPersistenceConflictError(
            "RFx package organization location authority changed.",
          );
        }
        const currentLocation = organizationLocationSnapshot.data() as ConfirmedOrganizationLocation;
        if (
          String(currentLocation.organizationId) !== String(bundle.aggregate.issuerOrganizationId) ||
          !boundLocationItems.every((item) =>
            sameOrganizationLocationProjection(item, currentLocation),
          )
        ) {
          throw new RfxPersistenceConflictError(
            "RFx package organization location authority changed.",
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
