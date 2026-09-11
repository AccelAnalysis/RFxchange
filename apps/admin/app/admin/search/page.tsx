import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { universalAdminSearch } from "@/src/application/admin/universal-search";
import { AdminPortalShell } from "@/src/components/admin/AdminPortalShell";
import { AdminUniversalSearchResults } from "@/src/components/admin/AdminUniversalSearchResults";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminPortalAccess } from "@/src/infrastructure/auth/admin-route-runtime";
import {
  authorityWithActiveGlobalGrants,
  createServerAdminSearchProviders,
} from "@/src/infrastructure/admin/operating-core-runtime";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";

function first(value: string | string[] | undefined): string {
  if (typeof value === "string") return value.trim().slice(0, 160);
  if (Array.isArray(value) && typeof value[0] === "string") return value[0].trim().slice(0, 160);
  return "";
}

export default async function AdminSearchPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const query = first(params.q);
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  const access = await resolveAdminPortalAccess({ sessionCookie });
  if (access.kind === "unauthenticated") {
    redirect(`/signin?returnTo=${encodeURIComponent(query ? `/admin/search?q=${query}` : "/admin/search")}`);
  }
  if (
    access.kind === "privileged-access-denied" &&
    access.reason === "recent-reauthentication-required"
  ) {
    redirect(`/signin?returnTo=${encodeURIComponent(query ? `/admin/search?q=${query}` : "/admin/search")}`);
  }
  if (access.kind !== "authorized") notFound();

  const globalDestination = access.destinations.find(
    (candidate) =>
      (candidate.key === "overview" || candidate.key === "work-queues") &&
      candidate.scope.kind === "GLOBAL",
  );
  if (!globalDestination) notFound();

  const now = new Date().toISOString();
  const authority = authorityWithActiveGlobalGrants(access.authority, access.grants, now);
  const results = query.length >= 2
    ? await universalAdminSearch({
        authority,
        query,
        providers: createServerAdminSearchProviders(
          getServerFirestore(),
          authority.effectivePermissions,
        ),
        limit: 40,
      })
    : [];

  return (
    <AdminPortalShell
      destinations={access.destinations}
      currentScope="GLOBAL"
    >
      <AdminUniversalSearchResults query={query} results={results} />
    </AdminPortalShell>
  );
}
