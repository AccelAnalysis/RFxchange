import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFunctionsFirestore } from "./runtime/firebase-admin.js";
import { RFXCHANGE_FUNCTIONS_REGION } from "./runtime/environment.js";

export const lifecycleEnrollmentFromAccount = onDocumentWritten({ document: "users/{userId}", region: RFXCHANGE_FUNCTIONS_REGION, retry: true }, async (event) => {
  if (!event.data?.after.exists) return;
  await getFunctionsFirestore().collection("lifecycleEnrollments").doc(event.params.userId).set({ userId: event.params.userId, nextEvaluationAt: new Date().toISOString() }, { merge: true });
});
export const lifecycleEnrollmentFromActivation = onDocumentWritten({ document: "activationJourneyContexts/{userId}", region: RFXCHANGE_FUNCTIONS_REGION, retry: true }, async (event) => {
  if (!event.data?.after.exists) return;
  await getFunctionsFirestore().collection("lifecycleEnrollments").doc(event.params.userId).set({ userId: event.params.userId, nextEvaluationAt: new Date().toISOString() }, { merge: true });
});

/** Canonical product activity keeps retained sessions out of incorrect inactivity journeys. */
function activityTrigger(document: string, actorField: "actorUserId" | "actor" = "actorUserId") {
  return onDocumentCreated({ document, region: RFXCHANGE_FUNCTIONS_REGION, retry: true }, async event => {
    const data = event.data?.data();
    const actorUserId = actorField === "actor" ? data?.actor?.userId : data?.actorUserId;
    if (typeof actorUserId !== "string" || typeof data.occurredAt !== "string" || !Number.isFinite(Date.parse(data.occurredAt))) return;
    const ref = getFunctionsFirestore().collection("lifecycleEnrollments").doc(actorUserId);
    const occurredAt = new Date(data.occurredAt).toISOString();
    if (Date.parse(occurredAt) > Date.now() + 300_000) return;
    await getFunctionsFirestore().runTransaction(async tx => {
      const current = await tx.get(ref);
      if (current.get("lastActivityAt") && String(current.get("lastActivityAt")) >= occurredAt) return;
      tx.set(ref, { userId: actorUserId, lastActivityAt: occurredAt, lastActivityEventId: event.id, nextEvaluationAt: new Date().toISOString() }, { merge: true });
    });
  });
}
export const lifecycleActivityFromRfx = activityTrigger("rfxEvents/{eventId}");
export const lifecycleActivityFromReferral = activityTrigger("businessReferralEvents/{eventId}");
export const lifecycleActivityFromProfile = activityTrigger("organizationProfileEvents/{eventId}", "actor");
export const lifecycleActivityFromResource = activityTrigger("providerNetworkEvents/{eventId}");
/** The single Microsoft/Telnyx adapters live in the trusted Exchange server. No client credentials. */
export const scheduledLifecycleCommunications = onSchedule({ schedule: "every 15 minutes", region: RFXCHANGE_FUNCTIONS_REGION, secrets: ["RFXCHANGE_LIFECYCLE_WORKER_SECRET"], timeoutSeconds: 300, maxInstances: 1 }, async () => {
  if (process.env.RFXCHANGE_LIFECYCLE_SEND_MODE !== "enabled") return;
  const workerSecret = process.env.RFXCHANGE_LIFECYCLE_WORKER_SECRET;
  if (!workerSecret || workerSecret.length < 32) throw new Error("lifecycle-worker-credential-unavailable");
  const origin = new URL(process.env.RFXCHANGE_EXCHANGE_ORIGIN ?? "");
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/") throw new Error("exchange-origin-invalid");
  const response = await fetch(new URL("/api/internal/lifecycle", origin), { method: "POST", redirect: "error", headers: { authorization: `Bearer ${workerSecret}` }, signal: AbortSignal.timeout(280_000) });
  if (!response.ok) throw new Error(`lifecycle-worker-http-${response.status}`);
});
