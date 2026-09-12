import { createHash } from "node:crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { communicationAddressKey } from "./address-key.ts";

type ObjectValue = Record<string, unknown>;
const object = (value: unknown): ObjectValue => value && typeof value === "object" && !Array.isArray(value) ? value as ObjectValue : {};
export interface TelnyxEvent {
  id: string; type: string; occurredAt: string; providerReference: string | null;
  addressKey: string | null; suppression: boolean | null; deliveryStatus: string | null;
}
export function normalizeTelnyxEvent(input: unknown, scope?: { messagingProfileId: string; fromNumber: string }): TelnyxEvent {
  const data = object(object(input).data);
  const payload = object(data.payload);
  if (typeof data.id !== "string" || !/^[a-zA-Z0-9-]{1,128}$/.test(data.id) || typeof data.occurred_at !== "string" || !Number.isFinite(Date.parse(data.occurred_at)) || typeof data.event_type !== "string") throw new Error("invalid-event");
  const text = typeof payload.text === "string" ? payload.text.trim().toUpperCase() : "";
  const from = object(payload.from).phone_number;
  const incoming = data.event_type === "message.received";
  const suppression = incoming && ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "REVOKE", "OPT OUT"].includes(text) ? true : incoming && ["START", "UNSTOP"].includes(text) ? false : null;
  const recipients = Array.isArray(payload.to) ? payload.to : [];
  if (scope && (!scope.messagingProfileId || !scope.fromNumber || payload.messaging_profile_id !== scope.messagingProfileId ||
    (incoming ? !recipients.some(recipient => object(recipient).phone_number === scope.fromNumber) : from !== scope.fromNumber))) throw new Error("event-outside-messaging-scope");
  const deliveryStatus = object(recipients[0]).status;
  return { id: data.id, type: data.event_type.slice(0, 80), occurredAt: new Date(data.occurred_at).toISOString(),
    providerReference: typeof payload.id === "string" && /^[a-zA-Z0-9-]{1,128}$/.test(payload.id) ? payload.id : null,
    addressKey: incoming && typeof from === "string" && /^\+\d{8,15}$/.test(from) ? communicationAddressKey("sms", from) : null,
    suppression, deliveryStatus: !incoming && typeof deliveryStatus === "string" && ["delivered", "delivery_failed", "sending_failed", "sent", "queued"].includes(deliveryStatus) ? deliveryStatus : null };
}
export async function persistTelnyxEvent(db: Firestore, event: TelnyxEvent) {
  const ref = db.collection("communicationWebhookEvents").doc(event.id);
  const fingerprint = createHash("sha256").update(JSON.stringify(event)).digest("hex");
  await db.runTransaction(async (tx) => {
    const previous = await tx.get(ref);
    if (previous.exists) { if (previous.get("fingerprint") !== fingerprint) throw new Error("event-identity-conflict"); return; }
    const suppressionRef = event.addressKey && event.suppression !== null ? db.collection("communicationSuppressions").doc(event.addressKey) : null;
    const suppression = suppressionRef ? await tx.get(suppressionRef) : null;
    if (suppressionRef && (!suppression?.exists || String(suppression.get("occurredAt")) < event.occurredAt)) tx.set(suppressionRef, { channel: "sms", suppressed: event.suppression, source: "telnyx", eventId: event.id, occurredAt: event.occurredAt });
    tx.create(ref, { ...event, fingerprint, receivedAt: new Date().toISOString(), processed: !event.deliveryStatus,
      ...(event.deliveryStatus ? { nextReconciliationAt: new Date().toISOString(), reconciliationAttempts: 0 } : {}) });
  });
  await reconcileTelnyxEvent(db, event.id);
}
export async function reconcileTelnyxEvent(db: Firestore, id: string, now = Date.now()) {
  await db.runTransaction(async (tx) => {
    const ref = db.collection("communicationWebhookEvents").doc(id);
    const event = await tx.get(ref);
    if (!event.exists || event.get("processed") || typeof event.get("providerReference") !== "string") return;
    const mapping = await tx.get(db.collection("communicationProviderReferences").doc(event.get("providerReference")));
    const jobRef = mapping.exists && typeof mapping.get("jobId") === "string" ? db.collection("lifecycleCommunicationJobs").doc(mapping.get("jobId")) : null;
    const job = jobRef ? await tx.get(jobRef) : null;
    if (!jobRef || !job?.exists) {
      const expired = now - Date.parse(event.get("receivedAt")) >= 86_400_000;
      tx.update(ref, { reconciliationAttempts: Number(event.get("reconciliationAttempts") ?? 0) + 1,
        nextReconciliationAt: expired ? FieldValue.delete() : new Date(now + 3_600_000).toISOString(),
        status: expired ? "needs-attention" : "awaiting-provider-reference" });
      return;
    }
    const occurredAt = event.get("occurredAt") as string;
    const status = event.get("deliveryStatus");
    const terminal = ["delivered", "delivery_failed", "sending_failed"].includes(String(job.get("deliveryStatus")));
    if (typeof status === "string" && (!job.get("deliveryOccurredAt") || String(job.get("deliveryOccurredAt")) < occurredAt) && !terminal) tx.update(jobRef, { deliveryStatus: status, deliveryOccurredAt: occurredAt });
    tx.update(ref, { processed: true, status: "reconciled", nextReconciliationAt: FieldValue.delete() });
  });
}
