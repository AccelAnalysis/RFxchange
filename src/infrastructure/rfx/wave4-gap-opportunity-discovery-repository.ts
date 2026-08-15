import { FieldPath, type Firestore } from "firebase-admin/firestore";

import type { ResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import { FirestoreOpportunityDiscoveryRepository } from "../firestore/opportunity-discovery.ts";

const PROJECTIONS = "rfxOpportunityProjections";
const GEOGRAPHIES = "geographies";
const MAX_DISCOVERY_SCAN = 10_000;
const PAGE_SIZE = 200;

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
 * DSC-004 removes the old 250-document visibility horizon. The service still
 * supplies its legacy candidate hint, but this repository treats it only as a
 * minimum scan request and walks deterministic document-id pages until the
 * collection ends or the explicit 10k safety bound is reached.
 */
export class Wave4GapOpportunityDiscoveryRepository extends FirestoreOpportunityDiscoveryRepository {
  constructor(private readonly gapDb: Firestore) {
    super(gapDb);
  }

  override async listProjections(limit: number) {
    const minimumRequested = Math.max(1, limit);
    const permitted: ResponderOpportunityProjection[] = [];
    let scanned = 0;
    let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    while (scanned < MAX_DISCOVERY_SCAN) {
      const remaining = MAX_DISCOVERY_SCAN - scanned;
      let query: FirebaseFirestore.Query = this.gapDb
        .collection(PROJECTIONS)
        .orderBy(FieldPath.documentId())
        .limit(Math.min(PAGE_SIZE, remaining));
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      if (page.empty) break;
      scanned += page.size;
      const projections = page.docs.map(
        (document) => document.data() as ResponderOpportunityProjection,
      );
      permitted.push(...await released(this.gapDb, projections));
      cursor = page.docs.at(-1) ?? null;
      if (page.size < Math.min(PAGE_SIZE, remaining)) break;
    }

    // Keep the parameter meaningful for callers while never truncating the
    // authoritative candidate set back to the obsolete 250-document ceiling.
    if (permitted.length < minimumRequested && scanned >= MAX_DISCOVERY_SCAN) {
      return Object.freeze(permitted);
    }
    return Object.freeze(permitted);
  }
}
