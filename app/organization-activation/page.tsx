import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";

/** Legacy compatibility route; marker activation now lives in the integrated /join journey. */
export default async function OrganizationActivationPage() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });

  if (access.kind === "unauthenticated") {
    redirect("/signin?returnTo=%2Forganization-activation");
  }
  if (access.kind === "authorized") {
    redirect(access.state.controlledPlatformUrl ?? "/geography/canvas");
  }
  redirect("/join");
}
