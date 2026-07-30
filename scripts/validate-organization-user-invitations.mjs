import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rolePresets = await readFile(
  new URL("../src/domain/authorization/organization-role-presets.ts", import.meta.url),
  "utf8",
);
const invitationModel = await readFile(
  new URL("../src/domain/organization-invitations/model.ts", import.meta.url),
  "utf8",
);
const invitationWorkflow = await readFile(
  new URL("../src/application/organization-access/invitations.ts", import.meta.url),
  "utf8",
);
const acceptanceStore = await readFile(
  new URL("../src/infrastructure/firestore/organization-user-invitations.ts", import.meta.url),
  "utf8",
);
const schema = await readFile(
  new URL("../src/infrastructure/firestore/schema.ts", import.meta.url),
  "utf8",
);
const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");

for (const role of [
  "primary-administrator",
  "administrator",
  "opportunity-manager",
  "responder",
  "evaluator",
  "referral-manager",
  "finance-billing",
  "viewer",
]) {
  assert.ok(rolePresets.includes(`\"${role}\"`), `Missing standard organization role preset ${role}.`);
}

for (const capability of [
  "organization.users.manage",
  "organization.permissions.manage",
  "rfx.create",
  "rfx.publish",
  "response.create",
  "response.submit",
  "evaluation.review",
  "referral.manage",
  "billing.manage",
]) {
  assert.ok(rolePresets.includes(`\"${capability}\"`), `Missing expected role capability ${capability}.`);
}

assert.ok(
  invitationModel.includes("invitedByUserId") &&
    invitationModel.includes("invitedByMembershipId") &&
    invitationModel.includes("roleKey") &&
    invitationModel.includes("permissions") &&
    invitationModel.includes("acceptedByUserId"),
  "ORG-021 invitations must preserve organization, actor, role/capability and accepting-user identity.",
);
assert.ok(
  invitationModel.includes('organizationPermission("organization.users.manage")') &&
    invitationModel.includes('organizationPermission("organization.permissions.manage")'),
  "Invitation issuance must be capability-authorized rather than role-name authorized.",
);
assert.ok(
  invitationWorkflow.includes("createLegalAcknowledgement") &&
    invitationWorkflow.includes("REQUIRED_ACKNOWLEDGEMENT_STATUS") &&
    invitationWorkflow.includes("createOrganizationMembership") &&
    invitationWorkflow.includes("createOrganizationUserAuthorization"),
  "Invitation acceptance must produce membership, role/permissions and individual legal evidence.",
);
assert.ok(
  !invitationWorkflow.includes("createOrganizationAccount"),
  "Invitation acceptance must attach a user to the existing organization rather than create another organization.",
);
assert.ok(
  schema.includes('organizationUserInvitations: "organizationUserInvitations"'),
  "Organization invitations must be registered in the canonical Firestore schema.",
);
assert.ok(
  rules.includes("match /organizationUserInvitations/{documentId}") &&
    rules.includes("allow read, write: if serverManagedOnly();"),
  "Organization invitation records must remain behind the server-managed Firestore boundary.",
);
assert.ok(
  acceptanceStore.includes("runTransaction") &&
    acceptanceStore.includes("organizationMemberships") &&
    acceptanceStore.includes("organizationAuthorizations") &&
    acceptanceStore.includes("legalAcknowledgements"),
  "Invitation acceptance must atomically persist membership, authorization and legal evidence.",
);
assert.ok(
  !rolePresets.includes('from "firebase') &&
    !invitationModel.includes('from "firebase') &&
    !invitationWorkflow.includes('from "firebase'),
  "Organization role and invitation application/domain contracts must remain provider independent.",
);

console.log("Organization invitations and standard role presets validated.");
