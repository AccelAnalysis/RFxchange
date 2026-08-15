import { createHash, randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
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
  if (!permitted(projection)) return false;
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

function emailRequest(
  search: SavedSearch,
  projection: Projection,
  recipient: Readonly<{ name: string; email: string }>,
  matchId: string,
  now: string,
) {
  const windowKey = search.alertPolicy === "daily-digest" ? now.slice(0, 10) : matchId;
  const alertId = search.alertPolicy === "daily-digest"
    ? stableId("oppalert", search.organizationId, search.userId, windowKey)
    : stableId("oppalert", matchId, search.alertPolicy);
  const origin = process.env.RFXCHANGE_PUBLIC_ORIGIN?.trim() || "http://localhost:3000";
  const continueUrl = `${new URL(origin).origin}/opportunities?selected=${encodeURIComponent(projection.reference)}`;
  return Object.freeze({
    alertId,
    windowKey,
    request: Object.freeze({
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
    }),
  });
}

async function currentRecipient(
  db: Firestore,
  search: SavedSearch,
): Promise<Readonly<{ name: string; email: string }> | null> {
  const [user, membership, organizationRestrictions, membershipRestrictions] = await Promise.all([
    db.collection(USERS).doc(search.userId).get(),
    db.collection(MEMBERSHIPS).doc(search.membershipId).get(),
    db.collection(RESTRICTIONS)
      .where("target.kind", "==", "organization")
      .where("target.organizationId", "==", search.organizationId)
      .get(),
    db.collection(RESTRICTIONS)
      .where("target.kind", "==", "membership")
      .where("target.membershipId", "==", search.membershipId)
      .get(),
  ]);
  const userData = user.data() as { id?: string; name?: string; primaryEmail?: string } | undefined;
  const membershipData = membership.data() as { userId?: string; organizationId?: string; status?: string } | undefined;
  const restricted = [...organizationRestrictions.docs, ...membershipRestrictions.docs]
    .some((record) => record.get("state") !== "none");
  if (
    !user.exists ||
    !userData ||
    userData.id !== search.userId ||
    !userData.name?.trim() ||
    !userData.primaryEmail?.trim() ||
    !membership.exists ||
    !membershipData ||
    membershipData.userId !== search.userId ||
    membershipData.organizationId !== search.organizationId ||
    membershipData.status !== "active" ||
    restricted
  ) return null;
  return Object.freeze({ name: userData.name.trim(), email: userData.primaryEmail.trim() });
}

async function projectionStillCurrent(db: Firestore, projection: Projection): Promise<boolean> {
  const snapshot = await db.collection(PROJECTIONS).doc(projection.reference).get();
  if (!snapshot.exists) return false;
  const current = snapshot.data() as Projection;
  if (
    current.aggregateVersion !== projection.aggregateVersion ||
    current.digest !== projection.digest ||
    !permitted(current)
  ) return false;
  const geographies = await db.getAll(
    ...projection.payload.localities.map((item) => db.collection(GEOGRAPHIES).doc(item.id)),
  );
  return geographies.length > 0 && geographies.every(
    (geography) => geography.exists && geography.get("releaseState") === "released",
  );
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
  const matchRef = db.collection(MATCHES).doc(matchId);
  if ((await matchRef.get()).exists) return;
  const recipient = search.alertPolicy === "off" ? null : await currentRecipient(db, search);
  const delivery = recipient ? emailRequest(search, projection, recipient, matchId, now) : null;
  const alertRef = delivery ? db.collection(ALERTS).doc(delivery.alertId) : null;
  await db.runTransaction(async (transaction) => {
    const refs = alertRef ? [matchRef, alertRef] : [matchRef];
    const records = await transaction.getAll(...refs);
    if (records[0]?.exists) return;
    const match = Object.freeze({
      schemaVersion: 1,
      id: matchId,
      organizationId: search.organizationId,
      userId: search.userId,
      membershipId: search.membershipId,
      savedSearchId: search.id,
      savedSearchVersion: search.version,
      opportunityReference: projection.reference,
      projectionVersion: projection.aggregateVersion,
      projectionDigest: projection.digest,
      evaluationPolicyVersion: 1,
      matchedAt: now,
    });
    transaction.create(matchRef, { ...match, persistedAt: FieldValue.serverTimestamp() });
    if (!alertRef || !delivery) return;
    const existing = records[1]?.data() as Record<string, unknown> | undefined;
    if (records[1]?.exists) {
      if (
        search.alertPolicy !== "daily-digest" ||
        existing?.status !== "queued" ||
        existing?.windowKey !== delivery.windowKey
      ) {
        throw new Error("Opportunity alert identity collision.");
      }
      const references = [...new Set([
        ...((existing.opportunityReferences as string[] | undefined) ?? []),
        projection.reference,
      ])];
      const matchIds = [...new Set([
        ...((existing.matchEventIds as string[] | undefined) ?? []),
        matchId,
      ])];
      const savedSearchIds = [...new Set([
        ...((existing.savedSearchIds as string[] | undefined) ?? []),
        search.id,
      ])];
      const existingRequest = existing.request as { variables?: Record<string, unknown> } | undefined;
      const existingSummary = String(existingRequest?.variables?.opportunity_summary ?? "");
      transaction.set(alertRef, {
        ...existing,
        matchEventIds: matchIds,
        opportunityReferences: references,
        savedSearchIds,
        request: {
          ...(existing.request as object),
          variables: {
            ...(existingRequest?.variables ?? {}),
            opportunity_count: references.length,
            opportunity_summary: `${existingSummary}\n${opportunitySummary(projection)}`.trim().slice(0, 1800),
          },
        },
        updatedAt: now,
        persistenceUpdatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }
    transaction.create(alertRef, {
      schemaVersion: 1,
      id: delivery.alertId,
      organizationId: search.organizationId,
      userId: search.userId,
      membershipId: search.membershipId,
      matchEventIds: [matchId],
      opportunityReferences: [projection.reference],
      savedSearchIds: [search.id],
      deliveryMode: search.alertPolicy,
      windowKey: delivery.windowKey,
      request: delivery.request,
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

async function processEvaluation(db: Firestore, id: string): Promise<void> {
  const claimed = await claimEvaluation(db, id);
  if (!claimed) return;
  try {
    const projection = claimed.record.projection;
    if (
      projection.reference !== claimed.record.reference ||
      projection.aggregateVersion !== claimed.record.projectionVersion ||
      projection.digest !== claimed.record.projectionDigest ||
      !(await projectionStillCurrent(db, projection))
    ) {
      throw new Error("Opportunity projection changed before durable evaluation.");
    }
    const searches = await db.collection(SEARCHES).where("status", "==", "active").limit(500).get();
    const now = new Date().toISOString();
    for (const document of searches.docs) {
      const search = document.data() as SavedSearch;
      if (search.status !== "active" || !matches(projection, search, now)) continue;
      await saveMatch(db, search, projection, now);
    }
    await completeEvaluation(db, id, claimed.claimId);
  } catch (error) {
    await completeEvaluation(db, id, claimed.claimId, error);
  }
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
    const snapshot = await db
      .collection(EVALUATIONS)
      .where("status", "==", "queued")
      .limit(25)
      .get();
    for (const document of snapshot.docs) {
      await processEvaluation(db, document.id);
    }
  },
);
