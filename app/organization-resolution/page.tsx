import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";

/** Legacy compatibility route; organization resolution now lives in the integrated /join journey. */
export default async function OrganizationResolutionPage() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });

  if (access.kind === "unauthenticated") {
    redirect("/signin?returnTo=%2Forganization-resolution");
  }
  if (access.kind === "authorized") redirect("/organization-profile");
  redirect("/join");
}
