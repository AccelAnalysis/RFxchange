type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type TransactionalEmailMessageId = Brand<string, "TransactionalEmailMessageId">;
export type TransactionalEmailAddress = Brand<string, "TransactionalEmailAddress">;
export type TransactionalEmailTemplateKey = Brand<string, "TransactionalEmailTemplateKey">;
export type TransactionalEmailEventKey = Brand<string, "TransactionalEmailEventKey">;
export type TransactionalEmailCorrelationId = Brand<string, "TransactionalEmailCorrelationId">;
export type TransactionalEmailIdempotencyKey = Brand<string, "TransactionalEmailIdempotencyKey">;

export type TransactionalEmailPurpose = "transactional" | "administrative";
export type TransactionalEmailVariable = string | number | boolean | null;
export type TransactionalEmailDeliveryStatus = "accepted" | "rejected";

export interface TransactionalEmailRecipient {
  readonly email: TransactionalEmailAddress;
  readonly displayName: string | null;
}

export interface TransactionalEmailDeliveryMetadata {
  readonly correlationId: TransactionalEmailCorrelationId;
  readonly idempotencyKey: TransactionalEmailIdempotencyKey;
  readonly requestedAt: string;
  readonly organizationId: string | null;
  readonly userId: string | null;
  readonly relatedObjectType: string | null;
  readonly relatedObjectId: string | null;
  readonly tags: readonly string[];
}

export interface TransactionalEmailRequest {
  readonly id: TransactionalEmailMessageId;
  readonly purpose: TransactionalEmailPurpose;
  readonly recipient: TransactionalEmailRecipient;
  readonly eventKey: TransactionalEmailEventKey;
  readonly eventVersion: number;
  readonly templateKey: TransactionalEmailTemplateKey;
  readonly templateVersion: number;
  readonly variables: Readonly<Record<string, TransactionalEmailVariable>>;
  readonly metadata: TransactionalEmailDeliveryMetadata;
}

export interface TransactionalEmailDeliveryReceipt {
  readonly messageId: TransactionalEmailMessageId;
  readonly status: TransactionalEmailDeliveryStatus;
  /** Provider identity remains an opaque adapter key, never a domain-specific SDK type. */
  readonly providerKey: string;
  readonly externalReference: string | null;
  readonly recordedAt: string;
  readonly diagnosticCode: string | null;
}

function required(value: string, field: string, max = 256): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  if (normalized.length > max) throw new Error(`${field} cannot exceed ${max} characters.`);
  return normalized;
}

function stableKey(value: string, field: string): string {
  const normalized = required(value, field, 128).toLowerCase();
  if (!/^[a-z0-9][a-z0-9._:-]{0,127}$/.test(normalized)) {
    throw new Error(`${field} must be a stable lowercase identifier.`);
  }
  return normalized;
}

function positiveVersion(value: number | undefined, field: string): number {
  const normalized = value ?? 1;
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 10_000) {
    throw new Error(`${field} must be an integer between 1 and 10000.`);
  }
  return normalized;
}

function iso(value: string, field: string): string {
  const parsed = Date.parse(required(value, field, 64));
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString();
}

export function transactionalEmailAddress(value: string): TransactionalEmailAddress {
  const normalized = required(value, "Transactional email recipient", 320).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Transactional email recipient must be a valid email address.");
  }
  return normalized as TransactionalEmailAddress;
}

export function transactionalEmailMessageId(value: string): TransactionalEmailMessageId {
  return stableKey(value, "Transactional email message id") as TransactionalEmailMessageId;
}

export function transactionalEmailTemplateKey(value: string): TransactionalEmailTemplateKey {
  return stableKey(value, "Transactional email template key") as TransactionalEmailTemplateKey;
}

export function transactionalEmailEventKey(value: string): TransactionalEmailEventKey {
  return stableKey(value, "Transactional email event key") as TransactionalEmailEventKey;
}

export function transactionalEmailCorrelationId(value: string): TransactionalEmailCorrelationId {
  return required(value, "Transactional email correlation id", 192) as TransactionalEmailCorrelationId;
}

export function transactionalEmailIdempotencyKey(value: string): TransactionalEmailIdempotencyKey {
  return required(value, "Transactional email idempotency key", 192) as TransactionalEmailIdempotencyKey;
}

function optionalReference(value: string | null | undefined, field: string, max = 192): string | null {
  if (value === null || value === undefined || !value.trim()) return null;
  return required(value, field, max);
}

