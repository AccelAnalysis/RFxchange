import { readFile } from "node:fs/promises";

const conditions = await readFile("src/domain/admin-authorization/conditions.ts", "utf8");
const repository = await readFile("src/domain/admin-authorization/condition-policy-repository.ts", "utf8");
const firestore = await readFile("src/infrastructure/firestore/admin-sensitive-action-policy-repository.ts", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(`Admin sensitive-action condition validation failed: ${message}`);
}

for (const kind of [
  "justification",
  "evidence",
  "recent-reauthentication",
  "secondary-approval",
]) {
  assert(conditions.includes(`\"${kind}\"`), `missing required ADM-015 condition kind ${kind}`);
}

assert(
  conditions.includes("const authorization = authorizeScopedAdministrativeAction"),
  "permission/scope authorization must execute before sensitive conditions",
);
assert(
  conditions.includes('if (authorization.kind === "deny")'),
  "condition evidence must not bypass a denied authorization result",
);
assert(conditions.includes("justification?.trim()"), "justification must be concrete nonblank text");
assert(conditions.includes("uniqueEvidenceReferences"), "evidence must use concrete references rather than a satisfied boolean");
assert(conditions.includes("reauthenticatedAt"), "recent reauthentication must be timestamp evidence");
assert(
  conditions.includes("approval.approverAdministratorId === context.administratorId"),
  "secondary approval must reject self-approval",
);
assert(
  conditions.includes("approval.permission !== requirement.permission") &&
    conditions.includes("approval.scopeValue !== requirement.scope.value"),
  "secondary approval must be bound to the exact permission and scope",
);
assert(
  conditions.includes("age !== null && age <= condition.maximumAgeSeconds"),
  "secondary approval must be time bounded",
);
assert(repository.includes("AdminSensitiveActionPolicyRepository"), "condition policy requires a repository port");
assert(
  firestore.includes('ADMIN_SENSITIVE_ACTION_POLICY_COLLECTION = "adminSensitiveActionPolicies"'),
  "condition policy requires Firestore configuration persistence",
);
assert(
  !conditions.includes("conditionsSatisfied: boolean") && !conditions.includes("approved: boolean"),
  "ADM-015 must not trust broad caller-supplied condition booleans",
);

console.log("Wave 1.14 ADM-015 sensitive administrative action condition guardrails passed.");
