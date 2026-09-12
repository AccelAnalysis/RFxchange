import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { PublicDataReview } from "@/src/components/communications/PublicDataReview";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import styles from "@/src/components/communications/ServiceSettings.module.css";
export default async function Page({ searchParams }: { searchParams: Promise<{ organizationId?: string }> }) {
  const access = await resolveAdminRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value, permission: "organization.profile.read", scope: "GLOBAL", access: "read" });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fadmin%2Fenrichment");
  if (access.kind !== "authorized") notFound();
  const organizationId = (await searchParams).organizationId ?? "";
  return <><section className={styles.panel}><a href="/admin/system">Integrations & system</a><h1>Organization enrichment review</h1>
    <form><label>Organization ID<input name="organizationId" required pattern="[A-Za-z0-9._:-]{1,128}" defaultValue={organizationId}/></label><button>Open review</button></form></section>
    {/^[A-Za-z0-9._:-]{1,128}$/.test(organizationId) && <PublicDataReview key={organizationId} organizationId={organizationId} admin/>}</>;
}
