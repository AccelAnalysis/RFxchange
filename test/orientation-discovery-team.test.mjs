import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { OrientationJourneyService } from "../src/application/orientation/orientation-journey.ts";
import {
  SYNTHETIC_ORIENTATION_PROVENANCE,
  createSyntheticOrientationScenario,
  phaseOneOrientationOverlay,
} from "../src/application/orientation/synthetic-scenario.ts";
import { createPortsmouthControlledLocalityPreview } from "../src/data/geography/portsmouth-controlled-locality-preview.ts";
import { geographicPositionWithinBoundary } from "../src/domain/organization-location/model.ts";
import { accessJourneyId } from "../src/domain/lifecycle/model.ts";
import {
  ORIENTATION_STEP_SEQUENCE,
  SLICE_2_10_MAX_ORIENTATION_STEP,
} from "../src/domain/orientation/model.ts";
import { organizationId } from "../src/domain/organizations/model.ts";
import { userId } from "../src/domain/users/model.ts";

const START = "2026-08-01T12:00:00.000Z";

function fixture() {
  const journeys = new Map();
  const events = [];
  let sequence = 0;
  let now = START;
  const repository = {
    async getById(id) { return journeys.get(id) ?? null; },
    async saveTransition(input) {
      const existing = journeys.get(input.journey.id);
      assert.equal(existing?.revision ?? null, input.expectedRevision);
      journeys.set(input.journey.id, input.journey);
      events.push(input.event);
    },
  };
  const service = new OrientationJourneyService({
    journeys: repository,
    ids: { event: () => `orientation-event-${++sequence}` },
    now: () => now,
  });
  const scope = Object.freeze({
    userId: userId("usr-orientation"),
    accessJourneyId: accessJourneyId("activation-usr-orientation"),
    organizationId: organizationId("org-orientation"),
    geographyId: "us-va-portsmouth",
  });
  return { service, scope, journeys, events, setNow(value) { now = value; } };
}

test("EDU-001-004 define one stable eight-step scenario while Slice 2.10 exposes only steps 1-4", () => {
  assert.deepEqual(ORIENTATION_STEP_SEQUENCE.map((step) => step.key), [
    "three-organization-scenario",
    "opportunity-issuance",
    "capability-match",
    "gap-and-teammate-discovery",
    "teammate-invitation",
    "joint-response",
    "human-evaluation",
    "network-effect",
  ]);
  assert.equal(SLICE_2_10_MAX_ORIENTATION_STEP, 4);
});

test("EDU-001-004 persist resumable, ordered, idempotent and restartable progress", async () => {
  const subject = fixture();
  const started = await subject.service.start(subject.scope);
  assert.equal(started.completedThroughStep, 0);
  assert.equal((await subject.service.start(subject.scope)).revision, 1);
  assert.equal(subject.events.length, 1, "re-entry must not duplicate start evidence");

  await assert.rejects(
    subject.service.completeStep(subject.scope, "opportunity-issuance"),
    /canonical order/,
  );
  for (const [index, step] of ORIENTATION_STEP_SEQUENCE.slice(0, 4).entries()) {
    subject.setNow(`2026-08-01T12:0${index + 1}:00.000Z`);
    const journey = await subject.service.completeStep(subject.scope, step.key);
    assert.equal(journey.completedThroughStep, index + 1);
  }
  const repeated = await subject.service.completeStep(subject.scope, "capability-match");
  assert.equal(repeated.completedThroughStep, 4);
  assert.equal(subject.events.length, 5, "idempotent replay must not duplicate evidence");
  await assert.rejects(
    subject.service.completeStep(subject.scope, "teammate-invitation"),
    /not enabled/,
  );

  const restarted = await subject.service.restart(subject.scope);
  assert.equal(restarted.completedThroughStep, 0);
  assert.equal(restarted.restartCount, 1);
  assert.equal(subject.events.at(-1).kind, "restarted");
  await assert.rejects(
    subject.service.get({ ...subject.scope, userId: userId("usr-other") }),
    /another participant scope/,
  );
});

test("EDU-001-004 synthetic scenario stays deterministic, locality-bounded and clearly tutorial-provenanced", async () => {
  const model = await createPortsmouthControlledLocalityPreview();
  const selected = model.features.find((feature) => feature.role === "selected");
  assert.ok(selected);
  const first = createSyntheticOrientationScenario(model);
  const second = createSyntheticOrientationScenario(model);
  assert.deepEqual(second, first);
  assert.equal(first.provenance, SYNTHETIC_ORIENTATION_PROVENANCE);
  assert.equal(first.organizations.length, 3);
  for (const node of [...first.organizations, first.opportunity.node]) {
    assert.equal(node.provenance, SYNTHETIC_ORIENTATION_PROVENANCE);
    assert.ok(geographicPositionWithinBoundary(node.coordinate, selected.boundary.geometry));
  }
  for (const [index, node] of first.organizations.entries()) {
    for (const peer of first.organizations.slice(index + 1)) {
      const separation = Math.hypot(node.coordinate[0] - peer.coordinate[0], node.coordinate[1] - peer.coordinate[1]);
      assert.ok(separation > 0.01, "synthetic organizations must remain visually separated at locality fit");
    }
  }
  const initial = phaseOneOrientationOverlay(first, null);
  assert.equal(initial.nodes.length, 3);
  assert.equal(initial.paths.length, 0);
  const complete = phaseOneOrientationOverlay(first, {
    id: "orientation-activation-usr", version: 1, scenarioId: first.id,
    scenarioVersion: first.version, userId: userId("usr"), accessJourneyId: accessJourneyId("activation-usr"),
    organizationId: organizationId("org"), geographyId: model.selectedGeography.id,
    status: "in-progress", completedThroughStep: 4, revision: 5, restartCount: 0,
    startedAt: START, updatedAt: START, completedAt: null,
  });
  assert.equal(complete.nodes.length, 4);
  assert.deepEqual(complete.paths.map((path) => path.kind), ["capability-match", "teammate-discovery"]);
});

test("EDU-001-004 route and map integration preserve server authority and synthetic isolation", async () => {
  const [route, scenario, map, client, rules] = await Promise.all([
    readFile(new URL("../app/api/orientation/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/application/orientation/synthetic-scenario.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/map/ExchangeSpatialScene.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/orientation/OrientationJourneyClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../firestore.rules", import.meta.url), "utf8"),
  ]);
  assert.match(route, /resolveParticipantRoute/);
  assert.match(route, /resolveAuthorizedOrientationScope/);
  assert.doesNotMatch(client, /firebase|firestore|collection\(/i);
  assert.doesNotMatch(scenario, /opportunitiesRepository|responsesRepository|referralsRepository|teamRepository/i);
  assert.match(map, /TUTORIAL_NODE_SOURCE_ID/);
  assert.match(map, /TUTORIAL_PATH_SOURCE_ID/);
  assert.match(client, /showSearch=\{false\}/);
  assert.match(rules, /match \/orientationJourneys\/\{documentId\}/);
  assert.match(rules, /match \/orientationJourneyEvents\/\{documentId\}/);
});
