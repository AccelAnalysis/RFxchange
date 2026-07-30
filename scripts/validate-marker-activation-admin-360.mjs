import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const [
  markerModel,
  markerService,
  markerRepository,
  organization360,
  mapContract,
  mapCanvas,
  mapStyles,
  markerPage,
  organization360Page,
  rules,
  schema,
  tests,
  architecture,
] = await Promise.all([
  source("src/domain/organization-markers/model.ts"),
  source("src/application/geography/organization-marker-activation.ts"),
  source("src/infrastructure/firestore/organization-marker.ts"),
  source("src/application/admin/organization-360.ts"),
  source("src/application/geography/controlled-locality-map.ts"),
  source("src/components/map/ControlledLocalityCanvas.tsx"),
  source("src/components/map/ControlledLocalityCanvas.module.css"),
  source("app/organization-activation/page.tsx"),
  source("app/admin/organizations/[organizationId]/page.tsx"),
  source("firestore.rules"),
  source("src/infrastructure/firestore/schema.ts"),
  source("test/marker-activation-organization-360.test.mjs"),
  source("docs/architecture/WAVE_2_SLICE_2_8.md"),
]);

for (const reason of [
  "relationship-authority-missing",
  "geography-participation-denied",
  "confirmed-location-missing",
  "profile-incomplete",
  "organization-blocked",
]) {
  assert.ok(markerModel.includes(reason), `Marker gate is missing: ${reason}`);
}
for (const privacy of ["exact", "approximate", "locality-presence"]) {
  assert.ok(markerModel.includes(privacy), `Marker privacy treatment is missing: ${privacy}`);
}
assert.ok(
  markerModel.includes("localityPresenceCoordinate") &&
    markerModel.includes("geographicPositionWithinBoundary"),
  "Locality-only markers must use deterministic authoritative-locality projection.",
);
assert.ok(
  markerService.includes("authorizeOrganizationOperation") &&
    markerService.includes("evaluateGeographyParticipation") &&
    markerService.includes('"organization-activation"'),
  "Marker recalculation must reuse organization and geography server authority.",
);
assert.ok(
  markerRepository.includes("runTransaction") &&
    markerRepository.includes("organizationMarkerEvents") &&
    markerRepository.includes("organizationAuditEvents"),
  "Marker current state, transition evidence, and audit must commit atomically.",
);
assert.ok(
  schema.includes('organizationMarkerActivations: "organizationMarkerActivations"') &&
    schema.includes('organizationMarkerEvents: "organizationMarkerEvents"'),
  "Marker persistence collections are missing from the canonical schema.",
);
assert.match(
  rules,
  /match \/organizationMarkerEvents\/\{documentId\}[\s\S]*?allow update, delete: if false;/,
  "Marker transition history must remain client-immutable.",
);

for (const tab of [
  "overview",
  "users",
  "profile",
  "locations-service-areas",
  "capabilities",
  "rfx",
  "responses",
  "referrals",
  "teaming",
  "resources",
  "credibility",
  "commerce",
  "support",
  "audit",
]) {
  assert.ok(organization360.includes(`"${tab}"`), `Organization 360 tab is missing: ${tab}`);
}
assert.ok(
  organization360.includes("authorizeScopedAdministrativeAction") &&
    organization360.includes("ORGANIZATION:${organizationId}") &&
    organization360.includes("CASE:${caseRecord.id}"),
  "Organization 360 must preserve exact organization/case scoped grants.",
);
assert.ok(
  organization360.includes("organization.location.private.read") &&
    organization360.includes("privateLocationVisible"),
  "Private exact location must require minimum-necessary permission.",
);
for (const independentState of [
  "accountAccess",
  "verification",
  "officialProvider",
  "commercial",
  "primaryGeography",
  "restriction",
  "investigation",
  "governingCase",
]) {
  assert.ok(
    organization360.includes(independentState),
    `Status header is missing independent state: ${independentState}`,
  );
}

assert.ok(
  mapContract.includes("CONTROLLED_MAP_SEMANTIC_LAYER_ORDER") &&
    mapContract.includes('"entity-marker": 70') &&
    mapContract.includes('"marker-emphasis": 80'),
  "Controlled map must expose deterministic provider-neutral marker layers.",
);
assert.ok(
  mapCanvas.includes('"organization-marker"') &&
    mapCanvas.includes("projectGeographicPosition") &&
    mapCanvas.includes('role="button"') &&
    mapCanvas.includes("aria-pressed"),
  "Organization markers must be coordinate-projected and keyboard accessible.",
);
assert.ok(
  mapStyles.includes("@media (prefers-reduced-motion: reduce)") &&
    mapStyles.includes("stroke: none"),
  "Marker activation must reduce motion and avoid a permanent pin outline.",
);
assert.ok(
  markerPage.includes("MarkerActivationPanel") &&
    organization360Page.includes("Organization360"),
  "Participant activation and admin Organization 360 routes are missing.",
);

for (const evidence of [
  "server-authoritative marker gate",
  "locality-only",
  "camera/zoom",
  "exact organization scope",
  "governing case detail",
]) {
  assert.ok(tests.includes(evidence), `Slice test evidence is missing: ${evidence}`);
}
for (const feature of ["GEO-011", "ADM-063", "ADM-064"]) {
  assert.ok(architecture.includes(feature), `Architecture record is missing ${feature}.`);
}
assert.ok(
  architecture.includes("does not release the organization into OPEN") &&
    architecture.includes("Slice 2.9 was not implemented"),
  "Architecture must preserve post-marker release and non-scope boundaries.",
);

console.log("Slice 2.8 marker activation and Organization 360 architecture validated.");
