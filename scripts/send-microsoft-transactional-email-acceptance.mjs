import { randomUUID } from "node:crypto";

import { TransactionalEmailService } from "../src/application/communications/transactional-email.ts";
import {
  MicrosoftGraphAcceptanceEmailRenderer,
  MicrosoftGraphTransactionalEmailProvider,
  microsoftGraphTransactionalEmailConfigurationFromEnvironment,
} from "../src/infrastructure/communications/microsoft-graph-transactional-email.ts";

if (process.env.RFXCHANGE_ALLOW_LIVE_MICROSOFT_EMAIL_ACCEPTANCE !== "true") {
  throw new Error(
    "Live Microsoft email acceptance is disabled. Set " +
      "RFXCHANGE_ALLOW_LIVE_MICROSOFT_EMAIL_ACCEPTANCE=true only for a controlled recipient.",
  );
}

const recipient = process.env.RFXCHANGE_MICROSOFT_EMAIL_ACCEPTANCE_RECIPIENT?.trim();
if (!recipient) {
  throw new Error("RFXCHANGE_MICROSOFT_EMAIL_ACCEPTANCE_RECIPIENT is required.");
}

const identifier = randomUUID();
const requestedAt = new Date().toISOString();
const provider = new MicrosoftGraphTransactionalEmailProvider(
  microsoftGraphTransactionalEmailConfigurationFromEnvironment(),
  new MicrosoftGraphAcceptanceEmailRenderer(),
);
const service = new TransactionalEmailService(provider);
const receipt = await service.request({
  id: `microsoft-acceptance-${identifier}`,
  purpose: "administrative",
  recipientEmail: recipient,
  eventKey: "system.microsoft-email-acceptance",
  templateKey: "system.microsoft-email-acceptance.v1",
  correlationId: identifier,
  idempotencyKey: `microsoft-email-acceptance:${identifier}`,
  requestedAt,
  tags: ["controlled-acceptance", "microsoft"],
});

console.log(JSON.stringify({
  messageId: receipt.messageId,
  status: receipt.status,
  providerKey: receipt.providerKey,
  externalReference: receipt.externalReference,
  diagnosticCode: receipt.diagnosticCode,
  recordedAt: receipt.recordedAt,
}, null, 2));
