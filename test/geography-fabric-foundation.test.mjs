import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertGeographicScopeImmutableIdentity,
  assertSameImmutableGeographyVersion,
  createCanonicalGeography,
  createGeographicScope,
  createGeographicScopeMembers,
  createGeographyDatasetSource,
  createGeographyFabricCommand,
  createGeographyFabricEvent,
  createGeographyMetricSnapshot,
  createGeographyVersion,
  createLocationGeographyMembership,
  createLocationGeographyProfile,
  geographyReference,
  projectGeographyMetricSnapshot,
  projectLocationGeographyProfile,
} from "../src/domain/geography-fabric/model.ts";
import {
  GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS,
  GEOGRAPHY_FABRIC_FIRESTORE_COLLECTION_CONVENTIONS,
  geographyFabricDocumentPath,
} from "../src/infrastructure/firestore/geography-fabric-schema.ts";

const now = "2026-08-23T21:00:00.000Z";
const source = createGeographyDatasetSource({
  id: "census-2025",
  sourceSystem: "census-geocoder",
  name: "Public Address Ranges Current",
  authority: "United States Census Bureau",
  sourceUrl: "https://geocoding.geo.census.gov/",
  licenseOrUseBasis: "United States Government public data",
  vintage: "Current_Current",
  importedAt: now,
});

function geographyFixture({
  id,
  type,
  name,
  externalId,
  stateCode = "VA",
  sourceSystem = "census-geocoder",
  datasetSourceId = source.id,
  vintage = "Current_Current",
  parentVersionId = null,
}) {
  const versionId = `${id}:v2025`;
  const geography = createCanonicalGeography({
    id,
    type,
    name,
    countryCode: "US",
    stateCode: type === "country" ? null : stateCode,
    externalId,
    sourceSystem,
    currentVersionId: versionId,
    now,
  });
  const version = createGeographyVersion({
    id: versionId,
    geographyId: geography.id,
    datasetSourceId,
    vintage,
    name: `${name} ${vintage}`,
    parentVersionId,
    now,
  });
  return Object.freeze({
    geography,
    version,
    reference: geographyReference({ geography, version }),
  });
}

const country = geographyFixture({
  id: "us",
  type: "country",
  name: "United States",
  externalId: "US",
  stateCode: null,
});
const state = geographyFixture({
  id: "us-va",
  type: "state",
  name: "Virginia",
  externalId: "51",
  parentVersionId: country.version.id,
});
const county = geographyFixture({
  id: "us-va-51003",
  type: "county-equivalent",
  name: "City of Hampton",
  externalId: "51520",
  parentVersionId: state.version.id,
});
const place = geographyFixture({
  id: "us-va-hampton",
  type: "place",
  name: "Hampton",
  externalId: "5135000",
  parentVersionId: county.version.id,
});
const tract = geographyFixture({
  id: "us-va-51520-010100",
  type: "census-tract",
  name: "Census Tract 101",
  externalId: "51520010100",
  parentVersionId: county.version.id,
});
const blockGroup = geographyFixture({
  id: "us-va-51520-010100-1",
  type: "block-group",
  name: "Block Group 1",
  externalId: "515200101001",
  parentVersionId: tract.version.id,
});
const block = geographyFixture({
  id: "us-va-51520-010100-1-1000",
  type: "census-block",
  name: "Census Block 1000",
  externalId: "515200101001000",
  parentVersionId: blockGroup.version.id,
});
const market = geographyFixture({
  id: "market-hampton-roads",
  type: "region-market",
  name: "Hampton Roads",
  externalId: "hampton-roads",
  sourceSystem: "rfxchange-market",
  datasetSourceId: source.id,
});
const opportunityZone = geographyFixture({
  id: "oz-51520010100",
  type: "opportunity-zone",
  name: "Opportunity Zone 51520010100",
  externalId: "51520010100",
  sourceSystem: "federal-program",
  datasetSourceId: source.id,
});

const hierarchy = Object.freeze({
  country: country.reference,
  state: state.reference,
  countyEquivalent: county.reference,
  place: place.reference,
  censusTract: tract.reference,
  blockGroup: blockGroup.reference,
  censusBlock: block.reference,
});
const allReferences = Object.freeze([
  country.reference,
  state.reference,
  county.reference,
  place.reference,
  tract.reference,
  blockGroup.reference,
  block.reference,
  market.reference,
  opportunityZone.reference,
]);

function memberships(profileVersion = 1) {
  return Object.freeze(
    allReferences.map((reference) =>
      createLocationGeographyMembership({
        locationId: "org-location-1",
        organizationId: "org-1",
        profileVersion,
        reference,
        derivation:
          reference.type === "region-market" ? "governed-import" : "accepted-coordinate",
        now,
      }),
    ),
  );
}

