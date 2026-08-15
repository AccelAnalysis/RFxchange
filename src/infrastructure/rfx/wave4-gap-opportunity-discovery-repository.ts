import { FieldPath, type Firestore } from "firebase-admin/firestore";

import type { ResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import { FirestoreOpportunityDiscoveryRepository } from "../firestore/opportunity-discovery.ts";

const PROJECTIONS = "rfxOpportunityProjections";
const GEOGRAPHIES = "geographies";
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
 * DSC-004 removes the old fixed visibility horizon. The service's `limit`
 * remains a presentation-page hint; authoritative discovery walks every
 * deterministic document-id page before the service applies governed filters
 * and its participant cursor.
 */
export class Wave4GapOpportunityDiscoveryRepository extends FirestoreOpportunityDiscoveryRepository {
  constructor(private readonly gapDb: Firestore) {
    super(gapDb);
  }

  override async listProjections() {
    const permitted: ResponderOpportunityProjection[] = [];
    let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    while (true) {
      let query: FirebaseFirestore.Query = this.gapDb
        .collection(PROJECTIONS)
        .orderBy(FieldPath.documentId())
        .limit(PAGE_SIZE);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      if (page.empty) break;
      const projections = page.docs.map(
        (document) => document.data() as ResponderOpportunityProjection,
      );
      permitted.push(...await released(this.gapDb, projections));
      cursor = page.docs.at(-1) ?? null;
      if (page.size < PAGE_SIZE) break;
    }

    return Object.freeze(permitted);
  }
}
