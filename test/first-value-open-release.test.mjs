import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  FirstValueAndOpenReleaseService,
  OPEN_RELEASE_REMEDIATION,
  OPEN_RELEASE_REQUIREMENTS,
  evaluateOpenReleaseGate,
} from "../src/application/activation/open-release.ts";
import {
  FIRST_VALUE_DESTINATIONS,
  FIRST_VALUE_INTENTS,
  FirstValueStateError,
  createFirstValueSelection,
  recommendFirstValueIntent,
} from "../src/domain/first-value/model.ts";
import {
  accessJourneyId,
  advanceAccessLifecycle,
  createAccessLifecycle,
} from "../src/domain/lifecycle/model.ts";
import { organizationId } from "../src/domain/organizations/model.ts";
import { userId } from "../src/domain/users/model.ts";

const NOW = "2026-08-01T19:00:00.000Z";
const scope = Object.freeze({
  accessJourneyId: accessJourneyId("activation-usr-open"),
  userId: userId("usr-open"),
  organizationId: organizationId("org-open"),
});

function controlledLifecycle() {
  let lifecycle = createAccessLifecycle({ id: scope.accessJourneyId, now: NOW });
  for (const state of [
    "account-started", "account-activated", "geography-selected", "organization-resolved",
    "organization-registered", "organization-activated", "controlled-platform",
  ]) lifecycle = advanceAccessLifecycle(lifecycle, state, NOW);
  return Object.freeze({ ...lifecycle, userId: scope.userId });
}

function completeSnapshot(overrides = {}) {
  return Object.freeze({
    scope,
    lifecycle: controlledLifecycle(),
    accountUsable: true,
    authenticationCurrent: true,
    membershipActive: true,
    restrictionState: "none",
    policiesCurrent: true,
    organizationAuthorityEstablished: true,
    profileComplete: true,
    markerActiveInAllowedGeography: true,
    orientationComplete: true,
    selection: createFirstValueSelection({ ...scope, selectedIntent: "explore-network", now: NOW }),
    ...overrides,
  });
}

test("EDU-009 defines every semantic destination without persisting route authority", () => {
  assert.equal(FIRST_VALUE_INTENTS.length, 7);
  assert.deepEqual(Object.keys(FIRST_VALUE_DESTINATIONS), [...FIRST_VALUE_INTENTS]);
  for (const intent of FIRST_VALUE_INTENTS) {
    const destination = FIRST_VALUE_DESTINATIONS[intent];
    assert.equal(destination.intent, intent);
    assert.ok(destination.label && destination.summary && destination.availabilityMessage);
    assert.ok(destination.route === null || destination.route === "/geography/canvas" || destination.route === "/referrals");
  }
  assert.equal(FIRST_VALUE_DESTINATIONS["send-receive-referral"].route, "/referrals");
  assert.equal(FIRST_VALUE_DESTINATIONS["send-receive-referral"].availability, "available");
  const selection = createFirstValueSelection({ ...scope, selectedIntent: "find-teammate", now: NOW });
  assert.deepEqual(selection.presentedIntents, FIRST_VALUE_INTENTS);
  assert.equal(selection.presentationSource, "post-orientation-first-value");
  assert.equal("route" in selection, false);
});

test("acquisition context recommends but direct entry remains neutral", () => {
  assert.equal(recommendFirstValueIntent("opportunity"), "find-opportunities");
  assert.equal(recommendFirstValueIntent("team-invitation"), "find-teammate");
  assert.equal(recommendFirstValueIntent("referral"), "send-receive-referral");
  assert.equal(recommendFirstValueIntent("provider"), "find-resources-support");
  assert.equal(recommendFirstValueIntent("buyer-need"), "find-customers-suppliers");
  assert.equal(recommendFirstValueIntent("organization-claim"), "explore-network");
  assert.equal(recommendFirstValueIntent("direct"), null);
  assert.equal(recommendFirstValueIntent(null), null);
});

