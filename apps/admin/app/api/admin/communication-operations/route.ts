import { NextRequest, NextResponse } from "next/server";
import { communicationOperation } from "@/src/domain/communications/operations";
import { applyCommunicationOperation, communicationOperationsSnapshot } from "@/src/infrastructure/communications/operations";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { boundedRequestBytes } from "@/src/infrastructure/http/bounded-request";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
export const runtime = "nodejs";
const authorize = (request: NextRequest, write: boolean) => resolveAdminRoute({ sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  permission: write ? "config.value.manage" : "system.health.read", scope: "GLOBAL", access: write ? "write" : "read" });
export async function GET(request: NextRequest) {
  if ((await authorize(request, false)).kind !== "authorized") return NextResponse.json({ error: "Operations access required." }, { status: 403 });
  return NextResponse.json(await communicationOperationsSnapshot(getServerFirestore()), { headers: { "cache-control": "no-store" } });
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Request origin required." }, { status: 403 });
  const access = await authorize(request, true);
  if (access.kind !== "authorized") return NextResponse.json({ error: "Management access required." }, { status: 403 });
  let command;
  try { command = communicationOperation(JSON.parse((await boundedRequestBytes(request, 4096)).toString("utf8"))); }
  catch { return NextResponse.json({ error: "Review the action, record, version and reason." }, { status: 400 }); }
  try { return NextResponse.json(await applyCommunicationOperation(getServerFirestore(), access.authority, command)); }
  catch { return NextResponse.json({ error: "The record changed or cannot receive that action. Refresh and review it." }, { status: 409 }); }
}
