import {
  createOpportunityDiscoveryQuery,
  opportunityDeadline,
  opportunityDeadlineState,
  opportunityMatchesQuery,
  opportunityQueryFingerprint,
  type OpportunityDiscoveryQuery,
  type OpportunityDiscoveryRepository,
} from "../../domain/rfx/discovery.ts";
import type { ResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import {
  OpportunityDiscoveryError,
  type OpportunityDiscoveryItem,
  type OpportunityDiscoveryResult,
  type OpportunityParticipantScope,
} from "./opportunity-discovery-service.ts";
import { Wave4GapOpportunityDiscoveryService } from "./wave4-gap-opportunity-discovery-service.ts";

interface ProjectionPage {
  readonly items: readonly ResponderOpportunityProjection[];
  readonly nextCursor: string | null;
}

interface BoundedProjectionRepository extends OpportunityDiscoveryRepository {
  listProjectionPage(cursor: string | null, pageSize?: number): Promise<ProjectionPage>;
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

function participantOffset(cursor: string | null, fingerprint: string): number {
  if (!cursor) return 0;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [storedFingerprint, rawOffset] = decoded.split(":");
    const offset = Number.parseInt(rawOffset ?? "", 10);
    if (storedFingerprint !== fingerprint || !Number.isSafeInteger(offset) || offset < 0) {
      throw new Error("stale");
    }
    return offset;
  } catch {
    throw new OpportunityDiscoveryError("invalid", "Opportunity search cursor is stale or malformed.");
  }
}

function participantCursor(fingerprint: string, offset: number): string {
  return Buffer.from(`${fingerprint}:${offset}`, "utf8").toString("base64url");
}

function permitted(projection: ResponderOpportunityProjection): boolean {
  return projection.mode === "published" &&
    Boolean(projection.publishedAt) &&
    (projection.audience === "public" || projection.audience === "authenticated-participants");
}

function item(
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

export class BoundedOpportunityDiscoveryService extends Wave4GapOpportunityDiscoveryService {
  constructor(
    private readonly boundedRepository: BoundedProjectionRepository,
    private readonly boundedNow: () => string = () => new Date().toISOString(),
    publicOrigin = "http://localhost:3000",
  ) {
    super(boundedRepository, boundedNow, publicOrigin);
  }

  override async discover(
    scope: OpportunityParticipantScope,
    input: Parameters<typeof createOpportunityDiscoveryQuery>[0],
  ): Promise<OpportunityDiscoveryResult> {
    let query: OpportunityDiscoveryQuery;
    try {
      query = createOpportunityDiscoveryQuery(input);
    } catch (error) {
      throw new OpportunityDiscoveryError(
        "invalid",
        error instanceof Error ? error.message : "Opportunity query is invalid.",
      );
    }
    const withoutCursor = queryWithoutCursor(query);
    const queryHash = opportunityQueryFingerprint(withoutCursor);
    const offset = participantOffset(query.cursor, queryHash);
    const targetMatchCount = offset + query.limit + 1;
    const now = this.boundedNow();
    const [watches, savedSearches] = await Promise.all([
      this.boundedRepository.listWatches(scope.organizationId, scope.userId),
      this.boundedRepository.listSavedSearches(scope.organizationId, scope.userId),
    ]);
    const watchedReferences = watches
      .filter((watch) => watch.status === "watching")
      .map((watch) => watch.opportunityReference);
    const watched = new Set(watchedReferences);

    const matching: ResponderOpportunityProjection[] = [];
    let datastoreCursor: string | null = null;
    do {
      const page = await this.boundedRepository.listProjectionPage(datastoreCursor, 120);
      for (const projection of page.items) {
        if (!permitted(projection)) continue;
        if (opportunityMatchesQuery({
          projection,
          query: withoutCursor,
          watched: watched.has(projection.reference),
          now,
        })) {
          matching.push(projection);
          if (matching.length >= targetMatchCount) break;
        }
      }
      datastoreCursor = page.nextCursor;
    } while (datastoreCursor && matching.length < targetMatchCount);

    const selected = matching.slice(offset, offset + query.limit);
    const items = Object.freeze(
      selected.flatMap((projection) => {
        const value = item(projection, watched.has(projection.reference), now);
        return value ? [value] : [];
      }),
    );

    const watchedProjections = await Promise.all(
      watchedReferences.map((reference) => this.boundedRepository.getProjection(reference)),
    );
    const allOpenWatched = watchedProjections
      .flatMap((projection) => {
        if (!projection || !permitted(projection)) return [];
        const value = item(projection, true, now);
        return value ? [value] : [];
      })
      .sort((left, right) =>
        left.responseDeadline.localeCompare(right.responseDeadline) ||
        left.reference.localeCompare(right.reference),
      );
    const nowValue = Date.parse(now);
    const days = (value: OpportunityDiscoveryItem) =>
      (Date.parse(`${value.responseDeadline}T23:59:59.999Z`) - nowValue) / 86_400_000;

    return Object.freeze({
      query,
      items,
      nextCursor: matching.length > offset + query.limit
        ? participantCursor(queryHash, offset + query.limit)
        : null,
      savedSearches: Object.freeze(savedSearches.filter((saved) => saved.status !== "deleted")),
      deadlines: Object.freeze({
        next7Days: Object.freeze(allOpenWatched.filter((value) => days(value) <= 7)),
        next30Days: Object.freeze(allOpenWatched.filter((value) => days(value) > 7 && days(value) <= 30)),
        later: Object.freeze(allOpenWatched.filter((value) => days(value) > 30)),
      }),
    });
  }
}
