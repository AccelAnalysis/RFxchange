import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const primitives = await read("src/components/ui/Primitives.tsx");
const styles = await read("src/components/ui/Primitives.module.css");
const contracts = await read("src/components/ui/object-contracts.ts");
const participant = await read("src/components/participant/ParticipantWorkspace.tsx");
const participantNavigation = await read("src/components/participant/ParticipantTopNavigation.tsx");
const persistentShell = await read("src/components/participant/PersistentParticipantShell.tsx");
const participantRegistry = await read("src/application/participant/participant-lens-registry.ts");

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

test("Participant workspace consumes shared B2 primitives through one persistent shell without enabling later domains", () => {
  const participantComponents = `${participant}\n${participantNavigation}`;
  for (const name of [
    "OverlayPanel",
    "ResponsiveSheet",
    "ControlGroup",
    "SearchFilterFrame",
    "StatusSummary",
  ]) {
    assert.match(participantComponents, new RegExp(`\\b${name}\\b`));
  }

  assert.match(persistentShell, /ParticipantTopNavigation/);
  assert.match(persistentShell, /data-participant-shell=\{authorizedParticipant \? "persistent" : undefined\}/);
  assert.match(persistentShell, /data-participant-content-region/);
  assert.match(participant, /if \(persistent\) return <>\{children\}<\/>/);
  assert.match(participant, /registerExplicitActiveItem\(activeItem\)/);
  assert.match(participant, /Opportunity and resource layers remain unavailable/);

  assert.match(
    participantRegistry,
    /id: "opportunities-rfx"[\s\S]*?href: null[\s\S]*?availability: "unavailable"/,
  );
  assert.match(participantNavigation, /aria-disabled="true"/);
  assert.match(participantNavigation, /participantNavigation\.notYetAvailable/);
  assert.doesNotMatch(participantRegistry, /id: "network"/);
});
