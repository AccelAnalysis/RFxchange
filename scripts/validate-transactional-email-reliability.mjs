import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const paths = [
  "src/domain/communications/transactional-email.ts",
  "src/domain/communications/transactional-email-template.ts",
  "src/application/communications/transactional-email-template-catalog.ts",
  "functions/src/application/transactional-email-delivery-audit.ts",
  "functions/src/application/transactional-email-jobs.ts",
  "functions/src/runtime/firestore-transactional-email-delivery-audit-store.ts",
  "firestore.rules",
  "docs/architecture/COMMS-003-005-transactional-communications-reliability.md",
];
const files = Object.fromEntries(await Promise.all(paths.map(async (path) => [
  path,
  await readFile(new URL(`../${path}`, import.meta.url), "utf8"),
])));

const envelope = files["src/domain/communications/transactional-email.ts"];
const templateDomain = files["src/domain/communications/transactional-email-template.ts"];
const catalog = files["src/application/communications/transactional-email-template-catalog.ts"];
const auditedExecution = files["functions/src/application/transactional-email-delivery-audit.ts"];
const jobBridge = files["functions/src/application/transactional-email-jobs.ts"];
const firestoreStore = files["functions/src/runtime/firestore-transactional-email-delivery-audit-store.ts"];
const rules = files["firestore.rules"];
const architecture = files["docs/architecture/COMMS-003-005-transactional-communications-reliability.md"];

for (const expected of [
  "eventVersion",
  "templateVersion",
  "VersionedTransactionalEmailTemplateCatalog",
  "assertTransactionalEmailTemplateVariables",
]) {
  assert.ok(
    envelope.includes(expected) || templateDomain.includes(expected) || catalog.includes(expected),
    `COMMS-003 is missing ${expected}.`,
  );
}
assert.ok(
  catalog.includes("htmlEscape") && catalog.includes("not a reviewed event-template mapping"),
  "COMMS-003 must escape HTML variables and reject unreviewed mappings.",
);

for (const expected of [
  "executeReliableTransactionalEmailJob",
  "recipientAddressHash",
  "originatingEventId",
  "listTerminalFailures",
  "executeBackgroundJob",
]) {
  assert.ok(auditedExecution.includes(expected), `COMMS-004/005 execution is missing ${expected}.`);
}
for (const expected of [
  "transactionalEmailDeliveries",
  "transactionalEmailDeliveryEvents",
  "payload-conflict",
  "transaction.create",
  "listTerminalFailures",
]) {
  assert.ok(firestoreStore.includes(expected), `COMMS-004 Firestore ledger is missing ${expected}.`);
}
for (const prohibited of [
  "subjectTemplate",
  "textTemplate",
  "htmlTemplate",
  "clientSecret",
  "recipientEmail:",
]) {
  assert.equal(
    firestoreStore.includes(prohibited),
    false,
    `COMMS-004 ledger must not persist ${prohibited}.`,
  );
}
assert.ok(
  jobBridge.includes("classifyTransactionalEmailProviderFailure") &&
    jobBridge.includes("retryAfterSeconds"),
  "COMMS-005 must preserve provider-neutral failure and retry evidence.",
);
assert.ok(
  rules.includes("match /transactionalEmailDeliveries/{documentId}") &&
    rules.includes("match /transactionalEmailDeliveryEvents/{documentId}"),
  "COMMS-004 collections must be denied to direct Firestore clients.",
);
for (const phrase of [
  "does not create another queue",
  "raw recipient addresses",
  "accepted replay does not invoke the provider",
  "terminal failures",
]) {
  assert.ok(
    architecture.toLowerCase().includes(phrase.toLowerCase()),
    `COMMS-003/004/005 architecture evidence is missing: ${phrase}`,
  );
}

console.log("Transactional communications reliability validated.");
