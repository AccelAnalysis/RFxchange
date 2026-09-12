import { NextRequest, NextResponse } from "next/server";
import { authorizeOrganizationOperation } from "@/src/application/auth/authorize-organization-operation";
import { createServerFirebaseAccountSecurityService } from "@/src/infrastructure/auth/firebase-account-security-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createFirestoreFoundationRepositories } from "@/src/infrastructure/firestore/repositories";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { publicEnrichmentAdapters } from "@/functions/src/runtime/public-enrichment-adapters";
import { runPersistedPublicEnrichment } from "@/functions/src/runtime/public-enrichment-store";

import { boundedRequestBytes } from "@/src/infrastructure/http/bounded-request";

export const runtime = "nodejs";
async function accessFor(request: NextRequest) {
  return resolveParticipantRoute({ sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    requestedOrganizationId: request.nextUrl.searchParams.get("organizationId") ?? undefined });
}
export async function GET(request: NextRequest) {
  const access = await accessFor(request);
  if (access.kind !== "authorized") return NextResponse.json({ error: "Organization access required." }, { status: 403 });
  const snapshot = await getServerFirestore().collection("publicEnrichmentRuns").where("organizationId", "==", String(access.membership.organizationId)).orderBy("startedAt", "desc").limit(10).get();
  return NextResponse.json({ runs: snapshot.docs.map((doc) => {
    return publicRun(doc.data());
  }) }, { headers: { "cache-control": "no-store" } });
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Request origin required." }, { status: 403 });
  let raw: string;
  try { raw = (await boundedRequestBytes(request, 2048)).toString("utf8"); } catch { return NextResponse.json({ error: "Request too large." }, { status: 413 }); }
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body || typeof body.commandId !== "string" || !/^[A-Za-z0-9._:-]{8,128}$/.test(body.commandId) || (body.uei != null && (typeof body.uei !== "string" || !/^[A-Z0-9]{12}$/.test(body.uei)))) return NextResponse.json({ error: "A request ID and valid UEI are required." }, { status: 400 });
  if (body.action != null && !["review", "check"].includes(String(body.action))) return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  const access = await accessFor(request);
  if (access.kind !== "authorized") return NextResponse.json({ error: "Organization access required." }, { status: 403 });
  const db = getServerFirestore();
  const foundation = createFirestoreFoundationRepositories(db);
  const authorization = await authorizeOrganizationOperation({ context: access.context, organizationId: access.membership.organizationId, membershipId: access.membership.id, permission: "organization.profile.manage" }, {
    accountSecurity: createServerFirebaseAccountSecurityService(), organizations: foundation.organizations.accounts,
    memberships: foundation.users.memberships, authorizations: foundation.organizationAuthorization, restrictions: foundation.lifecycle.restrictions,
  });
  if (!authorization.allowed) return NextResponse.json({ error: "Profile management access required." }, { status: 403 });
  if (body.action === "review") {
    if (typeof body.runId !== "string" || !/^[a-f0-9]{64}$/.test(body.runId)) return NextResponse.json({ error: "Invalid review." }, { status: 400 });
    const ref = db.collection("publicEnrichmentRuns").doc(body.runId);
    try {
      await db.runTransaction(async tx => {
        const run = await tx.get(ref);
        if (!run.exists || run.get("organizationId") !== String(access.membership.organizationId) || !run.get("completedAt")) throw new Error("unavailable");
        if (run.get("reviewStatus") === "reviewed") return;
        tx.update(ref, { reviewStatus: "reviewed", reviewedByUserId: String(access.context.user.id), reviewedAt: new Date().toISOString() });
        tx.create(db.collection("publicEnrichmentEvents").doc(`${body.runId}:reviewed`), { organizationId: String(access.membership.organizationId), runId: body.runId, eventType: "enrichment_reviewed", actorUserId: String(access.context.user.id), occurredAt: new Date().toISOString() });
      });
      return NextResponse.json({ reviewed: true });
    } catch { return NextResponse.json({ error: "This review is unavailable." }, { status: 409 }); }
  }
  const profiles = await db.collection("organizationProfiles").where("organizationId", "==", String(access.membership.organizationId)).limit(1).get();
  const displayName = profiles.docs[0]?.get("displayName");
  if (typeof displayName !== "string") return NextResponse.json({ error: "Organization profile unavailable." }, { status: 409 });
  // Per-organization limit is transactional, so simultaneous requests cannot fan out unboundedly.
  const limiter = db.collection("publicEnrichmentLimits").doc(String(access.membership.organizationId));
  const allowed = await db.runTransaction(async (tx) => {
    const last = await tx.get(limiter);
    if (last.exists && last.get("commandId") !== body.commandId && Date.now() - Number(last.get("requestedAt")) < 60_000) return false;
    tx.set(limiter, { organizationId: String(access.membership.organizationId), commandId: body.commandId, requestedAt: Date.now() });
    return true;
  });
  if (!allowed) return NextResponse.json({ error: "Please wait a minute before checking again." }, { status: 429 });
  try {
    const run = await runPersistedPublicEnrichment(db, { organizationId: String(access.membership.organizationId), displayName, uei: typeof body.uei === "string" ? body.uei : null }, body.commandId, publicEnrichmentAdapters(process.env.SAM_API_KEY));
    return NextResponse.json({ run: publicRun({ ...run }) }, { headers: { "cache-control": "no-store" } });
  } catch { return NextResponse.json({ error: "This check is already running or its request changed. Refresh to see its progress." }, { status: 409 }); }
}
function publicRun(run: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(run).filter(([key]) => !["fingerprint", "leaseUntil", "leaseOwner"].includes(key)));
}
