import { createHash, randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { Auth } from "firebase-admin/auth";
import { createTransactionalEmailRequest } from "../../domain/communications/transactional-email.ts";
import { chooseLifecycleJourney, communicationSendDecision, DEFAULT_LIFECYCLE_POLICY, validateLifecyclePolicy, type CommunicationPreferences, type LifecycleState } from "../../domain/communications/lifecycle.ts";
import { TransactionalEmailProviderError } from "../../application/communications/transactional-email.ts";
import { lifecycleContent } from "../../application/communications/lifecycle-content.ts";
import { getServerFirebaseAuth } from "../auth/firebase-server.ts";
import { MicrosoftGraphTransactionalEmailProvider, microsoftGraphTransactionalEmailConfigurationFromEnvironment } from "./microsoft-graph-transactional-email.ts";
import { SmsProviderError, TelnyxSmsProvider } from "./telnyx-sms.ts";
import { communicationAddressKey } from "./address-key.ts";

const iso = (value: unknown): string => typeof value === "string" ? value : value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function" ? value.toDate().toISOString() : "";

export async function currentLifecycleState(db: Firestore, userId: string, auth: Pick<Auth, "getUser"> = getServerFirebaseAuth()): Promise<{ state: LifecycleState; email: string; phone: string | null }> {
  const user = await db.collection("users").doc(userId).get();
  const subject = user.get("login.subject");
  if (typeof subject !== "string") throw new Error("account-unavailable");
  const account = await auth.getUser(subject);
  const enrollment = await db.collection("lifecycleEnrollments").doc(userId).get();
  const signInAt = account.metadata.lastSignInTime ? new Date(account.metadata.lastSignInTime).toISOString() : iso(user.get("createdAt"));
  const observedActivity = iso(enrollment.get("lastActivityAt"));
  const lastActivityAt = observedActivity && Date.parse(observedActivity) > Date.parse(signInAt) ? observedActivity : signInAt;
  const activation = await db.collection("activationJourneyContexts").doc(userId).get();
  const journeyId = activation.get("accessJourneyId");
  const journey = typeof journeyId === "string" ? await db.collection("accessJourneys").doc(journeyId).get() : null;
  const organizationId = typeof activation.get("organizationId") === "string" ? activation.get("organizationId") as string : null;
  let restricted = activation.exists && (!journey?.exists || journey.get("userId") !== userId);
  restricted ||= journey?.get("state") === "open-platform" && !organizationId;
  if (organizationId) {
    const organization = await db.collection("organizations").doc(organizationId).get();
    restricted ||= !organization.exists;
    const membershipId = activation.get("membershipId");
    const membership = typeof membershipId === "string" ? await db.collection("organizationMemberships").doc(membershipId).get() : null;
    restricted ||= !membership || membership.get("userId") !== userId || membership.get("organizationId") !== organizationId || membership.get("status") !== "active";
    const restrictions = await db.collection("accessRestrictions").where("target.organizationId", "==", organizationId).get();
    restricted ||= restrictions.docs.some((doc) => doc.get("state") !== "none" && (doc.get("target.kind") === "organization" || doc.get("target.membershipId") === membershipId));
  }
  return {
    state: { userId, organizationId, active: journey?.get("state") === "open-platform", accountAvailable: !account.disabled && account.emailVerified && !restricted,
      lastActivityAt, registeredAt: iso(user.get("createdAt")) },
    email: account.email ?? "", phone: account.phoneNumber ?? null,
  };
}

interface LifecycleRuntimeDependencies {
  auth?: Pick<Auth, "getUser">;
  now?: () => number;
  environment?: NodeJS.ProcessEnv;
  deliver?: (input: { channel: "email" | "sms"; address: string; content: ReturnType<typeof lifecycleContent>; request: ReturnType<typeof createTransactionalEmailRequest> }) => Promise<{ providerKey: string; externalReference: string | null }>;
}

/** Scheduler consumer. Read fresh state, atomically reserve one delivery, then call one provider. */
export async function dispatchLifecycleCommunications(db: Firestore, dependencies: LifecycleRuntimeDependencies = {}) {
  const env = dependencies.environment ?? process.env;
  const clock = dependencies.now ?? Date.now;
  if (env.RFXCHANGE_LIFECYCLE_SEND_MODE !== "enabled") return { processed: 0, status: "disabled" };
  const configuration = await db.collection("lifecycleConfiguration").doc("current").get();
  const policy = configuration.exists ? validateLifecyclePolicy(configuration.get("policy")) : DEFAULT_LIFECYCLE_POLICY;
  if (!policy.enabled) return { processed: 0, status: "paused" };
  const now = clock();
  const started = Date.now();
  const due = await db.collection("lifecycleEnrollments").where("nextEvaluationAt", "<=", new Date(now).toISOString()).orderBy("nextEvaluationAt").limit(25).get();
  let processed = 0;
  for (const enrollment of due.docs) {
    if (Date.now() - started > 200_000) break;
    const userId = enrollment.id;
    try {
      const { state, email, phone } = await currentLifecycleState(db, userId, dependencies.auth);
      const journey = chooseLifecycleJourney(state, policy, now);
      const prefRef = db.collection("communicationPreferences").doc(userId);
      const prefs = (await prefRef.get()).data() as CommunicationPreferences | undefined;
      const channel = prefs?.email ? "email" : "sms";
      const address = channel === "email" ? email : phone;
      const nextEvaluationAt = new Date(now + 86_400_000).toISOString();
      if (!journey || !address || !prefs || (channel === "sms" && prefs.phone !== phone)) {
        await enrollment.ref.update({ nextEvaluationAt, status: "waiting", reason: "state-or-channel-unavailable" }); continue;
      }
      const key = createHash("sha256").update(`${userId}:${journey}:${state.lastActivityAt}`).digest("hex");
      const jobRef = db.collection("lifecycleCommunicationJobs").doc(key);
      const suppressionRef = db.collection("communicationSuppressions").doc(communicationAddressKey(channel, address));
      const reserved = await db.runTransaction(async (tx) => {
        const [job, freshPrefs, suppression, freshEnrollment, freshConfig] = await tx.getAll(jobRef, prefRef, suppressionRef, enrollment.ref, configuration.ref);
        const retry = job.exists && job.get("status") === "retryable-failure" && Number(job.get("attemptCount")) < 3;
        if (job.exists && !retry) {
          if (job.get("status") === "sending" && now - Date.parse(job.get("updatedAt")) > 300_000) tx.update(jobRef, { status: "needs-reconciliation", reason: "worker-interrupted", updatedAt: new Date(now).toISOString() });
          tx.update(enrollment.ref, { nextEvaluationAt });
          return false;
        }
        const currentPolicy = freshConfig.exists ? validateLifecyclePolicy(freshConfig.get("policy")) : DEFAULT_LIFECYCLE_POLICY;
        const decision = communicationSendDecision({ preferences: freshPrefs.exists ? freshPrefs.data() as CommunicationPreferences : null, policy: currentPolicy, state, journey, channel,
          suppressed: suppression.get("suppressed") === true, lastSentAt: retry ? null : freshEnrollment.get("lastSentAt") ?? null, now });
        if (decision) { tx.update(enrollment.ref, { nextEvaluationAt: decision === "quiet-hours" ? new Date(now + 3_600_000).toISOString() : nextEvaluationAt, status: "waiting", reason: decision }); return false; }
        tx.set(jobRef, { id: key, attemptCount: retry ? Number(job.get("attemptCount")) + 1 : 1, userId, organizationId: state.organizationId, journey, channel, purpose: "marketing", templateKey: `${journey}.v1`,
          status: "sending", addressKey: suppressionRef.id, createdAt: job.get("createdAt") ?? new Date(now).toISOString(), updatedAt: new Date(now).toISOString(), providerReference: null });
        tx.update(enrollment.ref, { nextEvaluationAt, lastSentAt: new Date(now).toISOString(), status: "sending", reason: null });
        return true;
      });
      if (!reserved) continue;
      try {
        // Recheck revocation and journey movement immediately before touching the provider.
        const fresh = await currentLifecycleState(db, userId, dependencies.auth);
        const [freshPrefs, suppression, freshConfig] = await db.getAll(prefRef, suppressionRef, configuration.ref);
        const finalDecision = communicationSendDecision({ preferences: freshPrefs.exists ? freshPrefs.data() as CommunicationPreferences : null,
          policy: freshConfig.exists ? validateLifecyclePolicy(freshConfig.get("policy")) : DEFAULT_LIFECYCLE_POLICY,
          state: fresh.state, journey, channel, suppressed: suppression.get("suppressed") === true, lastSentAt: null, now: clock() });
        if (finalDecision || (channel === "email" ? fresh.email : fresh.phone) !== address || (channel === "sms" && freshPrefs.get("phone") !== address)) {
          await jobRef.update({ status: "suppressed", reason: finalDecision ?? "address-changed", updatedAt: new Date().toISOString() }); continue;
        }
        const content = lifecycleContent(journey, env.RFXCHANGE_EXCHANGE_ORIGIN ?? "");
        const request = createTransactionalEmailRequest({ id: key, purpose: "marketing", recipientEmail: email,
          eventKey: `lifecycle.${journey}`, templateKey: `lifecycle.${journey}.v1`, correlationId: randomUUID(), idempotencyKey: key, requestedAt: new Date(clock()).toISOString(), userId, organizationId: state.organizationId });
        let receipt: { providerKey: string; externalReference: string | null };
        if (dependencies.deliver) {
          receipt = await dependencies.deliver({ channel, address, content, request });
        } else if (channel === "sms") {
          receipt = await new TelnyxSmsProvider({ apiKey: env.TELNYX_API_KEY ?? "", from: env.TELNYX_FROM_NUMBER ?? "", messagingProfileId: env.TELNYX_MESSAGING_PROFILE_ID ?? "" }).send(address, content.sms);
        } else {
          // Purpose/consent are enforced above; reuse the one existing Microsoft transport.
          receipt = await new MicrosoftGraphTransactionalEmailProvider(microsoftGraphTransactionalEmailConfigurationFromEnvironment(env), { async render() { return content; } }).deliver(request);
        }
        await db.runTransaction(async (tx) => {
          tx.update(jobRef, { status: "accepted", providerKey: receipt.providerKey, providerReference: receipt.externalReference, updatedAt: new Date().toISOString() });
          tx.create(db.collection("lifecycleCommunicationEvents").doc(`${key}:accepted`), { jobId: key, userId, eventType: "provider-accepted", providerKey: receipt.providerKey, occurredAt: new Date().toISOString() });
          if (channel === "sms" && receipt.externalReference) tx.set(db.collection("communicationProviderReferences").doc(receipt.externalReference), { jobId: key, addressKey: suppressionRef.id });
        });
      } catch (error) {
        const classified = error instanceof SmsProviderError || error instanceof TransactionalEmailProviderError;
        const ambiguous = !classified || (error instanceof SmsProviderError ? error.outcome === "unknown" : error.deliveryOutcome === "unknown");
        const attempts = Number((await jobRef.get()).get("attemptCount"));
        const retryable = classified && !ambiguous && error.retryable && attempts < 3;
        await jobRef.update({ status: ambiguous ? "needs-reconciliation" : retryable ? "retryable-failure" : "failed", reason: ambiguous ? "delivery-outcome-unknown" : error.code, updatedAt: new Date().toISOString() });
        if (retryable) await enrollment.ref.update({ nextEvaluationAt: new Date(clock() + 3_600_000).toISOString() });
      }
      processed++;
    } catch {
      await enrollment.ref.update({ nextEvaluationAt: new Date(now + 3_600_000).toISOString(), status: "needs-attention", reason: "evaluation-unavailable" });
    }
  }
  return { processed, status: "evaluated" };
}
