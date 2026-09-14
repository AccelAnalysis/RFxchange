export const CP09_MARKETING_EVENT_PORT_VERSION = 1 as const;
export const ACCELPO_MARKETING_PRODUCT_SOURCE = "accelpo" as const;

export const ACCELPO_MARKETING_LIFECYCLE_EVENT_TYPES = Object.freeze([
  "account.created",
  "organization.configured",
  "team.invited",
  "purchasing-policy.configured",
  "purchase-request.first",
  "approval.first",
  "community-sourcing.first",
  "award.first",
  "purchase.completed.first",
  "purchase.repeat-use",
  "seat.expanded",
] as const);

export type AccelPoMarketingLifecycleEventType =
  (typeof ACCELPO_MARKETING_LIFECYCLE_EVENT_TYPES)[number];

export type AccelPoPurchasingMode =
  | "direct-provider"
  | "source-first"
  | "authorize-first";

export type AccelPoLifecycleCountBand = "one" | "2-5" | "6-plus";
export type AccelPoRepeatUseBand = "second" | "3-5" | "6-plus";

/**
 * Broad lifecycle facts only. This is deliberately an allowlist rather than a free-form bag so
 * budgets, receipts, approval comments, file references, offers, and other private purchase data
 * cannot accidentally cross the CP-09 boundary.
 */
export interface AccelPoMarketingLifecycleFacts {
  readonly purchasingMode?: AccelPoPurchasingMode;
  readonly invitedTeamBand?: AccelPoLifecycleCountBand;
  readonly repeatUseBand?: AccelPoRepeatUseBand;
  readonly seatExpansionBand?: AccelPoLifecycleCountBand;
  readonly communitySourcingEligible?: boolean;
}

export interface AccelPoMarketingLifecycleEventInput {
  readonly eventType: AccelPoMarketingLifecycleEventType;
  readonly sourceEventId: string;
  readonly purchaseCaseId?: string;
  readonly occurredAt: string;
  readonly facts?: AccelPoMarketingLifecycleFacts;
}

export interface TrustedMarketingLifecycleContext {
  readonly organizationId: string;
  readonly actorAccountId?: string | null;
}

export interface AccelPoMarketingLifecycleSignal {
  readonly contractVersion: typeof CP09_MARKETING_EVENT_PORT_VERSION;
  readonly eventType: AccelPoMarketingLifecycleEventType;
  readonly organizationId: string;
  readonly actorAccountId: string | null;
  readonly purchaseCaseId: string | null;
  readonly productSource: typeof ACCELPO_MARKETING_PRODUCT_SOURCE;
  readonly occurredAt: string;
  readonly facts: Readonly<AccelPoMarketingLifecycleFacts>;
  readonly sourceEventId: string;
  readonly deduplicationKey: string;
}

export type AccelPoMarketingDeliveryStatus =
  | "pending"
  | "retryable-failure"
  | "delivered";

export interface AccelPoMarketingEventOutboxRecord {
  readonly id: string;
  readonly signal: AccelPoMarketingLifecycleSignal;
  readonly status: AccelPoMarketingDeliveryStatus;
  readonly attemptCount: number;
  readonly lastErrorCode: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deliveredAt: string | null;
}

