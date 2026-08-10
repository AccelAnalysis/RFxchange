import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  loadRequiredSceneWithRetry,
  REQUIRED_SCENE_MAX_ATTEMPTS,
  REQUIRED_SCENE_RETRY_BASE_DELAY_MS,
} from "../src/application/onboarding/required-scene-recovery.ts";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("required spatial requests retry a bounded number of times and preserve the final result", async () => {
  const controller = new AbortController();
  const delays = [];
  let attempts = 0;
  const result = await loadRequiredSceneWithRetry(
    async () => {
      attempts += 1;
      if (attempts < REQUIRED_SCENE_MAX_ATTEMPTS) throw new Error("temporary dependency failure");
      return "authorized-scene";
    },
    controller.signal,
    async (milliseconds) => delays.push(milliseconds),
  );

  assert.equal(result, "authorized-scene");
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [
    REQUIRED_SCENE_RETRY_BASE_DELAY_MS,
    REQUIRED_SCENE_RETRY_BASE_DELAY_MS * 2,
  ]);
});

test("required spatial requests fail after the bounded attempt budget", async () => {
  const controller = new AbortController();
  let attempts = 0;
  await assert.rejects(
    loadRequiredSceneWithRetry(
      async () => {
        attempts += 1;
        throw new Error("still unavailable");
      },
      controller.signal,
      async () => undefined,
    ),
    /still unavailable/,
  );
  assert.equal(attempts, REQUIRED_SCENE_MAX_ATTEMPTS);
});

test("cancelled spatial requests do not consume retry attempts", async () => {
  const controller = new AbortController();
  controller.abort();
  let attempts = 0;
  await assert.rejects(
    loadRequiredSceneWithRetry(
      async (signal) => {
        attempts += 1;
        if (signal.aborted) throw new DOMException("cancelled", "AbortError");
        return "unexpected";
      },
      controller.signal,
      async () => assert.fail("an aborted request must not wait for retry"),
    ),
    (error) => error instanceof DOMException && error.name === "AbortError",
  );
  assert.equal(attempts, 1);
});

test("candidate selection, motion scope, and incremental Mapbox updates remain explicit", () => {
  const activation = read("src/components/onboarding/ActivationJourneyClient.tsx");
  const spatialActivation = read("src/components/onboarding/SpatialActivationExperience.tsx");
  const scene = read("src/components/map/ExchangeSpatialScene.tsx");
  const mapbox = read("src/components/map/MapboxLocalityCanvas.tsx");
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");

  assert.match(activation, /selectedLocationCandidateId/);
  assert.match(activation, /candidateId: selectedLocationCandidateId/);
  assert.match(activation, /entry\.id === selectedLocationCandidateId/);
  assert.match(spatialActivation, /loadRequiredSceneWithRetry/);
  assert.match(scene, /continuousMotionRef\.current/);
  assert.doesNotMatch(workspace, /continuousMotion=/);
  assert.match(mapbox, /source\?\.setData\(relationshipPathGeoJson\)/);
  assert.match(mapbox, /source\?\.setData\(serviceFieldGeoJson\)/);
  assert.match(mapbox, /synchronizePointOverlays/);
  assert.doesNotMatch(
    mapbox.match(/\}, \[[\s\S]*?\]\);\n\n  useEffect\(\(\) => \{\n    pointOverlaysRef/)?.[0] ?? "",
    /pointOverlays,\n|relationshipPaths,\n|serviceFields,\n/,
  );
});

test("new map recovery and candidate copy is complete in all supported locales", () => {
  const locales = ["en-US", "es", "fr", "it", "de"];
  const expectedKeys = Object.keys(JSON.parse(read("src/i18n/messages/map-stabilization/en-US.json"))).sort();
  for (const locale of locales) {
    const messages = JSON.parse(read(`src/i18n/messages/map-stabilization/${locale}.json`));
    assert.deepEqual(Object.keys(messages).sort(), expectedKeys, `${locale} keys`);
    for (const value of Object.values(messages)) assert.ok(String(value).trim(), `${locale} message`);
  }
});
