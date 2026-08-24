import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { visibleImplementedAdminRuntimeDestinations } from "@/src/application/admin/portal-navigation";
import { AdminPortalShell } from "@/src/components/admin/AdminPortalShell";
import { ProviderReviewConsole } from "@/src/components/resource-providers/ProviderReviewConsole";
import { organizationId as parseOrganizationId } from "@/src/domain/organizations/model";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";
import { createServerResourceProviderFoundationService } from "@/src/infrastructure/resource-providers/runtime";

function first(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && value[0]?.trim()) return value[0].trim();
  return null;
}

export default async function ResourceProvidersAdminPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const requestedOrganizationId = first(params.organizationId);
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  const returnPath = requestedOrganizationId
    ? `/admin/resource-providers?organizationId=${encodeURIComponent(requestedOrganizationId)}`
    : "/admin/resource-providers";
  const access = await resolveAdminRoute({
    sessionCookie,
    permission: "provider.application.read",
    scope: requestedOrganizationId ? `ORGANIZATION:${requestedOrganizationId}` : "GLOBAL",
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

  const adminScope = Object.freeze({
    context: access.context,
    authority: access.authority,
    administratorId: String(access.account.administratorId),
    permission: "provider.application.read" as const,
    scope: access.scope,
    commandId: "page-snapshot",
  });
  const service = createServerResourceProviderFoundationService();
  const detail = requestedOrganizationId
    ? await service.adminDetail(adminScope, requestedOrganizationId)
    : null;
  const applications = requestedOrganizationId && access.scope.kind !== "GLOBAL"
    ? [Object.freeze({
        id: String(detail?.application.id ?? requestedOrganizationId),
        organizationId: requestedOrganizationId,
        status: detail?.application.status ?? "unknown",
        version: detail?.application.version ?? 0,
        categories: detail?.application.content.categories ?? [],
        submittedAt: detail?.application.submittedAt ?? null,
        updatedAt: detail?.application.updatedAt ?? "",
      })]
    : await service.adminQueue(adminScope);

  const foundation = createServerFirestoreFoundationRepositories(getServerFirestore());
  const organizationNames = new Map(await Promise.all(
    [...new Set(applications.map((application) => String(application.organizationId)))].map(
      async (organizationId) => {
        const profile = await foundation.organizations.profiles.getByOrganizationId(
          parseOrganizationId(organizationId),
        );
        return [organizationId, profile?.displayName ?? "Organization"] as const;
      },
    ),
  ));
  const applicationRows = applications.map((application) => Object.freeze({
    ...application,
    displayName: organizationNames.get(String(application.organizationId)) ?? "Organization",
  }));

  const reviewAccess = requestedOrganizationId
    ? await resolveAdminRoute({
        sessionCookie,
        permission: "provider.application.review",
        scope: `ORGANIZATION:${requestedOrganizationId}`,
        access: "write",
      })
    : null;
  const canReview = reviewAccess?.kind === "authorized";
  const destinations = visibleImplementedAdminRuntimeDestinations(
    access.authority,
    access.grants,
    new Date().toISOString(),
  );

  return (
    <AdminPortalShell
      destinations={destinations}
      currentDestination="resource-providers"
      currentScope={access.scope.value}
    >
      <ProviderReviewConsole
        applications={applicationRows}
        detail={detail}
        canReview={canReview}
      />
    </AdminPortalShell>
  );
}
