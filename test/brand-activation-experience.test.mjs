import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const journey = await read("src/components/onboarding/ActivationJourneyClient.tsx");
const journeyStyles = await read("src/components/onboarding/ActivationJourneyClient.module.css");
const spatial = await read("src/components/onboarding/SpatialActivationExperience.tsx");

test("Brand B5 preserves the authoritative activation journey", () => {
  for (const value of [
    "search-geographies",
    "select-census-geography",
    "MapboxLocalityCanvas",
    "Confirm this map position",
    "websiteNotApplicable",
    "Enter the Exchange",
  ]) {
    assert.match(journey, new RegExp(value));
  }
});

test("Brand B5 provides state continuity and non-blocking reduced-motion workspace entry", () => {
  assert.match(spatial, /Activation progress is preserved/);
  assert.match(spatial, /Your organization is now visible\. Entering The RFxchange\./);
  assert.match(spatial, /prefers-reduced-motion: reduce/);
  assert.match(spatial, /reducedMotion \? 50 : 900/);
  assert.match(spatial, />Enter now</);
  assert.doesNotMatch(spatial, /3_400/);
  assert.match(spatial, /StatusPill/);
});

test("Brand B5 uses semantic styling and accessible focus/sensory fallbacks", () => {
  assert.match(journeyStyles, /semantic-canvas/);
  assert.match(journeyStyles, /focus-visible/);
  assert.match(journeyStyles, /prefers-reduced-motion: reduce/);
  assert.match(journeyStyles, /prefers-reduced-transparency: reduce/);
  assert.doesNotMatch(journeyStyles, /#(?:0b0b0d|f7f3ea|252932|d6a23a|8a6418|2e5eaa|3b7b57)\b/i);
});

test("Brand B5 does not add sound, provider shortcuts, or registration objectives", () => {
  const source = `${journey}\n${spatial}`.toLowerCase();
  assert.doesNotMatch(source, /new audio\(/);
  assert.doesNotMatch(source, /<audio/);
  assert.doesNotMatch(source, /business objectives/);
  assert.doesNotMatch(source, /participation role/);
  assert.doesNotMatch(source, /apply as a resource provider during registration/);
});
