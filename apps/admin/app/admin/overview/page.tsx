import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { buildAdministrativeCommandCenter } from "@/src/application/admin/command-center";
import { buildUnifiedAdministrativeWorkQueue } from "@/src/application/admin/unified-work-queue";
import { AdminCommandCenter } from "@/src/components/admin/AdminCommandCenter";
import { AdminPortalShell } from "@/src/components/admin/AdminPortalShell";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminPortalAccess } from "@/src/infrastructure/auth/admin-route-runtime";
import {
  authorityWithActiveGlobalGrants,
  createServerAdminCommandCenterProviders,
  createServerAdministrativeWorkQueueProvider,
} from "@/src/infrastructure/admin/operating-core-runtime";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";

export default async function AdminOverviewPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  const access = await resolveAdminPortalAccess({ sessionCookie });

  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fadmin%2Foverview");
  if (
    access.kind === "privileged-access-denied" &&
    access.reason === "recent-reauthentication-required"
  ) {
    redirect("/signin?returnTo=%2Fadmin%2Foverview");
  }
  if (access.kind !== "authorized") notFound();

  const destination = access.destinations.find(
    (candidate) => candidate.key === "overview" && candidate.scope.kind === "GLOBAL",
  );
  if (!destination) notFound();

  const now = new Date().toISOString();
  const authority = authorityWithActiveGlobalGrants(access.authority, access.grants, now);
  const db = getServerFirestore();
  const providers = createServerAdminCommandCenterProviders(db);
  const [model, workItems] = await Promise.all([
    buildAdministrativeCommandCenter(authority, providers.queueProviders, providers.healthProviders),
    buildUnifiedAdministrativeWorkQueue(
      authority,
      [createServerAdministrativeWorkQueueProvider(db)],
      now,
    ),
  ]);
  const administratorId = String(access.account.administratorId);
  const assignedToMe = workItems.filter((item) => item.assignedAdministratorId === administratorId).length;
  const unassigned = workItems.filter((item) => !item.assignedAdministratorId).length;
  const overdue = workItems.filter((item) =>
    item.slaDueAt &&
    !["resolved", "closed"].includes(item.status) &&
    Date.parse(item.slaDueAt) < Date.parse(now),
  ).length;

  return (
    <AdminPortalShell
      destinations={access.destinations}
      currentDestination="overview"
      currentScope={destination.scope.value}
    >
      <AdminCommandCenter
        model={model}
        assignedToMe={assignedToMe}
        unassigned={unassigned}
        overdue={overdue}
      />
    </AdminPortalShell>
  );
}
