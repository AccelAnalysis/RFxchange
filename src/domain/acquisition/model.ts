import type { AccessJourneyId } from "../lifecycle/model.ts";
import type { UserId } from "../users/model.ts";

export const ACQUISITION_CONTEXT_VERSION = 1 as const;

export class AcquisitionContextBindingError extends Error {
  readonly code = "invalid-context" as const;

  constructor(message: string) {
    super(message);
    this.name = "AcquisitionContextBindingError";
  }
}

export const ACQUISITION_INTENT_KINDS = [
  "opportunity",
  "organization-claim",
  "referral",
  "team-invitation",
  "provider",
  "buyer-need",
  "direct",
] as const;

export type AcquisitionIntentKind = (typeof ACQUISITION_INTENT_KINDS)[number];

export const ACQUISITION_SOURCE_CHANNELS = [
  "public-opportunity",
  "organization-claim-link",
  "referral-link",
  "team-invitation-link",
  "provider-link",
  "buyer-link",
  "direct",
] as const;

export type AcquisitionSourceChannel = (typeof ACQUISITION_SOURCE_CHANNELS)[number];

export interface AcquisitionIntent {
  readonly kind: AcquisitionIntentKind;
  /** Stable semantic subject reference. It is never interpreted as a route or authority grant. */
  readonly subjectReference: string | null;
}

export interface AcquisitionSourceAttribution {
  readonly channel: AcquisitionSourceChannel;
  readonly sourceReference: string | null;
  readonly referrerHost: string | null;
}

export interface AcquisitionContextEnvelope {
  readonly id: string;
  readonly version: typeof ACQUISITION_CONTEXT_VERSION;
  readonly intent: AcquisitionIntent;
  readonly source: AcquisitionSourceAttribution;
  /** SHA-256 digest of the browser-held secret. The secret itself is never persisted. */
  readonly browserSecretDigest: string;
  readonly status: "issued" | "bound" | "resumed";
  readonly boundUserId: UserId | null;
  readonly boundAccessJourneyId: AccessJourneyId | null;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly boundAt: string | null;
  readonly firstResumedAt: string | null;
}

export interface BoundAcquisitionContext {
  readonly id: string;
  readonly version: typeof ACQUISITION_CONTEXT_VERSION;
  readonly intent: AcquisitionIntent;
  readonly source: AcquisitionSourceAttribution;
  readonly boundUserId: UserId;
  readonly boundAccessJourneyId: AccessJourneyId;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly boundAt: string;
  readonly resumeStatus: "pending" | "resumed";
  readonly firstResumedAt: string | null;
}

export type AcquisitionContextEventKind = "issued" | "bound" | "resumed";

export interface AcquisitionContextEvent {
  readonly id: string;
  readonly acquisitionContextId: string;
  readonly kind: AcquisitionContextEventKind;
  readonly userId: UserId | null;
  readonly accessJourneyId: AccessJourneyId | null;
  readonly occurredAt: string;
}

