import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_HELP_ARTICLES, validatePublicHelpArticles } from "@/src/application/support/public-help";
import { createPlatformAdministrativeAuditEvent } from "@/src/domain/admin-authorization/admin-audit";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { boundedRequestBytes } from "@/src/infrastructure/http/bounded-request";
export const runtime = "nodejs";
async function authorize(request: NextRequest, write: boolean) {
  return resolveAdminRoute({ sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    permission: write ? "config.value.manage" : "config.value.read", scope: "GLOBAL", access: write ? "write" : "read" });
}
export async function GET(request: NextRequest) {
  if ((await authorize(request, false)).kind !== "authorized") return NextResponse.json({ error: "Configuration access required." }, { status: 403 });
  const snapshot = await getServerFirestore().collection("publicHelpConfiguration").doc("current").get();
  return NextResponse.json({ articles: snapshot.get("articles") ?? PUBLIC_HELP_ARTICLES, version: snapshot.get("version") ?? 0 }, { headers: { "cache-control": "no-store" } });
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Request origin required." }, { status: 403 });
  const access = await authorize(request, true);
  if (access.kind !== "authorized") return NextResponse.json({ error: "Configuration management access required." }, { status: 403 });
  let body, articles;
  try {
    body = JSON.parse((await boundedRequestBytes(request, 150_000)).toString("utf8"));
    articles = validatePublicHelpArticles(body.articles);
    if (!Number.isInteger(body.expectedVersion) || body.confirmPublic !== true || typeof body.reason !== "string" || !body.reason.trim() || body.reason.length > 1000) throw new Error("invalid");
  } catch { return NextResponse.json({ error: "Review the public articles, publication confirmation and reason." }, { status: 400 }); }
  const db = getServerFirestore();
  const ref = db.collection("publicHelpConfiguration").doc("current");
  try {
    const version = await db.runTransaction(async tx => {
      const previous = await tx.get(ref);
      const currentVersion = previous.get("version") ?? 0;
      if (body.expectedVersion !== currentVersion) throw new Error("conflict");
      const audit = createPlatformAdministrativeAuditEvent(access.authority, { id: randomUUID(), permissionsExercised: ["config.value.manage"],
        target: { objectType: "public-help-configuration", objectId: "current" }, action: "public-help.published", reason: body.reason,
        priorState: previous.exists ? { articles: previous.get("articles"), version: currentVersion } : null,
        newState: { articles, version: currentVersion + 1 }, occurredAt: new Date().toISOString() });
      tx.set(ref, { articles, version: currentVersion + 1, publishedAt: audit.occurredAt });
      tx.create(db.collection("platformAdministrativeAuditEvents").doc(audit.id), { schemaVersion: 1, ...audit });
      return currentVersion + 1;
    });
    return NextResponse.json({ articles, version });
  } catch { return NextResponse.json({ error: "Published help changed. Refresh and review it." }, { status: 409 }); }
}
