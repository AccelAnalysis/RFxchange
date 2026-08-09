import assert from "node:assert/strict";
import test from "node:test";

import { createProviderPublication, createProviderRequestMessage, createProviderResource, projectProviderRequestMessage, publicProviderResource, updateProviderPublication, updateProviderResource } from "../src/domain/resource-network/model.ts";
import { createReferral, projectReferral, transitionReferral } from "../src/domain/referrals/model.ts";

const NOW = "2026-08-09T16:00:00.000Z";
const actor = { actorUserId: "user-provider", actorMembershipId: "membership-provider" };

test("provider discovery requires an explicit versioned publication and withdrawal", () => {
  const draft = createProviderPublication({ organizationId: "org-provider", sourceProfileVersion: 4, visibleServiceIds: ["service-capital"], ...actor, now: NOW });
  const published = updateProviderPublication({ current: draft, expectedVersion: 1, sourceProfileVersion: 4, visibleServiceIds: draft.visibleServiceIds, action: "publish", ...actor, now: NOW });
  assert.equal(published.status, "published");
  assert.throws(() => updateProviderPublication({ current: published, expectedVersion: 2, sourceProfileVersion: 5, visibleServiceIds: ["service-other"], action: "save", ...actor, now: NOW }), /withdrawn before changing/);
  assert.equal(updateProviderPublication({ current: published, expectedVersion: 2, sourceProfileVersion: 4, visibleServiceIds: published.visibleServiceIds, action: "withdraw", ...actor, now: NOW }).status, "withdrawn");
});

test("resources have governed lifecycle and minimized expiry-aware projections", () => {
  const draft = createProviderResource({ id: "resource-clinic", organizationId: "org-provider", kind: "workshop", title: "Capital readiness clinic", summary: "Provider-maintained weekly clinic.", description: "Participant-authored clinic and intake steps.", serviceIds: ["service-capital"], geographyIds: ["geo-boston"], modalities: ["hybrid"], eligibility: "Organizations in the maintained service territory.", intakeUrl: "https://provider.example/intake", startsAt: NOW, endsAt: "2026-09-09T16:00:00.000Z", visibility: "network", actorUserId: "user-provider", now: NOW });
  assert.equal(publicProviderResource(draft, "Neighborhood Enterprise Center", NOW), null);
  const published = updateProviderResource({ current: draft, expectedVersion: 1, action: "publish", actorUserId: "user-provider", now: NOW });
  const projection = publicProviderResource(published, "Neighborhood Enterprise Center", NOW);
  assert.equal(projection.providerDisplayName, "Neighborhood Enterprise Center");
  assert.doesNotMatch(JSON.stringify(projection), /user-provider|moderation/);
  assert.equal(publicProviderResource(published, "Neighborhood Enterprise Center", "2026-10-01T00:00:00.000Z"), null);
  assert.equal(updateProviderResource({ current: published, expectedVersion: 2, action: "withdraw", actorUserId: "user-provider", now: NOW }).status, "withdrawn");
});

test("request messages are bounded and restricted to the two organizations", () => {
  const message = createProviderRequestMessage({ id: "provider-message-1", referralId: "ref-provider-1", requesterOrganizationId: "org-requester", providerOrganizationId: "org-provider", authorOrganizationId: "org-requester", authorUserId: "user-requester", body: "Could we confirm the required intake documents?", now: NOW });
  assert.equal(message.body, "Could we confirm the required intake documents?");
  assert.doesNotMatch(JSON.stringify(projectProviderRequestMessage(message)), /user-requester|authorUserId/);
  assert.throws(() => createProviderRequestMessage({ ...message, id: "provider-message-2", authorOrganizationId: "org-stranger", now: NOW }), /outside this provider request/);
  assert.throws(() => createProviderRequestMessage({ ...message, id: "provider-message-3", body: "x".repeat(2001), now: NOW }), /cannot exceed 2000/);
});

test("provider requests preserve exact recipient, service publication, consent, and redirect", () => {
  const referral = createReferral({ id: "ref-provider-1", senderOrganizationId: "org-requester", senderOrganizationName: "Requester Works", recipient: { kind: "organization", organizationId: "org-provider", displayName: "Neighborhood Enterprise Center", notificationEmail: null }, need: "introduction", summary: "We need capital-readiness intake support.", urgency: "standard", preferredContactMethod: "platform", purpose: "provider-connection", providerContext: { providerOrganizationId: "org-provider", serviceId: "service-capital", publicationVersion: 2 }, sharedFields: ["sender-organization", "summary"], consentAcknowledged: true, correlationId: "provider-request:1", actorUserId: "user-requester", actorMembershipId: "membership-requester", now: NOW, expiresAt: "2026-09-09T16:00:00.000Z" });
  assert.equal(referral.providerContext.serviceId, "service-capital");
  const sent = transitionReferral({ referral, expectedVersion: 1, to: "sent", actorUserId: "user-requester", now: NOW });
  const redirected = transitionReferral({ referral: sent, expectedVersion: 2, to: "redirected", actorUserId: "user-provider", now: NOW, providerRedirect: { suggestedProviderOrganizationId: "org-provider-2", suggestedProviderDisplayName: "Regional Support Hub", reason: "This service is a closer fit." } });
  assert.equal(redirected.providerRedirect.suggestedProviderOrganizationId, "org-provider-2");
  assert.equal(projectReferral(redirected, "org-stranger"), null);
  assert.throws(() => createReferral({ ...referral, id: "ref-provider-invalid", recipient: { kind: "organization", organizationId: "org-other", displayName: "Other", notificationEmail: null }, consentAcknowledged: true, now: NOW, expiresAt: "2026-09-09T16:00:00.000Z", actorUserId: "user-requester", actorMembershipId: "membership-requester", correlationId: "provider-request:2" }), /exact recipient/);
});

test("resource contracts do not invent capacity or credibility state", () => {
  const source = [createProviderPublication, createProviderResource, publicProviderResource].map(String).join("\n");
  assert.doesNotMatch(source, /verified|endorsement|founding|sponsor|capacityScore|inferredCapacity/i);
});
