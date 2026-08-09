import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const schema = await readFile(
  new URL("../src/infrastructure/firestore/schema.ts", import.meta.url),
  "utf8",
);
const communicationsSchema = await readFile(
  new URL("../src/infrastructure/firestore/communications-schema.ts", import.meta.url),
  "utf8",
);
const documentation = await readFile(
  new URL("../docs/architecture/INF-003-firestore-schema-conventions.md", import.meta.url),
  "utf8",
);

const requiredCollections = [
  "organizations",
  "organizationProfiles",
  "organizationDiscoveryRecords",
  "organizationResolutions",
  "organizationEntityKeys",
  "organizationAuthorityClaims",
  "organizationAuthorityClaimEvents",
  "organizationAuthorityDecisions",
  "organizationLocationDrafts",
  "organizationLocations",
  "organizationLocationEvents",
  "organizationServiceGeographies",
  "organizationProfileCompletions",
  "organizationProfileEvents",
  "organizationCapabilityClaims",
  "organizationIndustryProfiles",
  "organizationPastPerformance",
  "organizationMarketPreferences",
  "organizationProvisionalTerms",
  "organizationMarketProfileEvents",
  "organizationMarketProfileCommands",
  "organizationMarkerActivations",
  "organizationMarkerEvents",
  "users",
  "organizationMemberships",
  "organizationAuthorizations",
  "organizationUserInvitations",
  "organizationAuditEvents",
  "accessJourneys",
  "accessRestrictions",
  "legalDocumentVersions",
  "legalAcknowledgements",
  "organizationAuthorityRepresentations",
  "platformChangeDirectives",
  "retentionPolicies",
  "retentionAssignments",
  "adminAuthorityContexts",
  "adminPermissionGrants",
  "backgroundJobs",
  "backgroundJobEvents",
  "acquisitionContexts",
  "acquisitionContextEvents",
  "businessReferrals",
  "businessReferralEvents",
  "businessReferralCommands",
  "referralEducationAcknowledgements",
  "referralCommunicationIntents",
  "networkEducationProgress",
  "networkEducationEvents",
  "networkEducationCommands",
  "orientationJourneys",
  "orientationJourneyEvents",
  "firstValueSelections",
  "activationReleaseEvents",
  "aiInterpretationRecords",
  "aiInterpretationCandidates",
  "aiInterpretationProvenance",
  "aiInterpretationUsageEvents",
  "aiInterpretationEvents",
  "aiInterpretationQuotaBuckets",
];

for (const collection of requiredCollections) {
  assert.ok(schema.includes(`\"${collection}\"`), `Missing canonical Firestore collection: ${collection}`);
}
for (const collection of [
  "transactionalEmailDeliveries",
  "transactionalEmailDeliveryEvents",
]) {
  assert.ok(
    communicationsSchema.includes(`\"${collection}\"`),
    `Missing communications Firestore collection: ${collection}`,
  );
}

assert.ok(
  schema.includes("FIRESTORE_SCHEMA_VERSION = 1"),
  "INF-003 requires an explicit initial Firestore schema version.",
);
assert.ok(
  schema.includes('"stable-id-fields-not-document-references"'),
  "Firestore relationships must remain stable ID fields rather than provider DocumentReference values.",
);
assert.ok(
  schema.includes('"query-contract-driven-composite-indexes"'),
  "Composite indexes must remain query-contract driven until INF-005.",
);
assert.ok(
  schema.includes("assertOrganizationScopedFirestoreRecord"),
  "Organization-scoped persisted records need an explicit organizationId guard.",
);