export interface AccelPoMarketingEnqueueResult {
  readonly outboxId: string;
  readonly deduplicationKey: string;
  readonly duplicate: boolean;
}

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/;
const FACT_KEYS = new Set([
  "purchasingMode",
  "invitedTeamBand",
  "repeatUseBand",
  "seatExpansionBand",
  "communitySourcingEligible",
]);
const EVENT_KEYS = new Set([
  "eventType",
  "sourceEventId",
  "purchaseCaseId",
  "occurredAt",
  "facts",
]);
const PURCHASE_CASE_EVENT_TYPES = new Set<AccelPoMarketingLifecycleEventType>([
  "purchase-request.first",
  "approval.first",
  "community-sourcing.first",
  "award.first",
  "purchase.completed.first",
  "purchase.repeat-use",
]);

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function strictKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, label: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label} contains an unsupported field.`);
  }
}

function identifier(value: unknown, label: string): string {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`${label} is invalid.`);
  }
  return value;
}

function optionalIdentifier(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  return identifier(value, label);
}

function isoTimestamp(value: unknown): string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) {
    throw new Error("Lifecycle event timestamp is invalid.");
  }
  return new Date(value).toISOString();
}

function eventType(value: unknown): AccelPoMarketingLifecycleEventType {
  if (
    typeof value !== "string" ||
    !ACCELPO_MARKETING_LIFECYCLE_EVENT_TYPES.includes(
      value as AccelPoMarketingLifecycleEventType,
    )
  ) {
    throw new Error("Lifecycle event type is invalid.");
  }
  return value as AccelPoMarketingLifecycleEventType;
}

function facts(value: unknown): Readonly<AccelPoMarketingLifecycleFacts> {
  if (value === undefined) return Object.freeze({});
  const input = record(value);
  if (!input) throw new Error("Lifecycle facts must be an object.");
  strictKeys(input, FACT_KEYS, "Lifecycle facts");

  const purchasingMode = input.purchasingMode;
  if (
    purchasingMode !== undefined &&
    purchasingMode !== "direct-provider" &&
    purchasingMode !== "source-first" &&
    purchasingMode !== "authorize-first"
  ) {
    throw new Error("Lifecycle purchasing mode is invalid.");
  }

  const countBand = (entry: unknown, label: string): AccelPoLifecycleCountBand | undefined => {
    if (entry === undefined) return undefined;
    if (entry !== "one" && entry !== "2-5" && entry !== "6-plus") {
      throw new Error(`${label} is invalid.`);
    }
    return entry;
  };
  const repeatBand = input.repeatUseBand;
  if (
    repeatBand !== undefined &&
    repeatBand !== "second" &&
    repeatBand !== "3-5" &&
    repeatBand !== "6-plus"
  ) {
    throw new Error("Repeat-use band is invalid.");
  }
  if (
    input.communitySourcingEligible !== undefined &&
    typeof input.communitySourcingEligible !== "boolean"
  ) {
    throw new Error("Community-sourcing eligibility must be boolean.");
  }

  return Object.freeze({
    ...(purchasingMode === undefined ? {} : { purchasingMode }),
    ...(input.invitedTeamBand === undefined
      ? {}
      : { invitedTeamBand: countBand(input.invitedTeamBand, "Invited-team band")! }),
    ...(repeatBand === undefined ? {} : { repeatUseBand: repeatBand }),
    ...(input.seatExpansionBand === undefined
      ? {}
      : { seatExpansionBand: countBand(input.seatExpansionBand, "Seat-expansion band")! }),
    ...(input.communitySourcingEligible === undefined
      ? {}
      : { communitySourcingEligible: input.communitySourcingEligible }),
  });
}

/**
 * Parse only the bounded event-owned fields. Organization and actor identity are supplied by a
 * trusted server context, never by the event producer's client payload.
 */
export function parseAccelPoMarketingLifecycleEventInput(
  value: unknown,
): AccelPoMarketingLifecycleEventInput {
  const input = record(value);
  if (!input) throw new Error("A lifecycle event is required.");
  strictKeys(input, EVENT_KEYS, "Lifecycle event");
  const parsedType = eventType(input.eventType);
  const purchaseCaseId = optionalIdentifier(input.purchaseCaseId, "Purchase Case identity");
  if (purchaseCaseId && !PURCHASE_CASE_EVENT_TYPES.has(parsedType)) {
    throw new Error("Purchase Case identity is not applicable to this lifecycle event.");
  }
  return Object.freeze({
    eventType: parsedType,
    sourceEventId: identifier(input.sourceEventId, "Source event identity"),
    ...(purchaseCaseId === undefined ? {} : { purchaseCaseId }),
    occurredAt: isoTimestamp(input.occurredAt),
    facts: facts(input.facts),
  });
}

export function parseTrustedMarketingLifecycleContext(
  value: TrustedMarketingLifecycleContext,
): Readonly<Required<TrustedMarketingLifecycleContext>> {
  const organizationId = identifier(value.organizationId, "Organization identity");
  const actorAccountId = value.actorAccountId == null
    ? null
    : identifier(value.actorAccountId, "Actor account identity");
  return Object.freeze({ organizationId, actorAccountId });
}
