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
  listProjectionPage(
    cursor: string | null,
    pageSize?: number,
    minimumDeadline?: string | null,
  ): Promise<ProjectionPage>;
  cursorAfterProjection(projection: ResponderOpportunityProjection): string;
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

const PARTICIPANT_CURSOR_FINGERPRINT_LENGTH = 24;
const PROJECTION_PAGE_SIZE = 120;
const MAX_PROJECTION_PAGES_PER_REQUEST = 4;

function participantDatastoreCursor(cursor: string | null, fingerprint: string): string | null {
  if (!cursor) return null;
  try {
    const expectedFingerprint = fingerprint.slice(0, PARTICIPANT_CURSOR_FINGERPRINT_LENGTH);
    const storedFingerprint = cursor.slice(0, PARTICIPANT_CURSOR_FINGERPRINT_LENGTH);
    const separator = cursor.at(PARTICIPANT_CURSOR_FINGERPRINT_LENGTH);
    const datastoreCursor = cursor.slice(PARTICIPANT_CURSOR_FINGERPRINT_LENGTH + 1);
    if (
      storedFingerprint !== expectedFingerprint ||
      separator !== "-" ||
      !/^[A-Za-z0-9_-]{8,150}$/.test(datastoreCursor)
    ) {
      throw new Error("stale");
    }
    return datastoreCursor;
  } catch {
    throw new OpportunityDiscoveryError("invalid", "Opportunity search cursor is stale or malformed.");
  }
}

function participantCursor(fingerprint: string, datastoreCursor: string): string {
  return `${fingerprint.slice(0, PARTICIPANT_CURSOR_FINGERPRINT_LENGTH)}-${datastoreCursor}`;
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
    const now = this.boundedNow();
    const minimumDeadline = now.slice(0, 10);
    let datastoreCursor = participantDatastoreCursor(query.cursor, queryHash);
    const [watches, savedSearches] = await Promise.all([
      this.boundedRepository.listWatches(scope.organizationId, scope.userId),
      this.boundedRepository.listSavedSearches(scope.organizationId, scope.userId),
    ]);
    const watchedReferences = watches
      .filter((watch) => watch.status === "watching")
      .map((watch) => watch.opportunityReference);
    const watched = new Set(watchedReferences);

    const matching: ResponderOpportunityProjection[] = [];
    let scannedPages = 0;
    do {
      const page = await this.boundedRepository.listProjectionPage(
        datastoreCursor,
        PROJECTION_PAGE_SIZE,
        minimumDeadline,
      );
      scannedPages += 1;
      for (const projection of page.items) {
        if (!permitted(projection)) continue;
        if (opportunityMatchesQuery({
          projection,
          query: withoutCursor,
          watched: watched.has(projection.reference),
          now,
        })) {
          matching.push(projection);
          if (matching.length >= query.limit + 1) break;
        }
      }
      datastoreCursor = page.nextCursor;
    } while (
      datastoreCursor &&
      matching.length < query.limit + 1 &&
      scannedPages < MAX_PROJECTION_PAGES_PER_REQUEST
    );

    const selected = matching.slice(0, query.limit);
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

    const lastSelected = selected.at(-1) ?? null;
    const bufferedResultCursor = matching.length > query.limit && lastSelected
      ? this.boundedRepository.cursorAfterProjection(lastSelected)
      : null;
    // A selective query may exhaust its per-request scan budget before filling a result page.
    // Continue from the datastore boundary already scanned instead of hiding later records or
    // allowing one request to walk the entire open corpus.
    const boundedScanCursor = !bufferedResultCursor &&
      datastoreCursor &&
      scannedPages >= MAX_PROJECTION_PAGES_PER_REQUEST
      ? datastoreCursor
      : null;

    return Object.freeze({
      query,
      items,
      nextCursor: bufferedResultCursor
        ? participantCursor(queryHash, bufferedResultCursor)
        : boundedScanCursor
          ? participantCursor(queryHash, boundedScanCursor)
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
