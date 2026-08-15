import { FieldPath, type Firestore } from "firebase-admin/firestore";

import type {
  OpportunityMatchBundle,
  SavedOpportunitySearch,
} from "../../domain/rfx/discovery.ts";
import type { ResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import { getServerFirebaseAuth } from "../auth/firebase-server.ts";
import { FirestoreOpportunityDiscoveryRepository } from "../firestore/opportunity-discovery.ts";

const PROJECTIONS = "rfxOpportunityProjections";
const GEOGRAPHIES = "geographies";
const USERS = "users";
const PAGE_SIZE = 200;

interface ParticipantUser {
  readonly id?: string;
  readonly primaryEmail?: string;
  readonly login?: Readonly<{
    readonly provider?: string;
    readonly subject?: string;
  }>;
}

function firebaseErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : null;
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
 * DSC-004 removes the old fixed visibility horizon. The service's `limit`
 * remains a presentation-page hint; authoritative discovery walks every
 * deterministic document-id page before the service applies its governed
 * filters and participant cursor.
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

  private async providerAccountAuthoritative(
    search: SavedOpportunitySearch,
  ): Promise<boolean> {
    const snapshot = await this.gapDb.collection(USERS).doc(search.userId).get();
    const user = snapshot.data() as ParticipantUser | undefined;
    const providerSubject = user?.login?.provider === "firebase"
      ? user.login.subject?.trim() ?? ""
      : "";
    const primaryEmail = user?.primaryEmail?.trim() ?? "";
    if (
      !snapshot.exists ||
      !user ||
      user.id !== search.userId ||
      !providerSubject ||
      !primaryEmail
    ) {
      return false;
    }
    try {
      const account = await getServerFirebaseAuth().getUser(providerSubject);
      return Boolean(
        !account.disabled &&
        account.emailVerified &&
        account.email?.trim() &&
        account.email.trim().toLowerCase() === primaryEmail.toLowerCase()
      );
    } catch (error) {
      if (firebaseErrorCode(error) === "auth/user-not-found") return false;
      throw error;
    }
  }

  override async saveMatch(bundle: OpportunityMatchBundle) {
    const search = await this.getSavedSearch(bundle.match.savedSearchId);
    if (
      !search ||
      search.id !== bundle.match.savedSearchId ||
      search.version !== bundle.match.savedSearchVersion ||
      search.organizationId !== bundle.match.organizationId ||
      search.userId !== bundle.match.userId ||
      search.membershipId !== bundle.match.membershipId ||
      !(await this.providerAccountAuthoritative(search))
    ) {
      throw new Error("Opportunity saved-search provider authority changed.");
    }
    return super.saveMatch(bundle);
  }
}
