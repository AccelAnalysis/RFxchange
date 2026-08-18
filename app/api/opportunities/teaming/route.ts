import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { OpportunityTeamingError, type OpportunityTeamingScope, type VerifiedTeammateCandidate } from "@/src/application/rfx/opportunity-teaming-service";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import { loadAuthorizedNetworkDiscovery } from "@/src/infrastructure/network-discovery/runtime";
import { attemptTeamInvitationDelivery, createServerOpportunityTeamingService } from "@/src/infrastructure/rfx/opportunity-teaming-runtime";

export const runtime = "nodejs";

async function participantScope(): Promise<OpportunityTeamingScope | NextResponse> {
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") return NextResponse.json({ error: "Participant activation is required.", destination: participantEntryDestination(access) }, { status: 403 });
  if (access.kind === "wrong-organization" || access.kind === "restricted" || access.state.lifecycleState !== "open-platform") return NextResponse.json({ error: "RFx teaming is unavailable." }, { status: 403 });
  return Object.freeze({
    context: access.context,
    organizationId: access.membership.organizationId,
    userId: access.context.user.id,
    membershipId: access.membership.id,
    acquisitionContext: access.state.acquisitionContext
      ? Object.freeze({ id: access.state.acquisitionContext.id, kind: access.state.acquisitionContext.kind, subjectReference: access.state.acquisitionContext.subjectReference })
      : null,
  });
}

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  try { return Boolean(origin && (origin === request.nextUrl.origin || (host && new URL(origin).host === host))); } catch { return false; }
}

function problem(request: NextRequest, error: unknown) {
  const status = error instanceof OpportunityTeamingError
    ? error.code === "forbidden" ? 403 : error.code === "not-found" ? 404 : error.code === "conflict" ? 409 : error.code === "dependency-unavailable" ? 503 : 400
    : 500;
  return apiProblem(request, {
    status,
    code: error instanceof OpportunityTeamingError ? error.code : "dependency-unavailable",
    participantMessage: status === 404 ? "This team invitation is unavailable." : status === 403 ? "RFx teaming is unavailable for this organization membership." : status === 409 ? "The opportunity, gap, candidate, or invitation changed. Review the current facts and try again." : status === 400 ? "The teaming request contains unsupported information." : "RFx teaming is temporarily unavailable.",
    cause: error,
  });
}

async function verifiedCandidate(scope: OpportunityTeamingScope, reference: string, gapReference: string, organizationReference: string): Promise<VerifiedTeammateCandidate> {
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind !== "authorized" || access.membership.id !== scope.membershipId || access.membership.organizationId !== scope.organizationId) throw new OpportunityTeamingError("forbidden", "Candidate discovery is unavailable.");
  const mapProjection = await loadAuthorizedParticipantMapProjection(access);
  if (!mapProjection) throw new OpportunityTeamingError("dependency-unavailable", "Candidate geography is temporarily unavailable.");
  const context = await createServerOpportunityTeamingService().gapContext(scope, reference, gapReference);
  const discovery = await loadAuthorizedNetworkDiscovery({ access, mapProjection, capability: context.capabilityLabel, focusedOrganizationId: organizationReference });
  if (!discovery.available) throw new OpportunityTeamingError("forbidden", "Candidate discovery is unavailable for this geography.");
  const candidate = discovery.projection.organizations.find((item) => String(item.organizationId) === organizationReference);
  if (!candidate || candidate.match.source !== "confirmed-structured" || candidate.organizationId === scope.organizationId || candidate.organizationId === context.issuerOrganizationId) throw new OpportunityTeamingError("not-found", "Candidate organization is unavailable.");
  return Object.freeze({ organizationId: candidate.organizationId, displayName: candidate.profile.displayName, matchedCapabilityNames: candidate.match.matchedCapabilityNames });
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
    if (Number(request.headers.get("content-length") ?? "0") > 65_536) return NextResponse.json({ error: "Teaming request body is too large." }, { status: 413 });
    const scope = await participantScope();
    if (scope instanceof NextResponse) return scope;
    const body = await request.json() as Record<string, unknown>;
    const service = createServerOpportunityTeamingService();
    const action = String(body.action ?? "");
    if (action === "create") {
      const reference = String(body.reference ?? "");
      const gapReference = String(body.gapReference ?? "");
      const candidateReference = typeof body.candidateOrganizationId === "string" && body.candidateOrganizationId ? body.candidateOrganizationId : null;
      const candidate = candidateReference ? await verifiedCandidate(scope, reference, gapReference, candidateReference) : null;
      const result = await service.createInvitation(scope, {
        commandId: String(body.commandId ?? ""), reference, gapReference,
        proposedCapacity: String(body.proposedCapacity ?? ""), responsibilitySummary: String(body.responsibilitySummary ?? ""),
        candidate, recipientDisplayName: typeof body.recipientDisplayName === "string" ? body.recipientDisplayName : null,
        recipientEmail: typeof body.recipientEmail === "string" ? body.recipientEmail : null,
      });
      if (!result.replayed && result.invitation.target.kind === "external") await attemptTeamInvitationDelivery(result.invitation);
      return NextResponse.json({ invitation: result.view, replayed: result.replayed }, { status: result.replayed ? 200 : 201 });
    }
    if (action === "accept" || action === "decline" || action === "revoke") {
      const result = await service.decide(scope, {
        commandId: String(body.commandId ?? ""), invitationId: String(body.invitationId ?? ""), expectedVersion: Number(body.expectedVersion), action,
        boundaryVersion: action === "accept" ? Number(body.boundaryVersion) : null,
        boundaryLocale: action === "accept" ? String(body.boundaryLocale ?? "") : null,
      });
      return NextResponse.json({ invitation: result.view, replayed: result.replayed });
    }
    throw new OpportunityTeamingError("invalid", "Teaming action is unsupported.");
  } catch (error) { return problem(request, error); }
}
