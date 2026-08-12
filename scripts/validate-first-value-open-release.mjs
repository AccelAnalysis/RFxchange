import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [model, service, runtime, api, firstValuePage, joinPage, exchangePage, repository, rules, workflow, architecture] = await Promise.all([
  read("src/domain/first-value/model.ts"),
  read("src/application/activation/open-release.ts"),
  read("src/infrastructure/activation-release/runtime.ts"),
  read("app/api/first-value/route.ts"),
  read("app/first-value/page.tsx"),
  read("app/join/page.tsx"),
  read("app/exchange/page.tsx"),
  read("src/infrastructure/firestore/first-value.ts"),
  read("firestore.rules"),
  read(".github/workflows/ci.yml"),
  read("docs/architecture/WAVE_2_SLICE_2_12.md"),
]);

for (const intent of [
  "find-opportunities", "issue-opportunity", "find-customers-suppliers", "find-teammate",
  "send-receive-referral", "find-resources-support", "explore-network",
]) assert.ok(model.includes(`\"${intent}\"`), `Missing first-value intent ${intent}.`);
assert.ok(model.includes('presentationSource: "post-orientation-first-value"'));
assert.ok(!model.match(/interface FirstValueSelection[\s\S]*?readonly route:/));
assert.ok(service.includes("OPEN_RELEASE_REQUIREMENTS") && service.includes("snapshots.read(input.scope)"));
assert.ok(service.includes('advanceAccessLifecycle(fresh.lifecycle, "open-platform"'));
for (const forbidden of ["organizationType", "businessObjectives", "participationRoles", "providerStatus", "foundingStatus", "paidStatus", "credibilityScore"]) {
  assert.ok(!service.includes(forbidden), `OPEN cannot depend on optional ${forbidden}.`);
}
for (const required of ["accountSecurity.inspect", "getForMembership", "isCurrentActivationLegalAcceptance", "organization.profile.manage", "completedThroughStep === 8"]) {
  assert.ok(runtime.includes(required), `OPEN runtime is missing current-state check ${required}.`);
}
assert.ok(api.includes('Readonly<{ selectedIntent?: unknown }>'));
assert.ok(api.includes("resolveParticipantRoute") && !api.includes("organizationId?: unknown"));
assert.ok(firstValuePage.includes('orientation.status !== "completed"'));
assert.ok(service.includes('"current-policies": "/join?step=legal"'), "Current-policy OPEN remediation must point to the legal remediation route.");
for (const required of [
  'requestedStep === "legal"',
  'access.state.lifecycleState === "controlled-platform"',
  "createServerActivationJourneyService().state(access.context)",
  'activationState.nextStep !== "legal"',
  "activationUserId = access.context.user.id",
]) assert.ok(joinPage.includes(required), `Legal remediation routing is missing server-authorized guard: ${required}`);
assert.ok(!joinPage.includes("acceptLegal("), "The remediation route must never auto-accept policy terms.");
assert.ok(exchangePage.includes("service.evaluate(scope)") && exchangePage.includes("gate.remediation"));
assert.ok(repository.includes("runTransaction") && repository.includes("activationReleaseEvents"));
assert.ok(rules.includes("match /firstValueSelections/{documentId}") && rules.includes("match /activationReleaseEvents/{documentId}"));
assert.ok(workflow.includes("smoke-first-value-open-emulator.mjs"));
assert.ok(architecture.includes("EDU-009") && architecture.includes("EDU-010"));

console.log("EDU-009/010 first-value, policy remediation, and server-authoritative OPEN architecture validated.");
