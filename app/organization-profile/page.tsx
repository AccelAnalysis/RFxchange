import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MapMotionPreferenceToggle } from "@/src/components/account/MapMotionPreferenceToggle";
import { MarketProfilePanel } from "@/src/components/market-profile/MarketProfilePanel";
import {
  OrganizationEnrichmentLocationMap,
  OrganizationEnrichmentPanel,
} from "@/src/components/organization-enrichment/OrganizationEnrichmentPanel";
import {
  OperationalWorkspace,
  ParticipantShell,
} from "@/src/components/participant/ParticipantWorkspace";
import { hydrateEssentialOrganizationProfile } from "@/src/domain/organization-profile/model";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  ParticipantRouteDependencyUnavailableError,
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { createFirestoreOrganizationLocationRepositories } from "@/src/infrastructure/firestore/organization-location";
import { createFirestoreOrganizationMarkerRepositories } from "@/src/infrastructure/firestore/organization-marker";
import { createFirestoreEssentialOrganizationProfileRepositories } from "@/src/infrastructure/firestore/organization-profile";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "@/src/infrastructure/firestore/runtime";
import { loadAuthorizedMarketProfile } from "@/src/infrastructure/market-profile/runtime";
import { loadAuthorizedOrganizationEnrichment } from "@/src/infrastructure/organization-enrichment/runtime";
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { currentBuildIdentity } from "@/src/infrastructure/system/build-identity";
import { getRequestDictionary } from "@/src/i18n/server";
import {
  settleOptionalWorkspacePanel,
  type OptionalWorkspacePanelResult,
} from "@/src/application/workspace/optional-workspace-panel";

import styles from "./page.module.css";

