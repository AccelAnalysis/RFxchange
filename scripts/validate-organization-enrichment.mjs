import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [model, service, repository, route, delivery, storage, rules, schema, component, mapCss, authority, slice, tracker, dependency, dictionary] = await Promise.all([
  read("src/domain/organization-enrichment/model.ts"), read("src/application/organization-enrichment/organization-enrichment.ts"),
  read("src/infrastructure/firestore/organization-enrichment.ts"), read("app/api/organization-enrichment/route.ts"),
  read("app/api/organization-enrichment/assets/[assetId]/route.ts"), read("src/domain/storage/model.ts"),
  read("firestore.rules"), read("src/infrastructure/firestore/schema.ts"),
  read("src/components/organization-enrichment/OrganizationEnrichmentPanel.tsx"),
  read("src/components/map/MapboxLocalityCanvas.module.css"), read("docs/slices/SLICE_3_4_EXECUTION_AUTHORITY.md"),
  read("docs/slices/SLICE_3_4_CREDENTIAL_MEDIA_AND_LOCATION_ENRICHMENT.md"),
  read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md"), read("docs/tracking/RFxchange_DEPENDENCY_MAP.md"),
  read("src/i18n/get-dictionary.ts"),
]);

for (const kind of ["certification", "license", "uei", "cage", "sam_registration", "other_identifier"]) {
  assert.ok(model.includes(`"${kind}"`), `Credential kind is missing: ${kind}`);
}
for (const boundary of ["Organization reported", "evidence_submitted", "projectPublicCredential", "projectPublicProfileAsset", "subordinate-location"]) {
  assert.ok(model.includes(boundary), `Enrichment model boundary is missing: ${boundary}`);
}
assert.doesNotMatch(model, /credibilityBadge|organizationVerified|qualifiedOrganization/);
assert.match(service, /authorizeOrganizationOperation/);
assert.match(service, /permission: "organization\.profile\.manage"/);
assert.match(service, /geographicPositionWithinBoundary/);
assert.match(service, /primaryLocations\.getByOrganizationId/);
assert.match(service, /stored\.sensitivity !== "standard"/);
assert.match(service, /localityDerivedCoordinate/);
assert.match(repository, /runTransaction/);
assert.match(repository, /organizationEnrichmentCommands/);
assert.match(route, /Same-origin request required/);
assert.match(route, /storeOrganizationAsset/);
assert.match(route, /publicCredentials/);
assert.match(delivery, /x-content-type-options/);
assert.doesNotMatch(delivery, /getSignedUrl|getDownloadURL/);
assert.match(storage, /"organization-document"/);
for (const collection of ["organizationCredentials", "organizationProfileAssets", "organizationAdditionalLocationDrafts", "organizationAdditionalLocations", "organizationEnrichmentEvents", "organizationEnrichmentCommands"]) {
  assert.ok(schema.includes(collection), `Firestore schema is missing ${collection}.`);
  assert.ok(rules.includes(`/${collection}/`), `Firestore rules are missing ${collection}.`);
}
assert.match(component, /MapboxLocalityCanvas/);
assert.match(component, /kind: "subordinate-location"/);
assert.match(mapCss, /data-kind="subordinate-location"/);
for (const locale of ["EnUS", "Es", "Fr", "It", "De"]) assert.ok(dictionary.includes(`organizationEnrichment${locale}`));
assert.match(authority, /Slice 3\.5 was then recalculated and separately authorized/);
assert.match(slice, /COMPLETE VIA PR #128/);
assert.match(tracker, /438 total · 155 Done · 283 Not Started/);
assert.match(tracker, /Network completion is \*\*38\/38\*\*/);
assert.match(dependency, /Slice 3\.4[^\n]+COMPLETE/);
assert.match(dependency, /Slice 3\.5[^\n]+COMPLETE VIA PR #130/);
console.log("Slice 3.4 credential, media, publication, private storage, additional-location privacy, subordinate-map, localization, and sequencing architecture validated.");
