import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createSyntheticOrientationScenario,
  orientationMapOverlay,
} from "../src/application/orientation/synthetic-scenario.ts";
import { createPortsmouthControlledLocalityPreview } from "../src/data/geography/portsmouth-controlled-locality-preview.ts";
import { accessJourneyId } from "../src/domain/lifecycle/model.ts";
import { organizationId } from "../src/domain/organizations/model.ts";
import { userId } from "../src/domain/users/model.ts";

const NOW = "2026-08-01T12:08:00.000Z";

function journey(completedThroughStep, status = "in-progress") {
  return Object.freeze({
    id: "orientation-activation-usr",
    version: 1,
    scenarioId: "exchange-network-basics",
    scenarioVersion: 1,
    userId: userId("usr"),
    accessJourneyId: accessJourneyId("activation-usr"),
    organizationId: organizationId("org"),
    geographyId: "us-va-portsmouth",
    status,
    completedThroughStep,
    revision: completedThroughStep + 1,
    restartCount: 0,
    startedAt: NOW,
    updatedAt: NOW,
    completedAt: status === "completed" ? NOW : null,
  });
}

test("EDU-005 models reviewed nonbinding invitation and explicit acceptance", async () => {
  const scenario = createSyntheticOrientationScenario(await createPortsmouthControlledLocalityPreview());
  assert.equal(scenario.teammateInvitation.reviewState, "reviewed");
  assert.equal(scenario.teammateInvitation.acceptanceState, "accepted");
  assert.match(scenario.teammateInvitation.nonbindingBoundary, /not a subcontract, joint venture, teaming agreement/);
});

test("EDU-006 maps every synthetic requirement to contribution and completion", async () => {
  const scenario = createSyntheticOrientationScenario(await createPortsmouthControlledLocalityPreview());
  assert.ok(scenario.jointResponse.sections.length >= 4);
  assert.ok(scenario.jointResponse.sections.every((section) => section.requirement && section.assignedTo && section.state === "complete"));
  assert.ok(scenario.jointResponse.sections.some((section) => section.assignedTo === "Tutorial Teammate"));
  assert.match(scenario.jointResponse.submissionBoundary, /no live RFx response/);
});

test("EDU-007 preserves stated criteria and human selection authority", async () => {
  const scenario = createSyntheticOrientationScenario(await createPortsmouthControlledLocalityPreview());
  assert.equal(scenario.evaluation.criteria.length, 3);
  assert.equal(scenario.evaluation.responses.length, 2);
  assert.ok(scenario.evaluation.responses.some((response) => response.id === scenario.evaluation.selectedResponseId));
  assert.match(scenario.evaluation.authorityBoundary, /does not automatically choose a winner/);
});

test("EDU-008 completes the connected map path without claiming a live outcome", async () => {
  const scenario = createSyntheticOrientationScenario(await createPortsmouthControlledLocalityPreview());
  const overlay = orientationMapOverlay(scenario, journey(8, "completed"));
  assert.equal(overlay.stage, "network-effect");
  assert.deepEqual(overlay.paths.map((path) => path.kind), [
    "demand-signal", "capability-match", "teammate-discovery", "joint-response", "selected-outcome",
  ]);
  assert.match(overlay.accessibleSummary, /complete synthetic network path/);
  assert.match(scenario.networkEffect.outcomeBoundary, /not an award, contract, verified economic outcome, or credibility event/);
});

test("EDU-005-008 UI and server remain synthetic, ordered, and completion-bound", async () => {
  const [client, service, scenario, map] = await Promise.all([
    readFile(new URL("../src/components/orientation/OrientationJourneyClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/application/orientation/orientation-journey.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/application/orientation/synthetic-scenario.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/map/ExchangeSpatialScene.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(client, /Accept synthetic invitation/);
  assert.match(client, /Submit synthetic response/);
  assert.match(client, /Make human tutorial selection/);
  assert.match(client, /Complete orientation/);
  assert.match(service, /next\.status === "completed" \? "completed" : "step-completed"/);
  assert.doesNotMatch(scenario, /opportunitiesRepository|responsesRepository|referralsRepository|teamRepository|credibilityRepository/i);
  assert.match(map, /network-effect/);
});