function readable(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type MarketProfileResult = OptionalWorkspacePanelResult<
  Awaited<ReturnType<typeof loadAuthorizedMarketProfile>>
>;
type EnrichmentResult = OptionalWorkspacePanelResult<
  Awaited<ReturnType<typeof loadAuthorizedOrganizationEnrichment>>
>;
type MapProjectionResult = OptionalWorkspacePanelResult<
  Awaited<ReturnType<typeof loadAuthorizedParticipantMapProjection>>
>;
type WorkspaceResilienceCopy = Awaited<
  ReturnType<typeof getRequestDictionary>
>["dictionary"]["workspaceResilience"];

function OptionalPanelState({
  title,
  message,
}: Readonly<{ title: string; message: string }>) {
  return (
    <section className={styles.optionalPanel} role="status">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}

async function GeographyCard({
  pendingMap,
  markerActive,
  locationVisibility,
  copy,
}: Readonly<{
  pendingMap: Promise<MapProjectionResult>;
  markerActive: boolean;
  locationVisibility: string | null;
  copy: WorkspaceResilienceCopy;
}>) {
  const result = await pendingMap;
  const selectedGeography = result.available
    ? result.value?.model.selectedGeography ?? null
    : null;

  return (
    <article className={styles.card}>
      <h2>{copy.geographyTitle}</h2>
      <dl className={styles.definitionList}>
        <dt>Home locality</dt>
        <dd>
          {result.available
            ? selectedGeography?.name ?? "Not recorded"
            : copy.geographyUnavailable}
        </dd>
        <dt>Location visibility</dt>
        <dd>{locationVisibility ? readable(locationVisibility) : "Not recorded"}</dd>
        <dt>Marker</dt>
        <dd>{markerActive ? "Active" : "Not active"}</dd>
        <dt>Initial service geography</dt>
        <dd>
          {result.available
            ? selectedGeography?.name ?? "Not recorded"
            : copy.geographyUnavailable}
        </dd>
      </dl>
      <p className={styles.empty}>
        During minimum activation, RFxchange initializes the confirmed home locality as the
        organization&apos;s initial service geography. Expanded service territories remain a
        separate profile concept and can be refined in later profile enrichment.
      </p>
    </article>
  );
}

async function MarketProfileSection({
  pendingMarketProfile,
  organizationId,
  organizationName,
  copy,
}: Readonly<{
  pendingMarketProfile: Promise<MarketProfileResult>;
  organizationId: string;
  organizationName: string;
  copy: WorkspaceResilienceCopy;
}>) {
  const result = await pendingMarketProfile;
  if (!result.available) {
    return (
      <OptionalPanelState
        title={copy.marketProfileTitle}
        message={copy.marketProfileUnavailable}
      />
    );
  }
  const marketProfile = result.value;
  return (
    <MarketProfilePanel
      key={`${organizationId}:industry:${marketProfile.snapshot.industry?.revision ?? 0}`}
      organizationId={organizationId}
      organizationName={organizationName}
      snapshot={marketProfile.snapshot}
      catalog={marketProfile.catalog}
      naicsCatalog={marketProfile.naics}
      marketRoles={marketProfile.marketRoles}
      serviceGeographies={marketProfile.serviceGeographies}
    />
  );
}

async function EnrichmentSection({
  pendingEnrichment,
  pendingMap,
  organizationId,
  copy,
}: Readonly<{
  pendingEnrichment: Promise<EnrichmentResult>;
  pendingMap: Promise<MapProjectionResult>;
  organizationId: string;
  copy: WorkspaceResilienceCopy;
}>) {
  const enrichmentResult = await pendingEnrichment;
  if (!enrichmentResult.available) {
    return (
      <OptionalPanelState
        title={copy.enrichmentTitle}
        message={copy.enrichmentUnavailable}
      />
    );
  }
  return (
    <OrganizationEnrichmentPanel
      organizationId={organizationId}
      snapshot={enrichmentResult.value.snapshot}
      locationMap={(
        <Suspense
          fallback={(
            <p className={styles.empty} role="status">
              {copy.geographyLoading}
            </p>
          )}
        >
          <EnrichmentLocationMapSection
            pendingMap={pendingMap}
            snapshot={enrichmentResult.value.snapshot}
            unavailableMessage={copy.geographyUnavailable}
          />
        </Suspense>
      )}
    />
  );
}

async function EnrichmentLocationMapSection({
  pendingMap,
  snapshot,
  unavailableMessage,
}: Readonly<{
  pendingMap: Promise<MapProjectionResult>;
  snapshot: Awaited<
    ReturnType<typeof loadAuthorizedOrganizationEnrichment>
  >["snapshot"];
  unavailableMessage: string;
}>) {
  const mapResult = await pendingMap;
  if (!mapResult.available || !mapResult.value) {
    return <p className={styles.empty} role="status">{unavailableMessage}</p>;
  }
  return (
    <OrganizationEnrichmentLocationMap
      snapshot={snapshot}
      mapModel={mapResult.value.model}
      homeMarker={mapResult.value.homeMarker}
    />
  );
}

export default async function OrganizationProfilePage() {
  const sessionCookie = (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  const access = await resolveParticipantRoute({ sessionCookie });

  if (access.kind === "unauthenticated") {
    redirect("/signin?returnTo=%2Forganization-profile");
  }
  if (access.kind === "access-resolution-required") {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "activation-required") {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "wrong-organization") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }

  const pendingMarketProfile = settleOptionalWorkspacePanel(
    "market-profile",
    loadAuthorizedMarketProfile(access),
  );
  const pendingEnrichment = settleOptionalWorkspacePanel(
    "organization-enrichment",
    loadAuthorizedOrganizationEnrichment(access),
  );
  const pendingMap = settleOptionalWorkspacePanel(
    "participant-map",
    loadAuthorizedParticipantMapProjection(access),
  );
  const dictionaryPromise = getRequestDictionary();

  const db = getServerFirestore();
  const foundation = createServerFirestoreFoundationRepositories(db);
  const locations = createFirestoreOrganizationLocationRepositories(db);
  const markerRepositories = createFirestoreOrganizationMarkerRepositories(db);
  const profileRepositories = createFirestoreEssentialOrganizationProfileRepositories(db);
  const organizationId = access.membership.organizationId;
  const [
    profileRecord,
    authorization,
    markerActivation,
    profileCompletion,
    location,
    { dictionary },
  ] = await Promise.all([
    foundation.organizations.profiles.getByOrganizationId(organizationId),
    foundation.organizationAuthorization.getByMembershipId(access.membership.id),
    markerRepositories.activations.getByOrganizationId(organizationId),
    profileRepositories.completions.getByOrganizationId(organizationId),
    locations.locations.getByOrganizationId(organizationId),
    dictionaryPromise,
  ]);
  if (!profileRecord) {
    throw new ParticipantRouteDependencyUnavailableError(
      "workspace-state",
      new Error("Authorized organization profile identity is incomplete."),
    );
  }

  const copy = dictionary.workspaceResilience;
  const profile = hydrateEssentialOrganizationProfile(profileRecord);
  const workspaceStatus = access.state.lifecycleState === "open-platform" ? "Open" : "Active";
  const buildIdentity = currentBuildIdentity();

  return (
    <ParticipantShell activeItem="account">
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
          </header>

          <section className={styles.grid}>
            <article className={styles.card}>
              <h2>Organization identity</h2>
              <dl className={styles.definitionList}>
                <dt>Organization ID</dt>
                <dd>{String(access.membership.organizationId)}</dd>
                <dt>Organization type</dt>
                <dd>
                  {profile.organizationType
                    ? readable(profile.organizationType)
                    : "Optional enrichment not recorded"}
                </dd>
                <dt>Profile status</dt>
                <dd>
                  {profileCompletion?.status === "active" ? "Profile Complete" : "Incomplete"}
                </dd>
                <dt>Workspace state</dt>
                <dd><span className={styles.status}>{workspaceStatus}</span></dd>
              </dl>
            </article>

            <Suspense
              fallback={(
                <article className={styles.card}>
                  <h2>{copy.geographyTitle}</h2>
                  <p className={styles.empty}>{copy.geographyLoading}</p>
                </article>
              )}
            >
              <GeographyCard
                pendingMap={pendingMap}
                markerActive={markerActivation?.status === "active"}
                locationVisibility={location?.visibility ?? null}
                copy={copy}
              />
            </Suspense>

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
                <dd>
                  {authorization
                    ? readable(String(authorization.roleKey))
                    : "No authorization role recorded"}
                </dd>
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
              <Link href="/provider-application">Request Resource Provider Status</Link>
            </article>

            <article className={styles.card}>
              <h2>Current release boundary</h2>
              <dl className={styles.definitionList}>
                <dt>Build SHA</dt>
                <dd><code>{buildIdentity?.commitSha ?? "Not embedded in this build"}</code></dd>
              </dl>
              <p className={styles.empty}>
                Market profile, credential, media, additional-location enrichment, referrals, and
                published provider/resource routing are available. Credibility, commercial benefits,
                and RFx workflows remain unavailable until their approved slices are complete.
              </p>
            </article>
          </section>

          <Suspense
            fallback={(
              <OptionalPanelState
                title={copy.marketProfileTitle}
                message={copy.marketProfileLoading}
              />
            )}
          >
            <MarketProfileSection
              pendingMarketProfile={pendingMarketProfile}
              organizationId={String(access.membership.organizationId)}
              organizationName={profile.displayName}
              copy={copy}
            />
          </Suspense>
          <Suspense
            fallback={(
              <OptionalPanelState
                title={copy.enrichmentTitle}
                message={copy.enrichmentLoading}
              />
            )}
          >
            <EnrichmentSection
              pendingEnrichment={pendingEnrichment}
              pendingMap={pendingMap}
              organizationId={String(access.membership.organizationId)}
              copy={copy}
            />
          </Suspense>
        </section>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
