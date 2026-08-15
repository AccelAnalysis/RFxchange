import { randomUUID } from "node:crypto";
import {
  FieldPath,
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

import {
  createBackgroundJobRequest,
  type BackgroundJobExecutionResult,
} from "./application/background-jobs.js";
import {
  createTransactionalEmailDeliveryIntent,
  executeReliableTransactionalEmailJob,
} from "./application/transactional-email-delivery-audit.js";
import {
  backgroundJobPayloadFingerprint,
} from "./runtime/background-job-identifiers.js";
import {
  functionsRuntimeContextFromEnvironment,
  RFXCHANGE_FUNCTIONS_REGION,
} from "./runtime/environment.js";
import { getFunctionsFirestore } from "./runtime/firebase-admin.js";
import { FirestoreBackgroundJobStore } from "./runtime/firestore-background-job-store.js";
import { FirestoreTransactionalEmailDeliveryAuditStore } from "./runtime/firestore-transactional-email-delivery-audit-store.js";

const ALERTS = "opportunityAlertIntents";
const SEARCHES = "opportunitySavedSearches";
const PROJECTIONS = "rfxOpportunityProjections";
const MEMBERSHIPS = "organizationMemberships";
const RESTRICTIONS = "accessRestrictions";
const USERS = "users";
const GEOGRAPHIES = "geographies";
const PROVIDER_KEY = "microsoft-graph";
const ALERT_EVENT = "rfx.opportunity-alert";
const ALERT_TEMPLATE = "rfx-opportunity-alert";
const PAGE_SIZE = 200;
const WORK_BATCH = 25;

interface TransactionalEmailRequest {
  readonly id: string;
  readonly purpose: "transactional" | "administrative";
  readonly recipient: Readonly<{ email: string; displayName: string | null }>;
  readonly eventKey: string;
  readonly eventVersion: number;
  readonly templateKey: string;
  readonly templateVersion: number;
  readonly variables: Readonly<Record<string, string | number | boolean | null>>;
  readonly metadata: Readonly<{
    correlationId: string;
    idempotencyKey: string;
    requestedAt: string;
    organizationId: string | null;
    userId: string | null;
    relatedObjectType: string | null;
    relatedObjectId: string | null;
    tags: readonly string[];
  }>;
}

interface OpportunityAlertIntent {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly membershipId: string;
  readonly savedSearchIds: readonly string[];
  readonly opportunityReferences: readonly string[];
  readonly deliveryMode: "immediate" | "daily-digest";
  readonly windowKey: string;
  readonly request: TransactionalEmailRequest;
  readonly status: string;
  readonly attemptCount: number;
  readonly deliveryClaimId?: string | null;
  readonly deliveryLeaseUntil?: Timestamp | null;
  readonly nextAttemptAt?: Timestamp | null;
}

interface SavedSearch {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly membershipId: string;
  readonly status: string;
}

interface Projection {
  readonly reference: string;
  readonly mode: string;
  readonly audience: string;
  readonly publishedAt: string | null;
  readonly payload: Readonly<{
    title: string;
    timing: Readonly<{ responseDeadline: string | null }>;
    localities: readonly Readonly<{ id: string; label: string }>[];
  }>;
}

class ProviderFailure extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly deliveryOutcome: "known-failure" | "unknown";
  readonly providerKey = PROVIDER_KEY;
  readonly externalReference: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(input: Readonly<{
    code: string;
    message: string;
    retryable: boolean;
    deliveryOutcome: "known-failure" | "unknown";
    externalReference?: string | null;
    retryAfterSeconds?: number | null;
  }>) {
    super(input.message);
    this.name = "ProviderFailure";
    this.code = input.code;
    this.retryable = input.retryable;
    this.deliveryOutcome = input.deliveryOutcome;
    this.externalReference = input.externalReference ?? null;
    this.retryAfterSeconds = input.retryAfterSeconds ?? null;
  }
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new ProviderFailure({
      code: "microsoft-email-configuration-invalid",
      message: `${name} is required.`,
      retryable: false,
      deliveryOutcome: "known-failure",
    });
  }
  return value;
}