function profile(visibility = "exact") {
  const values = memberships();
  return createLocationGeographyProfile({
    locationId: "org-location-1",
    organizationId: "org-1",
    operatingGeographyId: "us-va-hampton-operating",
    profileVersion: 1,
    acceptedPoint: { longitude: -76.342, latitude: 37.029 },
    visibility,
    hierarchy,
    overlays: [market.reference, opportunityZone.reference],
    memberships: values,
    resolver: "US Census Geocoder layers=all",
    benchmark: "Public_AR_Current",
    resolverVintage: "Current_Current",
    sourceLocationUpdatedAt: now,
    resolvedAt: now,
  });
}

test("Geography Fabric keeps physical containment separate from markets and overlays", () => {
  const value = profile();
  assert.equal(value.hierarchy.countyEquivalent.type, "county-equivalent");
  assert.equal(value.hierarchy.censusBlock.type, "census-block");
  assert.equal(value.overlays[0].type, "region-market");
  assert.equal(value.overlays[1].economicDevelopmentZone, true);
  assert.equal(value.membershipIds.length, allReferences.length);

  assert.throws(
    () =>
      createLocationGeographyProfile({
        locationId: "org-location-2",
        organizationId: "org-1",
        profileVersion: 1,
        acceptedPoint: { longitude: -76.34, latitude: 37.03 },
        visibility: "exact",
        hierarchy,
        overlays: [county.reference],
        memberships: memberships(),
        resolver: "resolver",
        sourceLocationUpdatedAt: now,
        resolvedAt: now,
      }),
    /cannot be stored as overlays/,
  );
});

test("Location profiles require complete source-qualified materialized memberships", () => {
  assert.throws(
    () =>
      createLocationGeographyProfile({
        locationId: "org-location-1",
        organizationId: "org-1",
        profileVersion: 1,
        acceptedPoint: { longitude: -76.342, latitude: 37.029 },
        visibility: "exact",
        hierarchy,
        overlays: [market.reference, opportunityZone.reference],
        memberships: memberships().slice(0, -1),
        resolver: "resolver",
        sourceLocationUpdatedAt: now,
        resolvedAt: now,
      }),
    /complete hierarchy and overlays/,
  );

  const futureVersion = createGeographyVersion({
    id: "us-va-hampton:v2030",
    geographyId: place.geography.id,
    datasetSourceId: source.id,
    vintage: "2030",
    name: "Hampton 2030",
    parentVersionId: county.version.id,
    now,
  });
  assert.notEqual(place.version.id, futureVersion.id);
  assert.equal(place.version.geographyId, futureVersion.geographyId);
  assert.throws(
    () =>
      createCanonicalGeography({
        id: place.geography.id,
        type: "census-tract",
        name: "Reassigned Hampton",
        externalId: place.geography.externalId,
        sourceSystem: place.geography.sourceSystem,
        currentVersionId: futureVersion.id,
        now,
        existing: place.geography,
      }),
    /logical identity cannot be reassigned/,
  );
});

test("physical hierarchy rejects a tract from a different containment branch", () => {
  const unrelatedCounty = geographyFixture({
    id: "us-va-51700",
    type: "county-equivalent",
    name: "City of Newport News",
    externalId: "51700",
    parentVersionId: state.version.id,
  });
  const unrelatedTract = geographyFixture({
    id: "us-va-51700-030100",
    type: "census-tract",
    name: "Census Tract 301",
    externalId: "51700030100",
    parentVersionId: unrelatedCounty.version.id,
  });
  assert.throws(
    () =>
      createLocationGeographyProfile({
        locationId: "org-location-false-hierarchy",
        organizationId: "org-1",
        profileVersion: 1,
        acceptedPoint: { longitude: -76.342, latitude: 37.029 },
        visibility: "exact",
        hierarchy: {
          ...hierarchy,
          censusTract: unrelatedTract.reference,
          blockGroup: null,
          censusBlock: null,
        },
        overlays: [],
        memberships: [],
        resolver: "resolver",
        sourceLocationUpdatedAt: now,
        resolvedAt: now,
      }),
    /does not belong to the supplied physical hierarchy parent/,
  );
});

test("append-only geography versions compare every immutable semantic field", () => {
  const conflictingParent = {
    ...tract.version,
    parentVersionId: state.version.id,
  };
  assert.throws(
    () => assertSameImmutableGeographyVersion(tract.version, conflictingParent),
    /conflicts with the existing immutable record/,
  );
  const conflictingMetadata = {
    ...tract.version,
    metadata: { revised: true },
  };
  assert.throws(
    () => assertSameImmutableGeographyVersion(tract.version, conflictingMetadata),
    /conflicts with the existing immutable record/,
  );
});

