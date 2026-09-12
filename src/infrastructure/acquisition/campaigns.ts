import { createHash } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";
import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import { createPlatformAdministrativeAuditEvent } from "../../domain/admin-authorization/admin-audit.ts";
import { validateCampaign } from "../../domain/acquisition/campaign.ts";

export async function saveCampaign(db: Firestore, authority: PlatformAdministratorAuthorityContext, input: { campaign: unknown; expectedVersion: number; commandId: string; reason: string }) {
  const campaign = validateCampaign(input.campaign);
  if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 0 || !/^[A-Za-z0-9-]{8,128}$/.test(input.commandId) || !input.reason.trim() || input.reason.length > 1000) throw new Error("invalid-command");
  const key = createHash("sha256").update(`${authority.administratorId}:${input.commandId}`).digest("hex");
  const fingerprint = createHash("sha256").update(JSON.stringify({ ...input, campaign })).digest("hex");
  return db.runTransaction(async tx => {
    const ref = db.collection("marketingCampaigns").doc(campaign.id);
    const auditRef = db.collection("platformAdministrativeAuditEvents").doc(key);
    const [current, audit] = await tx.getAll(ref, auditRef);
    if (audit.exists) { if (audit.get("newState.fingerprint") !== fingerprint) throw new Error("command-conflict"); return audit.get("newState.campaign"); }
    if ((current.get("version") ?? 0) !== input.expectedVersion) throw new Error("version-conflict");
    const next = { ...campaign, version: input.expectedVersion + 1, updatedAt: new Date().toISOString() };
    tx.set(ref, next);
    tx.create(auditRef, { schemaVersion: 1, ...createPlatformAdministrativeAuditEvent(authority, { id: key,
      permissionsExercised: ["config.value.manage"], target: { objectType: "marketing-campaign", objectId: campaign.id },
      action: "campaign.saved", reason: input.reason, priorState: current.data() ?? null,
      newState: { campaign: next, fingerprint }, occurredAt: next.updatedAt }) });
    return next;
  });
}
