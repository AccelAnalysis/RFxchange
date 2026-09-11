import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { visibleImplementedAdminRuntimeDestinations } from "@/src/application/admin/portal-navigation";
import { buildOrganization360 } from "@/src/application/admin/organization-360";
import { AdminPortalShell } from "@/src/components/admin/AdminPortalShell";
import { Organization360 } from "@/src/components/admin/Organization360";
import { hydrateEssentialOrganizationProfile } from "@/src/domain/organization-profile/model";
import { organizationId as parseOrganizationId } from "@/src/domain/organizations/model";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { createFirestoreGeographyRepositories } from "@/src/infrastructure/firestore/geography-repositories";
import { createFirestoreOrganizationLocationRepositories } from "@/src/infrastructure/firestore/organization-location";
import { createFirestoreOrganizationMarkerRepositories } from "@/src/infrastructure/firestore/organization-marker";
import { createFirestoreEssentialOrganizationProfileRepositories } from "@/src/infrastructure/firestore/organization-profile";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";

export default async function Organization360Page({
  params,
}: {
  readonly params: Promise<{ organizationId: string }>;
}) {
  const { organizationId: rawOrganizationId } = await params;
  let organizationId;
  try {
    organizationId = parseOrganizationId(rawOrganizationId);
  } catch {
    notFound();
  }

  const cookieStore = await cookies();
  const access = await resolveAdminRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    permission: "organization.profile.read",
    scope: `ORGANIZATION:${organizationId}`,
  });
  if (access.kind === "unauthenticated") {
    redirect(`/signin?returnTo=${encodeURIComponent(`/admin/organizations/${organizationId}`)}`);
  }
  if (
    access.kind === "privileged-access-denied" &&
    access.reason === "recent-reauthentication-required"
  ) {
    redirect(`/signin?returnTo=${encodeURIComponent(`/admin/organizations/${organizationId}`)}`);
  }
  if (access.kind !== "authorized") notFound();

  const db = getServerFirestore();
  const foundation = createServerFirestoreFoundationRepositories(db);
  const locations = createFirestoreOrganizationLocationRepositories(db);
  const profileState = createFirestoreEssentialOrganizationProfileRepositories(db);
  const markers = createFirestoreOrganizationMarkerRepositories(db);

  const [organization, profileRecord, completion, marker, location, serviceGeography, memberships, restriction] =
    await Promise.all([
      foundation.organizations.accounts.getById(organizationId),
      foundation.organizations.profiles.getByOrganizationId(organizationId),
      profileState.completions.getByOrganizationId(organizationId),
      markers.activations.getByOrganizationId(organizationId),
      locations.locations.getByOrganizationId(organizationId),
      locations.serviceGeographies.getByOrganizationId(organizationId),
      foundation.users.memberships.listByOrganizationId(organizationId),
      foundation.lifecycle.restrictions.getForOrganization(organizationId),
    ]);
  if (!organization || !profileRecord) notFound();

  const primaryGeographyId = serviceGeography?.primaryGeographyId ?? location?.geographyId ?? null;
  if (!primaryGeographyId) notFound();
  const primaryGeography = await createFirestoreGeographyRepositories(db).definitions.getById(
    primaryGeographyId,
  );
  if (!primaryGeography) notFound();

  const projection = buildOrganization360(
    {
      authority: access.authority,
      grants: access.grants,
      now: new Date().toISOString(),
    },
    {
      organization,
      profile: hydrateEssentialOrganizationProfile(profileRecord),
      completion,
      marker,
      primaryGeography,
      location,
      serviceGeography,
      memberships,
      restriction,
      verificationState: "not-evaluated",
      officialProviderState: "not-evaluated",
      commercialAccount: null,
      administrativeCases: Object.freeze([]),
    },
  );
  const destinations = visibleImplementedAdminRuntimeDestinations(
    access.authority,
    access.grants,
    new Date().toISOString(),
  );

  return (
    <AdminPortalShell destinations={destinations} currentScope={access.scope.value}>
      <Organization360 projection={projection} />
    </AdminPortalShell>
  );
}
