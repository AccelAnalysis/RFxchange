import { createHash } from "node:crypto";

import { createTransactionalEmailRequest } from "../../domain/communications/transactional-email.ts";
import {
  organizationAuditAction,
  organizationAuditEventId,
  type OrganizationActionAuditEvent,
} from "../../domain/audit/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import {
  createOpportunityDiscoveryQuery,
  opportunityDeadline,
  opportunityDeadlineState,
  opportunityMatchesQuery,
  opportunityQueryFingerprint,
  opportunityWatchId,
  type OpportunityAlertIntent,
  type OpportunityDiscoveryQuery,
  type OpportunityDiscoveryRepository,
  type OpportunityMatchBundle,
  type OpportunityRelationCommandReceipt,
  type OpportunityRelationEvent,
  type OpportunitySavedSearchMatchEvent,
  type OpportunityWatch,
  type SavedOpportunityAlertPolicy,
  type SavedOpportunitySearch,
} from "../../domain/rfx/discovery.ts";
import type { ResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import type { OrganizationMembershipId, UserId } from "../../domain/users/model.ts";
import {
  OPPORTUNITY_ALERT_EVENT,
  opportunityAlertTransactionalEmailCatalog,
} from "./opportunity-alert-templates.ts";

export class OpportunityDiscoveryError extends Error {
  readonly code: "invalid" | "forbidden" | "not-found" | "conflict" | "dependency-unavailable";

  constructor(
    code: "invalid" | "forbidden" | "not-found" | "conflict" | "dependency-unavailable",
    message: string,
  ) {
    super(message);
    this.name = "OpportunityDiscoveryError";
    this.code = code;
  }
}

export interface OpportunityParticipantScope {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
}

export interface OpportunityDiscoveryItem {
  readonly reference: string;
  readonly aggregateVersion: number;
  readonly digest: string;
  readonly title: string;
  readonly summary: string;
  readonly issuerDisplayName: string;
  readonly requestFamilyLabel: string;
  readonly localities: readonly Readonly<{ id: string; label: string }>[];
  readonly responseDeadline: string;
  readonly deadlineState: "open" | "due-soon";
  readonly watched: boolean;
  readonly projection: Readonly<{
    readonly payload: ResponderOpportunityProjection["payload"];
  }>;
}

export interface OpportunityDiscoveryResult {
  readonly query: OpportunityDiscoveryQuery;
  readonly items: readonly OpportunityDiscoveryItem[];
  readonly nextCursor: string | null;
  readonly savedSearches: readonly SavedOpportunitySearch[];
  readonly deadlines: Readonly<{
    readonly next7Days: readonly OpportunityDiscoveryItem[];
    readonly next30Days: readonly OpportunityDiscoveryItem[];
    readonly later: readonly OpportunityDiscoveryItem[];
  }>;
}

function stable(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new OpportunityDiscoveryError("invalid", `${label} is invalid.`);
  }
  return normalized;
}

function normalizedLabel(value: string): string {
  const label = value.trim().replace(/\s+/g, " ").slice(0, 80);
  if (!label) throw new OpportunityDiscoveryError("invalid", "Saved search label is required.");
  return label;
}

function alertPolicy(value: string): SavedOpportunityAlertPolicy {
  if (value === "off" || value === "immediate" || value === "daily-digest") return value;
  throw new OpportunityDiscoveryError("invalid", "Saved search alert policy is unsupported.");
}

function discoveryQuery(input: Parameters<typeof createOpportunityDiscoveryQuery>[0]): OpportunityDiscoveryQuery {
  try {
    return createOpportunityDiscoveryQuery(input);
  } catch (error) {
    throw new OpportunityDiscoveryError(
      "invalid",
      error instanceof Error ? error.message : "Opportunity query is invalid.",
    );
  }
}