function required(value: string, label: string, maximum = 240): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} exceeds ${maximum} characters.`);
  return normalized;
}

function stableReference(value: string, label: string): string {
  const normalized = required(value, label, 191);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new Error(`${label} must be a stable semantic reference.`);
  }
  return normalized;
}

function timestamp(value: string, label: string): string {
  const parsed = new Date(required(value, label, 64));
  if (Number.isNaN(parsed.valueOf())) throw new Error(`${label} must be a valid timestamp.`);
  return parsed.toISOString();
}

function optionalHost(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const normalized = value.trim().toLowerCase();
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(normalized)) {
    throw new Error("Acquisition referrer host is malformed.");
  }
  return normalized;
}

export function acquisitionIntent(input: Readonly<{
  kind: AcquisitionIntentKind;
  subjectReference?: string | null;
}>): AcquisitionIntent {
  if (!ACQUISITION_INTENT_KINDS.includes(input.kind)) {
    throw new Error("Unsupported acquisition intent kind.");
  }
  const subjectReference = input.subjectReference?.trim()
    ? stableReference(input.subjectReference, "Acquisition subject reference")
    : null;
  if (input.kind === "direct" && subjectReference) {
    throw new Error("Direct acquisition context cannot target a subject.");
  }
  if (input.kind !== "direct" && !subjectReference) {
    throw new Error(`${input.kind} acquisition context requires a subject reference.`);
  }
  return Object.freeze({ kind: input.kind, subjectReference });
}

export function acquisitionSource(input: Readonly<{
  channel: AcquisitionSourceChannel;
  sourceReference?: string | null;
  referrerHost?: string | null;
}>): AcquisitionSourceAttribution {
  if (!ACQUISITION_SOURCE_CHANNELS.includes(input.channel)) {
    throw new Error("Unsupported acquisition source channel.");
  }
  return Object.freeze({
    channel: input.channel,
    sourceReference: input.sourceReference?.trim()
      ? stableReference(input.sourceReference, "Acquisition source reference")
      : null,
    referrerHost: optionalHost(input.referrerHost),
  });
}

export function createAcquisitionContextEnvelope(input: Readonly<{
  id: string;
  intent: AcquisitionIntent;
  source: AcquisitionSourceAttribution;
  browserSecretDigest: string;
  issuedAt: string;
  expiresAt: string;
}>): AcquisitionContextEnvelope {
  const issuedAt = timestamp(input.issuedAt, "Acquisition issued time");
  const expiresAt = timestamp(input.expiresAt, "Acquisition expiry time");
  if (expiresAt <= issuedAt) throw new Error("Acquisition context must expire after it is issued.");
  const browserSecretDigest = required(input.browserSecretDigest, "Browser secret digest", 128);
  if (!/^[a-f0-9]{64}$/.test(browserSecretDigest)) {
    throw new Error("Browser secret digest must be a SHA-256 hexadecimal digest.");
  }
  const intent = acquisitionIntent(input.intent);
  const source = acquisitionSource(input.source);
  const expectedChannels = Object.freeze({
    opportunity: "public-opportunity",
    "organization-claim": "organization-claim-link",
    referral: "referral-link",
    "team-invitation": "team-invitation-link",
    provider: "provider-link",
    "buyer-need": "buyer-link",
    direct: "direct",
  } satisfies Record<AcquisitionIntentKind, AcquisitionSourceChannel>);
  if (source.channel !== expectedChannels[intent.kind]) {
    throw new Error("Acquisition source channel does not match its semantic intent.");
  }
  return Object.freeze({
    id: stableReference(input.id, "Acquisition context id"),
    version: ACQUISITION_CONTEXT_VERSION,
    intent,
    source,
    browserSecretDigest,
    status: "issued" as const,
    boundUserId: null,
    boundAccessJourneyId: null,
    issuedAt,
    expiresAt,
    boundAt: null,
    firstResumedAt: null,
  });
}

export function bindAcquisitionContext(input: Readonly<{
  context: AcquisitionContextEnvelope;
  browserSecretDigest: string;
  userId: UserId;
  accessJourneyId: AccessJourneyId;
  now: string;
}>): AcquisitionContextEnvelope {
  const now = timestamp(input.now, "Acquisition binding time");
  let digestDifference = input.context.browserSecretDigest.length ^ input.browserSecretDigest.length;
  const digestLength = Math.max(
    input.context.browserSecretDigest.length,
    input.browserSecretDigest.length,
  );
  for (let index = 0; index < digestLength; index += 1) {
    digestDifference |=
      (input.context.browserSecretDigest.charCodeAt(index) || 0) ^
      (input.browserSecretDigest.charCodeAt(index) || 0);
  }
  if (digestDifference !== 0) {
    throw new AcquisitionContextBindingError("Acquisition context browser binding is invalid.");
  }
  if (now >= input.context.expiresAt) {
    throw new AcquisitionContextBindingError("Acquisition context has expired.");
  }
  if (input.context.status === "bound" || input.context.status === "resumed") {
    if (
      input.context.boundUserId !== input.userId ||
      input.context.boundAccessJourneyId !== input.accessJourneyId
    ) {
      throw new AcquisitionContextBindingError(
        "Acquisition context is already bound to another participant journey.",
      );
    }
    return input.context;
  }
  return Object.freeze({
    ...input.context,
    status: "bound" as const,
    boundUserId: input.userId,
    boundAccessJourneyId: input.accessJourneyId,
    boundAt: now,
  });
}

export function resumeAcquisitionContext(input: Readonly<{
  context: AcquisitionContextEnvelope;
  userId: UserId;
  accessJourneyId: AccessJourneyId;
  now: string;
}>): AcquisitionContextEnvelope {
  const now = timestamp(input.now, "Acquisition resume time");
  if (now >= input.context.expiresAt) throw new Error("Acquisition context has expired.");
  if (
    input.context.status === "issued" ||
    input.context.boundUserId !== input.userId ||
    input.context.boundAccessJourneyId !== input.accessJourneyId
  ) {
    throw new Error("Acquisition context cannot be resumed by this participant journey.");
  }
  if (input.context.status === "resumed") return input.context;
  return Object.freeze({
    ...input.context,
    status: "resumed" as const,
    firstResumedAt: now,
  });
}

export function boundAcquisitionContext(
  context: AcquisitionContextEnvelope,
): BoundAcquisitionContext {
  if (
    context.status === "issued" ||
    !context.boundUserId ||
    !context.boundAccessJourneyId ||
    !context.boundAt
  ) {
    throw new Error("Acquisition context is not bound to a participant journey.");
  }
  return Object.freeze({
    id: context.id,
    version: context.version,
    intent: context.intent,
    source: context.source,
    boundUserId: context.boundUserId,
    boundAccessJourneyId: context.boundAccessJourneyId,
    issuedAt: context.issuedAt,
    expiresAt: context.expiresAt,
    boundAt: context.boundAt,
    resumeStatus: context.status === "resumed" ? "resumed" : "pending",
    firstResumedAt: context.firstResumedAt,
  });
}

export function createAcquisitionContextEvent(input: Readonly<{
  id: string;
  context: AcquisitionContextEnvelope;
  kind: AcquisitionContextEventKind;
  occurredAt: string;
}>): AcquisitionContextEvent {
  if (input.kind === "bound" && input.context.status !== "bound") {
    throw new Error("A bound acquisition event requires a bound context.");
  }
  if (input.kind === "resumed" && input.context.status !== "resumed") {
    throw new Error("A resumed acquisition event requires a resumed context.");
  }
  return Object.freeze({
    id: stableReference(input.id, "Acquisition context event id"),
    acquisitionContextId: input.context.id,
    kind: input.kind,
    userId: input.context.boundUserId,
    accessJourneyId: input.context.boundAccessJourneyId,
    occurredAt: timestamp(input.occurredAt, "Acquisition event time"),
  });
}
