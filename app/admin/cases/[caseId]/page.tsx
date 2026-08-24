import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { visibleImplementedAdminRuntimeDestinations } from "@/src/application/admin/portal-navigation";
import { AdminCaseWorkspace } from "@/src/components/admin/AdminCaseWorkspace";
import { AdminPortalShell } from "@/src/components/admin/AdminPortalShell";
import {
  administrativeCaseId,
  assessAdministrativeCaseSla,
  nextAdministrativeCaseStatus,
} from "@/src/domain/admin-cases/model";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import {
  FirestoreAdministrativeCaseEventRepository,
  FirestoreAdministrativeCaseRepository,
} from "@/src/infrastructure/firestore/administrative-case-repository";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";

export default async function AdminCasePage({
  params,
}: Readonly<{
  params: Promise<Readonly<{ caseId: string }>>;
}>) {
  const { caseId: rawCaseId } = await params;
  let caseId;
  try {
    caseId = administrativeCaseId(decodeURIComponent(rawCaseId));
  } catch {
    notFound();
  }

  const db = getServerFirestore();
  const cases = new FirestoreAdministrativeCaseRepository(db);
  const caseRecord = await cases.getById(caseId);
  if (!caseRecord) notFound();

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  const returnPath = `/admin/cases/${encodeURIComponent(String(caseRecord.id))}`;
  const access = await resolveAdminRoute({
    sessionCookie,
    permission: String(caseRecord.readPermission),
    scope: `CASE:${String(caseRecord.id)}`,
  });
  if (access.kind === "unauthenticated") {
    redirect(`/signin?returnTo=${encodeURIComponent(returnPath)}`);
  }
  if (
    access.kind === "privileged-access-denied" &&
    access.reason === "recent-reauthentication-required"
  ) {
    redirect(`/signin?returnTo=${encodeURIComponent(returnPath)}`);
  }
  if (access.kind !== "authorized") notFound();

  const events = await new FirestoreAdministrativeCaseEventRepository(db).listByCaseId(caseRecord.id);
  const nextStatus = nextAdministrativeCaseStatus(caseRecord.status);
  const transitionAccess = nextStatus
    ? await resolveAdminRoute({
        sessionCookie,
        permission: String(caseRecord.actionPermission),
        scope: `CASE:${String(caseRecord.id)}`,
        access: "write",
      })
    : null;
  const organizationAccess = caseRecord.organizationId
    ? await resolveAdminRoute({
        sessionCookie,
        permission: "organization.profile.read",
        scope: `ORGANIZATION:${caseRecord.organizationId}`,
      })
    : null;
  const destinations = visibleImplementedAdminRuntimeDestinations(
    access.authority,
    access.grants,
    new Date().toISOString(),
  );
  const workDestination = destinations.find(
    (candidate) => candidate.key === "work-queues" && candidate.scope.kind === "GLOBAL",
  );

  return (
    <AdminPortalShell
      destinations={destinations}
      currentDestination={workDestination ? "work-queues" : undefined}
      currentScope={`CASE:${String(caseRecord.id)}`}
      navigationScope={workDestination?.scope.value}
    >
      <AdminCaseWorkspace
        caseRecord={caseRecord}
        events={events}
        slaState={assessAdministrativeCaseSla(caseRecord, new Date().toISOString())}
        nextStatus={nextStatus}
        canTransition={transitionAccess?.kind === "authorized"}
        organizationHref={caseRecord.organizationId && organizationAccess?.kind === "authorized"
          ? `/admin/organizations/${encodeURIComponent(caseRecord.organizationId)}`
          : null}
      />
    </AdminPortalShell>
  );
}
