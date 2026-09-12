import { NextRequest, NextResponse } from "next/server";
import { verifyTelnyxWebhook } from "@/src/infrastructure/communications/telnyx-sms";
import { normalizeTelnyxEvent, persistTelnyxEvent } from "@/src/infrastructure/communications/telnyx-events";
import { boundedRequestBytes } from "@/src/infrastructure/http/bounded-request";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const messagingProfileId = process.env.TELNYX_MESSAGING_PROFILE_ID ?? "";
  const fromNumber = process.env.TELNYX_FROM_NUMBER ?? "";
  if (!messagingProfileId || !fromNumber || !process.env.TELNYX_PUBLIC_KEY) return new NextResponse(null, { status: 503 });
  let raw: Buffer;
  try { raw = await boundedRequestBytes(request, 64_000); } catch { return new NextResponse(null, { status: 413 }); }
  if (!verifyTelnyxWebhook(raw, request.headers.get("telnyx-timestamp"), request.headers.get("telnyx-signature-ed25519"), process.env.TELNYX_PUBLIC_KEY ?? "")) return new NextResponse(null, { status: 401 });
  let event;
  try { event = normalizeTelnyxEvent(JSON.parse(raw.toString("utf8")), { messagingProfileId, fromNumber }); } catch { return new NextResponse(null, { status: 400 }); }
  await persistTelnyxEvent(getServerFirestore(), event);
  return new NextResponse(null, { status: 200 });
}