function responseReference(response: Response): string | null {
  return (
    response.headers.get("request-id") ??
    response.headers.get("x-ms-request-id") ??
    response.headers.get("client-request-id")
  )?.trim() || null;
}

function retryAfter(response: Response): number | null {
  const raw = response.headers.get("retry-after")?.trim();
  if (!raw) return null;
  const seconds = Number(raw);
  return Number.isInteger(seconds) && seconds >= 0 && seconds <= 86_400
    ? seconds
    : null;
}

function retryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function renderedAlert(request: TransactionalEmailRequest): Readonly<{ subject: string; text: string }> {
  if (
    request.eventKey !== ALERT_EVENT ||
    request.eventVersion !== 1 ||
    request.templateKey !== ALERT_TEMPLATE ||
    request.templateVersion !== 1
  ) {
    throw new ProviderFailure({
      code: "opportunity-alert-template-invalid",
      message: "Opportunity alert template identity is unsupported.",
      retryable: false,
      deliveryOutcome: "known-failure",
    });
  }
  const recipient = String(request.variables.recipient_name ?? "").trim();
  const count = Number(request.variables.opportunity_count ?? 0);
  const summary = String(request.variables.opportunity_summary ?? "").trim();
  const continueUrl = String(request.variables.continue_url ?? "").trim();
  if (!recipient || !Number.isFinite(count) || count < 1 || !summary || !continueUrl) {
    throw new ProviderFailure({
      code: "opportunity-alert-template-variables-invalid",
      message: "Opportunity alert template variables are incomplete.",
      retryable: false,
      deliveryOutcome: "known-failure",
    });
  }
  return Object.freeze({
    subject: `${count} RFx opportunity update`,
    text: `Hello ${recipient},\n\nA saved RFx search found ${count} currently permitted opportunity update(s):\n\n${summary}\n\nReview the current details securely: ${continueUrl}\n\nA saved-search match is not qualification, eligibility, endorsement, or an award prediction.`,
  });
}