test("EDU-010 independently enforces every current OPEN prerequisite with exact remediation", () => {
  const ready = evaluateOpenReleaseGate(completeSnapshot());
  assert.equal(ready.kind, "ready");
  assert.deepEqual(ready.satisfied, OPEN_RELEASE_REQUIREMENTS);
  const missing = Object.freeze({
    "controlled-platform-state": { lifecycle: createAccessLifecycle({ id: scope.accessJourneyId, now: NOW }) },
    "usable-account": { accountUsable: false },
    "current-authentication": { authenticationCurrent: false },
    "active-membership": { membershipActive: false },
    "no-blocking-restriction": { restrictionState: "suspended" },
    "current-policies": { policiesCurrent: false },
    "organization-authority": { organizationAuthorityEstablished: false },
    "profile-complete": { profileComplete: false },
    "active-marker-in-allowed-geography": { markerActiveInAllowedGeography: false },
    "orientation-complete": { orientationComplete: false },
    "first-value-selected-and-presented": { selection: null },
  });
  for (const requirement of OPEN_RELEASE_REQUIREMENTS) {
    const blocked = evaluateOpenReleaseGate(completeSnapshot(missing[requirement]));
    assert.equal(blocked.kind, "blocked", requirement);
    assert.ok(blocked.failed.includes(requirement), requirement);
    assert.equal(blocked.remediation, OPEN_RELEASE_REMEDIATION[blocked.failed[0]], requirement);
  }
});

test("optional classification, provider, verification, commercial and credibility state are absent from OPEN", () => {
  const source = `${evaluateOpenReleaseGate}`;
  for (const forbidden of ["organizationType", "businessObjectives", "participationRoles", "providerStatus", "verified", "paid", "founding", "credibility"]) {
    assert.doesNotMatch(source, new RegExp(forbidden, "i"));
  }
});

test("selection plus OPEN transition is durable, idempotent and cross-scope fail closed", async () => {
  let lifecycle = controlledLifecycle();
  let selection = null;
  const events = [];
  const repository = {
    async getByAccessJourneyId(id) { return id === String(scope.accessJourneyId) ? selection : null; },
    async saveSelection(input) { selection = input.selection; events.push(input.event); },
    async releaseOpen(input) {
      if (lifecycle.state === "open-platform") return "already-open";
      lifecycle = input.lifecycle;
      events.push(input.event);
      return "released";
    },
  };
  const snapshots = {
    async read(requestedScope) {
      if (requestedScope.userId !== scope.userId || requestedScope.organizationId !== scope.organizationId) {
        throw new Error("OPEN release scope belongs to another participant.");
      }
      return completeSnapshot({ lifecycle, selection });
    },
  };
  let sequence = 0;
  const service = new FirstValueAndOpenReleaseService({
    selections: repository, snapshots, ids: { event: () => `event-${++sequence}` }, now: () => NOW,
  });
  const first = await service.selectAndRelease({ scope, selectedIntent: "find-opportunities", acquisitionIntentKind: "opportunity" });
  assert.equal(first.lifecycleState, "open-platform");
  assert.equal(selection.selectedIntent, "find-opportunities");
  assert.equal(selection.acquisitionRecommendation, "find-opportunities");
  assert.deepEqual(events.map((event) => event.kind), ["first-value-selected", "open-released"]);

  const repeated = await service.selectAndRelease({ scope, selectedIntent: "find-opportunities", acquisitionIntentKind: "opportunity" });
  assert.equal(repeated.lifecycleState, "open-platform");
  assert.equal(events.length, 2);
  await assert.rejects(
    service.selectAndRelease({ scope, selectedIntent: "find-resources-support", acquisitionIntentKind: null }),
    (error) => error instanceof FirstValueStateError && error.code === "conflict" &&
      /cannot be changed/.test(error.message),
  );
  await assert.rejects(
    service.selectAndRelease({ scope: { ...scope, userId: userId("usr-other") }, selectedIntent: "find-opportunities", acquisitionIntentKind: null }),
    /another participant/,
  );
});

test("server routes reject stale browser authority and preserve truthful destination boundaries", async () => {
  const [api, client, exchange, firstValue] = await Promise.all([
    readFile(new URL("../app/api/first-value/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/first-value/FirstValueChoiceClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/exchange/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/first-value/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(client, /JSON\.stringify\(\{ selectedIntent: selected \}\)/);
  assert.doesNotMatch(client, /JSON\.stringify\(\{[^}]*organizationId|JSON\.stringify\(\{[^}]*accessJourneyId|JSON\.stringify\(\{[^}]*lifecycle/);
  assert.match(api, /resolveParticipantRoute/);
  assert.match(api, /acquisitionIntentKind: access\.state\.acquisitionContext\?\.kind \?\? null/);
  assert.match(exchange, /service\.evaluate\(scope\)/);
  assert.match(exchange, /redirect\(gate\.remediation\)/);
  assert.match(firstValue, /orientation\.status !== "completed"/);
});
