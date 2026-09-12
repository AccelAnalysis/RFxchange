import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createPlatformAdministrativeAuditEvent } from "@/src/domain/admin-authorization/admin-audit";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { boundedRequestBytes } from "@/src/infrastructure/http/bounded-request";
import { publicEnrichmentAdapters } from "@/functions/src/runtime/public-enrichment-adapters";
import { runPersistedPublicEnrichment } from "@/functions/src/runtime/public-enrichment-store";
export const runtime = "nodejs";
function organization(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("organizationId") ?? "";
  return /^[A-Za-z0-9._:-]{1,128}$/.test(id) ? id : null;
}
async function authorize(request: NextRequest, write: boolean) {
  return resolveAdminRoute({ sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    permission: write ? "organization.profile.update" : "organization.profile.read", scope: "GLOBAL", access: write ? "write" : "read" });
}
const project = (run: Record<string, unknown>) => Object.fromEntries(Object.entries(run).filter(([key]) => !["fingerprint", "leaseOwner", "leaseUntil"].includes(key)));
export async function GET(request: NextRequest) {
  if ((await authorize(request, false)).kind !== "authorized") return NextResponse.json({ error: "Organization review access required." }, { status: 403 });
  const organizationId = organization(request);
  if (!organizationId) return NextResponse.json({ error: "Choose an organization." }, { status: 400 });
  const runs = await getServerFirestore().collection("publicEnrichmentRuns").where("organizationId", "==", organizationId).orderBy("startedAt", "desc").limit(10).get();
  return NextResponse.json({ runs: runs.docs.map(run => project(run.data())) }, { headers: { "cache-control": "no-store" } });
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Request origin required." }, { status: 403 });
  const access = await authorize(request, true);
  if (access.kind !== "authorized") return NextResponse.json({ error: "Organization management access required." }, { status: 403 });
  const organizationId = organization(request);
  let body;
  try {
    body = JSON.parse((await boundedRequestBytes(request, 4096)).toString("utf8"));
    if (!organizationId || typeof body.commandId !== "string" || !/^[A-Za-z0-9._:-]{8,128}$/.test(body.commandId) || typeof body.reason !== "string" || !body.reason.trim() || body.reason.length > 1000 ||
      (body.action != null && !["check", "review"].includes(body.action)) || (body.uei != null && (typeof body.uei !== "string" || !/^[A-Z0-9]{12}$/.test(body.uei))) ||
      (body.action === "review" && (typeof body.runId !== "string" || !/^[a-f0-9]{64}$/.test(body.runId)))) throw new Error("invalid");
  } catch { return NextResponse.json({ error: "Review the organization, request and reason." }, { status: 400 }); }
  const db = getServerFirestore();
  const profiles = await db.collection("organizationProfiles").where("organizationId", "==", organizationId).limit(1).get();
  const displayName = profiles.docs[0]?.get("displayName");
  if (typeof displayName !== "string") return NextResponse.json({ error: "Organization profile unavailable." }, { status: 404 });
  const commandId = `admin:${body.commandId}`;
  const auditId = createHash("sha256").update(`${organizationId}:${commandId}`).digest("hex");
  const auditRef = db.collection("platformAdministrativeAuditEvents").doc(auditId);
  const fingerprint = createHash("sha256").update(JSON.stringify({ organizationId, commandId, action: body.action ?? "check", runId: body.runId ?? null, uei: body.uei ?? null, reason: body.reason })).digest("hex");
  try {
    await db.runTransaction(async tx => {
      const previous = await tx.get(auditRef);
      if (previous.exists) {
        if (previous.get("newState.requestFingerprint") !== fingerprint || previous.get("actorAdministratorId") !== access.authority.administratorId) throw new Error("command-conflict");
        return;
      }
      const runRef = body.action === "review" ? db.collection("publicEnrichmentRuns").doc(body.runId) : null;
      const run = runRef ? await tx.get(runRef) : null;
      if (runRef && (!run?.exists || run.get("organizationId") !== organizationId || !run.get("completedAt"))) throw new Error("review-unavailable");
      const audit = createPlatformAdministrativeAuditEvent(access.authority, { id: auditId, permissionsExercised: ["organization.profile.update"],
        target: { objectType: "organization-public-enrichment", objectId: body.runId ?? organizationId, organizationId },
        action: body.action === "review" ? "enrichment.reviewed" : "enrichment.requested", reason: body.reason,
        priorState: run ? { reviewStatus: run.get("reviewStatus") } : null,
        newState: { requestFingerprint: fingerprint, commandId, ...(run ? { reviewStatus: "reviewed" } : {}) }, occurredAt: new Date().toISOString() });
      if (runRef) tx.update(runRef, { reviewStatus: "reviewed", reviewedAt: audit.occurredAt, reviewedByAdministratorId: access.authority.administratorId });
      tx.create(auditRef, { schemaVersion: 1, ...audit });
    });
    if (body.action === "review") return NextResponse.json({ reviewed: true });
    const run = await runPersistedPublicEnrichment(db, { organizationId: organizationId!, displayName, uei: body.uei ?? null }, commandId, publicEnrichmentAdapters(process.env.SAM_API_KEY));
    return NextResponse.json({ run: project({ ...run }) });
  } catch { return NextResponse.json({ error: "The request is already running or changed. Refresh and review the current record." }, { status: 409 }); }
}
