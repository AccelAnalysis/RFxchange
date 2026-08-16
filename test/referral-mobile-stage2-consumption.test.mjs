import assert from "node:assert/strict";
import test from "node:test";

import {
  createReferralMobileActionRail,
  createReferralMobileRecordBinding,
  REFERRAL_MOBILE_COMPOSITION_POLICY,
} from "../src/application/referrals/referral-mobile-composition.ts";
import { projectExchangeRoomActions } from "../src/application/participant/exchange-room-actions.ts";
import { selectionMatchesCard } from "../src/application/participant/mobile-exchange-contracts.ts";

const copy = Object.freeze({
  translate(key, values = {}) {
    const catalog = {
      "referralWorkspace.roles.sender": "Sending organization",
      "referralWorkspace.roles.recipient": "Recipient organization",
      "referralWorkspace.fields.purpose": "Purpose",
      "referralWorkspace.fields.urgency": "Urgency",
      "referralWorkspace.fields.contact": "Preferred contact",
      "referralWorkspace.fields.notification": "Notification",
      "referralWorkspace.fields.expires": "Expires",
      "referralWorkspace.notificationStates.deliveryOutcomeUnknown": "Delivery outcome unknown",
      "referralWorkspace.path.visible": `Referral path: ${values.status ?? ""}`,
      "referralWorkspace.path.unavailable": "No referral path is available.",
      "referralWorkspace.detail.boundary": "Participant-reported context; no endorsement or verified outcome.",
    };
    return catalog[key] ?? key;
  },
  formatToken(value) {
    return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  },
  formatDate(value) {
    return value.slice(0, 10);
  },
});

function senderReferral(overrides = {}) {
  return Object.freeze({
    role: "sender",
    id: "ref-1",
    version: 3,
    senderOrganizationId: "org-home",
    recipientLabel: "Counterparty LLC",
    recipientKind: "organization",
    recipientOrganizationId: "org-counterparty",
    need: "introduction",
    summary: "Introduce the two organizations for a capability conversation.",
    urgency: "standard",
    preferredContactMethod: "email",
    purpose: "business-introduction",
    opportunityReference: null,
    providerContext: null,
    providerRedirect: null,
    sharedFields: ["sender-organization", "summary"],
    status: "sent",
    outcome: null,
    correlationId: "private-correlation-must-not-project",
    notificationStatus: "accepted",
    createdAt: "2026-08-16T12:00:00.000Z",
    sentAt: "2026-08-16T12:05:00.000Z",
    expiresAt: "2026-09-15T12:00:00.000Z",
    updatedAt: "2026-08-16T12:05:00.000Z",
    ...overrides,
  });
}

function recipientReferral(overrides = {}) {
  return Object.freeze({
    role: "recipient",
    id: "ref-received-1",
    version: 2,
    senderOrganizationId: "org-sender",
    senderOrganizationName: "Sender Industries",
    recipientLabel: "Viewer Organization",
    recipientOrganizationId: "org-home",
    need: "capability",
    summary: "A real received referral requiring a participant decision.",
    urgency: "soon",
    preferredContactMethod: "platform",
    purpose: "capability-connection",
    opportunityReference: null,
    providerContext: null,
    providerRedirect: null,
    sharedFields: ["sender-organization", "summary"],
    status: "sent",
    outcome: null,
    correlationId: "private-received-correlation",
    notificationStatus: "accepted",
    createdAt: "2026-08-16T13:00:00.000Z",
    sentAt: "2026-08-16T13:01:00.000Z",
    expiresAt: "2026-09-15T13:00:00.000Z",
    updatedAt: "2026-08-16T13:01:00.000Z",
    ...overrides,
  });
}

function counterparty(overrides = {}) {
  return Object.freeze({
    organizationId: "org-counterparty",
    displayName: "Counterparty LLC",
    markerId: "marker-org-counterparty",
    locality: "Suffolk, VA",
    media: null,
    pathEndpointEligible: true,
    ...overrides,
  });
}

