import { FieldPath, FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";

import type { OrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  OpportunityDiscoveryRepository,
  OpportunityAlertIntent,
  OpportunityAlertRecipient,
  OpportunityMatchBundle,
  OpportunityRelationBundle,
  OpportunityRelationCommandReceipt,
  OpportunityWatch,
  SavedOpportunitySearch,
} from "../../domain/rfx/discovery.ts";
import type { ResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import type { UserId } from "../../domain/users/model.ts";
import { FIRESTORE_SCHEMA_VERSION } from "./schema.ts";
import { getFirestoreRecordById, listFirestoreRecords } from "./support.ts";

const PROJECTIONS = "rfxOpportunityProjections";
const SAVED_SEARCHES = "opportunitySavedSearches";
const WATCHES = "opportunityWatches";
const MATCHES = "opportunitySavedSearchMatches";
const ALERTS = "opportunityAlertIntents";
const COMMANDS = "opportunityRelationCommands";
const EVENTS = "opportunityRelationEvents";
const AUDITS = "organizationAuditEvents";
const MEMBERSHIPS = "organizationMemberships";
const RESTRICTIONS = "accessRestrictions";
const USERS = "users";
const GEOGRAPHIES = "geographies";

function mutable(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp(), persistenceUpdatedAt: FieldValue.serverTimestamp() });
}

function immutable(value: object) {
  return Object.freeze({ ...value, schemaVersion: FIRESTORE_SCHEMA_VERSION, persistedAt: FieldValue.serverTimestamp() });
}

function sameCommand(left: OpportunityRelationCommandReceipt, right: OpportunityRelationCommandReceipt): boolean {
  return left.organizationId === right.organizationId && left.userId === right.userId && left.membershipId === right.membershipId && left.action === right.action && left.requestFingerprint === right.requestFingerprint && left.resultingRecordId === right.resultingRecordId && left.resultingVersion === right.resultingVersion;
}

function unrestricted(records: readonly FirebaseFirestore.QueryDocumentSnapshot[]): boolean {
  return records.every((record) => record.get("state") === "none");
}

async function releasedProjections(
  db: Firestore,
  projections: readonly ResponderOpportunityProjection[],
): Promise<readonly ResponderOpportunityProjection[]> {
  const ids = [...new Set(projections.flatMap((projection) => projection.payload.localities.map((item) => item.id)))];
  if (!ids.length) return Object.freeze([]);
  const snapshots = await db.getAll(...ids.map((id) => db.collection(GEOGRAPHIES).doc(id)));
  const released = new Set(snapshots.filter((snapshot) => snapshot.exists && snapshot.get("releaseState") === "released").map((snapshot) => snapshot.id));
  return Object.freeze(projections.filter((projection) => projection.payload.localities.length > 0 && projection.payload.localities.every((item) => released.has(item.id))));
}

function mergeDailyAlert(current: OpportunityAlertIntent, next: OpportunityAlertIntent): OpportunityAlertIntent {
  if (current.deliveryMode !== "daily-digest" || next.deliveryMode !== "daily-digest" || current.windowKey !== next.windowKey || current.status !== "queued" || current.request.metadata.idempotencyKey !== next.request.metadata.idempotencyKey) {
    throw new Error("Opportunity daily digest identity collision.");
  }
  const summaries = [current.request.variables.opportunity_summary, next.request.variables.opportunity_summary]
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
  const opportunityReferences = Object.freeze([...new Set([...current.opportunityReferences, ...next.opportunityReferences])]);
  return Object.freeze({
    ...current,
    matchEventIds: Object.freeze([...new Set([...current.matchEventIds, ...next.matchEventIds])]),
    opportunityReferences,
    savedSearchIds: Object.freeze([...new Set([...current.savedSearchIds, ...next.savedSearchIds])]),
    request: Object.freeze({
      ...current.request,
      variables: Object.freeze({
        ...current.request.variables,
        opportunity_count: opportunityReferences.length,
        opportunity_summary: summaries.join("\n").slice(0, 1800),
      }),
    }),
    updatedAt: next.updatedAt,
  });
}

async function assertCurrentParticipant(transaction: Transaction, db: Firestore, bundle: Readonly<{ record: SavedOpportunitySearch | OpportunityWatch; audit: OrganizationActionAuditEvent }>) {
  const membershipRef = db.collection(MEMBERSHIPS).doc(bundle.record.membershipId);
  const [membership, organizationRestrictions, membershipRestrictions] = await Promise.all([
    transaction.get(membershipRef),
    transaction.get(db.collection(RESTRICTIONS).where("target.kind", "==", "organization").where("target.organizationId", "==", bundle.record.organizationId)),
    transaction.get(db.collection(RESTRICTIONS).where("target.kind", "==", "membership").where("target.membershipId", "==", bundle.record.membershipId)),
  ]);
  const data = membership.data() as { userId?: string; organizationId?: string; status?: string } | undefined;
  const restricted = [...organizationRestrictions.docs, ...membershipRestrictions.docs].some((record) => record.get("state") !== "none");
  if (!membership.exists || !data || data.userId !== bundle.record.userId || data.organizationId !== bundle.record.organizationId || data.status !== "active" || restricted || bundle.audit.organizationId !== bundle.record.organizationId || bundle.audit.actor.userId !== bundle.record.userId || bundle.audit.actor.membershipId !== bundle.record.membershipId) {
    throw new Error("Opportunity relation authority changed.");
  }
}

