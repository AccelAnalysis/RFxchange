from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE_BRANCH = "control/final-convergence-beacons-actions"


def file_text(path: str) -> str:
    return (ROOT / path).read_text()


def write_text(path: str, content: str) -> None:
    (ROOT / path).write_text(content)


def replace_exact(path: str, old: str, new: str, expected: int = 1) -> None:
    text = file_text(path)
    count = text.count(old)
    if count != expected:
        raise RuntimeError(
            f"{path}: expected {expected} occurrence(s), found {count}: {old[:120]!r}"
        )
    write_text(path, text.replace(old, new))


# Bring the stacked branch onto the reviewed lower branch before applying its own fixes.
subprocess.run(["git", "fetch", "origin", BASE_BRANCH], cwd=ROOT, check=True)
subprocess.run(
    ["git", "merge", "--no-edit", f"origin/{BASE_BRANCH}"],
    cwd=ROOT,
    check=True,
)

model = "src/domain/geography-fabric/model.ts"
replace_exact(
    model,
    '''  readonly vintage: string;
  readonly countryCode: string;''',
    '''  readonly vintage: string;
  readonly parentVersionId: GeographyVersionId | null;
  readonly countryCode: string;''',
)
replace_exact(
    model,
    '''    sourceSystem: input.geography.sourceSystem,
    vintage: input.version.vintage,
    countryCode: input.geography.countryCode,''',
    '''    sourceSystem: input.geography.sourceSystem,
    vintage: input.version.vintage,
    parentVersionId: input.version.parentVersionId,
    countryCode: input.geography.countryCode,''',
)
replace_exact(
    model,
    '''  return Object.freeze({
    id,
    geographyId: canonicalGeographyId(input.geographyId),
    datasetSourceId: geographyDatasetSourceId(input.datasetSourceId),
    sourceLayer: optional(input.sourceLayer, "Geography source layer"),
    vintage: normalized(input.vintage, "Geography vintage", 120),
    name: normalized(input.name, "Geography version name", 300),
    parentVersionId,
    geometryReference: optional(
      input.geometryReference,
      "Geography geometry reference",
      1_000,
    ),
    effectiveFrom,
    effectiveTo,
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
    createdAt: isoTimestamp(input.now),
  });
}

export function geographyReference''',
    '''  return Object.freeze({
    id,
    geographyId: canonicalGeographyId(input.geographyId),
    datasetSourceId: geographyDatasetSourceId(input.datasetSourceId),
    sourceLayer: optional(input.sourceLayer, "Geography source layer"),
    vintage: normalized(input.vintage, "Geography vintage", 120),
    name: normalized(input.name, "Geography version name", 300),
    parentVersionId,
    geometryReference: optional(
      input.geometryReference,
      "Geography geometry reference",
      1_000,
    ),
    effectiveFrom,
    effectiveTo,
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
    createdAt: isoTimestamp(input.now),
  });
}

function metadataFingerprint(
  metadata: Readonly<Record<string, string | number | boolean | null>>,
): string {
  return JSON.stringify(
    Object.entries(metadata).sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function assertSameImmutableGeographyVersion(
  existing: GeographyVersion,
  expected: GeographyVersion,
): void {
  const scalarFields = [
    "id",
    "geographyId",
    "datasetSourceId",
    "sourceLayer",
    "vintage",
    "name",
    "parentVersionId",
    "geometryReference",
    "effectiveFrom",
    "effectiveTo",
  ] as const;
  if (
    scalarFields.some((field) => existing[field] !== expected[field])
    || metadataFingerprint(existing.metadata) !== metadataFingerprint(expected.metadata)
  ) {
    throw new Error("Geography version conflicts with the existing immutable record.");
  }
}

export function assertGeographicScopeImmutableIdentity(
  existing: GeographicScope,
  expected: GeographicScope,
): void {
  if (
    existing.id !== expected.id
    || existing.organizationId !== expected.organizationId
    || existing.kind !== expected.kind
    || existing.subject.kind !== expected.subject.kind
    || existing.subject.id !== expected.subject.id
    || existing.subject.organizationId !== expected.subject.organizationId
  ) {
    throw new Error("Geographic scope identity, subject, and purpose cannot be reassigned.");
  }
}

export function geographyReference''',
)
replace_exact(
    model,
    '''  for (const [reference, type] of expected) {
    if (reference && reference.type !== type) {
      throw new Error(`Physical hierarchy ${type} has the wrong geography type.`);
    }
  }
  if (hierarchy.censusTract && !hierarchy.countyEquivalent) {''',
    '''  for (const [reference, type] of expected) {
    if (reference && reference.type !== type) {
      throw new Error(`Physical hierarchy ${type} has the wrong geography type.`);
    }
  }

  const requireParent = (
    child: GeographyReference | null,
    parent: GeographyReference | null,
    label: string,
  ) => {
    if (!child) return;
    if (!parent || child.parentVersionId !== parent.versionId) {
      throw new Error(`${label} does not belong to the supplied physical hierarchy parent.`);
    }
  };
  if (hierarchy.country.parentVersionId !== null) {
    throw new Error("Physical hierarchy country cannot declare a parent geography version.");
  }
  requireParent(hierarchy.state, hierarchy.country, "State");
  requireParent(
    hierarchy.countyEquivalent,
    hierarchy.state ?? hierarchy.country,
    "County or county-equivalent",
  );
  requireParent(hierarchy.place, hierarchy.countyEquivalent, "Place");
  requireParent(hierarchy.censusTract, hierarchy.countyEquivalent, "Census tract");
  requireParent(hierarchy.blockGroup, hierarchy.censusTract, "Block group");
  requireParent(hierarchy.censusBlock, hierarchy.blockGroup, "Census block");

  if (hierarchy.censusTract && !hierarchy.countyEquivalent) {''',
)

