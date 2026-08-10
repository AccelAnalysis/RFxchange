import assert from "node:assert/strict";
import test from "node:test";

import { referralInvitationDeliveryPermitted } from "../src/application/referrals/referral-invitation-delivery.ts";

const queued = Object.freeze({ status: "queued" });
const retryable = Object.freeze({ status: "retryable-failure" });
const accepted = Object.freeze({ status: "accepted" });

function referral(overrides = {}) {
  return Object.freeze({
    status: "sent",
    recipient: Object.freeze({ kind: "external" }),
    attachedRecipientOrganizationId: null,
    ...overrides,
  });
}

test("queued external invitation is deliverable only before recipient attachment", () => {
  assert.equal(referralInvitationDeliveryPermitted(referral(), queued), true);
  assert.equal(referralInvitationDeliveryPermitted(referral({ attachedRecipientOrganizationId: "org-attached" }), queued), false);
});

test("retryable external invitation is blocked after recipient attachment", () => {
  assert.equal(referralInvitationDeliveryPermitted(referral(), retryable), true);
  assert.equal(referralInvitationDeliveryPermitted(referral({ attachedRecipientOrganizationId: "org-attached" }), retryable), false);
});

test("organization recipients remain deliverable while sent even though their recipient organization is attached", () => {
  const organizationReferral = referral({
    recipient: Object.freeze({ kind: "organization" }),
    attachedRecipientOrganizationId: "org-recipient",
  });
  assert.equal(referralInvitationDeliveryPermitted(organizationReferral, queued), true);
});

test("advanced lifecycle or non-retryable communication is not deliverable", () => {
  assert.equal(referralInvitationDeliveryPermitted(referral({ status: "accepted" }), queued), false);
  assert.equal(referralInvitationDeliveryPermitted(referral(), accepted), false);
  assert.equal(referralInvitationDeliveryPermitted(referral(), null), false);
});