function normalizedVariables(
  variables: Readonly<Record<string, TransactionalEmailVariable>> | undefined,
): Readonly<Record<string, TransactionalEmailVariable>> {
  const entries = Object.entries(variables ?? {});
  if (entries.length > 100) throw new Error("Transactional email variables cannot exceed 100 entries.");
  return Object.freeze(Object.fromEntries(entries.map(([key, value]) => {
    const normalizedKey = stableKey(key, "Transactional email variable key");
    if (typeof value === "string" && value.length > 4000) {
      throw new Error(`Transactional email variable ${normalizedKey} cannot exceed 4000 characters.`);
    }
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new Error(`Transactional email variable ${normalizedKey} must be finite.`);
    }
    return [normalizedKey, value] as const;
  })));
}

function normalizedTags(values: readonly string[] | undefined): readonly string[] {
  const tags = [...new Set((values ?? []).map((value) => stableKey(value, "Transactional email tag")))];
  if (tags.length > 20) throw new Error("Transactional email tags cannot exceed 20 values.");
  return Object.freeze(tags);
}

export function createTransactionalEmailRequest(input: Readonly<{
  id: string;
  purpose: TransactionalEmailPurpose;
  recipientEmail: string;
  recipientDisplayName?: string | null;
  eventKey: string;
  eventVersion?: number;
  templateKey: string;
  templateVersion?: number;
  variables?: Readonly<Record<string, TransactionalEmailVariable>>;
  correlationId: string;
  idempotencyKey: string;
  requestedAt: string;
  organizationId?: string | null;
  userId?: string | null;
  relatedObjectType?: string | null;
  relatedObjectId?: string | null;
  tags?: readonly string[];
}>): TransactionalEmailRequest {
  if (input.purpose !== "transactional" && input.purpose !== "administrative") {
    throw new Error(`Unsupported transactional email purpose: ${String(input.purpose)}.`);
  }
  const relatedObjectType = optionalReference(input.relatedObjectType, "Transactional email related object type", 96);
  const relatedObjectId = optionalReference(input.relatedObjectId, "Transactional email related object id");
  if ((relatedObjectType === null) !== (relatedObjectId === null)) {
    throw new Error("Transactional email related object type and id must be supplied together.");
  }
  return Object.freeze({
    id: transactionalEmailMessageId(input.id),
    purpose: input.purpose,
    recipient: Object.freeze({
      email: transactionalEmailAddress(input.recipientEmail),
      displayName: optionalReference(input.recipientDisplayName, "Transactional email recipient display name", 160),
    }),
    eventKey: transactionalEmailEventKey(input.eventKey),
    eventVersion: positiveVersion(input.eventVersion, "Transactional email event version"),
    templateKey: transactionalEmailTemplateKey(input.templateKey),
    templateVersion: positiveVersion(input.templateVersion, "Transactional email template version"),
    variables: normalizedVariables(input.variables),
    metadata: Object.freeze({
      correlationId: transactionalEmailCorrelationId(input.correlationId),
      idempotencyKey: transactionalEmailIdempotencyKey(input.idempotencyKey),
      requestedAt: iso(input.requestedAt, "Transactional email requested timestamp"),
      organizationId: optionalReference(input.organizationId, "Transactional email organization id"),
      userId: optionalReference(input.userId, "Transactional email user id"),
      relatedObjectType,
      relatedObjectId,
      tags: normalizedTags(input.tags),
    }),
  });
}

export function createTransactionalEmailDeliveryReceipt(input: Readonly<{
  messageId: TransactionalEmailMessageId;
  status: TransactionalEmailDeliveryStatus;
  providerKey: string;
  externalReference?: string | null;
  recordedAt: string;
  diagnosticCode?: string | null;
}>): TransactionalEmailDeliveryReceipt {
  if (input.status !== "accepted" && input.status !== "rejected") {
    throw new Error(`Unsupported transactional email delivery status: ${String(input.status)}.`);
  }
  return Object.freeze({
    messageId: input.messageId,
    status: input.status,
    providerKey: stableKey(input.providerKey, "Transactional email provider key"),
    externalReference: optionalReference(input.externalReference, "Transactional email external delivery reference", 512),
    recordedAt: iso(input.recordedAt, "Transactional email delivery recorded timestamp"),
    diagnosticCode: optionalReference(input.diagnosticCode, "Transactional email diagnostic code", 128),
  });
}
