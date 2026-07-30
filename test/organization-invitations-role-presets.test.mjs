import test from "node:test";
import assert from "node:assert/strict";

import {
  STANDARD_ORGANIZATION_ROLE_PRESET_KEYS,
  STANDARD_ORGANIZATION_ROLE_PRESETS,
  standardOrganizationRolePreset,
} from "../src/domain/authorization/organization-role-presets.ts";
import { createOrganizationUserAuthorization } from "../src/domain/authorization/model.ts";
import {
  REQUIRED_LEGAL_DOCUMENT_KINDS,
  createLegalDocumentVersion,
} from "../src/domain/legal/model.ts";
import { createOrganizationAccount } from "../src/domain/organizations/model.ts";
import {
  createOrganizationMembership,
  createUserIdentity,
} from "../src/domain/users/model.ts";
import {
  issueStandardOrganizationUserInvitation,
  planOrganizationInvitationAcceptance,
} from "../src/application/organization-access/invitations.ts";

const NOW = "2026-07-30T12:00:00.000Z";

function organization() {
  return createOrganizationAccount({ id: "org-major-clean", now: NOW });
}

function user(id, email, name = id) {
  return createUserIdentity({
    id,
    name,
    primaryEmail: email,
    loginProvider: "firebase",
    loginSubject: `firebase-${id}`,
    now: NOW,
  });
}

function primaryAdminContext() {
  const org = organization();
  const inviter = user("user-owner", "owner@majorclean.example", "Jonathan Holman");
  const membership = createOrganizationMembership(inviter, org, {
    id: "membership-owner",
    now: NOW,
  });
  const authorization = createOrganizationUserAuthorization(membership, org, {
    roleKey: "primary-administrator",
    permissions: standardOrganizationRolePreset("primary-administrator").permissions,
    now: NOW,
  });
  return { org, inviter, membership, authorization };
}

function legalVersions() {
  return REQUIRED_LEGAL_DOCUMENT_KINDS.map((kind, index) =>
    createLegalDocumentVersion({
      id: `legal-${index + 1}`,
      kind,
      version: "2026-07-30",
      effectiveAt: "2026-07-30T00:00:00.000Z",
      now: "2026-07-30T00:00:00.000Z",
    }),
  );
}

test("ORG-022 exposes exactly the eight standard organization role presets", () => {
  assert.deepEqual(
    STANDARD_ORGANIZATION_ROLE_PRESETS.map((preset) => preset.key),
    STANDARD_ORGANIZATION_ROLE_PRESET_KEYS,
  );
  assert.equal(standardOrganizationRolePreset("primary-administrator").permissions.length > 0, true);
  assert.deepEqual(standardOrganizationRolePreset("administrator").permissions, [
    "organization.profile.manage",
    "organization.users.manage",
    "organization.permissions.manage",
  ]);
  assert.deepEqual(standardOrganizationRolePreset("opportunity-manager").permissions, [
    "rfx.create",
    "rfx.publish",
  ]);
  assert.deepEqual(standardOrganizationRolePreset("responder").permissions, [
    "response.create",
    "response.submit",
  ]);
  assert.deepEqual(standardOrganizationRolePreset("evaluator").permissions, ["evaluation.review"]);
  assert.deepEqual(standardOrganizationRolePreset("referral-manager").permissions, ["referral.manage"]);
  assert.deepEqual(standardOrganizationRolePreset("finance-billing").permissions, ["billing.manage"]);
  assert.deepEqual(standardOrganizationRolePreset("viewer").permissions, []);
});

test("ORG-021 primary administrator can issue an organization-scoped invitation with a capability snapshot", () => {
  const { org, inviter, membership, authorization } = primaryAdminContext();
  const invitation = issueStandardOrganizationUserInvitation({
    id: "invite-brit",
    organization: org,
    inviter,
    inviterMembership: membership,
    inviterAuthorization: authorization,
    inviteeEmail: "Brit.Smith@Example.com",
    rolePresetKey: "opportunity-manager",
    now: NOW,
  });

  assert.equal(invitation.organizationId, org.id);
  assert.equal(invitation.email, "brit.smith@example.com");
  assert.equal(invitation.invitedByUserId, inviter.id);
  assert.equal(invitation.roleKey, "opportunity-manager");
  assert.deepEqual(invitation.permissions, ["rfx.create", "rfx.publish"]);
  assert.equal(invitation.status, "pending");
});

