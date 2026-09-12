import type { Firestore } from "firebase-admin/firestore";
import { marketingCampaignReference } from "../../application/acquisition/marketing-entry.ts";
/** Called only after server authentication. Reported campaign IDs never establish authority. */
export async function recordMarketingAttribution(db: Firestore, userId: string, first: string | undefined, last: string | undefined, now: string) {
  const firstCampaign = marketingCampaignReference(first);
  const lastCampaign = marketingCampaignReference(last) ?? firstCampaign;
  if (!firstCampaign && !lastCampaign) return;
  await db.runTransaction(async tx => {
    const ref = db.collection("marketingAttribution").doc(userId);
    const existing = await tx.get(ref);
    tx.set(ref, { userId, classification: "reported-not-authoritative",
      firstTouch: existing.get("firstTouch") ?? { campaign: firstCampaign ?? lastCampaign, observedAt: now },
      lastTouch: { campaign: lastCampaign, observedAt: now }, updatedAt: now }, { merge: true });
  });
}