function withoutCursor(query: OpportunityDiscoveryQuery): Omit<OpportunityDiscoveryQuery, "cursor"> {
  return Object.freeze({
    text: query.text,
    requestFamilyKeys: query.requestFamilyKeys,
    capabilityIds: query.capabilityIds,
    localityIds: query.localityIds,
    deadlineWindow: query.deadlineWindow,
    watched: query.watched,
    limit: query.limit,
  });
}

function id(prefix: string, ...values: readonly string[]): string {
  return `${prefix}_${createHash("sha256").update(values.join(":"), "utf8").digest("hex").slice(0, 40)}`;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function audit(scope: OpportunityParticipantScope, eventId: string, action: string, occurredAt: string): OrganizationActionAuditEvent {
  return Object.freeze({
    id: organizationAuditEventId(eventId),
    organizationId: scope.organizationId,
    actor: Object.freeze({ userId: scope.userId, membershipId: scope.membershipId }),
    action: organizationAuditAction(action),
    target: null,
    occurredAt: new Date(occurredAt).toISOString() as never,
  });
}

function cursorOffset(cursor: string | null, queryFingerprint: string): number {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [fingerprintValue, offsetValue] = decoded.split(":");
    const offset = Number.parseInt(offsetValue ?? "", 10);
    if (fingerprintValue !== queryFingerprint || !Number.isInteger(offset) || offset < 0 || offset > 10_000) {
      throw new Error("stale");
    }
    return offset;
  } catch {
    throw new OpportunityDiscoveryError("invalid", "Opportunity search cursor is stale or malformed.");
  }
}

function cursor(queryFingerprint: string, offset: number): string {
  return Buffer.from(`${queryFingerprint}:${offset}`, "utf8").toString("base64url");
}

function projectionPermitted(projection: ResponderOpportunityProjection): boolean {
  return projection.mode === "published" &&
    Boolean(projection.publishedAt) &&
    (projection.audience === "public" || projection.audience === "authenticated-participants");
}

function toItem(projection: ResponderOpportunityProjection, watched: boolean, now: string): OpportunityDiscoveryItem | null {
  const deadlineState = opportunityDeadlineState(projection, now);
  if (deadlineState === "passed") return null;
  return Object.freeze({
    reference: projection.reference,
    aggregateVersion: projection.aggregateVersion,
    digest: projection.digest,
    title: projection.payload.title,
    summary: projection.payload.summary,
    issuerDisplayName: projection.payload.issuerDisplayName,
    requestFamilyLabel: projection.payload.requestFamilyLabel,
    localities: projection.payload.localities,
    responseDeadline: opportunityDeadline(projection),
    deadlineState,
    watched,
    projection: Object.freeze({ payload: projection.payload }),
  });
}

export class OpportunityDiscoveryService {
  private readonly repository: OpportunityDiscoveryRepository;
  private readonly now: () => string;
  private readonly publicOrigin: string;

  constructor(
    repository: OpportunityDiscoveryRepository,
    now: () => string = () => new Date().toISOString(),
    publicOrigin = "http://localhost:3000",
  ) {
    this.repository = repository;
    this.now = now;
    this.publicOrigin = publicOrigin;
  }

