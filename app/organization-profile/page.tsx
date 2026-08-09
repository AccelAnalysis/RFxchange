import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { MapMotionPreferenceToggle } from "@/src/components/account/MapMotionPreferenceToggle";
import { SignOutButton } from "@/src/components/auth/SignOutButton";
import { MarketProfilePanel } from "@/src/components/market-profile/MarketProfilePanel";
import { OrganizationEnrichmentPanel } from "@/src/components/organization-enrichment/OrganizationEnrichmentPanel";
import {
  OperationalWorkspace,
  ParticipantShell,
} from "@/src/components/participant/ParticipantWorkspace";
import { hydrateEssentialOrganizationProfile } from "@/src/domain/organization-profile/model";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";
import { loadAuthorizedMarketProfile } from "@/src/infrastructure/market-profile/runtime";
import { loadAuthorizedOrganizationEnrichment } from "@/src/infrastructure/organization-enrichment/runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";

import styles from "./page.module.css";

function readable(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function OrganizationProfilePage() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });

  if (access.kind === "unauthenticated") {
    redirect("/signin?returnTo=%2Forganization-profile");
  }
  if (access.kind === "activation-required") redirect("/join");
  if (access.kind === "wrong-organization") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }

  const foundation = createServerFirestoreFoundationRepositories(getServerFirestore());
  const [profileRecord, authorization, marketProfile, enrichment, mapProjection] = await Promise.all([
    foundation.organizations.profiles.getByOrganizationId(access.membership.organizationId),
    foundation.organizationAuthorization.getByMembershipId(access.membership.id),
    loadAuthorizedMarketProfile(access),
    loadAuthorizedOrganizationEnrichment(access),
    loadAuthorizedParticipantMapProjection(access),
  ]);
  if (!profileRecord) redirect("/join");

  const profile = hydrateEssentialOrganizationProfile(profileRecord);
  const workspaceStatus = access.state.lifecycleState === "open-platform" ? "Open" : "Active";
  const selectedGeography = access.state.selectedGeography;

  return (
    <ParticipantShell activeItem="Account">
      <OperationalWorkspace ariaLabel="Organization account workspace">
        <section className={styles.page}>
          <header className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Account · RFxchange</p>
              <h1>{profile.displayName}</h1>
              <p>
                Manage the organization identity and market information that permitted participants
                can use to discover what your organization says it does.
              </p>
            </div>
            <SignOutButton className={styles.signOut} />
          </header>

          <section className={styles.grid}>
            <article className={styles.card}>
              <h2>Organization identity</h2>
              <dl className={styles.definitionList}>
                <dt>Organization ID</dt>
                <dd>{String(access.membership.organizationId)}</dd>
                <dt>Organization type</dt>
                <dd>{profile.organizationType ? readable(profile.organizationType) : "Optional enrichment not recorded"}</dd>
                <dt>Profile status</dt>
                <dd>{access.state.profileCompletion?.status === "active" ? "Profile Complete" : "Incomplete"}</dd>
                <dt>Workspace state</dt>
                <dd><span className={styles.status}>{workspaceStatus}</span></dd>
              </dl>
            </article>

            <article className={styles.card}>
              <h2>Geography & marker</h2>
              <dl className={styles.definitionList}>
                <dt>Home locality</dt>
                <dd>{access.state.selectedGeography?.name ?? "Not recorded"}</dd>
                <dt>Location visibility</dt>
                <dd>{access.state.location ? readable(access.state.location.visibility) : "Not recorded"}</dd>
                <dt>Marker</dt>
                <dd>{access.state.marker?.status === "active" ? "Active" : "Not active"}</dd>
                <dt>Initial service geography</dt>
                <dd>{access.state.selectedGeography?.name ?? "Not recorded"}</dd>
              </dl>
              <p className={styles.empty}>
                During minimum activation, RFxchange initializes the confirmed home locality as the
                organization&apos;s initial service geography. Expanded service territories remain a
                separate profile concept and can be refined in later profile enrichment.
              </p>
            </article>

            <article className={styles.card}>
              <h2>Capabilities</h2>
              {profile.capabilities.length ? (
                <ul className={styles.tags}>
                  {profile.capabilities.map((capability) => (
                    <li key={String(capability.id)}>
                      {capability.name} · {capability.category === "other"
                        ? capability.otherCategory
                        : readable(capability.category)}
                    </li>
                  ))}
                </ul>
              ) : <p className={styles.empty}>No capability has been recorded.</p>}
            </article>

            <article className={styles.card}>
              <h2>Opportunity participation</h2>
              <p className={styles.empty}>
                Every RFxchange organization can discover and respond to opportunities and can also
                create and issue opportunities. These transaction roles do not require a permanent
                buyer or supplier classification.
              </p>
            </article>

            <article className={styles.card}>
              <h2>Map settings</h2>
              <MapMotionPreferenceToggle />
            </article>

            <article className={styles.card}>
              <h2>Your organization relationship</h2>
              <dl className={styles.definitionList}>
                <dt>Membership</dt>
                <dd>Active</dd>
                <dt>Authorization role</dt>
                <dd>{authorization ? readable(String(authorization.roleKey)) : "No authorization role recorded"}</dd>
                <dt>Granted capabilities</dt>
                <dd>{authorization?.permissions.length ?? 0}</dd>
              </dl>
            </article>

            <article className={styles.card}>
              <h2>Resource Provider status</h2>
              <p className={styles.empty}>
                Official Resource Provider status is a separate application and administrator-review
                process. It is not selected during registration and is not implied by Profile Complete.
              </p>
            </article>

            <article className={styles.card}>
              <h2>Current release boundary</h2>
              <p className={styles.empty}>
                Market profile, credential, media, and additional-location enrichment are available. Referrals, provider routing, credibility,
                commercial benefits, and RFx workflows remain unavailable until their approved
                slices are complete.
              </p>
            </article>
          </section>

          <MarketProfilePanel
            organizationId={String(access.membership.organizationId)}
            organizationName={profile.displayName}
            snapshot={marketProfile.snapshot}
            catalog={marketProfile.catalog}
            marketRoles={marketProfile.marketRoles}
            serviceGeographies={marketProfile.serviceGeographyIds.map((id) => ({
              id,
              label: id === String(selectedGeography?.id)
                ? selectedGeography?.name ?? id
                : id,
            }))}
          />
          <OrganizationEnrichmentPanel
            organizationId={String(access.membership.organizationId)}
            snapshot={enrichment.snapshot}
            mapModel={mapProjection?.model ?? null}
            homeMarker={mapProjection?.homeMarker ?? null}
          />
        </section>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