export class FirestoreOpportunityDiscoveryRepository implements OpportunityDiscoveryRepository {
  constructor(private readonly db: Firestore) {}

  async listProjections(limit: number) {
    const requested = Math.max(1, limit);
    const pageSize = Math.min(200, requested);
    const permitted: ResponderOpportunityProjection[] = [];
    let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    while (permitted.length < requested) {
      let query: FirebaseFirestore.Query = this.db
        .collection(PROJECTIONS)
        .orderBy(FieldPath.documentId())
        .limit(pageSize);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      if (page.empty) break;
      const projections = page.docs.map((document) => document.data() as ResponderOpportunityProjection);
      permitted.push(...await releasedProjections(this.db, projections));
      cursor = page.docs.at(-1) ?? null;
      if (page.size < pageSize) break;
    }
    return Object.freeze(permitted.slice(0, requested));
  }

  async getProjection(reference: string) {
    const projection = await getFirestoreRecordById<ResponderOpportunityProjection>(this.db, PROJECTIONS, reference);
    if (!projection) return null;
    const permitted = await releasedProjections(this.db, [projection]);
    return permitted[0] ?? null;
  }

  listSavedSearches(organizationId: OrganizationId, userId: UserId) {
    return listFirestoreRecords<SavedOpportunitySearch>(
      this.db.collection(SAVED_SEARCHES).where("organizationId", "==", organizationId).where("userId", "==", userId),
      SAVED_SEARCHES,
    ).then((items) => Object.freeze([...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))));
  }

  getSavedSearch(id: string) {
    return getFirestoreRecordById<SavedOpportunitySearch>(this.db, SAVED_SEARCHES, id);
  }

  listWatches(organizationId: OrganizationId, userId: UserId) {
    return listFirestoreRecords<OpportunityWatch>(
      this.db.collection(WATCHES).where("organizationId", "==", organizationId).where("userId", "==", userId),
      WATCHES,
    );
  }

  getWatch(id: string) {
    return getFirestoreRecordById<OpportunityWatch>(this.db, WATCHES, id);
  }

  getCommand(id: string) {
    return getFirestoreRecordById<OpportunityRelationCommandReceipt>(this.db, COMMANDS, id);
  }

  async getAlertRecipient(search: SavedOpportunitySearch): Promise<OpportunityAlertRecipient | null> {
    const [user, membership, organizationRestrictions, membershipRestrictions] = await Promise.all([
      this.db.collection(USERS).doc(search.userId).get(),
      this.db.collection(MEMBERSHIPS).doc(search.membershipId).get(),
      this.db.collection(RESTRICTIONS).where("target.kind", "==", "organization").where("target.organizationId", "==", search.organizationId).get(),
      this.db.collection(RESTRICTIONS).where("target.kind", "==", "membership").where("target.membershipId", "==", search.membershipId).get(),
    ]);
    const userData = user.data() as { id?: string; name?: string; primaryEmail?: string } | undefined;
    const membershipData = membership.data() as { userId?: string; organizationId?: string; status?: string } | undefined;
    if (!user.exists || !userData || userData.id !== search.userId || !userData.name?.trim() || !userData.primaryEmail?.trim() || !membership.exists || !membershipData || membershipData.userId !== search.userId || membershipData.organizationId !== search.organizationId || membershipData.status !== "active" || !unrestricted(organizationRestrictions.docs) || !unrestricted(membershipRestrictions.docs)) return null;
    return Object.freeze({ userId: search.userId, displayName: userData.name, primaryEmail: userData.primaryEmail });
  }

  listActiveSavedSearches() {
    return listFirestoreRecords<SavedOpportunitySearch>(
      this.db.collection(SAVED_SEARCHES).where("status", "==", "active").limit(500),
      SAVED_SEARCHES,
    );
  }

  private saveRelation<T extends SavedOpportunitySearch | OpportunityWatch>(collection: string, bundle: OpportunityRelationBundle<T>): Promise<"created" | "replayed"> {
    const recordRef = this.db.collection(collection).doc(bundle.record.id);
    const commandRef = this.db.collection(COMMANDS).doc(bundle.command.id);
    const eventRef = this.db.collection(EVENTS).doc(bundle.event.id);
    const auditRef = this.db.collection(AUDITS).doc(bundle.audit.id);
    return this.db.runTransaction(async (transaction) => {
      const [recordSnapshot, commandSnapshot, eventSnapshot, auditSnapshot] = await transaction.getAll(recordRef, commandRef, eventRef, auditRef);
      if (commandSnapshot.exists) {
        const prior = commandSnapshot.data() as OpportunityRelationCommandReceipt;
        if (sameCommand(prior, bundle.command)) return "replayed" as const;
        throw new Error("Opportunity relation command identity collision.");
      }
      if (eventSnapshot.exists || auditSnapshot.exists) throw new Error("Opportunity relation evidence identity collision.");
      if (bundle.expectedVersion === null) {
        if (recordSnapshot.exists || bundle.record.version !== 1) throw new Error("Opportunity relation identity already exists.");
      } else {
        const current = recordSnapshot.data() as T | undefined;
        if (!recordSnapshot.exists || !current || current.organizationId !== bundle.record.organizationId || current.userId !== bundle.record.userId || current.version !== bundle.expectedVersion || bundle.record.version !== bundle.expectedVersion + 1) throw new Error("Opportunity relation changed before this command.");
      }
      await assertCurrentParticipant(transaction, this.db, bundle);
      transaction.set(recordRef, mutable(bundle.record));
      transaction.create(commandRef, immutable(bundle.command));
      transaction.create(eventRef, immutable(bundle.event));
      transaction.create(auditRef, immutable(bundle.audit));
      return "created" as const;
    });
  }

  saveSavedSearch(bundle: OpportunityRelationBundle<SavedOpportunitySearch>) {
    return this.saveRelation(SAVED_SEARCHES, bundle);
  }

  saveWatch(bundle: OpportunityRelationBundle<OpportunityWatch>) {
    return this.saveRelation(WATCHES, bundle);
  }

  saveMatch(bundle: OpportunityMatchBundle): Promise<"created" | "replayed"> {
    const matchRef = this.db.collection(MATCHES).doc(bundle.match.id);
    const alertRef = bundle.alert ? this.db.collection(ALERTS).doc(bundle.alert.id) : null;
    const savedSearchRef = this.db.collection(SAVED_SEARCHES).doc(bundle.match.savedSearchId);
    const projectionRef = this.db.collection(PROJECTIONS).doc(bundle.match.opportunityReference);
    const membershipRef = this.db.collection(MEMBERSHIPS).doc(bundle.match.membershipId);
    return this.db.runTransaction(async (transaction) => {
      const refs = alertRef ? [matchRef, alertRef, savedSearchRef, projectionRef, membershipRef] : [matchRef, savedSearchRef, projectionRef, membershipRef];
      const records = await transaction.getAll(...refs);
      const [matchSnapshot, ...rest] = records;
      if (matchSnapshot.exists) return "replayed" as const;
      const alertSnapshot = alertRef ? rest.shift() : null;
      const [savedSearchSnapshot, projectionSnapshot, membershipSnapshot] = rest;
      const currentAlert = alertSnapshot?.data() as OpportunityAlertIntent | undefined;
      if (alertSnapshot?.exists && (!currentAlert || bundle.alert?.deliveryMode !== "daily-digest")) throw new Error("Opportunity alert identity collision.");
      const savedSearch = savedSearchSnapshot?.data() as SavedOpportunitySearch | undefined;
      const projection = projectionSnapshot?.data() as ResponderOpportunityProjection | undefined;
      const membership = membershipSnapshot?.data() as { userId?: string; organizationId?: string; status?: string } | undefined;
      const geographyRefs = projection?.payload.localities.map((item) => this.db.collection(GEOGRAPHIES).doc(item.id)) ?? [];
      const [organizationRestrictions, membershipRestrictions, ...geographies] = await Promise.all([
        transaction.get(this.db.collection(RESTRICTIONS).where("target.kind", "==", "organization").where("target.organizationId", "==", bundle.match.organizationId)),
        transaction.get(this.db.collection(RESTRICTIONS).where("target.kind", "==", "membership").where("target.membershipId", "==", bundle.match.membershipId)),
        ...geographyRefs.map((reference) => transaction.get(reference)),
      ]);
      const deadline = projection?.payload.timing.responseDeadline;
      if (!savedSearchSnapshot?.exists || !savedSearch || savedSearch.status !== "active" || savedSearch.id !== bundle.match.savedSearchId || savedSearch.version !== bundle.match.savedSearchVersion || savedSearch.organizationId !== bundle.match.organizationId || savedSearch.userId !== bundle.match.userId || !projectionSnapshot?.exists || !projection || projection.mode !== "published" || !projection.publishedAt || (projection.audience !== "public" && projection.audience !== "authenticated-participants") || projection.reference !== bundle.match.opportunityReference || projection.aggregateVersion !== bundle.match.projectionVersion || projection.digest !== bundle.match.projectionDigest || !deadline || Date.parse(`${deadline}T23:59:59.999Z`) <= Date.now() || !geographyRefs.length || geographies.some((item) => !item.exists || item.get("releaseState") !== "released") || !membershipSnapshot?.exists || !membership || membership.status !== "active" || membership.userId !== bundle.match.userId || membership.organizationId !== bundle.match.organizationId || !unrestricted(organizationRestrictions.docs) || !unrestricted(membershipRestrictions.docs)) {
        throw new Error("Opportunity saved-search match authority changed.");
      }
      transaction.create(matchRef, immutable(bundle.match));
      if (alertRef && bundle.alert) {
        if (currentAlert) transaction.set(alertRef, mutable(mergeDailyAlert(currentAlert, bundle.alert)));
        else transaction.create(alertRef, mutable(bundle.alert));
      }
      return "created" as const;
    });
  }
}
