import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { buildUnifiedAdministrativeWorkQueue } from "@/src/application/admin/unified-work-queue";
import { AdminPortalShell } from "@/src/components/admin/AdminPortalShell";
import { AdminWorkQueueWorkspace } from "@/src/components/admin/AdminWorkQueueWorkspace";
import { ADMINISTRATIVE_WORK_STATUSES } from "@/src/domain/admin-work-queue/model";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminPortalAccess } from "@/src/infrastructure/auth/admin-route-runtime";
import {
  authorityWithActiveGlobalGrants,
  createServerAdministrativeWorkQueueProvider,
} from "@/src/infrastructure/admin/operating-core-runtime";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";

const SEVERITIES = ["low", "normal", "high", "critical"] as const;
const ASSIGNMENTS = ["all", "mine", "unassigned"] as const;

function first(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && value[0]?.trim()) return value[0].trim();
  return null;
}

export default async function AdminWorkQueuesPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const requestedStatus = first(params.status) ?? "all";
  const requestedSeverity = first(params.severity) ?? "all";
  const requestedAssignment = first(params.assignment) ?? "all";
  const requestedCaseId = first(params.caseId);
  const status = requestedStatus === "all" || ADMINISTRATIVE_WORK_STATUSES.includes(
    requestedStatus as (typeof ADMINISTRATIVE_WORK_STATUSES)[number],
  ) ? requestedStatus : "all";
  const severity = requestedSeverity === "all" || SEVERITIES.includes(
    requestedSeverity as (typeof SEVERITIES)[number],
  ) ? requestedSeverity : "all";
  const assignment = ASSIGNMENTS.includes(
    requestedAssignment as (typeof ASSIGNMENTS)[number],
  ) ? requestedAssignment : "all";

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  const access = await resolveAdminPortalAccess({ sessionCookie });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fadmin%2Fwork-queues");
  if (
    access.kind === "privileged-access-denied" &&
    access.reason === "recent-reauthentication-required"
  ) {
    redirect("/signin?returnTo=%2Fadmin%2Fwork-queues");
  }
  if (access.kind !== "authorized") notFound();

  const destination = access.destinations.find(
    (candidate) => candidate.key === "work-queues" && candidate.scope.kind === "GLOBAL",
  );
  if (!destination) notFound();

  const now = new Date().toISOString();
  const authority = authorityWithActiveGlobalGrants(access.authority, access.grants, now);
  const administratorId = String(access.account.administratorId);
  const queue = await buildUnifiedAdministrativeWorkQueue(
    authority,
    [createServerAdministrativeWorkQueueProvider(getServerFirestore())],
    now,
  );
  const items = queue.filter((item) => {
    if (status !== "all" && item.status !== status) return false;
    if (severity !== "all" && item.severity !== severity) return false;
    if (assignment === "mine" && item.assignedAdministratorId !== administratorId) return false;
    if (assignment === "unassigned" && item.assignedAdministratorId) return false;
    return true;
  });
  const selected = requestedCaseId
    ? items.find((item) => String(item.id) === requestedCaseId) ?? null
    : items[0] ?? null;

  return (
    <AdminPortalShell
      destinations={access.destinations}
      currentDestination="work-queues"
      currentScope={destination.scope.value}
    >
      <AdminWorkQueueWorkspace
        items={items}
        selected={selected}
        currentAdministratorId={administratorId}
        status={status}
        severity={severity}
        assignment={assignment}
      />
    </AdminPortalShell>
  );
}
