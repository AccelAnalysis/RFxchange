import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [model, service, repository, support, route, attachRoute, acquisitionRoute, rules, schema, workspace, map, authority, dictionary, workflow] = await Promise.all([
  read("src/domain/referrals/model.ts"), read("src/application/referrals/referral-network.ts"),
  read("src/infrastructure/firestore/referrals.ts"), read("src/infrastructure/firestore/support.ts"), read("app/api/referrals/route.ts"),
  read("app/api/referrals/attach/route.ts"), read("app/api/acquisition/referral/route.ts"),
  read("firestore.rules"), read("src/infrastructure/firestore/schema.ts"),
  read("src/components/referrals/ReferralWorkspace.tsx"), read("src/components/map/MapboxLocalityCanvas.tsx"),
  read("docs/slices/SLICE_3_5_EXECUTION_AUTHORITY.md"), read("src/i18n/get-dictionary.ts"), read(".github/workflows/ci.yml"),
]);

for (const status of ["draft", "sent", "accepted", "declined", "contacted", "closed", "expired"]) assert.ok(model.includes(`"${status}"`), `Referral status missing: ${status}`);
for (const boundary of ["ReferralConsentEvidence", "ReferralEducationAcknowledgement", "SenderReferralProjection", "RecipientReferralProjection", "attachedRecipientOrganizationId"]) assert.ok(model.includes(boundary), `Referral boundary missing: ${boundary}`);
assert.match(service, /permission: "referral\.manage"/);
assert.match(service, /issue\(\{ referralId: current\.id \}\)/);
assert.match(service, /REFERRAL_INVITATION_EVENT/);
assert.match(service, /primaryEmail\.trim\(\)\.toLowerCase\(\)/);
assert.match(repository, /runTransaction/);
assert.match(repository, /businessReferralCommands/);
assert.match(support, /businessReferrals: Object\.freeze\(\{ createdAt: true, updatedAt: true \}\)/);
assert.match(support, /referralCommunicationIntents: Object\.freeze\(\{ createdAt: false, updatedAt: true \}\)/);
for (const collection of ["businessReferrals", "businessReferralEvents", "businessReferralCommands", "referralEducationAcknowledgements", "referralCommunicationIntents"]) {
  assert.ok(schema.includes(collection), `Firestore schema missing ${collection}.`);
  assert.ok(rules.includes(`/${collection}/`), `Firestore rules missing ${collection}.`);
}
assert.match(route, /resolveParticipantRoute/);
assert.match(attachRoute, /lifecycleState !== "open-platform"/);
assert.match(attachRoute, /attachExternalRecipient/);
assert.match(acquisitionRoute, /parseAcquisitionContextToken/);
assert.match(workspace, /exact shared data|sharedValue/);
assert.match(workspace, /relationshipPaths/);
assert.match(model, /senderOrganizationId: referral\.senderOrganizationId/);
assert.match(workspace, /String\(selected\.senderOrganizationId\)/);
assert.doesNotMatch(workspace, /displayName === selected\.senderOrganizationName/);
assert.match(map, /RELATIONSHIP_PATH_LAYER_ID/);
assert.doesNotMatch(model, /credibility|qualification|verifiedOutcome|referralFee/);
for (const locale of ["EnUS", "Es", "Fr", "It", "De"]) assert.ok(dictionary.includes(`referral${locale}`), `Referral locale missing: ${locale}`);
assert.match(authority, /REF-001/);
assert.match(authority, /Slice 3\.6 was then recalculated and separately authorized/);
assert.match(workflow, /smoke-referral-network-emulator/);
console.log("Slice 3.5 referral lifecycle, consent, education, acquisition, communications, projection, spatial, localization, and direct-client boundaries validated.");
