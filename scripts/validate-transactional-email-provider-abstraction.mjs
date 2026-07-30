import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const domain = await readFile(
  new URL("../src/domain/communications/transactional-email.ts", import.meta.url),
  "utf8",
);
const application = await readFile(
  new URL("../src/application/communications/transactional-email.ts", import.meta.url),
  "utf8",
);

for (const required of [
  "TransactionalEmailRecipient",
  "TransactionalEmailDeliveryMetadata",
  "TransactionalEmailRequest",
  "TransactionalEmailDeliveryReceipt",
  "recipientEmail",
  "eventKey",
  "templateKey",
  "correlationId",
  "idempotencyKey",
  "requestedAt",
  "organizationId",
  "userId",
  "relatedObjectType",
  "relatedObjectId",
]) {
  assert.ok(domain.includes(required), `COMMS-001 contract is missing ${required}.`);
}

assert.ok(
  application.includes("interface TransactionalEmailProvider") &&
    application.includes("deliver(request: TransactionalEmailRequest)") &&
    application.includes("class TransactionalEmailService"),
  "COMMS-001 application code must request delivery through a provider-neutral interface.",
);
assert.ok(
  application.includes("receipt.messageId !== request.id"),
  "COMMS-001 must preserve message correlation across the provider boundary.",
);

for (const source of [domain, application]) {
  const lower = source.toLowerCase();
  for (const providerSpecific of ["microsoft.graph", "graph.microsoft", "@azure", "sendgrid", "mailgun", "postmark", "sesclient"]) {
    assert.equal(
      lower.includes(providerSpecific),
      false,
      `COMMS-001 domain/application contracts must not depend on provider SDK ${providerSpecific}.`,
    );
  }
  assert.equal(source.includes('from "firebase'), false, "COMMS-001 must not couple email delivery to Firebase.");
}

console.log("COMMS-001 transactional email provider abstraction validated.");
