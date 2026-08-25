import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RfxResponseCollaborationWorkspace } from "@/src/components/rfx/RfxResponseCollaborationWorkspace";
import { ParticipantShell } from "@/src/components/participant/ParticipantWorkspace";
import { RfxResponseCollaborationError } from "@/src/domain/rfx/collaboration";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerRfxResponseCollaborationService } from "@/src/infrastructure/rfx/rfx-response-collaboration-runtime";

export const dynamic = "force-dynamic";

function safeReturn(value: string | string[] | undefined, reference: string): string {
  const fallback = `/opportunities/${encodeURIComponent(reference)}/assess`;
  const candidate = typeof value === "string" && value.length <= 2_000 ? value : null;
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  try {
    const parsed = new URL(candidate, "https://rfxchange.invalid");
    if (parsed.origin !== "https://rfxchange.invalid" || !parsed.pathname.startsWith("/opportunities")) return fallback;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}

export default async function RfxCollaboratePage({ params, searchParams }: Readonly<{
  params: Promise<{ reference: string }>;
  searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>) {
  const { reference } = await params;
  const query = searchParams ? await searchParams : {};
  const lead = typeof query.lead === "string" ? query.lead : null;
  const returnHref = safeReturn(query.returnTo, reference);
  const currentHref = `/opportunities/${encodeURIComponent(reference)}/collaborate${lead ? `?lead=${encodeURIComponent(lead)}` : ""}`;
  const access = await resolveParticipantRoute({
    sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") redirect(`/signin?returnTo=${encodeURIComponent(currentHref)}`);
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");

  try {
    const workspace = await createServerRfxResponseCollaborationService().workspace({
      context: access.context,
      organizationId: access.membership.organizationId,
      membershipId: access.membership.id,
      userId: access.context.user.id,
    }, { reference, leadOrganizationId: lead });
    return <RfxResponseCollaborationWorkspace
      initialWorkspace={workspace}
      reference={reference}
      leadOrganizationId={lead}
      returnHref={returnHref}
    />;
  } catch (error) {
    if (!(error instanceof RfxResponseCollaborationError)) throw error;
    return <ParticipantShell activeItem="opportunities-rfx"><main style={{ width: "min(100%, 42rem)", margin: "0 auto", padding: "1.5rem 1rem 6rem" }}>
      <p style={{ fontWeight: 750 }}>Collaboration unavailable</p>
      <h1>Response work has not been assigned here yet</h1>
      <p>{error.code === "not-found" ? "The lead organization must start its response before assigning teammate work." : error.message}</p>
      <p><Link href={returnHref}>Return to the RFx</Link></p>
    </main></ParticipantShell>;
  }
}