  async discover(scope: OpportunityParticipantScope, input: Parameters<typeof createOpportunityDiscoveryQuery>[0]): Promise<OpportunityDiscoveryResult> {
    const query = discoveryQuery(input);
    const queryWithoutCursor = withoutCursor(query);
    const queryHash = opportunityQueryFingerprint(queryWithoutCursor);
    const offset = cursorOffset(query.cursor, queryHash);
    const now = this.now();
    const [projections, watches, savedSearches] = await Promise.all([
      this.repository.listProjections(250),
      this.repository.listWatches(scope.organizationId, scope.userId),
      this.repository.listSavedSearches(scope.organizationId, scope.userId),
    ]);
    const watched = new Set(watches.filter((item) => item.status === "watching").map((item) => item.opportunityReference));
    const matching = projections
      .filter(projectionPermitted)
      .filter((projection) => opportunityMatchesQuery({ projection, query: queryWithoutCursor, watched: watched.has(projection.reference), now }))
      .sort((left, right) => opportunityDeadline(left).localeCompare(opportunityDeadline(right)) || left.reference.localeCompare(right.reference));
    const selected = matching.slice(offset, offset + query.limit);
    const items = Object.freeze(selected.flatMap((projection) => {
      const item = toItem(projection, watched.has(projection.reference), now);
      return item ? [item] : [];
    }));
    const allOpenItems = projections.filter(projectionPermitted).flatMap((projection) => {
      const item = toItem(projection, watched.has(projection.reference), now);
      return item?.watched ? [item] : [];
    }).sort((left, right) => left.responseDeadline.localeCompare(right.responseDeadline));
    const nowValue = Date.parse(now);
    const days = (item: OpportunityDiscoveryItem) => (Date.parse(`${item.responseDeadline}T23:59:59.999Z`) - nowValue) / 86_400_000;
    return Object.freeze({
      query,
      items,
      nextCursor: offset + query.limit < matching.length ? cursor(queryHash, offset + query.limit) : null,
      savedSearches: Object.freeze(savedSearches.filter((item) => item.status !== "deleted")),
      deadlines: Object.freeze({
        next7Days: Object.freeze(allOpenItems.filter((item) => days(item) <= 7)),
        next30Days: Object.freeze(allOpenItems.filter((item) => days(item) > 7 && days(item) <= 30)),
        later: Object.freeze(allOpenItems.filter((item) => days(item) > 30)),
      }),
    });
  }

