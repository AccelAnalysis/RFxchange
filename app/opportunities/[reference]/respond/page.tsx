import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { RfxCycleError } from "@/src/domain/rfx/cycle";
import { createServerRfxCycleService } from "@/src/infrastructure/rfx/rfx-cycle-runtime";
import { RfxResponseWorkspace } from "@/src/components/rfx/RfxResponseWorkspace";
import { ParticipantShell } from "@/src/components/participant/ParticipantWorkspace";

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

export default async function RespondPage({ params, searchParams }: Readonly<{
  params: Promise<{ reference: string }>;
  searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>) {
  const { reference } = await params;
  const query = searchParams ? await searchParams : {};
  const returnHref = safeReturn(query.returnTo, reference);
  const currentHref = `/opportunities/${encodeURIComponent(reference)}/respond?returnTo=${encodeURIComponent(returnHref)}`;
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind === "unauthenticated") redirect(`/signin?returnTo=${encodeURIComponent(currentHref)}`);
  if (access.kind === "access-resolution-required" || access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform") redirect(access.state.controlledPlatformUrl ?? "/join");

  try {
    const workspace = await createServerRfxCycleService().responderWorkspace({
      context: access.context,
      organizationId: access.membership.organizationId,
      membershipId: access.membership.id,
      userId: access.context.user.id,
    }, reference);
    return <RfxResponseWorkspace initialWorkspace={workspace} returnHref={returnHref} />;
  } catch (error) {
    if (!(error instanceof RfxCycleError)) throw error;
    return <ParticipantShell activeItem="opportunities-rfx">
      <main style={{ width: "min(100%, 42rem)", margin: "0 auto", padding: "1.5rem 1rem 6rem" }}>
        <p style={{ fontWeight: 750 }}>Response unavailable</p>
        <h1>Review the pursuit before responding</h1>
        <p>{error.code === "conflict" ? error.message : "This response action is not available for the current organization membership."}</p>
        <p><Link href={returnHref}>Return to the opportunity</Link></p>
      </main>
    </ParticipantShell>;
  }
}
