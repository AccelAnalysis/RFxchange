import { createHash } from "node:crypto";

import {
  organizationAuditAction,
  organizationAuditEventId,
  type OrganizationActionAuditEvent,
} from "../../domain/audit/model.ts";
import {
  createOpportunityDiscoveryQuery,
  opportunityDeadline,
  opportunityDeadlineState,
  opportunityMatchesQuery,
  opportunityQueryFingerprint,
  type OpportunityDiscoveryQuery,
  type OpportunityDiscoveryRepository,
  type OpportunityRelationCommandReceipt,
  type OpportunityRelationEvent,
  type SavedOpportunityAlertPolicy,
  type SavedOpportunitySearch,
} from "../../domain/rfx/discovery.ts";
import type { ResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import {
  OpportunityDiscoveryError,
  OpportunityDiscoveryService,
  type OpportunityDiscoveryItem,
  type OpportunityDiscoveryResult,
  type OpportunityParticipantScope,
} from "./opportunity-discovery-service.ts";

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

function id(prefix: string, ...values: readonly string[]): string {
  return `${prefix}_${createHash("sha256").update(values.join(":"), "utf8").digest("hex").slice(0, 40)}`;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function audit(
  scope: OpportunityParticipantScope,
  eventId: string,
  action: string,
  occurredAt: string,
): OrganizationActionAuditEvent {
  return Object.freeze({
    id: organizationAuditEventId(eventId),
    organizationId: scope.organizationId,
    actor: Object.freeze({ userId: scope.userId, membershipId: scope.membershipId }),
    action: organizationAuditAction(action),
    target: null,
    occurredAt: new Date(occurredAt).toISOString() as never,
  });
}

function discoveryQuery(
  input: Parameters<typeof createOpportunityDiscoveryQuery>[0],
): OpportunityDiscoveryQuery {
  try {
    return createOpportunityDiscoveryQuery(input);
  } catch (error) {
    throw new OpportunityDiscoveryError(
      "invalid",
      error instanceof Error ? error.message : "Opportunity query is invalid.",
    );
  }
}

function normalizedQuery(input: Parameters<typeof createOpportunityDiscoveryQuery>[0]) {
  const query = discoveryQuery({ ...input, cursor: null });
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

function queryWithoutCursor(query: OpportunityDiscoveryQuery): Omit<OpportunityDiscoveryQuery, "cursor"> {
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

function cursorOffset(cursor: string | null, queryFingerprint: string): number {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [fingerprintValue, offsetValue] = decoded.split(":");
    const offset = Number.parseInt(offsetValue ?? "", 10);
    if (
      fingerprintValue !== queryFingerprint ||
      !Number.isSafeInteger(offset) ||
      offset < 0
    ) {
      throw new Error("stale");
    }
    return offset;
  } catch {
    throw new OpportunityDiscoveryError(
      "invalid",
      "Opportunity search cursor is stale or malformed.",
    );
  }
}

function nextCursor(queryFingerprint: string, offset: number): string {
  return Buffer.from(`${queryFingerprint}:${offset}`, "utf8").toString("base64url");
}

function projectionPermitted(projection: ResponderOpportunityProjection): boolean {
  return projection.mode === "published" &&
    Boolean(projection.publishedAt) &&
    (projection.audience === "public" || projection.audience === "authenticated-participants");
}

function toItem(
  projection: ResponderOpportunityProjection,
  watched: boolean,
  now: string,
): OpportunityDiscoveryItem | null {
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

export class Wave4GapOpportunityDiscoveryService extends OpportunityDiscoveryService {
  private readonly gapRepository: OpportunityDiscoveryRepository;
  private readonly gapNow: () => string;

  constructor(
    repository: OpportunityDiscoveryRepository,
    now: () => string = () => new Date().toISOString(),
    publicOrigin = "http://localhost:3000",
  ) {
    super(repository, now, publicOrigin);
    this.gapRepository = repository;
    this.gapNow = now;
  }

  override async discover(
    scope: OpportunityParticipantScope,
    input: Parameters<typeof createOpportunityDiscoveryQuery>[0],
  ): Promise<OpportunityDiscoveryResult> {
    const query = discoveryQuery(input);
    const withoutCursor = queryWithoutCursor(query);
    const queryHash = opportunityQueryFingerprint(withoutCursor);
    const offset = cursorOffset(query.cursor, queryHash);
    const now = this.gapNow();
    const [projections, watches, savedSearches] = await Promise.all([
      // The Wave 4 repository intentionally ignores this presentation hint and
      // walks the complete deterministic projection set before filtering.
      this.gapRepository.listProjections(250),
      this.gapRepository.listWatches(scope.organizationId, scope.userId),
      this.gapRepository.listSavedSearches(scope.organizationId, scope.userId),
    ]);
    const watched = new Set(
      watches
        .filter((item) => item.status === "watching")
        .map((item) => item.opportunityReference),
    );
    const matching = projections
      .filter(projectionPermitted)
      .filter((projection) => opportunityMatchesQuery({
        projection,
        query: withoutCursor,
        watched: watched.has(projection.reference),
        now,
      }))
      .sort(
        (left, right) =>
          opportunityDeadline(left).localeCompare(opportunityDeadline(right)) ||
          left.reference.localeCompare(right.reference),
      );
    const selected = matching.slice(offset, offset + query.limit);
    const items = Object.freeze(
      selected.flatMap((projection) => {
        const item = toItem(projection, watched.has(projection.reference), now);
        return item ? [item] : [];
      }),
    );
    const allOpenItems = projections
      .filter(projectionPermitted)
      .flatMap((projection) => {
        const item = toItem(projection, watched.has(projection.reference), now);
        return item?.watched ? [item] : [];
      })
      .sort((left, right) => left.responseDeadline.localeCompare(right.responseDeadline));
    const nowValue = Date.parse(now);
    const days = (item: OpportunityDiscoveryItem) =>
      (Date.parse(`${item.responseDeadline}T23:59:59.999Z`) - nowValue) / 86_400_000;
    return Object.freeze({
      query,
      items,
      nextCursor:
        offset + query.limit < matching.length
          ? nextCursor(queryHash, offset + query.limit)
          : null,
      savedSearches: Object.freeze(
        savedSearches.filter((item) => item.status !== "deleted"),
      ),
      deadlines: Object.freeze({
        next7Days: Object.freeze(allOpenItems.filter((item) => days(item) <= 7)),
        next30Days: Object.freeze(
          allOpenItems.filter((item) => days(item) > 7 && days(item) <= 30),
        ),
        later: Object.freeze(allOpenItems.filter((item) => days(item) > 30)),
      }),
    });
  }

  override async saveSearch(
    scope: OpportunityParticipantScope,
    input: Parameters<OpportunityDiscoveryService["saveSearch"]>[1],
  ) {
    const commandId = stable(input.commandId, "Command identity");
    const savedSearchId = input.savedSearchId
      ? stable(input.savedSearchId, "Saved search identity")
      : null;
    const action = savedSearchId
      ? "saved-search.update" as const
      : "saved-search.create" as const;
    const query = normalizedQuery(input.query);
    const label = normalizedLabel(input.label);
    const policy = alertPolicy(input.alertPolicy);
    const status = input.status === "paused" || input.status === "deleted"
      ? input.status
      : "active";
    const expectedVersionInput = savedSearchId ? Number(input.expectedVersion) : null;

    // Business intent excludes requested/created/updated timestamps. That makes the
    // fingerprint stable across retries even when wall-clock time has advanced.
    const requestFingerprint = fingerprint({
      action,
      organizationId: scope.organizationId,
      userId: scope.userId,
      membershipId: scope.membershipId,
      savedSearchId,
      expectedVersion: expectedVersionInput,
      label,
      query,
      alertPolicy: policy,
      status,
    });

    // Exact replay must precede current-record/version inspection. A command that
    // already committed remains recoverable after the saved search advances.
    const prior = await this.gapRepository.getCommand(commandId);
    if (prior) {
      if (
        prior.organizationId !== scope.organizationId ||
        prior.userId !== scope.userId ||
        prior.membershipId !== scope.membershipId ||
        prior.action !== action ||
        prior.requestFingerprint !== requestFingerprint
      ) {
        throw new OpportunityDiscoveryError(
          "conflict",
          "Command identity was reused for different intent.",
        );
      }
      const replay = await this.gapRepository.getSavedSearch(prior.resultingRecordId);
      if (
        !replay ||
        replay.organizationId !== scope.organizationId ||
        replay.userId !== scope.userId
      ) {
        throw new OpportunityDiscoveryError(
          "dependency-unavailable",
          "Saved search replay is temporarily unavailable.",
        );
      }
      return Object.freeze({ savedSearch: replay, replayed: true as const });
    }

    const existing = savedSearchId
      ? await this.gapRepository.getSavedSearch(savedSearchId)
      : null;
    if (
      savedSearchId &&
      (!existing ||
        existing.organizationId !== scope.organizationId ||
        existing.userId !== scope.userId)
    ) {
      throw new OpportunityDiscoveryError("not-found", "Saved search is unavailable.");
    }
    const expectedVersion = existing ? expectedVersionInput : null;
    if (
      existing &&
      (!Number.isInteger(expectedVersion) || existing.version !== expectedVersion)
    ) {
      throw new OpportunityDiscoveryError(
        "conflict",
        `Saved search changed; current version is ${existing.version}.`,
      );
    }

    const now = this.gapNow();
    const recordId = existing?.id ?? id(
      "oppsaved",
      String(scope.organizationId),
      String(scope.userId),
      commandId,
    );
    const record: SavedOpportunitySearch = Object.freeze({
      schemaVersion: 1,
      id: recordId,
      organizationId: scope.organizationId,
      userId: scope.userId,
      membershipId: scope.membershipId,
      label,
      query,
      alertPolicy: policy,
      status,
      version: (existing?.version ?? 0) + 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    const eventId = id("oppevent", String(scope.organizationId), commandId);
    const command: OpportunityRelationCommandReceipt = Object.freeze({
      schemaVersion: 1,
      id: commandId,
      organizationId: scope.organizationId,
      userId: scope.userId,
      membershipId: scope.membershipId,
      action,
      requestFingerprint,
      resultingRecordId: record.id,
      resultingVersion: record.version,
      recordedAt: now,
    });
    const event: OpportunityRelationEvent = Object.freeze({
      schemaVersion: 1,
      id: eventId,
      organizationId: scope.organizationId,
      userId: scope.userId,
      membershipId: scope.membershipId,
      kind: existing ? "saved-search-updated" : "saved-search-created",
      recordId: record.id,
      recordVersion: record.version,
      commandId,
      occurredAt: now,
    });

    try {
      const result = await this.gapRepository.saveSavedSearch({
        record,
        expectedVersion,
        command,
        event,
        audit: audit(
          scope,
          id("audit", String(scope.organizationId), commandId),
          existing
            ? "opportunity.saved-search-updated"
            : "opportunity.saved-search-created",
          now,
        ),
      });
      if (result === "replayed") {
        const replay = await this.gapRepository.getSavedSearch(record.id);
        if (!replay) {
          throw new OpportunityDiscoveryError(
            "dependency-unavailable",
            "Saved search replay is temporarily unavailable.",
          );
        }
        return Object.freeze({ savedSearch: replay, replayed: true as const });
      }
      return Object.freeze({ savedSearch: record, replayed: false as const });
    } catch (error) {
      if (error instanceof OpportunityDiscoveryError) throw error;
      throw new OpportunityDiscoveryError(
        "conflict",
        error instanceof Error ? error.message : "Saved search conflicted.",
      );
    }
  }
}
