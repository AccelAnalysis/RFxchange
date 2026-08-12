import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [model, service, repository, runtime, route, page, workspace, rules, schema, support, registry, dictionary, workflow, authority, tracker, dependency, evidence, browserAcceptance] = await Promise.all([
  read("src/domain/rfx/model.ts"), read("src/application/rfx/rfx-draft-service.ts"),
  read("src/infrastructure/firestore/rfx.ts"), read("src/infrastructure/rfx/runtime.ts"),
  read("app/api/rfx/route.ts"), read("app/opportunities/manage/page.tsx"), read("src/components/rfx/RFxDraftWorkspace.tsx"),
  read("firestore.rules"), read("src/infrastructure/firestore/schema.ts"), read("src/infrastructure/firestore/support.ts"),
  read("src/application/participant/participant-lens-registry.ts"), read("src/i18n/get-dictionary.ts"),
  read(".github/workflows/ci.yml"), read("docs/slices/SLICE_4_1_EXECUTION_AUTHORITY.md"),
  read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md"), read("docs/tracking/RFxchange_DEPENDENCY_MAP.md"),
  read("docs/architecture/WAVE_4_SLICE_4_1.md"), read("scripts/acceptance-exchange-shell-emulator.mjs"),
]);

for (const boundary of ["RfxAggregate", "RequestFamilySnapshot", "RfxCommandReceipt", "RfxEvent", 'lifecycleState: "draft"']) assert.ok(model.includes(boundary), `RFx model boundary missing: ${boundary}`);
assert.match(model, /RFX_AMACS_RELEASE_VERSION = "0\.5\.0"/);
assert.match(model, /da7879f2609271b067ae6d02875e9388a02c4fe5/);
assert.match(service, /permission: "rfx\.create"/);
assert.match(service, /getRequestFamily/);
assert.match(service, /requestFamilySnapshotFromAmacs/);
assert.match(repository, /runTransaction/);
assert.match(repository, /transaction\.create\(eventRef/);
assert.match(repository, /transaction\.create\(commandRef/);
assert.match(repository, /transaction\.create\(auditRef/);
assert.match(runtime, /FirestoreRfxRepository/);
assert.match(route, /resolveParticipantRoute/);
assert.match(route, /Same-origin request required/);
assert.match(page, /lifecycleState !== "open-platform"/);
assert.match(workspace, /OperationalWorkspace/);
assert.match(workspace, /Private|private|rfxWorkspace\.privateDraft/);
for (const collection of ["rfxAggregates", "rfxEvents", "rfxCommands"]) {
  assert.ok(rules.includes(`/${collection}/`), `Firestore rules missing ${collection}.`);
  assert.ok(schema.includes(collection), `Firestore schema missing ${collection}.`);
  assert.ok(support.includes(`${collection}: Object.freeze`), `Firestore timestamp exposure missing ${collection}.`);
}
assert.match(registry, /href: "\/opportunities"/);
assert.match(registry, /availability: "enabled"/);
for (const locale of ["EnUS", "Es", "Fr", "It", "De"]) assert.ok(dictionary.includes(`rfxWorkspace${locale}`), `RFx locale missing: ${locale}`);
assert.match(workflow, /smoke-rfx-kernel-emulator/);
assert.match(authority, /ISS-001/);
assert.match(tracker, /438 total · 170 Done · 268 Not Started/);
assert.match(tracker, /RFx Core: \*\*18\/41\*\*/);
for (const id of ["ISS-001", "ISS-002", "ISS-003"]) assert.match(tracker, new RegExp("\\[x\\] `" + id + "`"));
assert.match(dependency, /Slice 4\.1 implementation result/);
assert.match(evidence, /Configured-browser acceptance proves/);
assert.match(browserAcceptance, /rfxKernel,/);
assert.match(browserAcceptance, /RFx missing-permission state/);
for (const forbidden of ["amended", "awarded", "submitted"]) {
  assert.doesNotMatch(model, new RegExp(`lifecycleState: [^\\n]*${forbidden}`), `Later lifecycle state leaked into Slice 4.1: ${forbidden}`);
}
console.log("Slice 4.1 RFx aggregate, authorization, AMACS snapshot, atomic persistence, private workspace, localization, and non-scope boundaries validated.");
