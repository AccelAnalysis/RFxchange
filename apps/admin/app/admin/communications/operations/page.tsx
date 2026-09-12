import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminCommunicationOperations } from "@/src/components/communications/AdminCommunicationOperations";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
export default async function Page() {
  const access = await resolveAdminRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value, permission: "system.health.read", scope: "GLOBAL", access: "read" });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fadmin%2Fcommunications%2Foperations");
  if (access.kind !== "authorized") notFound();
  return <AdminCommunicationOperations/>;
}
