import { createHash, randomUUID } from "node:crypto";
import {
  FieldPath,
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

import {
  RFXCHANGE_FUNCTIONS_REGION,
} from "./runtime/environment.js";
import { getFunctionsFirestore } from "./runtime/firebase-admin.js";

const EVALUATIONS = "opportunityDiscoveryEvaluations";
const PROJECTIONS = "rfxOpportunityProjections";
const SEARCHES = "opportunitySavedSearches";
const MATCHES = "opportunitySavedSearchMatches";
const ALERTS = "opportunityAlertIntents";
const MEMBERSHIPS = "organizationMemberships";
const RESTRICTIONS = "accessRestrictions";
const USERS = "users";
const GEOGRAPHIES = "geographies";
const MAX_ATTEMPTS = 10;
const PAGE_SIZE = 200;
const WORK_BATCH = 25;

interface Projection {
  readonly reference: string;
  readonly aggregateVersion: number;
  readonly digest: string;
  readonly mode: string;
  readonly audience: string;
  readonly publishedAt: string | null;
  readonly requestFamilyIndexKey?: string;
  readonly capabilityIndexKeys: readonly string[];
  readonly payload: Readonly<{
    title: string;
    summary: string;
    issuerDisplayName: string;
    requestFamilyLabel: string;
    timing: Readonly<{ responseDeadline: string | null }>;
    localities: readonly Readonly<{ id: string; label: string }>[];
    requirements: readonly Readonly<{
      title: string;
      description: string;
      capabilityLabel: string | null;
      capabilityDefinition: string | null;
    }>[];
  }>;
}

interface SavedSearch {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly membershipId: string;
  readonly status: string;
  readonly version: number;
  readonly alertPolicy: "off" | "immediate" | "daily-digest";
  readonly query: Readonly<{
    text: string;
    requestFamilyKeys: readonly string[];
    capabilityIds: readonly string[];
    localityIds: readonly string[];
    deadlineWindow: "all-open" | "next-7-days" | "next-30-days";
    watched: boolean | null;
    limit: number;
  }>;
}

interface EvaluationRecord {
  readonly id: string;
  readonly reference: string;
  readonly projectionVersion: number;
  readonly projectionDigest: string;
  readonly projection: Projection;
  readonly status: string;
  readonly attemptCount: number;
  readonly claimId?: string | null;
  readonly leaseUntil?: Timestamp | null;
  readonly nextAttemptAt?: Timestamp | null;
}

function stableId(prefix: string, ...values: readonly string[]): string {
  return `${prefix}_${createHash("sha256")
    .update(values.join(":"), "utf8")
    .digest("hex")
    .slice(0, 40)}`;
}

function permitted(projection: Projection): boolean {
  return projection.mode === "published" &&
    Boolean(projection.publishedAt) &&
    (projection.audience === "public" || projection.audience === "authenticated-participants");
}

function requestFamilyKey(projection: Projection): string {
  return (projection.requestFamilyIndexKey?.trim() || projection.payload.requestFamilyLabel || "")
    .toLocaleLowerCase("en-US");
}

function terms(value: string): readonly string[] {
  return value
    .toLocaleLowerCase("en-US")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((item) => item.length >= 2);
}

function matches(projection: Projection, search: SavedSearch, now: string): boolean {
  if (!permitted(projection) || search.status !== "active") return false;
  const deadlineValue = projection.payload.timing.responseDeadline;
  const deadline = deadlineValue ? Date.parse(`${deadlineValue}T23:59:59.999Z`) : Number.NaN;
  const nowValue = Date.parse(now);
  if (!Number.isFinite(deadline) || deadline <= nowValue) return false;
  const days = (deadline - nowValue) / 86_400_000;
  if (search.query.deadlineWindow === "next-7-days" && days > 7) return false;
  if (search.query.deadlineWindow === "next-30-days" && days > 30) return false;
  if (search.query.watched === true) return false;
  if (
    search.query.localityIds.length &&
    !search.query.localityIds.some((id) =>
      projection.payload.localities.some(
        (item) => item.id.toLocaleLowerCase("en-US") === id.toLocaleLowerCase("en-US"),
      ),
    )
  ) return false;
  if (
    search.query.capabilityIds.length &&
    !search.query.capabilityIds.some((id) =>
      projection.capabilityIndexKeys.some(
        (key) => key.toLocaleLowerCase("en-US") === id.toLocaleLowerCase("en-US"),
      ),
    )
  ) return false;
  if (
    search.query.requestFamilyKeys.length &&
    !search.query.requestFamilyKeys
      .map((value) => value.toLocaleLowerCase("en-US"))
      .includes(requestFamilyKey(projection))
  ) return false;
  const wanted = terms(search.query.text);
  if (!wanted.length) return true;
  const corpus = [
    projection.payload.title,
    projection.payload.summary,
    projection.payload.issuerDisplayName,
    projection.payload.requestFamilyLabel,
    ...projection.payload.localities.map((item) => item.label),
    ...projection.payload.requirements.flatMap((item) => [
      item.title,
      item.description,
      item.capabilityLabel ?? "",
      item.capabilityDefinition ?? "",
    ]),
  ].join(" ").toLocaleLowerCase("en-US");
  return wanted.every((term) => corpus.includes(term));
}

function opportunitySummary(projection: Projection): string {
  return `${projection.payload.title} — ${projection.payload.timing.responseDeadline ?? ""} — ${projection.payload.localities.map((item) => item.label).join(", ")}`.slice(0, 1800);
}

function alertIdentity(search: SavedSearch, projection: Projection, matchId: string, now: string) {
  const windowKey = search.alertPolicy === "daily-digest" ? now.slice(0, 10) : matchId;
  const alertId = search.alertPolicy === "daily-digest"
    ? stableId("oppalert", search.organizationId, search.userId, windowKey)
    : stableId("oppalert", matchId, search.alertPolicy);
  return Object.freeze({ alertId, windowKey });
}

function emailRequest(
  search: SavedSearch,
  projection: Projection,
  recipient: Readonly<{ name: string; email: string }>,
  alertId: string,
  windowKey: string,
  now: string,
) {
  const origin = process.env.RFXCHANGE_PUBLIC_ORIGIN?.trim() || "http://localhost:3000";
  const continueUrl = `${new URL(origin).origin}/opportunities?selected=${encodeURIComponent(projection.reference)}`;
  return Object.freeze({
    id: alertId,
    purpose: "transactional" as const,
    recipient: Object.freeze({ email: recipient.email, displayName: recipient.name }),
    eventKey: "rfx.opportunity-alert",
    eventVersion: 1,
    templateKey: "rfx-opportunity-alert",
    templateVersion: 1,
    variables: Object.freeze({
      recipient_name: recipient.name,
      opportunity_count: 1,
      opportunity_summary: opportunitySummary(projection),
      continue_url: continueUrl,
    }),
    metadata: Object.freeze({
      correlationId: `opportunity-alert:${windowKey}`,
      idempotencyKey: `opportunity-alert:${alertId}`,
      requestedAt: now,
      organizationId: search.organizationId,
      userId: search.userId,
      relatedObjectType: "opportunity-alert",
      relatedObjectId: alertId,
      tags: Object.freeze(["rfx", "opportunity", search.alertPolicy]),
    }),
  });
}

function unrestricted(records: readonly FirebaseFirestore.QueryDocumentSnapshot[]): boolean {
  return records.every((record) => record.get("state") === "none");
}

async function saveMatch(
  db: Firestore,
  search: SavedSearch,
  projection: Projection,
  now: string,
): Promise<void> {
  const matchId = stableId(
    "oppmatch",
    search.id,
    String(search.version),
    projection.reference,
    String(projection.aggregateVersion),
    projection.digest,
  );
  const identity = alertIdentity(search, projection, matchId, now);
  const matchRef = db.collection(MATCHES).doc(matchId);
  const searchRef = db.collection(SEARCHES).doc(search.id);
  const projectionRef = db.collection(PROJECTIONS).doc(projection.reference);
  const membershipRef = db.collection(MEMBERSHIPS).doc(search.membershipId);
  const userRef = db.collection(USERS).doc(search.userId);
  const alertRef = search.alertPolicy === "off"
    ? null
    : db.collection(ALERTS).doc(identity.alertId);

  await db.runTransaction(async (transaction) => {
    const matchSnapshot = await transaction.get(matchRef);
    if (matchSnapshot.exists) return;

    const [
      savedSearchSnapshot,
      projectionSnapshot,
      membershipSnapshot,
      userSnapshot,
    ] = await transaction.getAll(
      searchRef,
      projectionRef,
      membershipRef,
      userRef,
    );
    const currentSearch = savedSearchSnapshot.data() as SavedSearch | undefined;
    const currentProjection = projectionSnapshot.data() as Projection | undefined;
    const membership = membershipSnapshot.data() as
      | { userId?: string; organizationId?: string; status?: string }
      | undefined;
    const user = userSnapshot.data() as
      | { id?: string; name?: string; primaryEmail?: string }
      | undefined;

    const geographyRefs = currentProjection?.payload.localities.map(
      (item) => db.collection(GEOGRAPHIES).doc(item.id),
    ) ?? [];
    const [organizationRestrictions, membershipRestrictions, ...geographies] = await Promise.all([
      transaction.get(
        db.collection(RESTRICTIONS)
          .where("target.kind", "==", "organization")
          .where("target.organizationId", "==", search.organizationId),
      ),
      transaction.get(
        db.collection(RESTRICTIONS)
          .where("target.kind", "==", "membership")
          .where("target.membershipId", "==", search.membershipId),
      ),
      ...geographyRefs.map((reference) => transaction.get(reference)),
    ]);
    const alertSnapshot = alertRef ? await transaction.get(alertRef) : null;

    if (
      !savedSearchSnapshot.exists ||
      !currentSearch ||
      currentSearch.id !== search.id ||
      currentSearch.organizationId !== search.organizationId ||
      currentSearch.userId !== search.userId ||
      currentSearch.membershipId !== search.membershipId ||
      currentSearch.version !== search.version ||
      currentSearch.status !== "active" ||
      !projectionSnapshot.exists ||
      !currentProjection ||
      currentProjection.reference !== projection.reference ||
      currentProjection.aggregateVersion !== projection.aggregateVersion ||
      currentProjection.digest !== projection.digest ||
      !matches(currentProjection, currentSearch, now) ||
      !membershipSnapshot.exists ||
      !membership ||
      membership.userId !== search.userId ||
      membership.organizationId !== search.organizationId ||
      membership.status !== "active" ||
      !unrestricted(organizationRestrictions.docs) ||
      !unrestricted(membershipRestrictions.docs) ||
      geographyRefs.length === 0 ||
      geographies.some((geography) =>
        !geography.exists || geography.get("releaseState") !== "released"
      )
    ) {
      throw new Error("Opportunity saved-search match authority changed.");
    }

    let request: ReturnType<typeof emailRequest> | null = null;
    if (currentSearch.alertPolicy !== "off") {
      if (
        !userSnapshot.exists ||
        !user ||
        user.id !== currentSearch.userId ||
        !user.name?.trim() ||
        !user.primaryEmail?.trim()
      ) {
        request = null;
      } else {
        request = emailRequest(
          currentSearch,
          currentProjection,
          Object.freeze({ name: user.name.trim(), email: user.primaryEmail.trim() }),
          identity.alertId,
          identity.windowKey,
          now,
        );
      }
    }

    transaction.create(matchRef, {
      schemaVersion: 1,
      id: matchId,
      organizationId: currentSearch.organizationId,
      userId: currentSearch.userId,
      membershipId: currentSearch.membershipId,
      savedSearchId: currentSearch.id,
      savedSearchVersion: currentSearch.version,
      opportunityReference: currentProjection.reference,
      projectionVersion: currentProjection.aggregateVersion,
      projectionDigest: currentProjection.digest,
      evaluationPolicyVersion: 1,
      matchedAt: now,
      persistedAt: FieldValue.serverTimestamp(),
    });

    if (!alertRef || !request) return;
    const existing = alertSnapshot?.data() as Record<string, unknown> | undefined;
    if (alertSnapshot?.exists) {
      const existingRequest = existing?.request as
        | { metadata?: { idempotencyKey?: string }; variables?: Record<string, unknown> }
        | undefined;
      if (
        currentSearch.alertPolicy !== "daily-digest" ||
        existing?.status !== "queued" ||
        existing?.deliveryMode !== "daily-digest" ||
        existing?.windowKey !== identity.windowKey ||
        existingRequest?.metadata?.idempotencyKey !== request.metadata.idempotencyKey
      ) {
        throw new Error("Opportunity alert identity collision.");
      }
      const references = [...new Set([
        ...((existing.opportunityReferences as string[] | undefined) ?? []),
        currentProjection.reference,
      ])];
      const matchIds = [...new Set([
        ...((existing.matchEventIds as string[] | undefined) ?? []),
        matchId,
      ])];
      const savedSearchIds = [...new Set([
        ...((existing.savedSearchIds as string[] | undefined) ?? []),
        currentSearch.id,
      ])];
      const existingSummary = String(existingRequest?.variables?.opportunity_summary ?? "");
      transaction.set(alertRef, {
        ...existing,
        userId: currentSearch.userId,
        membershipId: currentSearch.membershipId,
        matchEventIds: matchIds,
        opportunityReferences: references,
        savedSearchIds,
        request: {
          ...request,
          variables: {
            ...request.variables,
            opportunity_count: references.length,
            opportunity_summary: `${existingSummary}\n${opportunitySummary(currentProjection)}`
              .trim()
              .slice(0, 1800),
          },
        },
        updatedAt: now,
        persistenceUpdatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    transaction.create(alertRef, {
      schemaVersion: 1,
      id: identity.alertId,
      organizationId: currentSearch.organizationId,
      userId: currentSearch.userId,
      membershipId: currentSearch.membershipId,
      matchEventIds: [matchId],
      opportunityReferences: [currentProjection.reference],
      savedSearchIds: [currentSearch.id],
      deliveryMode: currentSearch.alertPolicy,
      windowKey: identity.windowKey,
      request,
      status: "queued",
      attemptCount: 0,
      createdAt: now,
      updatedAt: now,
      persistedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function claimEvaluation(
  db: Firestore,
  id: string,
): Promise<Readonly<{ record: EvaluationRecord; claimId: string }> | null> {
  const ref = db.collection(EVALUATIONS).doc(id);
  const claimId = randomUUID();
  const now = Timestamp.now();
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return null;
    const record = snapshot.data() as EvaluationRecord;
    if (record.status !== "queued") return null;
    if (record.nextAttemptAt && record.nextAttemptAt.toMillis() > now.toMillis()) return null;
    if (record.leaseUntil && record.leaseUntil.toMillis() > now.toMillis()) return null;
    transaction.set(ref, {
      ...record,
      claimId,
      leaseUntil: Timestamp.fromMillis(now.toMillis() + 5 * 60_000),
      attemptCount: (record.attemptCount ?? 0) + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Object.freeze({ record, claimId });
  });
}

async function completeEvaluation(
  db: Firestore,
  id: string,
  claimId: string,
  error: unknown = null,
): Promise<void> {
  const ref = db.collection(EVALUATIONS).doc(id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    const record = snapshot.data() as EvaluationRecord;
    if (record.claimId !== claimId) return;
    if (!error) {
      transaction.set(ref, {
        ...record,
        status: "completed",
        claimId: null,
        leaseUntil: null,
        nextAttemptAt: null,
        lastErrorCode: null,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }
    const attemptCount = record.attemptCount ?? 1;
    const delaySeconds = Math.min(3600, 30 * 2 ** Math.min(attemptCount - 1, 7));
    transaction.set(ref, {
      ...record,
      status: attemptCount >= MAX_ATTEMPTS ? "terminal-failure" : "queued",
      claimId: null,
      leaseUntil: null,
      nextAttemptAt: attemptCount >= MAX_ATTEMPTS
        ? null
        : Timestamp.fromMillis(Date.now() + delaySeconds * 1000),
      lastErrorCode: (error instanceof Error ? error.name : "unknown")
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .slice(0, 96),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function processAllActiveSearches(
  db: Firestore,
  projection: Projection,
  now: string,
): Promise<void> {
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  while (true) {
    let query: FirebaseFirestore.Query = db.collection(SEARCHES)
      .where("status", "==", "active")
      .orderBy(FieldPath.documentId())
      .limit(PAGE_SIZE);
    if (cursor) query = query.startAfter(cursor);
    const page = await query.get();
    if (page.empty) break;
    for (const document of page.docs) {
      const search = document.data() as SavedSearch;
      if (search.status !== "active" || !matches(projection, search, now)) continue;
      await saveMatch(db, search, projection, now);
    }
    cursor = page.docs.at(-1) ?? null;
    if (page.size < PAGE_SIZE) break;
  }
}

async function processEvaluation(db: Firestore, id: string): Promise<boolean> {
  const claimed = await claimEvaluation(db, id);
  if (!claimed) return false;
  try {
    const projection = claimed.record.projection;
    const currentSnapshot = await db.collection(PROJECTIONS).doc(projection.reference).get();
    const current = currentSnapshot.data() as Projection | undefined;
    if (
      !currentSnapshot.exists ||
      !current ||
      projection.reference !== claimed.record.reference ||
      projection.aggregateVersion !== claimed.record.projectionVersion ||
      projection.digest !== claimed.record.projectionDigest ||
      current.aggregateVersion !== projection.aggregateVersion ||
      current.digest !== projection.digest ||
      !permitted(current)
    ) {
      throw new Error("Opportunity projection changed before durable evaluation.");
    }
    await processAllActiveSearches(db, current, new Date().toISOString());
    await completeEvaluation(db, id, claimed.claimId);
  } catch (error) {
    await completeEvaluation(db, id, claimed.claimId, error);
  }
  return true;
}

/** Durable retry consumer for publication-triggered discovery evaluation. */
export const scheduledOpportunityDiscoveryEvaluation = onSchedule(
  {
    region: RFXCHANGE_FUNCTIONS_REGION,
    schedule: "every 5 minutes",
    timeZone: "UTC",
    retryCount: 3,
    minBackoffSeconds: 30,
    maxBackoffSeconds: 300,
  },
  async () => {
    const db = getFunctionsFirestore();
    let cursor: FirebaseFirestore.QueryDocumentSnapshot | null = null;
    let claimedCount = 0;
    while (claimedCount < WORK_BATCH) {
      let query: FirebaseFirestore.Query = db.collection(EVALUATIONS)
        .where("status", "==", "queued")
        .orderBy(FieldPath.documentId())
        .limit(PAGE_SIZE);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      if (page.empty) break;
      for (const document of page.docs) {
        if (await processEvaluation(db, document.id)) {
          claimedCount += 1;
          if (claimedCount >= WORK_BATCH) break;
        }
      }
      cursor = page.docs.at(-1) ?? null;
      if (page.size < PAGE_SIZE) break;
    }
  },
);