test("real sent Referral binds focal record, counterparty, card, detail and authorized path through shared contracts", () => {
  const binding = createReferralMobileRecordBinding({
    referral: senderReferral(),
    viewerOrganizationId: "org-home",
    counterparty: counterparty(),
    pathAuthorized: true,
    relationshipGeometryReference: "relationship-geometry:ref-1",
    copy,
  });

  assert.equal(binding.identity.subjectKind, "record");
  assert.equal(binding.identity.selectionKey, "referral:ref-1");
  assert.equal(binding.selection.kind, "record");
  assert.equal(binding.selection.selectedOrganization.selectionKey, "organization:org-counterparty");
  assert.equal(binding.selection.selectedOrganization.associationRole, "counterparty");
  assert.equal(binding.selection.selectedMarker.role, "associated-organization");
  assert.equal(binding.selection.selectedRelationship.relationshipId, "ref-1");
  assert.equal(binding.selection.selectedRelationship.authority, "server-revalidated");
  assert.equal(selectionMatchesCard(binding.selection, binding.card), true);

  assert.equal(binding.card.title, "Counterparty LLC");
  assert.equal(binding.card.locality, "Suffolk, VA");
  assert.equal(binding.card.summary, "Introduce the two organizations for a capability conversation.");
  assert.equal(binding.card.favorite.visible, false);
  assert.equal(binding.card.favorite.availability, "hidden");
  assert.equal(binding.card.favorite.handler, null);
  assert.equal(binding.card.detailContext.canonicalHref, "/referrals?referral=ref-1");

  assert.equal(binding.relationship.pathState, "authorized-path");
  assert.deepEqual(binding.relationship.endpointOrganizationIds, ["org-home", "org-counterparty"]);
  assert.equal(binding.relationship.geometryReference, "relationship-geometry:ref-1");
  assert.equal(binding.relationship.authoritySource, "server-derived");

  assert.equal(binding.detail.consentState, "recorded-evidence-minimized");
  assert.equal(binding.detail.reportedOutcome, null);
  assert.equal(binding.detail.outcomeAuthority, null);
  assert.deepEqual(binding.detail.sharedFields, ["sender-organization", "summary"]);
  assert.equal(JSON.stringify(binding).includes("private-correlation-must-not-project"), false);
});

test("received Referral binds only the real recipient lifecycle actions and keeps server command context outside the shared card action", () => {
  const binding = createReferralMobileRecordBinding({
    referral: recipientReferral(),
    viewerOrganizationId: "org-home",
    counterparty: counterparty({
      organizationId: "org-sender",
      displayName: "Sender Industries",
      markerId: "marker-org-sender",
    }),
    pathAuthorized: true,
    copy,
  });

  assert.equal(binding.card.title, "Sender Industries");
  assert.deepEqual(binding.card.recordActions.map((action) => action.id), [
    "referral.accepted",
    "referral.declined",
  ]);
  assert.deepEqual(binding.card.recordActions.map((action) => action.handler?.intent), [
    "referral.transition.accepted",
    "referral.transition.declined",
  ]);
  assert.deepEqual(binding.recordActionCommands, [
    {
      id: "referral.accepted",
      kind: "transition",
      referralId: "ref-received-1",
      expectedVersion: 2,
      action: "accepted",
    },
    {
      id: "referral.declined",
      kind: "transition",
      referralId: "ref-received-1",
      expectedVersion: 2,
      action: "declined",
    },
  ]);
});

test("external recipient remains a real Referral record without a fabricated organization, marker, endpoint or path", () => {
  const binding = createReferralMobileRecordBinding({
    referral: senderReferral({
      id: "ref-external",
      recipientKind: "external",
      recipientOrganizationId: null,
      recipientLabel: "External Recipient",
    }),
    viewerOrganizationId: "org-home",
    counterparty: null,
    pathAuthorized: false,
    copy,
  });

  assert.equal(binding.selection.kind, "record");
  assert.equal(binding.selection.selectedOrganization, null);
  assert.equal(binding.selection.selectedMarker, null);
  assert.equal(binding.identity.organizationId, null);
  assert.equal(binding.card.organizationIdentity, null);
  assert.equal(binding.relationship.pathState, "no-path");
  assert.equal(binding.relationship.endpointOrganizationIds, null);
  assert.equal(binding.relationship.geometryReference, null);
  assert.equal(binding.relationship.privacy, "suppressed");
});

test("declined, expired, redirected, draft and unauthorized relationship states explicitly project no-path", () => {
  for (const status of ["draft", "declined", "redirected", "expired"]) {
    const binding = createReferralMobileRecordBinding({
      referral: senderReferral({ id: `ref-${status}`, status }),
      viewerOrganizationId: "org-home",
      counterparty: counterparty(),
      pathAuthorized: true,
      copy,
    });
    assert.equal(binding.relationship.pathState, "no-path", status);
    assert.equal(binding.relationship.endpointOrganizationIds, null, status);
  }

  const suppressed = createReferralMobileRecordBinding({
    referral: senderReferral({ id: "ref-path-suppressed" }),
    viewerOrganizationId: "org-home",
    counterparty: counterparty(),
    pathAuthorized: false,
    relationshipGeometryReference: "must-not-project",
    copy,
  });
  assert.equal(suppressed.relationship.pathState, "no-path");
  assert.equal(suppressed.relationship.endpointOrganizationIds, null);
  assert.equal(suppressed.relationship.geometryReference, null);
  assert.equal(JSON.stringify(suppressed).includes("must-not-project"), false);
});

