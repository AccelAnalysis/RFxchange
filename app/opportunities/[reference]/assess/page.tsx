import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { OpportunityAssessmentWorkspace } from "@/src/components/rfx/OpportunityAssessmentWorkspace";
import { OpportunityAssessmentUnavailable } from "@/src/components/rfx/OpportunityAssessmentUnavailable";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { OpportunityPursuitError, type OpportunityPursuitWorkspace } from "@/src/application/rfx/opportunity-pursuit-service";
import { createServerOpportunityPursuitService } from "@/src/infrastructure/rfx/opportunity-pursuit-runtime";

export const dynamic = "force-dynamic";

function discoveryReturnHref(value: string | string[] | undefined, reference: string): string {
  const fallback = `/opportunities?selected=${encodeURIComponent(reference)}`;
  const candidate = typeof value === "string" && value.length <= 2_000 ? value : null;
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  const parsed = new URL(candidate, "https://rfxchange.invalid");
  if (parsed.origin !== "https://rfxchange.invalid" || parsed.pathname !== "/opportunities") return fallback;
  const allowed = new Set(["q", "deadline", "watched", "locality", "capability", "requestFamily", "cursor", "selected"]);
  const safe = new URLSearchParams();
  for (const [key, item] of parsed.searchParams) if (allowed.has(key) && item.length <= 500) safe.append(key, item);
  safe.set("selected", reference);
  return `/opportunities?${safe.toString()}`;
}

export default async function OpportunityAssessmentPage({ params, searchParams }: Readonly<{ params: Promise<{ reference: string }>; searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>> }>) {
  const { reference } = await params;
  const query = searchParams ? await searchParams : {};
  const returnHref = discoveryReturnHref(query.returnTo, reference);
  const currentHref = `/opportunities/${encodeURIComponent(reference)}/assess?returnTo=${encodeURIComponent(returnHref)}`;
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect(`/signin?returnTo=${encodeURIComponent(currentHref)}`);
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");
  let outcome: Readonly<{ kind: "available"; workspace: OpportunityPursuitWorkspace }> | Readonly<{ kind: "unavailable"; error: OpportunityPursuitError }>;
  try {
    const workspace = await createServerOpportunityPursuitService().workspace({ context: access.context, organizationId: access.membership.organizationId, userId: access.context.user.id, membershipId: access.membership.id }, reference);
    outcome = Object.freeze({ kind: "available", workspace });
  } catch (error) {
    if (!(error instanceof OpportunityPursuitError)) throw error;
    outcome = Object.freeze({ kind: "unavailable", error });
  }
  if (outcome.kind === "unavailable") return <OpportunityAssessmentUnavailable errorCode={outcome.error.code} returnHref={returnHref} retryHref={currentHref} />;
  return <OpportunityAssessmentWorkspace workspace={outcome.workspace} returnHref={returnHref} />;
}
