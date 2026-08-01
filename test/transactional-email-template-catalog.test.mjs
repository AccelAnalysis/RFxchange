import assert from "node:assert/strict";
import test from "node:test";

import { VersionedTransactionalEmailTemplateCatalog } from "../src/application/communications/transactional-email-template-catalog.ts";
import { TransactionalEmailService } from "../src/application/communications/transactional-email.ts";
import { createTransactionalEmailTemplateDefinition } from "../src/domain/communications/transactional-email-template.ts";
import { createTransactionalEmailDeliveryReceipt } from "../src/domain/communications/transactional-email.ts";

const NOW = "2026-08-01T21:15:00.000Z";

function invitationTemplate(overrides = {}) {
  return createTransactionalEmailTemplateDefinition({
    eventKey: "organization.user-invited",
    eventVersion: 1,
    templateKey: "organization.invitation",
    templateVersion: 1,
    purpose: "administrative",
    variables: [
      { key: "organization_name", type: "string", maximumLength: 160 },
      { key: "action_url", type: "string", maximumLength: 1_000 },
      { key: "expires_at", type: "string", required: false, maximumLength: 64 },
    ],
    subjectTemplate: "Invitation to {{organization_name}} on The RFxchange",
    textTemplate:
      "You were invited to {{organization_name}}. Review the invitation: {{action_url}} {{expires_at}}",
    htmlTemplate:
      "<p>You were invited to <strong>{{organization_name}}</strong>.</p><p><a href=\"{{action_url}}\">Review invitation</a></p>",
    ...overrides,
  });
}

test("COMMS-003 maps one event version to one explicit template version and renders reviewed variables", async () => {
  const catalog = new VersionedTransactionalEmailTemplateCatalog([invitationTemplate()]);
  const reference = catalog.referenceForEvent("organization.user-invited", 1);
  assert.deepEqual(reference, {
    eventKey: "organization.user-invited",
    eventVersion: 1,
    templateKey: "organization.invitation",
    templateVersion: 1,
    purpose: "administrative",
  });

  const rendered = catalog.renderVersioned({
    ...reference,
    variables: {
      organization_name: "Coastal <Works>",
      action_url: "https://example.test/invitation/123?a=1&b=2",
      expires_at: null,
    },
  });
  assert.equal(
    rendered.content.subject,
    "Invitation to Coastal <Works> on The RFxchange",
  );
  assert.match(rendered.content.text, /Review the invitation/);
  assert.match(rendered.content.html, /Coastal &lt;Works&gt;/);
  assert.match(rendered.content.html, /a=1&amp;b=2/);
  assert.deepEqual(rendered.reference, reference);
});

test("COMMS-003 rejects duplicate mappings, undeclared variables, missing values and wrong types", () => {
  const template = invitationTemplate();
  assert.throws(
    () => new VersionedTransactionalEmailTemplateCatalog([template, template]),
    /duplicated/,
  );
  const catalog = new VersionedTransactionalEmailTemplateCatalog([template]);
  assert.throws(
    () => catalog.renderVersioned({
      eventKey: "organization.user-invited",
      eventVersion: 1,
      templateKey: "organization.invitation",
      templateVersion: 1,
      purpose: "administrative",
      variables: {
        organization_name: "Example",
        action_url: "https://example.test",
        unexpected: true,
      },
    }),
    /not declared/,
  );
  assert.throws(
    () => catalog.renderVersioned({
      eventKey: "organization.user-invited",
      eventVersion: 1,
      templateKey: "organization.invitation",
      templateVersion: 1,
      purpose: "administrative",
      variables: { organization_name: "Example" },
    }),
    /action_url is required/,
  );
  assert.throws(
    () => catalog.renderVersioned({
      eventKey: "organization.user-invited",
      eventVersion: 1,
      templateKey: "organization.invitation",
      templateVersion: 1,
      purpose: "administrative",
      variables: { organization_name: 4, action_url: "https://example.test" },
    }),
    /must be string/,
  );
});

test("COMMS-003 provider-neutral request preserves explicit event and template versions", async () => {
  const requests = [];
  const service = new TransactionalEmailService({
    async deliver(request) {
      requests.push(request);
      return createTransactionalEmailDeliveryReceipt({
        messageId: request.id,
        status: "accepted",
        providerKey: "test-provider",
        recordedAt: NOW,
      });
    },
  });
  await service.request({
    id: "message-versioned-1",
    purpose: "administrative",
    recipientEmail: "member@example.test",
    eventKey: "organization.user-invited",
    eventVersion: 3,
    templateKey: "organization.invitation",
    templateVersion: 7,
    correlationId: "correlation-versioned",
    idempotencyKey: "organization-invite-event-3-member-1",
    requestedAt: NOW,
  });
  assert.equal(requests[0].eventVersion, 3);
  assert.equal(requests[0].templateVersion, 7);
});