  async saveSearch(scope: OpportunityParticipantScope, input: Readonly<{
    commandId: string;
    savedSearchId?: string | null;
    expectedVersion?: number | null;
    label: string;
    query: Parameters<typeof createOpportunityDiscoveryQuery>[0];
    alertPolicy: string;
    status?: string | null;
  }>) {
    const commandId = stable(input.commandId, "Command identity");
    const existing = input.savedSearchId ? await this.repository.getSavedSearch(stable(input.savedSearchId, "Saved search identity")) : null;
    if (input.savedSearchId && (!existing || existing.organizationId !== scope.organizationId || existing.userId !== scope.userId)) {
      throw new OpportunityDiscoveryError("not-found", "Saved search is unavailable.");
    }
    const expectedVersion = existing ? Number(input.expectedVersion) : null;
    if (existing && (!Number.isInteger(expectedVersion) || existing.version !== expectedVersion)) {
      throw new OpportunityDiscoveryError("conflict", `Saved search changed; current version is ${existing.version}.`);
    }
    const normalizedQuery = discoveryQuery({ ...input.query, cursor: null });
    const query = withoutCursor(normalizedQuery);
    const now = this.now();
    const recordId = existing?.id ?? id("oppsaved", String(scope.organizationId), String(scope.userId), commandId);
    const status = input.status === "paused" || input.status === "deleted" ? input.status : "active";
    const record: SavedOpportunitySearch = Object.freeze({
      schemaVersion: 1,
      id: recordId,
      organizationId: scope.organizationId,
      userId: scope.userId,
      membershipId: scope.membershipId,
      label: normalizedLabel(input.label),
      query,
      alertPolicy: alertPolicy(input.alertPolicy),
      status,
      version: (existing?.version ?? 0) + 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    const action = existing ? "saved-search.update" as const : "saved-search.create" as const;
    const requestFingerprint = fingerprint({ action, organizationId: scope.organizationId, userId: scope.userId, record });
    const prior = await this.repository.getCommand(commandId);
    if (prior) {
      if (prior.requestFingerprint !== requestFingerprint || prior.action !== action) throw new OpportunityDiscoveryError("conflict", "Command identity was reused for different intent.");
      const replay = await this.repository.getSavedSearch(prior.resultingRecordId);
      if (!replay) throw new OpportunityDiscoveryError("dependency-unavailable", "Saved search replay is temporarily unavailable.");
      return Object.freeze({ savedSearch: replay, replayed: true as const });
    }
    const eventId = id("oppevent", String(scope.organizationId), commandId);
    const command: OpportunityRelationCommandReceipt = Object.freeze({ schemaVersion: 1, id: commandId, organizationId: scope.organizationId, userId: scope.userId, membershipId: scope.membershipId, action, requestFingerprint, resultingRecordId: record.id, resultingVersion: record.version, recordedAt: now });
    const event: OpportunityRelationEvent = Object.freeze({ schemaVersion: 1, id: eventId, organizationId: scope.organizationId, userId: scope.userId, membershipId: scope.membershipId, kind: existing ? "saved-search-updated" : "saved-search-created", recordId: record.id, recordVersion: record.version, commandId, occurredAt: now });
    try {
      const result = await this.repository.saveSavedSearch({ record, expectedVersion, command, event, audit: audit(scope, id("audit", String(scope.organizationId), commandId), existing ? "opportunity.saved-search-updated" : "opportunity.saved-search-created", now) });
      return Object.freeze({ savedSearch: record, replayed: result === "replayed" });
    } catch (error) {
      throw new OpportunityDiscoveryError("conflict", error instanceof Error ? error.message : "Saved search conflicted.");
    }
  }

  async setWatch(scope: OpportunityParticipantScope, input: Readonly<{ commandId: string; reference: string; watching: boolean }>) {
    const commandId = stable(input.commandId, "Command identity");
    const reference = stable(input.reference, "Opportunity reference");
    const projection = await this.repository.getProjection(reference);
    if (!projection || !projectionPermitted(projection) || opportunityDeadlineState(projection, this.now()) === "passed") {
      throw new OpportunityDiscoveryError("not-found", "Opportunity is unavailable.");
    }
    const recordId = opportunityWatchId(String(scope.organizationId), String(scope.userId), reference);
    const existing = await this.repository.getWatch(recordId);
    if (existing && (existing.organizationId !== scope.organizationId || existing.userId !== scope.userId)) throw new OpportunityDiscoveryError("not-found", "Opportunity watch is unavailable.");
    const now = this.now();
    const record: OpportunityWatch = Object.freeze({ schemaVersion: 1, id: recordId, organizationId: scope.organizationId, userId: scope.userId, membershipId: scope.membershipId, opportunityReference: reference, status: input.watching ? "watching" : "removed", version: (existing?.version ?? 0) + 1, createdAt: existing?.createdAt ?? now, updatedAt: now });
    const requestFingerprint = fingerprint({ action: "watch.set", organizationId: scope.organizationId, userId: scope.userId, reference, watching: input.watching });
    const prior = await this.repository.getCommand(commandId);
    if (prior) {
      if (prior.requestFingerprint !== requestFingerprint || prior.resultingRecordId !== recordId) throw new OpportunityDiscoveryError("conflict", "Command identity was reused for different intent.");
      const replay = await this.repository.getWatch(recordId);
      if (!replay) throw new OpportunityDiscoveryError("dependency-unavailable", "Opportunity watch replay is temporarily unavailable.");
      return Object.freeze({ watch: replay, replayed: true as const });
    }
    const event: OpportunityRelationEvent = Object.freeze({ schemaVersion: 1, id: id("oppevent", String(scope.organizationId), commandId), organizationId: scope.organizationId, userId: scope.userId, membershipId: scope.membershipId, kind: input.watching ? "opportunity-watched" : "opportunity-unwatched", recordId, recordVersion: record.version, commandId, occurredAt: now });
    const command: OpportunityRelationCommandReceipt = Object.freeze({ schemaVersion: 1, id: commandId, organizationId: scope.organizationId, userId: scope.userId, membershipId: scope.membershipId, action: "watch.set", requestFingerprint, resultingRecordId: recordId, resultingVersion: record.version, recordedAt: now });
    try {
      const result = await this.repository.saveWatch({ record, expectedVersion: existing?.version ?? null, command, event, audit: audit(scope, id("audit", String(scope.organizationId), commandId), input.watching ? "opportunity.watched" : "opportunity.unwatched", now) });
      return Object.freeze({ watch: record, replayed: result === "replayed" });
    } catch (error) {
      throw new OpportunityDiscoveryError("conflict", error instanceof Error ? error.message : "Opportunity watch conflicted.");
    }
  }

  async evaluatePublishedProjection(projection: ResponderOpportunityProjection): Promise<Readonly<{ matches: number; alerts: number }>> {
    if (!projectionPermitted(projection)) return Object.freeze({ matches: 0, alerts: 0 });
    const now = this.now();
    const searches = await this.repository.listActiveSavedSearches();
    let matches = 0;
    let alerts = 0;
    for (const search of searches) {
      if (search.status !== "active" || !opportunityMatchesQuery({ projection, query: search.query, watched: false, now })) continue;
      const matchId = id("oppmatch", search.id, String(search.version), projection.reference, String(projection.aggregateVersion), projection.digest);
      const match: OpportunitySavedSearchMatchEvent = Object.freeze({ schemaVersion: 1, id: matchId, organizationId: search.organizationId, userId: search.userId, membershipId: search.membershipId, savedSearchId: search.id, savedSearchVersion: search.version, opportunityReference: projection.reference, projectionVersion: projection.aggregateVersion, projectionDigest: projection.digest, evaluationPolicyVersion: 1, matchedAt: now });
      let alert: OpportunityAlertIntent | null = null;
      if (search.alertPolicy !== "off") {
        const recipient = await this.repository.getAlertRecipient(search);
        if (recipient) {
          const reference = opportunityAlertTransactionalEmailCatalog.referenceForEvent(OPPORTUNITY_ALERT_EVENT, 1);
          const windowKey = search.alertPolicy === "daily-digest" ? now.slice(0, 10) : matchId;
          const alertId = search.alertPolicy === "daily-digest"
            ? id("oppalert", String(search.organizationId), String(search.userId), windowKey)
            : id("oppalert", matchId, search.alertPolicy);
          const continueUrl = `${new URL(this.publicOrigin).origin}/opportunities?selected=${encodeURIComponent(projection.reference)}`;
          const opportunitySummary = `${projection.payload.title} — ${opportunityDeadline(projection)} — ${projection.payload.localities.map((item) => item.label).join(", ")}`.slice(0, 1800);
          const request = createTransactionalEmailRequest({
            id: alertId,
            purpose: reference.purpose,
            recipientEmail: recipient.primaryEmail,
            recipientDisplayName: recipient.displayName,
            eventKey: String(reference.eventKey),
            eventVersion: reference.eventVersion,
            templateKey: String(reference.templateKey),
            templateVersion: reference.templateVersion,
            variables: { recipient_name: recipient.displayName, opportunity_count: 1, opportunity_summary: opportunitySummary, continue_url: continueUrl },
            correlationId: `opportunity-alert:${windowKey}`,
            idempotencyKey: `opportunity-alert:${alertId}`,
            requestedAt: now,
            organizationId: String(search.organizationId),
            userId: String(search.userId),
            relatedObjectType: "opportunity-alert",
            relatedObjectId: alertId,
            tags: ["rfx", "opportunity", search.alertPolicy],
          });
          alert = Object.freeze({
            schemaVersion: 1,
            id: alertId,
            organizationId: search.organizationId,
            userId: search.userId,
            membershipId: search.membershipId,
            matchEventIds: Object.freeze([matchId]),
            opportunityReferences: Object.freeze([projection.reference]),
            savedSearchIds: Object.freeze([search.id]),
            deliveryMode: search.alertPolicy,
            windowKey,
            request,
            status: "queued",
            attemptCount: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      const result = await this.repository.saveMatch({ match, alert } satisfies OpportunityMatchBundle);
      if (result === "created") {
        matches += 1;
        if (alert) alerts += 1;
      }
    }
    return Object.freeze({ matches, alerts });
  }
}
