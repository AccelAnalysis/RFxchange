import type { AccessJourneyId } from "../../domain/lifecycle/model.ts";
import type { UserId } from "../../domain/users/model.ts";
import {
  acquisitionIntent,
  acquisitionSource,
  boundAcquisitionContext,
  createAcquisitionContextEnvelope,
  createAcquisitionContextEvent,
  type AcquisitionContextEnvelope,
  type AcquisitionContextEvent,
  type AcquisitionIntentKind,
  type AcquisitionSourceChannel,
  type BoundAcquisitionContext,
} from "../../domain/acquisition/model.ts";
import {
  projectPermittedPublicOpportunity,
  type PublicOpportunityProjection,
  type PublicOpportunityProjectionRepository,
} from "../../domain/acquisition/public-opportunity.ts";
import type { AcquisitionContextRepository } from "../../domain/acquisition/repository.ts";

const CONTEXT_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

export interface AcquisitionContextToken {
  readonly contextId: string;
  readonly browserSecret: string;
}

export interface PreparedAcquisitionContext {
  readonly token: AcquisitionContextToken;
  readonly context: AcquisitionContextEnvelope;
  readonly event: AcquisitionContextEvent;
}

export interface AcquisitionContextServiceDependencies {
  readonly contexts: AcquisitionContextRepository;
  readonly opportunities: PublicOpportunityProjectionRepository;
  readonly ids: Readonly<{
    context(): string;
    event(): string;
  }>;
  readonly secrets: Readonly<{
    create(): string;
    digest(value: string): string;
  }>;
  readonly now: () => string;
}

type TrustedAcquisitionInput = Readonly<{
  kind: Exclude<AcquisitionIntentKind, "opportunity" | "direct">;
  subjectReference: string;
  channel: Exclude<AcquisitionSourceChannel, "public-opportunity" | "direct">;
  sourceReference?: string | null;
  referrer?: string | null;
}>;

type PreparedIdentity = Readonly<{
  contextId?: string;
  eventId?: string;
  browserSecret?: string;
  issuedAt?: string;
}>;

function expiryFrom(now: string): string {
  return new Date(new Date(now).valueOf() + CONTEXT_LIFETIME_MS).toISOString();
}

function hostFromReferrer(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    return new URL(value).hostname || null;
  } catch {
    return null;
  }
}

export class AcquisitionContextService {
  private readonly dependencies: AcquisitionContextServiceDependencies;

  constructor(dependencies: AcquisitionContextServiceDependencies) {
    this.dependencies = dependencies;
  }

  async publicOpportunity(reference: string): Promise<PublicOpportunityProjection | null> {
    return projectPermittedPublicOpportunity(
      await this.dependencies.opportunities.getByReference(reference.trim()),
    );
  }

  async issuePublicOpportunity(input: Readonly<{
    reference: string;
    referrer?: string | null;
  }>): Promise<Readonly<{ token: AcquisitionContextToken; projection: PublicOpportunityProjection }>> {
    const projection = await this.publicOpportunity(input.reference);
    if (!projection) throw new Error("Public opportunity is unavailable.");
    const token = await this.issue({
      kind: "opportunity",
      subjectReference: projection.reference,
      channel: "public-opportunity",
      sourceReference: projection.reference,
      referrer: input.referrer,
    });
    return Object.freeze({ token, projection });
  }

  /**
   * Server-internal issuance seam for approved claim/referral/team/provider/buyer workflows.
   */
  async issueTrusted(input: TrustedAcquisitionInput): Promise<AcquisitionContextToken> {
    return this.issue(input);
  }

  /**
   * Builds a valid context, issued event, and browser token without writing them. An application
   * transaction coordinator may include the returned context and event in the same database
   * transaction as the business object that owns the invitation. The browser secret remains only
   * in the returned token; persistence receives its digest.
   */
  prepareTrusted(
    input: TrustedAcquisitionInput & PreparedIdentity,
  ): PreparedAcquisitionContext {
    return this.prepare(input);
  }

  private prepare(input: Readonly<{
    kind: AcquisitionIntentKind;
    subjectReference?: string | null;
    channel: AcquisitionSourceChannel;
    sourceReference?: string | null;
    referrer?: string | null;
  }> & PreparedIdentity): PreparedAcquisitionContext {
    const now = new Date(input.issuedAt ?? this.dependencies.now()).toISOString();
    const browserSecret = input.browserSecret?.trim() || this.dependencies.secrets.create();
    const context = createAcquisitionContextEnvelope({
      id: input.contextId?.trim() || this.dependencies.ids.context(),
      intent: acquisitionIntent({
        kind: input.kind,
        subjectReference: input.subjectReference,
      }),
      source: acquisitionSource({
        channel: input.channel,
        sourceReference: input.sourceReference,
        referrerHost: hostFromReferrer(input.referrer),
      }),
      browserSecretDigest: this.dependencies.secrets.digest(browserSecret),
      issuedAt: now,
      expiresAt: expiryFrom(now),
    });
    const event = createAcquisitionContextEvent({
      id: input.eventId?.trim() || this.dependencies.ids.event(),
      context,
      kind: "issued",
      occurredAt: now,
    });
    return Object.freeze({
      token: Object.freeze({ contextId: context.id, browserSecret }),
      context,
      event,
    });
  }

  private async issue(input: Readonly<{
    kind: AcquisitionIntentKind;
    subjectReference?: string | null;
    channel: AcquisitionSourceChannel;
    sourceReference?: string | null;
    referrer?: string | null;
  }>): Promise<AcquisitionContextToken> {
    const prepared = this.prepare(input);
    await this.dependencies.contexts.create(prepared.context, prepared.event);
    return prepared.token;
  }

  async bind(input: Readonly<{
    token: AcquisitionContextToken;
    userId: UserId;
    accessJourneyId: AccessJourneyId;
  }>): Promise<BoundAcquisitionContext> {
    const context = await this.dependencies.contexts.bind({
      id: input.token.contextId,
      browserSecretDigest: this.dependencies.secrets.digest(input.token.browserSecret),
      userId: input.userId,
      accessJourneyId: input.accessJourneyId,
      now: this.dependencies.now(),
      eventId: this.dependencies.ids.event(),
    });
    return boundAcquisitionContext(context);
  }

  async resume(input: Readonly<{
    contextId: string;
    userId: UserId;
    accessJourneyId: AccessJourneyId;
  }>): Promise<BoundAcquisitionContext> {
    const context = await this.dependencies.contexts.resume({
      id: input.contextId,
      userId: input.userId,
      accessJourneyId: input.accessJourneyId,
      now: this.dependencies.now(),
      eventId: this.dependencies.ids.event(),
    });
    return boundAcquisitionContext(context);
  }
}

export function serializeAcquisitionContextToken(token: AcquisitionContextToken): string {
  return `v1.${token.contextId}.${token.browserSecret}`;
}

export function parseAcquisitionContextToken(value: string | null | undefined): AcquisitionContextToken | null {
  if (!value) return null;
  const match = /^v1\.([A-Za-z0-9][A-Za-z0-9._:-]{0,190})\.([A-Za-z0-9_-]{32,128})$/.exec(value);
  if (!match) return null;
  return Object.freeze({ contextId: match[1], browserSecret: match[2] });
}