test("invitation issuance fails closed without user and permission-management capabilities", () => {
  const { org, inviter, membership } = primaryAdminContext();
  const authorization = createOrganizationUserAuthorization(membership, org, {
    roleKey: "opportunity-manager",
    permissions: ["rfx.create", "rfx.publish"],
    now: NOW,
  });

  assert.throws(
    () =>
      issueStandardOrganizationUserInvitation({
        id: "invite-denied",
        organization: org,
        inviter,
        inviterMembership: membership,
        inviterAuthorization: authorization,
        inviteeEmail: "invitee@example.com",
        rolePresetKey: "viewer",
        now: NOW,
      }),
    /Organization permission denied: missing-permission/,
  );
});

test("invitation acceptance binds one authenticated user to the existing organization with individual legal evidence", () => {
  const { org, inviter, membership, authorization } = primaryAdminContext();
  const invitation = issueStandardOrganizationUserInvitation({
    id: "invite-lisa",
    organization: org,
    inviter,
    inviterMembership: membership,
    inviterAuthorization: authorization,
    inviteeEmail: "lisa@example.com",
    rolePresetKey: "finance-billing",
    now: NOW,
  });
  const invitee = user("user-lisa", "lisa@example.com", "Lisa Carter");

  const plan = planOrganizationInvitationAcceptance({
    invitation,
    user: invitee,
    organization: org,
    existingMemberships: [],
    membershipId: "membership-lisa",
    legalAcknowledgementIds: {
      "terms-of-service": "ack-lisa-terms",
      "platform-rules": "ack-lisa-rules",
      "privacy-policy": "ack-lisa-privacy",
    },
    currentLegalVersions: legalVersions(),
    now: "2026-07-30T12:05:00.000Z",
  });

  assert.equal(plan.invitation.status, "accepted");
  assert.equal(plan.invitation.acceptedByUserId, invitee.id);
  assert.equal(plan.membership.userId, invitee.id);
  assert.equal(plan.membership.organizationId, org.id);
  assert.equal(plan.membership.status, "active");
  assert.equal(plan.authorization.membershipId, plan.membership.id);
  assert.equal(plan.authorization.roleKey, "finance-billing");
  assert.deepEqual(plan.authorization.permissions, ["billing.manage"]);
  assert.equal(plan.legalAcknowledgements.length, 3);
  assert.deepEqual(
    plan.legalAcknowledgements.map((record) => record.userId),
    [invitee.id, invitee.id, invitee.id],
  );
  assert.deepEqual(
    plan.legalAcknowledgements.map((record) => record.membershipId),
    [plan.membership.id, plan.membership.id, plan.membership.id],
  );
});

test("invitation acceptance rejects a different signed-in email and duplicate organization membership", () => {
  const { org, inviter, membership, authorization } = primaryAdminContext();
  const invitation = issueStandardOrganizationUserInvitation({
    id: "invite-michael",
    organization: org,
    inviter,
    inviterMembership: membership,
    inviterAuthorization: authorization,
    inviteeEmail: "michael@example.com",
    rolePresetKey: "responder",
    now: NOW,
  });
  const wrongUser = user("user-wrong", "wrong@example.com");
  assert.throws(
    () =>
      planOrganizationInvitationAcceptance({
        invitation,
        user: wrongUser,
        organization: org,
        existingMemberships: [],
        membershipId: "membership-wrong",
        legalAcknowledgementIds: {
          "terms-of-service": "ack-wrong-terms",
          "platform-rules": "ack-wrong-rules",
          "privacy-policy": "ack-wrong-privacy",
        },
        currentLegalVersions: legalVersions(),
        now: "2026-07-30T12:05:00.000Z",
      }),
    /email does not match/,
  );

  const invitee = user("user-michael", "michael@example.com");
  const existing = createOrganizationMembership(invitee, org, {
    id: "membership-existing",
    now: NOW,
  });
  assert.throws(
    () =>
      planOrganizationInvitationAcceptance({
        invitation,
        user: invitee,
        organization: org,
        existingMemberships: [existing],
        membershipId: "membership-new",
        legalAcknowledgementIds: {
          "terms-of-service": "ack-michael-terms",
          "platform-rules": "ack-michael-rules",
          "privacy-policy": "ack-michael-privacy",
        },
        currentLegalVersions: legalVersions(),
        now: "2026-07-30T12:05:00.000Z",
      }),
    /will not create a duplicate membership/,
  );
});
