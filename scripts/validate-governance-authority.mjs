import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const model = await readFile(new URL("../src/domain/governance/model.ts", import.meta.url), "utf8");
const repository = await readFile(
  new URL("../src/domain/governance/repository.ts", import.meta.url),
  "utf8",
);

assert.ok(
  model.includes("authorized-to-establish-or-begin-establishing-organization-account"),
  "GOV-004 must preserve the exact organizational authority representation boundary.",
);
assert.ok(
  model.includes('source: "explicit-user-action"'),
  "Organization authority representation must preserve explicit user-action evidence.",
);
assert.ok(
  !model.includes("verifiedAuthority") && !model.includes("verificationStatus"),
  "GOV-004 representation must not be silently upgraded into verified legal authority.",
);

for (const target of ["feature", "workflow", "geography", "eligibility", "api", "integration"]) {
  assert.ok(model.includes(`"${target}"`), `Missing GOV-006 platform change target: ${target}`);
}
for (const operation of ["add", "modify", "remove", "temporarily-disable"]) {
  assert.ok(model.includes(`"${operation}"`), `Missing GOV-006 platform change operation: ${operation}`);
}

assert.ok(
  model.includes('authority: "platform-governance"'),
  "Platform changes must be explicitly separated from organization-user authority.",
);
assert.ok(
  model.includes('mode: "normal"') && model.includes('mode: "emergency-security"'),
  "ADM-008 requires distinct normal and emergency/security change modes.",
);
assert.ok(
  model.includes('requirement: "before-effective"'),
  "Normal changes must require communication before effectiveness.",
);
assert.ok(
  model.includes('requirement: "post-action-allowed"'),
  "Emergency/security actions must permit immediate intervention with later communication.",
);
assert.ok(
  model.includes("effectiveAt: createdAt"),
  "Emergency/security intervention must support immediate effect.",
);

for (const repositoryName of [
  "OrganizationAuthorityRepresentationRepository",
  "PlatformChangeDirectiveRepository",
]) {
  assert.ok(repository.includes(repositoryName), `Missing repository port: ${repositoryName}`);
}
assert.match(repository, /append\(record: OrganizationAuthorityRepresentation\)/);
assert.match(repository, /append\(directive: PlatformChangeDirective\)/);
assert.ok(!/\bupdate\s*\(/.test(repository), "Governance authority repositories must not expose update operations.");
assert.ok(!/\bdelete\s*\(/.test(repository), "Governance authority repositories must not expose delete operations.");

console.log("Governance authority architecture guardrails passed.");