for (const appendOnlyCollection of [
  "organizationAuditEvents",
  "organizationResolutions",
  "organizationEntityKeys",
  "organizationAuthorityClaimEvents",
  "organizationAuthorityDecisions",
  "organizationLocationEvents",
  "organizationProfileEvents",
  "organizationProvisionalTerms",
  "organizationMarketProfileEvents",
  "organizationMarketProfileCommands",
  "organizationMarkerEvents",
  "legalDocumentVersions",
  "legalAcknowledgements",
  "organizationAuthorityRepresentations",
  "platformChangeDirectives",
  "retentionPolicies",
  "retentionAssignments",
  "adminPermissionGrants",
  "backgroundJobEvents",
  "acquisitionContextEvents",
  "businessReferralEvents",
  "businessReferralCommands",
  "referralEducationAcknowledgements",
  "networkEducationEvents",
  "networkEducationCommands",
  "orientationJourneyEvents",
  "activationReleaseEvents",
  "aiInterpretationProvenance",
  "aiInterpretationUsageEvents",
  "aiInterpretationEvents",
]) {
  const start = schema.indexOf(`${appendOnlyCollection}: Object.freeze({`);
  assert.ok(start >= 0, `Missing collection convention for ${appendOnlyCollection}.`);
  const block = schema.slice(start, schema.indexOf("}),", start) + 3);
  assert.ok(block.includes("appendOnly: true"), `${appendOnlyCollection} must remain append-only.`);
  assert.ok(block.includes("mutable: false"), `${appendOnlyCollection} must not become mutable.`);
}

const backgroundJobStart = schema.indexOf("backgroundJobs: Object.freeze({");
assert.ok(backgroundJobStart >= 0, "Missing background job aggregate convention.");
const backgroundJobBlock = schema.slice(
  backgroundJobStart,
  schema.indexOf("}),", backgroundJobStart) + 3,
);
assert.ok(backgroundJobBlock.includes("appendOnly: false"));
assert.ok(backgroundJobBlock.includes("mutable: true"));

const invitationStart = schema.indexOf("organizationUserInvitations: Object.freeze({");
assert.ok(invitationStart >= 0, "Missing organization invitation convention.");
const invitationBlock = schema.slice(
  invitationStart,
  schema.indexOf("}),", invitationStart) + 3,
);
assert.ok(invitationBlock.includes("organizationIdRequired: true"));
assert.ok(invitationBlock.includes("appendOnly: false"));
assert.ok(invitationBlock.includes("mutable: true"));

const deliveryStart = communicationsSchema.indexOf(
  "transactionalEmailDeliveries: Object.freeze({",
);
assert.ok(deliveryStart >= 0, "Missing transactional email delivery aggregate convention.");
const deliveryBlock = communicationsSchema.slice(
  deliveryStart,
  communicationsSchema.indexOf("}),", deliveryStart) + 3,
);
assert.ok(deliveryBlock.includes('scope: "platform-scoped"'));
assert.ok(deliveryBlock.includes("appendOnly: false"));
assert.ok(deliveryBlock.includes("mutable: true"));

const deliveryEventStart = communicationsSchema.indexOf(
  "transactionalEmailDeliveryEvents: Object.freeze({",
);
assert.ok(deliveryEventStart >= 0, "Missing transactional email delivery event convention.");
const deliveryEventBlock = communicationsSchema.slice(
  deliveryEventStart,
  communicationsSchema.indexOf("}),", deliveryEventStart) + 3,
);
assert.ok(deliveryEventBlock.includes('scope: "platform-scoped"'));
assert.ok(deliveryEventBlock.includes("appendOnly: true"));
assert.ok(deliveryEventBlock.includes("mutable: false"));

assert.ok(
  !schema.includes('from "firebase') &&
    !schema.includes("from 'firebase") &&
    !schema.includes("firebase-admin") &&
    !communicationsSchema.includes('from "firebase') &&
    !communicationsSchema.includes("from 'firebase") &&
    !communicationsSchema.includes("firebase-admin"),
  "INF-003 schema contracts must not introduce Firebase SDK or Admin SDK dependencies.",
);

const normalizedDocumentation = documentation.toLowerCase();
for (const phrase of [
  "top-level firestore collections",
  "schemaversion",
  "server-assigned",
  "stable id fields",
  "composite indexes",
  "migrations must be idempotent",
  "production is firebase project `rfxchange`",
]) {
  assert.ok(
    normalizedDocumentation.includes(phrase),
    `INF-003 documentation is missing required policy: ${phrase}`,
  );
}

assert.ok(
  documentation.includes("Firestore paths alone never prove authority."),
  "Schema conventions must not be mistaken for authorization.",
);
assert.ok(
  documentation.includes("No secret belongs in Firestore"),
  "Firestore schema documentation must preserve the secret-storage boundary.",
);

console.log(
  `Canonical Firestore schema conventions validated across ${requiredCollections.length + 2} collections.`,
);
