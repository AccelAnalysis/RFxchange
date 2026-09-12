import { createHash } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { createPlatformAdministrativeAuditEvent } from "../../domain/admin-authorization/admin-audit.ts";
import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import { canCloseCommunicationJob, communicationAttention, type CommunicationOperation } from "../../domain/communications/operations.ts";
import { reconcileTelnyxEvent } from "./telnyx-events.ts";

export async function communicationOperationsSnapshot(db: Firestore) {
  const [jobs, callbacks, holds, enrollments] = await Promise.all([
    db.collection("lifecycleCommunicationJobs").orderBy("updatedAt", "desc").limit(100).get(),
    db.collection("communicationWebhookEvents").orderBy("receivedAt", "desc").limit(100).get(),
    db.collection("communicationSupportHolds").orderBy("updatedAt", "desc").limit(100).get(),
    db.collection("lifecycleEnrollments").where("status", "==", "needs-attention").count().get(),
  ]);
  const select = (id: string, data: Record<string, unknown>, fields: string[]) => Object.fromEntries([
    ["id", id], ["version", data.operationVersion ?? 0], ...fields.map(key => [key, data[key] ?? null]),
  ]);
  return {
    sampledAt: new Date().toISOString(), windowLimit: 100,
    counts: { recentJobs: jobs.size, recentJobsNeedingAttention: jobs.docs.filter(d => communicationAttention(d.data())).length,
      recentUnprocessedCallbacks: callbacks.docs.filter(d => !d.get("processed")).length,
      enrollmentsNeedingAttention: enrollments.data().count },
    jobs: jobs.docs.map(d => select(d.id, d.data(), ["userId", "journey", "channel", "status", "deliveryStatus", "reason", "updatedAt"])),
    callbacks: callbacks.docs.map(d => select(d.id, d.data(), ["type", "status", "processed", "receivedAt"])),
    holds: holds.docs.map(d => select(d.id, d.data(), ["held", "updatedAt"])),
  };
}

export async function applyCommunicationOperation(db: Firestore, authority: PlatformAdministratorAuthorityContext, command: CommunicationOperation) {
  const id = createHash("sha256").update(`${authority.administratorId}:${command.commandId}`).digest("hex");
  const fingerprint = createHash("sha256").update(JSON.stringify(command)).digest("hex");
  const auditRef = db.collection("platformAdministrativeAuditEvents").doc(id);
  const collection = command.action === "hold" || command.action === "release-hold" ? "communicationSupportHolds" : command.action === "close-job" ? "lifecycleCommunicationJobs" : "communicationWebhookEvents";
  const ref = db.collection(collection).doc(command.targetId);
  const version = await db.runTransaction(async tx => {
    const [priorAudit, before] = await tx.getAll(auditRef, ref);
    if (priorAudit.exists) {
      if (priorAudit.get("newState.fingerprint") !== fingerprint) throw new Error("command-conflict");
      return Number(priorAudit.get("newState.operationVersion"));
    }
    const current = Number(before.get("operationVersion") ?? 0);
    if (current !== command.expectedVersion) throw new Error("version-conflict");
    if (collection === "communicationSupportHolds") {
      const user = await tx.get(db.collection("users").doc(command.targetId));
      if (!user.exists) throw new Error("user-unavailable");
      if (command.action === "release-hold" && !before.get("held")) throw new Error("hold-unavailable");
    } else if (!before.exists) throw new Error("record-unavailable");
    if (command.action === "close-job" && !canCloseCommunicationJob(before.get("status"))) throw new Error("job-not-closable");
    if (command.action === "reconcile-callback" && before.get("processed")) throw new Error("callback-already-processed");
    const now = new Date().toISOString();
    const patch = { operationVersion: current + 1, updatedAt: now,
      ...(command.action === "hold" || command.action === "release-hold" ? { held: command.action === "hold" } : {}),
      ...(command.action === "close-job" ? { status: "closed-by-operator", priorDeliveryStatus: before.get("status"), resolution: "do-not-resend" } : {}),
    };
    const audit = createPlatformAdministrativeAuditEvent(authority, { id, permissionsExercised: ["config.value.manage"],
      target: { objectType: collection, objectId: ref.id }, action: `communications.${command.action}`, reason: command.reason,
      priorState: { operationVersion: current, status: before.get("status") ?? null, held: before.get("held") ?? null },
      newState: { ...patch, fingerprint }, occurredAt: now });
    tx.set(ref, patch, { merge: true });
    tx.create(auditRef, { schemaVersion: 1, ...audit });
    return current + 1;
  });
  // Replay is safe: this consumer only applies already-signed, persisted provider events.
  if (command.action === "reconcile-callback") await reconcileTelnyxEvent(db, command.targetId);
  return { version };
}
