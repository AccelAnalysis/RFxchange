import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";

/**
 * Legacy compatibility route.
 *
 * Organization-authority establishment is part of the integrated activation journey at /join.
 * Keeping a second fixture-driven authority workspace would let production navigation diverge from
 * persisted activation state, so this route only resolves the authenticated state and forwards to
 * the canonical runtime surface.
 */
export default async function OrganizationAuthorityPage() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });

  if (access.kind === "unauthenticated") {
    redirect("/signin?returnTo=%2Forganization-authority");
  }
  if (access.kind === "access-resolution-required") {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "authorized") redirect("/organization-profile");
  redirect("/join");
}
