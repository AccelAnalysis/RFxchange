import { FieldPath, type Firestore } from "firebase-admin/firestore";

import type { ResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import { FirestoreOpportunityDiscoveryRepository } from "../firestore/opportunity-discovery.ts";

const PROJECTIONS = "rfxOpportunityProjections";
const GEOGRAPHIES = "geographies";
const PAGE_SIZE = 120;

export interface OpportunityProjectionPage {
  readonly items: readonly ResponderOpportunityProjection[];
  readonly nextCursor: string | null;
}

interface ProjectionCursor {
  readonly deadline: string | null;
  readonly reference: string;
}

function encodeCursor(cursor: ProjectionCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeCursor(value: string): ProjectionCursor {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
    if (
      (parsed.deadline !== null && typeof parsed.deadline !== "string") ||
      typeof parsed.reference !== "string" ||
      !parsed.reference
    ) throw new Error("invalid");
    return Object.freeze({
      deadline: parsed.deadline as string | null,
      reference: parsed.reference,
    });
  } catch {
    throw new Error("Opportunity projection page cursor is invalid.");
  }
}

async function released(
  db: Firestore,
  projections: readonly ResponderOpportunityProjection[],
): Promise<readonly ResponderOpportunityProjection[]> {
  const ids = [...new Set(
    projections.flatMap((projection) => projection.payload.localities.map((item) => item.id)),
  )];
  if (!ids.length) return Object.freeze([]);
  const snapshots = await db.getAll(
    ...ids.map((id) => db.collection(GEOGRAPHIES).doc(id)),
  );
  const releasedIds = new Set(
    snapshots
      .filter((snapshot) => snapshot.exists && snapshot.get("releaseState") === "released")
      .map((snapshot) => snapshot.id),
  );
  return Object.freeze(
    projections.filter(
      (projection) =>
        projection.payload.localities.length > 0 &&
        projection.payload.localities.every((item) => releasedIds.has(item.id)),
    ),
  );
}

/**
 * DSC-004 uses a datastore cursor ordered exactly as participant discovery is
 * presented: response deadline, then projection/reference document identity.
 * Each call is bounded; the service asks for additional pages only until its
 * requested result window is complete.
 */
export class Wave4GapOpportunityDiscoveryRepository extends FirestoreOpportunityDiscoveryRepository {
  constructor(private readonly gapDb: Firestore) {
    super(gapDb);
  }

  async listProjectionPage(
    cursor: string | null,
    requestedPageSize = PAGE_SIZE,
  ): Promise<OpportunityProjectionPage> {
    const pageSize = Math.max(1, Math.min(PAGE_SIZE, Math.floor(requestedPageSize)));
    let query: FirebaseFirestore.Query = this.gapDb
      .collection(PROJECTIONS)
      .orderBy("payload.timing.responseDeadline", "asc")
      .orderBy(FieldPath.documentId(), "asc")
      .limit(pageSize);
    if (cursor) {
      const decoded = decodeCursor(cursor);
      query = query.startAfter(decoded.deadline, decoded.reference);
    }
    const page = await query.get();
    if (page.empty) return Object.freeze({ items: Object.freeze([]), nextCursor: null });
    const projections = page.docs.map(
      (document) => document.data() as ResponderOpportunityProjection,
    );
    const permitted = await released(this.gapDb, projections);
    const last = page.docs.at(-1)!;
    const lastData = last.data() as ResponderOpportunityProjection;
    return Object.freeze({
      items: permitted,
      nextCursor: page.size < pageSize
        ? null
        : encodeCursor(Object.freeze({
            deadline: lastData.payload.timing.responseDeadline,
            reference: last.id,
          })),
    });
  }

  override async listProjections(limit: number) {
    const page = await this.listProjectionPage(null, limit);
    return page.items;
  }
}
