import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { dispatchLifecycleCommunications } from "@/src/infrastructure/communications/lifecycle-runtime";
import { reconcileTelnyxEvent } from "@/src/infrastructure/communications/telnyx-events";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";

export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: NextRequest) {
  const secret = process.env.RFXCHANGE_LIFECYCLE_WORKER_SECRET;
  const received = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!secret || secret.length < 32 || Buffer.byteLength(received) !== Buffer.byteLength(secret) || !timingSafeEqual(Buffer.from(received), Buffer.from(secret))) return NextResponse.json({ error: "Unavailable." }, { status: 403 });
  const db = getServerFirestore();
  const pending = await db.collection("communicationWebhookEvents").where("nextReconciliationAt", "<=", new Date().toISOString()).orderBy("nextReconciliationAt").limit(50).get();
  for (const event of pending.docs) await reconcileTelnyxEvent(db, event.id);
  return NextResponse.json(await dispatchLifecycleCommunications(db), { headers: { "cache-control": "no-store" } });
}
