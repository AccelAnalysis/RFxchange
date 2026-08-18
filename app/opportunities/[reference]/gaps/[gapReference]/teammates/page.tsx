import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OpportunityTeamingError } from "@/src/application/rfx/opportunity-teaming-service";
import { OpportunityAssessmentUnavailable } from "@/src/components/rfx/OpportunityAssessmentUnavailable";
import { OpportunityTeammateWorkspace, type OpportunityTeammateCandidateView } from "@/src/components/rfx/OpportunityTeammateWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { ParticipantRouteDependencyUnavailableError, RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { loadAuthorizedNetworkDiscovery } from "@/src/infrastructure/network-discovery/runtime";
import { createServerOpportunityTeamingService } from "@/src/infrastructure/rfx/opportunity-teaming-runtime";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined, maximum = 500): string {
  const normalized = (typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "").trim();
  return normalized.length <= maximum ? normalized : "";
}

function safeReturn(value: string, reference: string): string {
  const fallback = `/opportunities/${encodeURIComponent(reference)}/assess`;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.length > 2_000) return fallback;
  const parsed = new URL(value, "https://rfxchange.invalid");
  return parsed.origin === "https://rfxchange.invalid" && parsed.pathname === `/opportunities/${encodeURIComponent(reference)}/assess` ? `${parsed.pathname}${parsed.search}` : fallback;
}

function matchesNeed(candidate: Readonly<{ profile: Readonly<{ displayName: string }>; capabilities: readonly Readonly<{ label: string; definition: string; domainLabel: string; familyLabel: string; specialties: readonly string[] }>[] }>, need: string): boolean {
  const terms = [...new Set(need.toLocaleLowerCase("en-US").split(/[^a-z0-9]+/).filter((item) => item.length >= 2))];
  if (!terms.length) return true;
  const corpus = [candidate.profile.displayName, ...candidate.capabilities.flatMap((item) => [item.label, item.definition, item.domainLabel, item.familyLabel, ...item.specialties])].join(" ").toLocaleLowerCase("en-US");
  return terms.every((term) => corpus.includes(term));
}

export default async function OpportunityTeammatesPage({ params, searchParams }: Readonly<{ params: Promise<{ reference: string; gapReference: string }>; searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>> }>) {
  const { reference, gapReference } = await params; const query = searchParams ? await searchParams : {};
  const returnHref = safeReturn(first(query.returnTo, 2_000), reference);
  const currentHref = `/opportunities/${encodeURIComponent(reference)}/gaps/${encodeURIComponent(gapReference)}/teammates?returnTo=${encodeURIComponent(returnHref)}`;
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect(`/signin?returnTo=${encodeURIComponent(currentHref)}`);
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");
  const service = createServerOpportunityTeamingService();
  const scope = Object.freeze({ context: access.context, organizationId: access.membership.organizationId, userId: access.context.user.id, membershipId: access.membership.id, acquisitionContext: access.state.acquisitionContext });
  try {
    const context = await service.gapContext(scope, reference, gapReference);
    const mapProjection = await loadAuthorizedParticipantMapProjection(access);
    if (!mapProjection) throw new ParticipantRouteDependencyUnavailableError("workspace-state", new Error("Authorized teammate geography is incomplete."));
    const capacity = ["capability-contributor", "delivery-support", "subject-matter-support"].includes(first(query.capacity)) ? first(query.capacity) : "capability-contributor";
    const need = first(query.need, 160);
    const serviceArea = first(query.serviceArea);
    const discovery = await loadAuthorizedNetworkDiscovery({ access, mapProjection, capability: context.capabilityLabel, serviceGeographyId: serviceArea || null });
    const candidates: readonly OpportunityTeammateCandidateView[] = discovery.available ? Object.freeze(discovery.projection.organizations
      .filter((item) => item.match.source === "confirmed-structured" && item.organizationId !== context.organizationId && item.organizationId !== context.issuerOrganizationId && item.match.matchedCapabilityNames.some((name) => name.toLocaleLowerCase("en-US") === context.capabilityLabel.toLocaleLowerCase("en-US")) && matchesNeed(item, need))
      .map((item) => Object.freeze({ organizationId: String(item.organizationId), displayName: item.profile.displayName, matchedCapabilityNames: item.match.matchedCapabilityNames, serviceGeographyIds: item.serviceGeographyIds }))) : [];
    const invitations = await service.invitations(scope, reference);
    return <OpportunityTeammateWorkspace context={context} candidates={candidates} invitations={invitations} serviceAreas={discovery.available ? discovery.serviceAreaOptions : []} query={{ capacity, need, serviceArea }} returnHref={returnHref} />;
  } catch (error) {
    if (!(error instanceof OpportunityTeamingError)) throw error;
    return <OpportunityAssessmentUnavailable errorCode={error.code} returnHref={returnHref} retryHref={currentHref} />;
  }
}
