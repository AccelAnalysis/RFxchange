import { createHash, randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import { enrichPublicOrganization, type EnrichmentAdapter, type EnrichmentSubject, type PublicEnrichmentRun } from "../application/public-enrichment.ts";

export async function runPersistedPublicEnrichment(db: Firestore, subject: EnrichmentSubject, commandId: string, adapters: readonly EnrichmentAdapter[], now = () => new Date().toISOString()) {
  const id = createHash("sha256").update(`${subject.organizationId}:${commandId}`).digest("hex");
  const fingerprint = createHash("sha256").update(JSON.stringify(subject)).digest("hex");
  const ref = db.collection("publicEnrichmentRuns").doc(id);
  const leaseOwner = randomUUID();
  const acquired = await db.runTransaction(async (tx) => {
    const previous = await tx.get(ref);
    if (previous.exists && previous.get("fingerprint") !== fingerprint) throw new Error("enrichment-command-conflict");
    if (previous.exists && previous.get("completedAt")) return previous.data() as PublicEnrichmentRun;
    if (previous.exists && Date.parse(previous.get("leaseUntil")) > Date.parse(now())) throw new Error("enrichment-in-progress");
    tx.set(ref, { id, organizationId: subject.organizationId, fingerprint, leaseOwner, status: "running", startedAt: now(), leaseUntil: new Date(Date.parse(now()) + 60_000).toISOString() });
    if (!previous.exists) tx.create(db.collection("publicEnrichmentEvents").doc(`${id}:started`), {
      id: `${id}:started`, organizationId: subject.organizationId, runId: id,
      eventType: "enrichment_started", occurredAt: now(),
    });
    return null;
  });
  if (acquired) return acquired;
  const run = await enrichPublicOrganization(id, subject, adapters, now);
  await db.runTransaction(async (tx) => {
    const current = await tx.get(ref);
    if (current.get("leaseOwner") !== leaseOwner) throw new Error("enrichment-lease-lost");
    if (current.get("fingerprint") !== fingerprint || current.get("completedAt")) throw new Error("enrichment-command-conflict");
    tx.set(ref, { ...run, fingerprint, leaseUntil: null, leaseOwner: null });
    tx.create(db.collection("publicEnrichmentEvents").doc(`${id}:completed`), {
      id: `${id}:completed`, organizationId: subject.organizationId, runId: id,
      eventType: "enrichment_completed", status: run.status, occurredAt: run.completedAt,
    });
  });
  return run;
}