test("persisted geographic scope identity cannot move across organizations or subjects", () => {
  const existing = createGeographicScope({
    id: "scope-org-1-service-immutable",
    subject: { kind: "organization", id: "org-1", organizationId: "org-1" },
    kind: "organization-service-area",
    mode: "remote",
    visibility: "network",
    revision: 1,
    updatedByUserId: "user-1",
    updatedByMembershipId: "membership-1",
    now,
  });
  const moved = {
    ...existing,
    organizationId: "org-2",
    subject: { ...existing.subject, id: "org-2", organizationId: "org-2" },
    revision: 2,
  };
  assert.throws(
    () => assertGeographicScopeImmutableIdentity(existing, moved),
    /cannot be reassigned/,
  );
});

test("Participant projections do not leak tract, block, zone or hidden point precision", () => {
  const exact = profile("exact");
  const privateProjection = projectLocationGeographyProfile(exact, "private");
  assert.deepEqual(privateProjection.point, exact.acceptedPoint);
  assert.ok(
    privateProjection.visibleGeographies.some((value) => value.type === "census-block"),
  );
  assert.ok(
    privateProjection.visibleGeographies.some((value) => value.type === "opportunity-zone"),
  );

  for (const audience of ["network", "public", "analytics"]) {
    const projection = projectLocationGeographyProfile(exact, audience);
    assert.ok(
      !projection.visibleGeographies.some((value) => value.type === "census-tract"),
    );
    assert.ok(
      !projection.visibleGeographies.some((value) => value.type === "census-block"),
    );
    assert.ok(
      !projection.visibleGeographies.some((value) => value.type === "opportunity-zone"),
    );
    assert.ok(
      projection.visibleGeographies.some((value) => value.type === "region-market"),
    );
  }
  assert.equal(projectLocationGeographyProfile(exact, "analytics").point, null);
  assert.equal(
    projectLocationGeographyProfile(profile("approximate"), "network").point,
    null,
  );
  assert.equal(
    projectLocationGeographyProfile(profile("locality-only"), "public").point,
    null,
  );
});

test("Geographic scopes enforce purpose, subject, mode and organization identity", () => {
  const scope = createGeographicScope({
    id: "scope-org-1-service",
    subject: { kind: "organization", id: "org-1", organizationId: "org-1" },
    kind: "organization-service-area",
    mode: "geographies",
    label: "Hampton and surrounding service area",
    inclusionVersionIds: [county.version.id, market.version.id],
    exclusionVersionIds: [],
    visibility: "network",
    revision: 1,
    updatedByUserId: "user-1",
    updatedByMembershipId: "membership-1",
    now,
  });
  const members = createGeographicScopeMembers(
    scope,
    [county.reference, market.reference],
    now,
  );
  assert.equal(members.length, 2);
  assert.ok(members.every((member) => member.organizationId === "org-1"));

  assert.throws(
    () =>
      createGeographicScope({
        id: "scope-invalid",
        subject: { kind: "organization", id: "org-1", organizationId: "org-1" },
        kind: "resource-service-area",
        mode: "remote",
        visibility: "public",
        revision: 1,
        updatedByUserId: "user-1",
        updatedByMembershipId: "membership-1",
        now,
      }),
    /cannot be attached/,
  );

  assert.throws(
    () =>
      createGeographicScope({
        id: "scope-invalid-remote",
        subject: { kind: "organization", id: "org-1", organizationId: "org-1" },
        kind: "organization-service-area",
        mode: "remote",
        inclusionVersionIds: [state.version.id],
        visibility: "public",
        revision: 1,
        updatedByUserId: "user-1",
        updatedByMembershipId: "membership-1",
        now,
      }),
    /Remote scope cannot imply/,
  );
});

test("Statewide and nationwide scope labels cannot substitute for the wrong geography type", () => {
  const invalidStatewide = createGeographicScope({
    id: "scope-statewide-invalid",
    subject: { kind: "organization", id: "org-1", organizationId: "org-1" },
    kind: "organization-service-area",
    mode: "statewide",
    inclusionVersionIds: [county.version.id],
    visibility: "network",
    revision: 1,
    updatedByUserId: "user-1",
    updatedByMembershipId: "membership-1",
    now,
  });
  assert.throws(
    () => createGeographicScopeMembers(invalidStatewide, [county.reference], now),
    /exactly one state geography/,
  );

  const statewide = createGeographicScope({
    id: "scope-statewide-valid",
    subject: { kind: "organization", id: "org-1", organizationId: "org-1" },
    kind: "organization-service-area",
    mode: "statewide",
    inclusionVersionIds: [state.version.id],
    visibility: "network",
    revision: 1,
    updatedByUserId: "user-1",
    updatedByMembershipId: "membership-1",
    now,
  });
  assert.equal(
    createGeographicScopeMembers(statewide, [state.reference], now)[0].geographyId,
    state.geography.id,
  );
});

