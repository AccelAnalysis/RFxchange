import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import type { AdminDomainSurfaceKey } from "@/src/application/admin/domain-operations";
import type { ImplementedAdminRuntimeDestinationKey } from "@/src/application/admin/portal-navigation";
import { AdminPortalShell } from "@/src/components/admin/AdminPortalShell";
import { AdminDomainWorkspace } from "@/src/components/admin/AdminDomainWorkspace";
import {
  authorizeScopedAdministrativeAction,
  createScopedAdministrativeActionRequirement,
} from "@/src/domain/admin-authorization/grants";
import { requireCataloguedAdminPermission } from "@/src/domain/admin-authorization/model";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminPortalAccess } from "@/src/infrastructure/auth/admin-route-runtime";
import { loadAdminDomainSurface } from "@/src/infrastructure/admin/domain-operations-runtime";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";

function first(value: string | string[] | undefined): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return "";
}

export async function AdminDomainPage({
  destinationKey,
  surfaceKey = destinationKey as AdminDomainSurfaceKey,
  currentPath,
  searchParams,
}: Readonly<{
  destinationKey: ImplementedAdminRuntimeDestinationKey;
  surfaceKey?: AdminDomainSurfaceKey;
  currentPath: string;
  searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const requestedScope = first(params.scope);
  const query = first(params.q);
  const status = first(params.status);
  const cursor = first(params.cursor);
  const selectedId = first(params.selected) || null;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  const access = await resolveAdminPortalAccess({ sessionCookie });
  const returnParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") returnParams.set(key, value);
  }
  const returnTo = encodeURIComponent(`${currentPath}${returnParams.size ? `?${returnParams}` : ""}`);
  if (access.kind === "unauthenticated") redirect(`/signin?returnTo=${returnTo}`);
  if (access.kind === "privileged-access-denied" && access.reason === "recent-reauthentication-required") redirect(`/signin?returnTo=${returnTo}`);
  if (access.kind !== "authorized") notFound();

  const candidates = access.destinations.filter((candidate) => candidate.key === destinationKey);
  const destination = requestedScope ? candidates.find((candidate) => candidate.scope.value === requestedScope) : candidates[0];
  if (!destination) notFound();

  const now = new Date().toISOString();
  const permissions = access.authority.effectivePermissions.map(requireCataloguedAdminPermission).filter((permission) =>
    authorizeScopedAdministrativeAction(
      access.authority,
      access.grants,
      createScopedAdministrativeActionRequirement({ permission, access: "read", scope: destination.scope.value }),
      { now, satisfiedConditionKeys: Object.freeze([]) },
    ).kind === "allow",
  );
  if (surfaceKey === "users-access" && (!permissions.includes(requireCataloguedAdminPermission("user.profile.read")) || !permissions.includes(requireCataloguedAdminPermission("user.access.read")))) notFound();

  const data = await loadAdminDomainSurface({
    db: getServerFirestore(), key: surfaceKey, scope: destination.scope, permissions,
    query: query || null, status: status || null, cursor: cursor || null,
  });

  return <AdminPortalShell destinations={access.destinations} currentDestination={destinationKey} currentScope={destination.scope.value}>
    <AdminDomainWorkspace data={data} query={query} status={status} selectedId={selectedId} currentPath={currentPath} scope={destination.scope.value} cursor={cursor}/>
  </AdminPortalShell>;
}
