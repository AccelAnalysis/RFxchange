import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminPortalAccess } from "@/src/infrastructure/auth/admin-route-runtime";

export default async function AdminEntryPage() {
  const cookieStore = await cookies();
  const access = await resolveAdminPortalAccess({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });

  if (access.kind === "unauthenticated") {
    redirect("/signin?returnTo=%2Fadmin");
  }
  if (
    access.kind === "privileged-access-denied" &&
    access.reason === "recent-reauthentication-required"
  ) {
    redirect("/signin?returnTo=%2Fadmin");
  }
  if (access.kind !== "authorized") notFound();

  // /admin/overview remains intentionally unregistered until it has a truthful complete runtime.
  redirect(access.destinations[0].href);
}