test("counterparty and viewer mismatches fail rather than widening selection or relationship disclosure", () => {
  assert.throws(
    () => createReferralMobileRecordBinding({
      referral: senderReferral(),
      viewerOrganizationId: "org-wrong-viewer",
      counterparty: counterparty(),
      pathAuthorized: true,
      copy,
    }),
    /does not belong to the current viewer organization/,
  );

  assert.throws(
    () => createReferralMobileRecordBinding({
      referral: senderReferral(),
      viewerOrganizationId: "org-home",
      counterparty: counterparty({ organizationId: "org-unrelated" }),
      pathAuthorized: true,
      copy,
    }),
    /does not match the authorized Referral projection/,
  );

  assert.throws(
    () => createReferralMobileRecordBinding({
      referral: senderReferral({ recipientKind: "external", recipientOrganizationId: null }),
      viewerOrganizationId: "org-home",
      counterparty: counterparty(),
      pathAuthorized: true,
      copy,
    }),
    /external Referral recipient cannot be promoted to an organization counterparty/,
  );
});

test("current sender retry and transition actions mirror the existing Referral runtime without broadening lifecycle", () => {
  const retry = createReferralMobileRecordBinding({
    referral: senderReferral({ notificationStatus: "retryable-failure" }),
    viewerOrganizationId: "org-home",
    counterparty: counterparty(),
    pathAuthorized: true,
    copy,
  });
  assert.deepEqual(retry.card.recordActions.map((action) => action.id), ["referral.retry-communication"]);
  assert.equal(retry.recordActionCommands[0].kind, "retry-communication");

  const contacted = createReferralMobileRecordBinding({
    referral: senderReferral({ status: "contacted", version: 5 }),
    viewerOrganizationId: "org-home",
    counterparty: counterparty(),
    pathAuthorized: true,
    copy,
  });
  assert.deepEqual(contacted.card.recordActions.map((action) => action.id), ["referral.closed"]);
  assert.equal(contacted.recordActionCommands[0].action, "closed");

  const closed = createReferralMobileRecordBinding({
    referral: senderReferral({ status: "closed", outcome: "connected", version: 6 }),
    viewerOrganizationId: "org-home",
    counterparty: counterparty(),
    pathAuthorized: true,
    copy,
  });
  assert.deepEqual(closed.card.recordActions, []);
  assert.equal(closed.detail.reportedOutcome, "connected");
  assert.equal(closed.detail.outcomeAuthority, "participant-reported-non-verified");
});

test("Referrals consumes exactly the four frozen lens-action positions with progressive availability intact", () => {
  const projections = projectExchangeRoomActions({
    activeLens: "referrals",
    viewerOrganizationId: "org-home",
    selectedOrganizationId: "org-counterparty",
    selectedOrganizationIsOfficialResourceProvider: false,
    openPlatformActionsAuthorized: true,
    networkDiscoveryAvailable: true,
    actionAuthorization: {
      rfxCreate: false,
      referralManage: true,
      resourceManage: false,
    },
    currentOpportunityReference: null,
  });
  const rail = createReferralMobileActionRail(projections);

  assert.equal(rail.lens, "referrals");
  assert.equal(rail.placement, "sheet-top");
  assert.equal(rail.actions.length, 4);
  assert.deepEqual(rail.actions.map((action) => action.id), [
    "referrals.new",
    "referrals.sent",
    "referrals.received",
    "referrals.starred",
  ]);
  assert.deepEqual(rail.actions.map((action) => action.position), [1, 2, 3, 4]);
  assert.ok(rail.actions.every((action) => action.availability === "disabled"));
  assert.ok(rail.actions.every((action) => action.handler === null));
  assert.equal(rail.actions[0].authorized, true);
});

test("Referrals Stage 2 policy consumes shared infrastructure and makes favorite/path/authority absence explicit", () => {
  assert.deepEqual(REFERRAL_MOBILE_COMPOSITION_POLICY, {
    sharedShellOnly: true,
    sharedMapOnly: true,
    sharedSheetOnly: true,
    sharedCardOnly: true,
    sharedSelectionOnly: true,
    sharedActionRailOnly: true,
    favoritePersistenceAvailable: false,
    clientSelectionGrantsAuthority: false,
    pathRequiresCurrentDomainAuthorization: true,
    noPathDisclosesEndpoints: false,
    consentEvidenceIsMinimized: true,
    outcomeIsNeverVerifiedByReferralState: true,
  });
});
