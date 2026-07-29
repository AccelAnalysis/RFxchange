import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const model = await readFile(new URL("../src/domain/retention/model.ts", import.meta.url), "utf8");
const repository = await readFile(
  new URL("../src/domain/retention/repository.ts", import.meta.url),
  "utf8",
);

for (const reason of ["legal", "financial", "security", "audit", "dispute", "compliance"]) {
  assert.ok(model.includes(`"${reason}"`), `Missing retention preservation reason: ${reason}`);
}

for (const field of ["policyId", "policyKey", "policyVersion", "classifiedAt"]) {
  assert.ok(model.includes(`readonly ${field}`), `Retention assignment must preserve ${field}.`);
}

assert.ok(
  model.includes('"preserve-required"') && model.includes('"retention-not-required"'),
  "Retention policy must explicitly classify preservation requirement.",
);
assert.ok(
  model.includes('"delete"') && model.includes('"moderation-remove"'),
  "Retention disposition must cover deletion and moderation removal.",
);
assert.ok(
  model.includes('kind: "preserve"'),
  "Preserve-required classification must produce an explicit preserve decision.",
);
assert.ok(
  model.includes('kind: "not-retention-blocked"'),
  "Non-retained classification must not be represented as deletion authorization.",
);
assert.ok(
  model.includes("Retention classification alone does not authorize deletion or moderation."),
  "Retention domain must explicitly avoid authorizing deletion by itself.",
);
assert.ok(
  model.includes("assignment.policyVersion !== policy.version"),
  "Disposition evaluation must be bound to the exact policy version used for classification.",
);
assert.ok(
  model.includes('readonly kind: "organization"') && model.includes('readonly kind: "platform"'),
  "Retention references must support organization and platform records without forcing one ownership shape.",
);

for (const repositoryName of ["RetentionPolicyRepository", "RecordRetentionAssignmentRepository"]) {
  assert.ok(repository.includes(repositoryName), `Missing repository port: ${repositoryName}`);
}
assert.match(repository, /append\(policy: RetentionPolicyClassification\)/);
assert.match(repository, /append\(assignment: RecordRetentionAssignment\)/);
assert.ok(!/\bdelete\s*\(/.test(repository), "Retention repositories must not expose deletion operations.");
assert.ok(!/\bupdate\s*\(/.test(repository), "Retention repositories must not rewrite classification history.");

console.log("Retention classification architecture guardrails passed.");
