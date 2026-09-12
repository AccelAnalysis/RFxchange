import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [model, service, repository, route, delivery, storage, rules, schema, component, taskSheet, taskSheetCss, profilePage, portal, copy, mapCss, authority, slice, tracker, dependency, dictionary] = await Promise.all([
  read("src/domain/organization-enrichment/model.ts"), read("src/application/organization-enrichment/organization-enrichment.ts"),
  read("src/infrastructure/firestore/organization-enrichment.ts"), read("app/api/organization-enrichment/route.ts"),
  read("app/api/organization-enrichment/assets/[assetId]/route.ts"), read("src/domain/storage/model.ts"),
  read("firestore.rules"), read("src/infrastructure/firestore/schema.ts"),
  read("src/components/organization-enrichment/OrganizationEnrichmentPanel.tsx"),
  read("src/components/account/ProfileTaskSheet.tsx"), read("src/components/account/ProfileTaskSheet.module.css"),
  read("app/organization-profile/page.tsx"), read("src/components/account/OrganizationProfilePortal.tsx"),
  read("src/i18n/messages/organization-enrichment/en-US.json"),
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

assert.match(profilePage, /OrganizationProfilePortal/);
for (const section of ["overview", "capabilities", "credentials", "locations", "media", "preferences"]) {
  assert.match(profilePage, new RegExp(`${section}=`), `Organization profile must project the ${section} portal section.`);
  assert.match(portal, new RegExp(`"${section}"`), `Portal tab registry must include ${section}.`);
}
assert.match(profilePage, /role="progressbar"/);
assert.match(profilePage, /publicPreview/);
assert.match(profilePage, /projectPublicCredential/);
assert.match(profilePage, /projectPublicProfileAsset/);
assert.match(profilePage, /ProfileTaskSheet/);
assert.match(profilePage, /portal\.addCredential/);
assert.match(profilePage, /portal\.addLocation/);
assert.match(profilePage, /portal\.uploadMedia/);
assert.match(taskSheet, /<dialog/);
assert.match(taskSheet, /showModal\(\)/);
assert.match(taskSheetCss, /input\[name="sourceLabel"\]/);
assert.match(taskSheetCss, /textarea\[name="evidenceAssetIds"\]/);
assert.match(taskSheetCss, /display: none !important/);
assert.match(copy, /"add": "Add credential"/);
assert.match(copy, /"empty": "No credentials yet\."/);
assert.match(copy, /"add": "Add location"/);
assert.match(copy, /Uploads start private/);
assert.doesNotMatch(copy, /Private supporting asset IDs/);
assert.doesNotMatch(copy, /administrator-review process/);

assert.match(authority, /Slice 3\.5 was then recalculated and separately authorized/);
assert.match(slice, /COMPLETE VIA PR #128/);
assert.match(tracker, /438 total · \d+ Done · \d+ Not Started/);
assert.match(tracker, /Network completion is \*\*38\/38\*\*/);
assert.match(dependency, /Slice 3\.4[^\n]+COMPLETE/);
assert.match(dependency, /Slice 3\.5[^\n]+COMPLETE VIA PR #130/);
console.log("Slice 3.4 credential, media, publication, private storage, and additional-location architecture validated with focused profile task sheets and public-preview boundaries.");