test("Intelligence geography metrics are coverage-qualified and suppress small cells", () => {
  const snapshot = createGeographyMetricSnapshot({
    id: "metric-snapshot-1",
    metricId: "exchange-capability-count",
    geographyId: tract.geography.id,
    geographyVersionId: tract.version.id,
    periodStart: "2026-08-01T00:00:00.000Z",
    periodEnd: "2026-09-01T00:00:00.000Z",
    recordType: "capability",
    count: 3,
    organizationCount: 2,
    minimumCellSize: 5,
    generatedAt: now,
  });
  assert.equal(snapshot.coverage, "rfxchange-exchange-only");
  assert.equal(snapshot.suppressed, true);
  assert.equal(projectGeographyMetricSnapshot(snapshot).count, null);
  assert.equal(projectGeographyMetricSnapshot(snapshot).organizationCount, null);

  assert.throws(
    () =>
      createGeographyMetricSnapshot({
        id: "metric-snapshot-2",
        metricId: "external-market-count",
        geographyId: tract.geography.id,
        geographyVersionId: tract.version.id,
        periodStart: "2026-08-01T00:00:00.000Z",
        periodEnd: "2026-09-01T00:00:00.000Z",
        recordType: "organization",
        count: 10,
        organizationCount: 10,
        coverage: "external-authoritative-dataset",
        generatedAt: now,
      }),
    /require at least one source dataset/,
  );
});

test("Geography Fabric commands and events retain matching subject and authority context", () => {
  const command = createGeographyFabricCommand({
    id: "geo-command-1",
    action: "save-geographic-scope",
    organizationId: "org-1",
    subjectId: "scope-org-1-service",
    requestFingerprint: "sha256:scope-revision-1",
    actorUserId: "user-1",
    actorMembershipId: "membership-1",
    recordedAt: now,
  });
  const event = createGeographyFabricEvent({
    id: "geo-event-1",
    kind: "geographic-scope-saved",
    organizationId: "org-1",
    subjectId: "scope-org-1-service",
    command,
    occurredAt: now,
  });
  assert.equal(event.commandId, command.id);
  assert.throws(
    () =>
      createGeographyFabricEvent({
        id: "geo-event-2",
        kind: "metric-snapshot-captured",
        organizationId: "org-1",
        subjectId: "scope-org-1-service",
        command,
        occurredAt: now,
      }),
    /does not match its command action/,
  );
  assert.throws(
    () =>
      createGeographyFabricCommand({
        id: "geo-command-2",
        action: "save-geographic-scope",
        organizationId: "org-1",
        subjectId: "scope-org-1-service",
        requestFingerprint: "sha256:scope-revision-2",
        actorUserId: "user-1",
        recordedAt: now,
      }),
    /must be supplied together/,
  );
});

test("Firestore extension preserves server-only stable-id and tenant conventions", async () => {
  assert.equal(Object.keys(GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS).length, 10);
  assert.equal(
    GEOGRAPHY_FABRIC_FIRESTORE_COLLECTION_CONVENTIONS.geographicScopes
      .organizationIdRequired,
    true,
  );
  assert.equal(
    GEOGRAPHY_FABRIC_FIRESTORE_COLLECTION_CONVENTIONS.geographyVersions.appendOnly,
    true,
  );
  assert.equal(
    GEOGRAPHY_FABRIC_FIRESTORE_COLLECTION_CONVENTIONS.locationGeographyProfiles.mutable,
    true,
  );
  assert.equal(
    geographyFabricDocumentPath("canonicalGeographies", "us-va"),
    "canonicalGeographies/us-va",
  );
  assert.throws(
    () => geographyFabricDocumentPath("canonicalGeographies", "us/va"),
    /cannot contain a slash/,
  );

  const repositorySource = await readFile(
    new URL(
      "../src/infrastructure/firestore/geography-fabric-repositories.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(repositorySource, /runTransaction/);
  assert.match(repositorySource, /transaction\.create/);
  assert.match(repositorySource, /commandIsReplay/);
  assert.match(repositorySource, /requireNextRevision/);
  assert.match(repositorySource, /assertSameImmutableGeographyVersion/);
  assert.match(repositorySource, /assertGeographicScopeImmutableIdentity/);
  assert.doesNotMatch(repositorySource, /census\.gov|fetch\(|firebase\/firestore/);
});
