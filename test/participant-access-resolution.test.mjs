import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { participantEntryDestination } from "../src/infrastructure/auth/participant-route-destination.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("participant entry destinations keep activation and access repair separate", () => {
  assert.equal(participantEntryDestination({
    kind: "activation-required",
    reason: "activation-context-required",
    context: {},
    state: null,
  }), "/join");
  assert.equal(participantEntryDestination({
    kind: "activation-required",
    reason: "activation-incomplete",
    context: {},
    state: {},
  }, "/acquisition/founding"), "/acquisition/founding");
  assert.equal(participantEntryDestination({
    kind: "access-resolution-required",
    reason: "account-resolution",
    context: {},
    state: {},
    options: [],
    selectedOrganizationId: null,
  }), "/access/resolve?reason=account-resolution");
  assert.equal(participantEntryDestination({
    kind: "access-resolution-required",
    reason: "organization-resolution",
    context: {},
    state: {},
    options: [{ organizationId: "org-b", membershipId: "membership-b" }],
    selectedOrganizationId: "org-b",
  }), "/access/resolve?reason=organization-resolution&organizationId=org-b");
});

test("protected participant routes consume access resolution instead of collapsing it to Join", async () => {
  const paths = [
    "app/exchange/page.tsx",
    "app/geography/canvas/page.tsx",
    "app/orientation/page.tsx",
    "app/first-value/page.tsx",
    "app/referrals/page.tsx",
    "app/resources/page.tsx",
    "app/provider-application/page.tsx",
    "app/organization-profile/page.tsx",
  ];
  const sources = await Promise.all(paths.map(read));
  for (let index = 0; index < sources.length; index += 1) {
    assert.match(sources[index], /access\.kind === "access-resolution-required"/, paths[index]);
    assert.match(sources[index], /participantEntryDestination\(access/, paths[index]);
  }
});

test("Join and the dedicated resolution page cannot transfer old organization lifecycle authority", async () => {
  const [join, resolution, classifier, englishRecovery] = await Promise.all([
    read("app/join/page.tsx"),
    read("app/access/resolve/page.tsx"),
    read("src/infrastructure/auth/participant-route-classification.ts"),
    read("src/i18n/messages/recovery/en-US.json"),
  ]);

  assert.match(join, /access\.kind === "access-resolution-required"/);
  assert.match(join, /participantEntryDestination\(access\)/);
  assert.match(resolution, /access\.options\.map/);
  assert.match(resolution, /selectedOrganizationId/);
  assert.match(resolution, /copy\.organizationBoundary/);
  assert.match(englishRecovery, /does not transfer another organization’s setup or permissions/);
  assert.doesNotMatch(resolution, /access\.membership/);
  assert.doesNotMatch(classifier, /stateForMembership/);
  assert.doesNotMatch(classifier, /kind: "authorized"[\s\S]{0,500}governedMembershipRepair/);
});
