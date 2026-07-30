import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const commandCenter = await readFile(
  new URL("../src/application/admin/command-center.ts", import.meta.url),
  "utf8",
);
const queue = await readFile(
  new URL("../src/application/admin/unified-work-queue.ts", import.meta.url),
  "utf8",
);
const search = await readFile(
  new URL("../src/application/admin/universal-search.ts", import.meta.url),
  "utf8",
);
const commandCenterUi = await readFile(
  new URL("../src/components/admin/AdminCommandCenter.tsx", import.meta.url),
  "utf8",
);
const shell = await readFile(
  new URL("../src/components/admin/AdminPortalShell.tsx", import.meta.url),
  "utf8",
);

for (const queueKey of [
  "claims",
  "verification",
  "provider-applications",
  "flagged-rfx",
  "trust-reports",
  "integrity-holds",
  "billing-exceptions",
  "data-corrections",
  "support-cases",
  "integration-failures",
]) {
  assert.ok(commandCenter.includes(`\"${queueKey}\"`), `ADM-058 missing attention queue ${queueKey}.`);
}
assert.ok(
  commandCenter.includes("/admin/work-queues?") && commandCenter.includes("status=open"),
  "ADM-058 queue counts must link directly to filtered work queues.",
);
for (const domain of ["organizations", "marketplace", "connections", "network", "commerce", "trust", "systems"]) {
  assert.ok(commandCenter.includes(`\"${domain}\"`), `ADM-059 missing health domain ${domain}.`);
}
assert.ok(
  commandCenter.includes("systemHealthMetricsFromOperationsSnapshot") &&
    commandCenter.includes("SystemOperationsHealthSnapshot"),
  "ADM-059 must reuse ADM-046 system health evidence rather than inventing a parallel system-health authority.",
);
assert.ok(
  commandCenterUi.indexOf("What needs attention?") < commandCenterUi.indexOf("Platform health"),
  "ADM-058/059 presentation must place operational workload before health summaries.",
);

for (const domain of ["claims", "verification", "provider", "rfx", "trust", "commerce", "data", "support", "system"]) {
  assert.ok(queue.includes(`\"${domain}\"`), `ADM-060 missing work domain ${domain}.`);
}
assert.ok(
  queue.includes("authorizedSources") && queue.includes("can(authority, source.readPermission)"),
  "ADM-060 must filter sources before querying unauthorized work domains.",
);
assert.ok(
  queue.includes("assignmentPermission") && queue.includes("assign("),
  "ADM-060 must support canonical cross-domain assignment.",
);

for (const kind of [
  "organization",
  "user",
  "rfx",
  "response",
  "referral",
  "transaction",
  "support-case",
  "geography",
  "provider",
  "audit-event",
]) {
  assert.ok(search.includes(`\"${kind}\"`), `ADM-091 missing global search kind ${kind}.`);
}
for (const lookup of ["name/email", "UEI/CAGE", "RFx/response ID", "Stripe customer ID", "audit ID"]) {
  assert.ok(search.includes(lookup), `ADM-091 documentation is missing lookup coverage: ${lookup}.`);
}
assert.ok(
  search.includes("authorizedSources") && search.includes("can(authority, source.readPermission)"),
  "ADM-091 must filter search sources before querying unauthorized domains.",
);
assert.ok(
  shell.includes("<AdminUniversalSearch") && shell.indexOf("<AdminUniversalSearch") < shell.indexOf("{children}"),
  "Universal administrative search must remain available at the top of the shared admin shell.",
);
assert.ok(
  !commandCenter.includes('from "firebase') &&
    !queue.includes('from "firebase') &&
    !search.includes('from "firebase'),
  "Slice 1.24 application contracts must remain provider independent.",
);

console.log("Attention-first command center, health panels, unified work queue, and universal admin search validated.");
