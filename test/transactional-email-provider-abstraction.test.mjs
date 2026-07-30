import test from "node:test";
import assert from "node:assert/strict";

import { TransactionalEmailService } from "../src/application/communications/transactional-email.ts";
import { createTransactionalEmailDeliveryReceipt } from "../src/domain/communications/transactional-email.ts";

const now = "2026-07-30T12:30:00.000Z";

class CaptureProvider {
  constructor(receiptFactory) {
    this.requests = [];
    this.receiptFactory = receiptFactory;
  }

  async deliver(request) {
    this.requests.push(request);
    return this.receiptFactory(request);
  }
}

test("COMMS-001 sends transactional/admin mail through one provider-neutral request contract", async () => {
  const provider = new CaptureProvider((request) => createTransactionalEmailDeliveryReceipt({
    messageId: request.id,
    status: "accepted",
    providerKey: "test-provider",
    externalReference: "opaque-provider-delivery-123",
    recordedAt: now,
  }));
  const service = new TransactionalEmailService(provider);

  const receipt = await service.request({
    id: "MSG-ADMIN-001",
    purpose: "administrative",
    recipientEmail: "OWNER@Example.COM",
    recipientDisplayName: "Organization Owner",
    eventKey: "organization.user-invited",
    templateKey: "organization.invitation.v1",
    variables: {
      organization_name: "Example Company",
      invitation_count: 1,
      requires_action: true,
    },
    correlationId: "corr-invite-001",
    idempotencyKey: "invite-org1-user7-v1",
    requestedAt: now,
    organizationId: "org_001",
    userId: "usr_007",
    relatedObjectType: "organization-invitation",
    relatedObjectId: "invite_001",
    tags: ["administrative", "membership", "membership"],
  });

  assert.equal(provider.requests.length, 1);
  const [request] = provider.requests;
  assert.equal(request.id, "msg-admin-001");
  assert.equal(request.purpose, "administrative");
  assert.equal(request.recipient.email, "owner@example.com");
  assert.equal(request.recipient.displayName, "Organization Owner");
  assert.equal(request.eventKey, "organization.user-invited");
  assert.equal(request.templateKey, "organization.invitation.v1");
  assert.equal(request.metadata.correlationId, "corr-invite-001");
  assert.equal(request.metadata.idempotencyKey, "invite-org1-user7-v1");
  assert.equal(request.metadata.organizationId, "org_001");
  assert.equal(request.metadata.userId, "usr_007");
  assert.equal(request.metadata.relatedObjectType, "organization-invitation");
  assert.equal(request.metadata.relatedObjectId, "invite_001");
  assert.deepEqual(request.metadata.tags, ["administrative", "membership"]);
  assert.deepEqual(request.variables, {
    organization_name: "Example Company",
    invitation_count: 1,
    requires_action: true,
  });
  assert.equal(receipt.status, "accepted");
  assert.equal(receipt.providerKey, "test-provider");
  assert.equal(receipt.externalReference, "opaque-provider-delivery-123");
});

test("COMMS-001 supports ordinary transactional workflow events through the same boundary", async () => {
  const provider = new CaptureProvider((request) => createTransactionalEmailDeliveryReceipt({
    messageId: request.id,
    status: "accepted",
    providerKey: "mail-adapter",
    recordedAt: now,
  }));
  const service = new TransactionalEmailService(provider);
  await service.request({
    id: "msg-rfx-published-1",
    purpose: "transactional",
    recipientEmail: "member@example.test",
    eventKey: "rfx.published",
    templateKey: "rfx.published.v1",
    correlationId: "corr-rfx-1",
    idempotencyKey: "rfx-1-published-member-1",
    requestedAt: now,
    organizationId: "org_001",
    relatedObjectType: "rfx",
    relatedObjectId: "rfx_001",
  });
  assert.equal(provider.requests[0].purpose, "transactional");
  assert.equal(provider.requests[0].metadata.organizationId, "org_001");
});

test("COMMS-001 rejects malformed envelope/context before a provider is invoked", async () => {
  const provider = new CaptureProvider(() => { throw new Error("provider should not run"); });
  const service = new TransactionalEmailService(provider);

  await assert.rejects(() => service.request({
    id: "message-1",
    purpose: "transactional",
    recipientEmail: "not-an-email",
    eventKey: "event.valid",
    templateKey: "template.valid",
    correlationId: "corr-1",
    idempotencyKey: "idem-1",
    requestedAt: now,
  }), /valid email address/);

  await assert.rejects(() => service.request({
    id: "message-2",
    purpose: "transactional",
    recipientEmail: "valid@example.test",
    eventKey: "event.valid",
    templateKey: "template.valid",
    correlationId: "corr-2",
    idempotencyKey: "idem-2",
    requestedAt: now,
    relatedObjectType: "rfx",
  }), /type and id must be supplied together/);

  assert.equal(provider.requests.length, 0);
});

test("COMMS-001 rejects a provider receipt that is not correlated to the requested message", async () => {
  const provider = new CaptureProvider(() => createTransactionalEmailDeliveryReceipt({
    messageId: "wrong-message",
    status: "accepted",
    providerKey: "test-provider",
    recordedAt: now,
  }));
  const service = new TransactionalEmailService(provider);

  await assert.rejects(() => service.request({
    id: "expected-message",
    purpose: "administrative",
    recipientEmail: "admin@example.test",
    eventKey: "admin.notice",
    templateKey: "admin.notice.v1",
    correlationId: "corr-admin",
    idempotencyKey: "idem-admin",
    requestedAt: now,
  }), /expected expected-message/);
});
