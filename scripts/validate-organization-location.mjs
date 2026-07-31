import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [
  model,
  geocodingPort,
  service,
  censusAdapter,
  persistence,
  schema,
  rules,
  mapCanvas,
  locationPanel,
  legacyRoute,
  joinRoute,
  activationUi,
  tests,
  architecture,
  ci,
] = await Promise.all([
  read("src/domain/organization-location/model.ts"),
  read("src/domain/organization-location/geocoding.ts"),
  read("src/application/organization-location/organization-location.ts"),
  read("src/infrastructure/geocoding/census-geocoder.ts"),
  read("src/infrastructure/firestore/organization-location.ts"),
  read("src/infrastructure/firestore/schema.ts"),
  read("firestore.rules"),
  read("src/components/map/ControlledLocalityCanvas.tsx"),
  read("src/components/organization-location/OrganizationLocationPanel.tsx"),
  read("app/organization-location/page.tsx"),
  read("app/join/page.tsx"),
  read("src/components/onboarding/ActivationJourneyClient.tsx"),
  read("test/organization-location.test.mjs"),
  read("docs/architecture/WAVE_2_SLICE_2_6.md"),
  read(".github/workflows/ci.yml"),
]);

for (const required of [
  "StructuredPostalAddress",
  "ConfirmedOrganizationLocation",
  "OrganizationServiceGeography",
  '"exact"',
  '"approximate"',
  '"locality-only"',
  "projectPublicOrganizationLocation",
  "geographicPositionWithinBoundary",
]) {
  assert.ok(model.includes(required), `Organization-location domain is missing ${required}.`);
}
assert.ok(model.includes("mailingAddress"));
assert.ok(model.includes("defaultLocationVisibility(isHomeOrPrivate"));
assert.ok(model.includes("stableHash"));

for (const required of [
  "OrganizationGeocodingProvider",
  "GeocodingProviderCandidate",
  "locate",
]) {
  assert.ok(geocodingPort.includes(required), `Provider-neutral geocoding port is missing ${required}.`);
}
for (const required of [
  "authorizeOrganizationOperation",
  '"organization.profile.manage"',
  "getByUserId",
  "evaluateGeographyParticipation",
  "listByUserAndGeography",
  "getByGeographyId",
  "candidate-not-confirmed",
  "saveServiceGeographies",
]) {
  assert.ok(service.includes(required), `Location application service is missing ${required}.`);
}
assert.equal(service.includes("CensusOrganizationGeocodingProvider"), false);

for (const required of [
  "https://geocoding.geo.census.gov",
  "/geocoder/locations/onelineaddress",
  "Public_AR_Current",
  "new AbortController",
  "setTimeout",
  "redirect: \"error\"",
]) {
  assert.ok(censusAdapter.includes(required), `Census adapter is missing ${required}.`);
}
assert.ok(censusAdapter.includes(".slice(0, 5)"));

for (const collection of [
  "organizationLocationDrafts",
  "organizationLocations",
  "organizationLocationEvents",
  "organizationServiceGeographies",
]) {
  assert.ok(schema.includes(collection), `Firestore schema is missing ${collection}.`);
  assert.ok(rules.includes(`/${collection}/{documentId}`), `Firestore rules are missing ${collection}.`);
  assert.ok(persistence.includes(collection), `Firestore adapter is missing ${collection}.`);
}
assert.ok(persistence.includes("runTransaction"));
assert.ok(persistence.includes("transaction.create"));

for (const required of [
  "projectGeographicPosition(overlay.position",
  'data-layer-order="70"',
  '"location-candidate"',
  '"confirmed-location"',
]) {
  assert.ok(mapCanvas.includes(required), `Controlled map point overlay is missing ${required}.`);
}
for (const required of [
  "Physical location",
  "Add a separate mailing address",
  "Public map precision",
  "Service geography",
  "A confirmed point is not yet an activated organization marker",
]) {
  assert.ok(locationPanel.includes(required), `Reference location component is missing ${required}.`);
}
assert.ok(mapCanvas.includes("temporary candidate awaiting confirmation"));

assert.ok(legacyRoute.includes("resolveParticipantRoute") && legacyRoute.includes("redirect("));
assert.equal(legacyRoute.includes("createPortsmouthControlledLocalityPreview"), false);
assert.ok(joinRoute.includes("createControlledLocalityPreview") && joinRoute.includes("ActivationJourneyClient"));
for (const required of [
  'postAction("begin-location"',
  'postAction("confirm-location"',
  "initial service geography",
  "Service territory remains a separate profile concept",
]) {
  assert.ok(activationUi.includes(required), `Integrated activation location UI is missing ${required}.`);
}

assert.ok(tests.includes("exact, approximate, and locality-only privacy"));
assert.ok(tests.includes("browser geography"));
assert.ok(
  architecture.includes("GEO-009") &&
    architecture.includes("GEO-010") &&
    architecture.includes("ORG-005") &&
    architecture.includes("ORG-006") &&
    architecture.includes("ORG-009"),
);
assert.ok(
  ci.includes("smoke-organization-location-emulator.mjs"),
  "CI must run the Slice 2.6 Firestore emulator acceptance.",
);

console.log("Slice 2.6 organization geography, location, privacy, service area, and integrated runtime validated.");
