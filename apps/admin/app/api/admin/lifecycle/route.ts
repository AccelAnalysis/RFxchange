import { isApplicationRequestOrigin } from "@/src/infrastructure/http/application-request-origin";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LIFECYCLE_POLICY, validateLifecyclePolicy } from "@/src/domain/communications/lifecycle";
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
  const access = await authorize(request, false);
  if (access.kind !== "authorized") return NextResponse.json({ error: "Configuration access required." }, { status: 403 });
  const doc = await getServerFirestore().collection("lifecycleConfiguration").doc("current").get();
  return NextResponse.json({ policy: doc.get("policy") ?? DEFAULT_LIFECYCLE_POLICY, version: doc.get("version") ?? 0 }, { headers: { "cache-control": "no-store" } });
}
export async function POST(request: NextRequest) {
  if (!isApplicationRequestOrigin(request, "admin")) return NextResponse.json({ error: "Request origin required." }, { status: 403 });
  const access = await authorize(request, true);
  if (access.kind !== "authorized") return NextResponse.json({ error: "Configuration management access required." }, { status: 403 });
  let body, policy;
  try {
    body = JSON.parse((await boundedRequestBytes(request, 4096)).toString("utf8"));
    policy = validateLifecyclePolicy(body.policy);
    if (!Number.isInteger(body.expectedVersion) || typeof body.reason !== "string" || !body.reason.trim() || body.reason.length > 1000) throw new Error("invalid");
  } catch { return NextResponse.json({ error: "A valid policy, version and reason are required." }, { status: 400 }); }
  const db = getServerFirestore();
  const ref = db.collection("lifecycleConfiguration").doc("current");
  try {
    const version = await db.runTransaction(async tx => {
      const previous = await tx.get(ref);
      const currentVersion = previous.get("version") ?? 0;
      if (body.expectedVersion !== currentVersion) throw new Error("conflict");
      const audit = createPlatformAdministrativeAuditEvent(access.authority, { id: randomUUID(), permissionsExercised: ["config.value.manage"],
        target: { objectType: "lifecycle-configuration", objectId: "current" }, action: "lifecycle.policy.changed", reason: body.reason,
        priorState: previous.exists ? { policy: previous.get("policy"), version: currentVersion } : null,
        newState: { policy, version: currentVersion + 1 }, occurredAt: new Date().toISOString() });
      tx.set(ref, { policy, version: currentVersion + 1, updatedAt: audit.occurredAt });
      tx.create(db.collection("platformAdministrativeAuditEvents").doc(audit.id), { schemaVersion: 1, ...audit });
      return currentVersion + 1;
    });
    return NextResponse.json({ policy, version });
  } catch { return NextResponse.json({ error: "Configuration changed. Refresh and review it." }, { status: 409 }); }
}
