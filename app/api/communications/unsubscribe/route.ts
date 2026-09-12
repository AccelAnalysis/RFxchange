import { NextRequest, NextResponse } from "next/server";
import { unsubscribeEmail } from "@/src/infrastructure/communications/unsubscribe";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { boundedRequestBytes } from "@/src/infrastructure/http/bounded-request";
import { applicationOrigins } from "@/src/application/platform/application-origins";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  // No GET side effect: email scanners cannot unsubscribe by opening a link.
  try {
    if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) throw new Error("invalid-content");
    const values = new URLSearchParams((await boundedRequestBytes(request, 1024)).toString("utf8"));
    await unsubscribeEmail(getServerFirestore(), values.get("token") ?? "");
    return NextResponse.redirect(new URL("/communications/unsubscribed", applicationOrigins.exchange), { status: 303, headers: { "cache-control": "no-store", "referrer-policy": "no-referrer" } });
  } catch { return new NextResponse("This unsubscribe link is unavailable. Open RFxchange communication preferences or contact jholman@accelanalysis.com for help.", { status: 400, headers: { "cache-control": "no-store", "content-type": "text/plain", "referrer-policy": "no-referrer" } }); }
}
