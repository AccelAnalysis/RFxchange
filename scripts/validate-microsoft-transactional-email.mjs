import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = Object.fromEntries(await Promise.all([
  "src/application/communications/transactional-email.ts",
  "src/infrastructure/communications/microsoft-graph-transactional-email.ts",
  "functions/src/application/transactional-email-jobs.ts",
  "scripts/send-microsoft-transactional-email-acceptance.mjs",
  ".env.example",
  "docs/architecture/COMMS-002-microsoft-transactional-email.md",
].map(async (path) => [path, await readFile(new URL(`../${path}`, import.meta.url), "utf8")])));

const application = files["src/application/communications/transactional-email.ts"];
const adapter = files["src/infrastructure/communications/microsoft-graph-transactional-email.ts"];
const jobs = files["functions/src/application/transactional-email-jobs.ts"];
const acceptance = files["scripts/send-microsoft-transactional-email-acceptance.mjs"];
const exampleEnvironment = files[".env.example"];
const architecture = files["docs/architecture/COMMS-002-microsoft-transactional-email.md"];

assert.ok(
  adapter.includes("implements TransactionalEmailProvider") &&
    adapter.includes("createTransactionalEmailDeliveryReceipt"),
  "COMMS-002 Microsoft adapter must conform to the COMMS-001 provider boundary.",
);
assert.ok(
  application.includes("class TransactionalEmailProviderError") &&
    application.includes("readonly retryable: boolean"),
  "COMMS-002 failures must expose provider-neutral retry classification.",
);
for (const expected of [
  "https://login.microsoftonline.com",
  "https://graph.microsoft.com",
  "client_credentials",
  "https://graph.microsoft.com/.default",
  "/sendMail",
  "response.status !== 202",
  "retry-after",
  "request-id",
]) {
  assert.ok(adapter.includes(expected), `COMMS-002 adapter is missing ${expected}.`);
}
for (const expected of [
  "transactionalEmailBackgroundJobHandler",
  "retryableBackgroundJobError",
  "terminalBackgroundJobError",
  "providerReference",
]) {
  assert.ok(jobs.includes(expected), `COMMS-002 INF-007 bridge is missing ${expected}.`);
}
assert.ok(
  acceptance.includes("RFXCHANGE_ALLOW_LIVE_MICROSOFT_EMAIL_ACCEPTANCE") &&
    acceptance.includes("RFXCHANGE_MICROSOFT_EMAIL_ACCEPTANCE_RECIPIENT"),
  "COMMS-002 live acceptance must require explicit opt-in and a controlled recipient.",
);
assert.ok(
  exampleEnvironment.includes("RFXCHANGE_MICROSOFT_TENANT_ID") &&
    exampleEnvironment.includes("RFXCHANGE_MICROSOFT_APPROVED_SENDER") &&
    !exampleEnvironment.includes("RFXCHANGE_MICROSOFT_CLIENT_SECRET="),
  "COMMS-002 environment documentation must identify configuration without committing a secret.",
);
assert.ok(
  architecture.includes("202 Accepted") &&
    /does not prove mailbox\s+delivery/.test(architecture) &&
    architecture.includes("Mail.Send"),
  "COMMS-002 architecture evidence must state Graph acceptance and permission semantics.",
);

for (const upstream of [
  "src/domain/communications/transactional-email.ts",
  "src/application/communications/transactional-email.ts",
]) {
  const source = files[upstream] ??
    await readFile(new URL(`../${upstream}`, import.meta.url), "utf8");
  assert.equal(
    source.toLowerCase().includes("graph.microsoft"),
    false,
    `${upstream} must remain independent of Microsoft Graph.`,
  );
}

console.log("COMMS-002 Microsoft transactional email adapter validated.");