async function graphToken(): Promise<string> {
  const tenantId = requiredEnvironment("RFXCHANGE_MICROSOFT_TENANT_ID");
  const clientId = requiredEnvironment("RFXCHANGE_MICROSOFT_CLIENT_ID");
  const clientSecret = requiredEnvironment("RFXCHANGE_MICROSOFT_CLIENT_SECRET");
  let response: Response;
  try {
    response = await fetch(
      `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "client_credentials",
          scope: "https://graph.microsoft.com/.default",
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    throw new ProviderFailure({
      code: "microsoft-identity-unavailable",
      message: "Microsoft identity is unavailable.",
      retryable: true,
      deliveryOutcome: "known-failure",
    });
  }
  if (!response.ok) {
    throw new ProviderFailure({
      code: `microsoft-identity-http-${response.status}`,
      message: "Microsoft identity rejected token acquisition.",
      retryable: retryableStatus(response.status),
      deliveryOutcome: "known-failure",
      externalReference: responseReference(response),
      retryAfterSeconds: retryAfter(response),
    });
  }
  const body = await response.json() as { access_token?: unknown };
  if (typeof body.access_token !== "string" || !body.access_token.trim()) {
    throw new ProviderFailure({
      code: "microsoft-identity-response-invalid",
      message: "Microsoft identity returned an invalid token response.",
      retryable: true,
      deliveryOutcome: "known-failure",
    });
  }
  return body.access_token;
}

async function deliverOpportunityAlert(request: TransactionalEmailRequest) {
  const rendered = renderedAlert(request);
  const token = await graphToken();
  const sender = requiredEnvironment("RFXCHANGE_MICROSOFT_APPROVED_SENDER");
  let response: Response;
  try {
    response = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "client-request-id": request.metadata.correlationId,
        },
        body: JSON.stringify({
          message: {
            subject: rendered.subject,
            body: { contentType: "Text", content: rendered.text },
            toRecipients: [{
              emailAddress: {
                address: request.recipient.email,
                ...(request.recipient.displayName
                  ? { name: request.recipient.displayName }
                  : {}),
              },
            }],
            internetMessageHeaders: [
              { name: "x-rfxchange-message-id", value: request.id },
              { name: "x-rfxchange-correlation-id", value: request.metadata.correlationId },
            ],
          },
          saveToSentItems: true,
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    throw new ProviderFailure({
      code: "microsoft-graph-unavailable",
      message: "Microsoft Graph delivery returned an unknown outcome.",
      retryable: false,
      deliveryOutcome: "unknown",
    });
  }
  const externalReference = responseReference(response);
  if (response.status !== 202) {
    throw new ProviderFailure({
      code: `microsoft-graph-http-${response.status}`,
      message: "Microsoft Graph rejected email delivery.",
      retryable: retryableStatus(response.status),
      deliveryOutcome: "known-failure",
      externalReference,
      retryAfterSeconds: retryAfter(response),
    });
  }
  return Object.freeze({
    status: "accepted" as const,
    providerKey: PROVIDER_KEY,
    externalReference,
    diagnosticCode: null,
  });
}

function due(intent: OpportunityAlertIntent, now: Timestamp): boolean {
  if (intent.status !== "queued") return false;
  if (intent.deliveryMode === "daily-digest") {
    const today = now.toDate().toISOString().slice(0, 10);
    if (intent.windowKey >= today) return false;
  }
  if (intent.nextAttemptAt && intent.nextAttemptAt.toMillis() > now.toMillis()) return false;
  if (intent.deliveryLeaseUntil && intent.deliveryLeaseUntil.toMillis() > now.toMillis()) return false;
  return true;
}

function projectionOpen(projection: Projection, now: Timestamp): boolean {
  if (
    projection.mode !== "published" ||
    !projection.publishedAt ||
    (projection.audience !== "public" && projection.audience !== "authenticated-participants")
  ) return false;
  const deadline = projection.payload.timing.responseDeadline;
  return Boolean(
    deadline && Date.parse(`${deadline}T23:59:59.999Z`) > now.toMillis(),
  );
}

function projectionSummary(projection: Projection): string {
  return `${projection.payload.title} — ${projection.payload.timing.responseDeadline ?? ""} — ${projection.payload.localities.map((item) => item.label).join(", ")}`;
}

function unrestricted(records: readonly FirebaseFirestore.QueryDocumentSnapshot[]): boolean {
  return records.every((record) => record.get("state") === "none");
}

async function claimAlert(
  db: Firestore,
  id: string,
  now: Timestamp,
): Promise<Readonly<{ intent: OpportunityAlertIntent; claimId: string }> | null> {
  const ref = db.collection(ALERTS).doc(id);
  const claimId = randomUUID();
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return null;
    const intent = snapshot.data() as OpportunityAlertIntent;
    if (!due(intent, now)) return null;

    const membershipRef = db.collection(MEMBERSHIPS).doc(intent.membershipId);
    const userRef = db.collection(USERS).doc(intent.userId);
    const searchRefs = intent.savedSearchIds.map((savedSearchId) =>
      db.collection(SEARCHES).doc(savedSearchId),
    );
    const projectionRefs = intent.opportunityReferences.map((reference) =>
      db.collection(PROJECTIONS).doc(reference),
    );
    if (!searchRefs.length || !projectionRefs.length) {
      transaction.set(ref, {
        ...intent,
        status: "suppressed",
        suppressionReason: "authority-changed",
        updatedAt: FieldValue.serverTimestamp(),
      });
      return null;
    }

    const records = await transaction.getAll(
      membershipRef,
      userRef,
      ...searchRefs,
      ...projectionRefs,
    );
    const membershipSnapshot = records[0];
    const userSnapshot = records[1];
    const searchSnapshots = records.slice(2, 2 + searchRefs.length);
    const projectionSnapshots = records.slice(2 + searchRefs.length);
    const membership = membershipSnapshot?.data() as
      | { userId?: string; organizationId?: string; status?: string }
      | undefined;
    const user = userSnapshot?.data() as
      | { id?: string; name?: string; primaryEmail?: string }
      | undefined;
    const searches = searchSnapshots.map((item) => item.data() as SavedSearch | undefined);
    const projections = projectionSnapshots.map((item) => item.data() as Projection | undefined);
    const geographyRefs = projections.flatMap((projection) =>
      projection?.payload.localities.map((locality) =>
        db.collection(GEOGRAPHIES).doc(locality.id),
      ) ?? [],
    );
    const [organizationRestrictions, membershipRestrictions, ...geographies] = await Promise.all([
      transaction.get(
        db.collection(RESTRICTIONS)
          .where("target.kind", "==", "organization")
          .where("target.organizationId", "==", intent.organizationId),
      ),
      transaction.get(
        db.collection(RESTRICTIONS)
          .where("target.kind", "==", "membership")
          .where("target.membershipId", "==", intent.membershipId),
      ),
      ...geographyRefs.map((reference) => transaction.get(reference)),
    ]);

    const currentSummary = projections
      .filter((projection): projection is Projection => Boolean(projection))
      .map(projectionSummary)
      .join("\n")
      .slice(0, 1800);
    const capturedSummary = String(intent.request.variables.opportunity_summary ?? "").trim();
    const capturedCount = Number(intent.request.variables.opportunity_count ?? 0);
    const authorityValid = Boolean(
      membershipSnapshot?.exists &&
      membership &&
      membership.userId === intent.userId &&
      membership.organizationId === intent.organizationId &&
      membership.status === "active" &&
      userSnapshot?.exists &&
      user &&
      user.id === intent.userId &&
      user.name?.trim() &&
      user.primaryEmail?.trim() &&
      user.primaryEmail.trim() === intent.request.recipient.email.trim() &&
      (intent.request.recipient.displayName === null ||
        user.name.trim() === intent.request.recipient.displayName.trim()) &&
      searchSnapshots.every((item) => item.exists) &&
      searches.every((search) =>
        Boolean(
          search &&
          search.organizationId === intent.organizationId &&
          search.userId === intent.userId &&
          search.membershipId === intent.membershipId &&
          search.status === "active",
        )
      ) &&
      projectionSnapshots.every((item) => item.exists) &&
      projections.every((projection) => Boolean(projection && projectionOpen(projection, now))) &&
      projections.length === intent.opportunityReferences.length &&
      geographyRefs.length > 0 &&
      geographies.every((geography) =>
        geography.exists && geography.get("releaseState") === "released"
      ) &&
      unrestricted(organizationRestrictions.docs) &&
      unrestricted(membershipRestrictions.docs) &&
      capturedCount === projections.length &&
      capturedSummary === currentSummary
    );

    if (!authorityValid) {
      transaction.set(ref, {
        ...intent,
        status: "suppressed",
        suppressionReason: "authority-changed",
        deliveryClaimId: null,
        deliveryLeaseUntil: null,
        nextAttemptAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return null;
    }

    transaction.set(ref, {
      ...intent,
      deliveryClaimId: claimId,
      deliveryLeaseUntil: Timestamp.fromMillis(now.toMillis() + 5 * 60_000),
      attemptCount: (intent.attemptCount ?? 0) + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return Object.freeze({ intent, claimId });
  });
}

async function completeAlert(
  db: Firestore,
  id: string,
  claimId: string,
  result: BackgroundJobExecutionResult,
): Promise<void> {
  const ref = db.collection(ALERTS).doc(id);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists) return;
    const current = snapshot.data() as OpportunityAlertIntent;
    if (current.deliveryClaimId !== claimId) return;
    if (result.outcome === "succeeded" || result.outcome === "duplicate") {
      transaction.set(ref, {
        ...current,
        status: "delivered",
        deliveryClaimId: null,
        deliveryLeaseUntil: null,
        nextAttemptAt: null,
        deliveredAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }
    if (result.outcome === "terminal-failure") {
      transaction.set(ref, {
        ...current,
        status: "terminal-failure",
        deliveryClaimId: null,
        deliveryLeaseUntil: null,
        nextAttemptAt: null,
        lastErrorCode: result.errorCode,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }
    const nextAttemptAt = result.outcome === "retry-scheduled" || result.outcome === "retry-not-ready"
      ? Timestamp.fromDate(new Date(result.nextAttemptAt))
      : Timestamp.fromMillis(Date.now() + 60_000);
    transaction.set(ref, {
      ...current,
      status: "queued",
      deliveryClaimId: null,
      deliveryLeaseUntil: null,
      nextAttemptAt,
      ...(result.outcome === "retry-scheduled" ? { lastErrorCode: result.errorCode } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

async function processAlert(db: Firestore, id: string): Promise<boolean> {
  const runtime = functionsRuntimeContextFromEnvironment();
  const now = Timestamp.now();
  const claimed = await claimAlert(db, id, now);
  if (!claimed) return false;
  const request = claimed.intent.request;
  const payloadFingerprint = backgroundJobPayloadFingerprint(request);
  const jobRequest = createBackgroundJobRequest({
    jobName: "communications.transactional-email.opportunity-alert",
    category: "notification",
    idempotencyKey: request.metadata.idempotencyKey,
    payloadFingerprint,
    correlationId: request.metadata.correlationId,
    environment: runtime.environment,
    projectId: runtime.projectId,
    requestedAt: request.metadata.requestedAt,
    maxAttempts: 5,
    retryBackoffSeconds: 60,
    leaseSeconds: 300,
  });
  const deliveryIntent = createTransactionalEmailDeliveryIntent({
    messageId: request.id,
    idempotencyKey: request.metadata.idempotencyKey,
    payloadFingerprint,
    purpose: request.purpose,
    eventKey: request.eventKey,
    eventVersion: request.eventVersion,
    originatingEventId: request.metadata.relatedObjectId ?? request.id,
    templateKey: request.templateKey,
    templateVersion: request.templateVersion,
    recipientEmail: request.recipient.email,
    correlationId: request.metadata.correlationId,
    environment: runtime.environment,
    projectId: runtime.projectId,
    organizationId: request.metadata.organizationId,
    userId: request.metadata.userId,
    relatedObjectType: request.metadata.relatedObjectType,
    relatedObjectId: request.metadata.relatedObjectId,
    requestedAt: request.metadata.requestedAt,
  });
  const result = await executeReliableTransactionalEmailJob({
    intent: deliveryIntent,
    request: jobRequest,
    runtime,
    backgroundJobStore: new FirestoreBackgroundJobStore(db),
    auditStore: new FirestoreTransactionalEmailDeliveryAuditStore(db),
    deliver: () => deliverOpportunityAlert(request),
    now: new Date().toISOString(),
  });
  await completeAlert(db, id, claimed.claimId, result);
  return true;
}

/**
 * DSC-006 consumes authoritative opportunityAlertIntents through COMMS-003/004/005
 * and INF-007. Due records are selected across deterministic pages before the
 * worker batch cap is applied, preventing not-yet-due digests or leased retries
 * from starving later immediate alerts.
 */
export const scheduledOpportunityAlertDelivery = onSchedule(
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
      let query: FirebaseFirestore.Query = db.collection(ALERTS)
        .where("status", "==", "queued")
        .orderBy(FieldPath.documentId())
        .limit(PAGE_SIZE);
      if (cursor) query = query.startAfter(cursor);
      const page = await query.get();
      if (page.empty) break;
      for (const document of page.docs) {
        if (await processAlert(db, document.id)) {
          claimedCount += 1;
          if (claimedCount >= WORK_BATCH) break;
        }
      }
      cursor = page.docs.at(-1) ?? null;
      if (page.size < PAGE_SIZE) break;
    }
  },
);