repository = "src/infrastructure/firestore/geography-fabric-repositories.ts"
replace_exact(
    repository,
    '''import type {
  CanonicalGeography,''',
    '''import {
  assertGeographicScopeImmutableIdentity,
  assertSameImmutableGeographyVersion,
  type CanonicalGeography,''',
)
replace_exact(
    repository,
    '''        if (snapshot.exists) {
          sameImmutableRecord(
            snapshot,
            record,
            ["id", "geographyId", "datasetSourceId", "vintage"],
            "Geography version",
          );
        } else {''',
    '''        if (snapshot.exists) {
          const existingVersion = toDomainRecord<GeographyVersion>(
            snapshot,
            "geographyVersions",
          );
          if (!existingVersion) {
            throw new Error("Geography version exists without readable data.");
          }
          assertSameImmutableGeographyVersion(existingVersion, record);
        } else {''',
)
replace_exact(
    repository,
    '''      if (commandIsReplay(commandSnapshot, input.command)) return;
      requireNextRevision(
        scopeSnapshot,
        input.scope.revision,
        "revision",
        "Geographic scope",
      );

      for (const member of input.members) {''',
    '''      if (commandIsReplay(commandSnapshot, input.command)) return;
      if (scopeSnapshot.exists) {
        const existingScope = toDomainRecord<GeographicScope>(
          scopeSnapshot,
          "geographicScopes",
        );
        if (!existingScope) {
          throw new Error("Geographic scope exists without readable data.");
        }
        assertGeographicScopeImmutableIdentity(existingScope, input.scope);
      }
      requireNextRevision(
        scopeSnapshot,
        input.scope.revision,
        "revision",
        "Geographic scope",
      );

      for (const member of input.members) {''',
)

# Add focused negative regressions to the foundation test.
test_path = "test/geography-fabric-foundation.test.mjs"
replace_exact(
    test_path,
    '''  createCanonicalGeography,
  createGeographicScope,''',
    '''  assertGeographicScopeImmutableIdentity,
  assertSameImmutableGeographyVersion,
  createCanonicalGeography,
  createGeographicScope,''',
)
insert_before = '''test("Participant projections do not leak tract, block, zone or hidden point precision", () => {'''
regressions = '''test("physical hierarchy rejects a tract from a different containment branch", () => {
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

'''
replace_exact(test_path, insert_before, regressions + insert_before)
replace_exact(
    test_path,
    '''  assert.match(repositorySource, /requireNextRevision/);
  assert.doesNotMatch(repositorySource, /census\\.gov|fetch\\(|firebase\\/firestore/);''',
    '''  assert.match(repositorySource, /requireNextRevision/);
  assert.match(repositorySource, /assertSameImmutableGeographyVersion/);
  assert.match(repositorySource, /assertGeographicScopeImmutableIdentity/);
  assert.doesNotMatch(repositorySource, /census\\.gov|fetch\\(|firebase\\/firestore/);''',
)

# Restore canonical CI and delete temporary remediation files before committing.
subprocess.run(["git", "fetch", "origin", BASE_BRANCH], cwd=ROOT, check=True)
ci = subprocess.run(
    ["git", "show", f"origin/{BASE_BRANCH}:.github/workflows/ci.yml"],
    cwd=ROOT,
    check=True,
    capture_output=True,
    text=True,
).stdout
write_text(".github/workflows/ci.yml", ci)
for temporary in [
    ".github/scripts/remediate-pr248.py",
]:
    candidate = ROOT / temporary
    if candidate.exists():
        candidate.unlink()

subprocess.run(["git", "diff", "--check"], cwd=ROOT, check=True)
subprocess.run(["git", "config", "user.name", "RFxchange implementation"], cwd=ROOT, check=True)
subprocess.run(["git", "config", "user.email", "actions@users.noreply.github.com"], cwd=ROOT, check=True)
subprocess.run(["git", "add", "-A"], cwd=ROOT, check=True)
subprocess.run(
    ["git", "commit", "-m", "Harden Geography Fabric immutable identity and hierarchy"],
    cwd=ROOT,
    check=True,
)
subprocess.run(
    ["git", "push", "origin", "HEAD:control/geography-fabric-foundation"],
    cwd=ROOT,
    check=True,
)
