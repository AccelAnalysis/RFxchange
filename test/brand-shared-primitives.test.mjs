import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const primitives = await read("src/components/ui/Primitives.tsx");
const styles = await read("src/components/ui/Primitives.module.css");
const contracts = await read("src/components/ui/object-contracts.ts");
const participant = await read("src/components/participant/ParticipantWorkspace.tsx");

test("Brand B2 exposes shared participant and operational primitives", () => {
  for (const name of [
    "NavigationFrame",
    "OverlayPanel",
    "ResponsiveSheet",
    "ControlGroup",
    "SearchFilterFrame",
    "StatusSummary",
    "StatusPill",
    "AlertBanner",
    "StatePanel",
    "ObjectCard",
    "Timeline",
    "DataTable",
  ]) {
    assert.match(primitives, new RegExp(`export function ${name}\\b`));
  }
});

test("Brand B2 state and data primitives include accessible equivalents", () => {
  assert.match(primitives, /aria-live=\{state === "loading"/);
  assert.match(primitives, /aria-busy=\{state === "loading"/);
  assert.match(primitives, /aria-current=\{item\.current \? "step"/);
  assert.match(primitives, /scope="col"/);
  assert.match(primitives, /scope="row"/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
  assert.match(styles, /focus-visible/);
});

test("Brand B2 future visual objects fail closed without authoritative provenance", () => {
  assert.match(contracts, /syntheticRuntimeObjectsAllowed: false/);
  assert.match(contracts, /plannedObjectsMayRenderAsLive: false/);
  assert.match(contracts, /missingAuthorityBehavior: "omit-and-explain"/);
  assert.match(contracts, /privacyPrecisionMustBePreserved: true/);
  assert.match(contracts, /published-opportunity-projection/);
  assert.match(contracts, /provider-service-territory/);
  assert.match(contracts, /relationship-event/);
  assert.match(contracts, /credibility-evidence/);
  assert.match(contracts, /outcome-evidence/);
});

test("Participant workspace consumes the shared B2 primitives without enabling later domains", () => {
  for (const name of [
    "NavigationFrame",
    "OverlayPanel",
    "ResponsiveSheet",
    "ControlGroup",
    "SearchFilterFrame",
    "StatusSummary",
  ]) {
    assert.match(participant, new RegExp(`\\b${name}\\b`));
  }
  assert.match(participant, /Opportunity and resource layers remain unavailable/);
  assert.match(participant, /Available in a later approved product slice/);
});
