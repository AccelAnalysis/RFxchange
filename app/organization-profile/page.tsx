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
import { projectOrganizationCapabilityClaim } from "@/src/domain/market-profile/model";
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
  account,
}: Readonly<{
  pendingMap: Promise<MapProjectionResult>;
  markerActive: boolean;
  locationVisibility: string | null;
  copy: WorkspaceResilienceCopy;
  account: Awaited<ReturnType<typeof getRequestDictionary>>["dictionary"]["interface"]["account"];
}>) {
  const result = await pendingMap;
  const selectedGeography = result.available
    ? result.value?.model.selectedGeography ?? null
    : null;

  return (
    <article className={styles.card}>
      <h2>{copy.geographyTitle}</h2>
      <dl className={styles.definitionList}>
        <dt>{account.homeLocality}</dt>
        <dd>
          {result.available
            ? selectedGeography?.name ?? account.notRecorded
            : copy.geographyUnavailable}
        </dd>
        <dt>{account.locationVisibility}</dt>
        <dd>{locationVisibility ? readable(locationVisibility) : account.notRecorded}</dd>
        <dt>{account.mapVisibility}</dt>
        <dd>{markerActive ? account.visible : account.inactive}</dd>
      </dl>
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

async function PublicCapabilities({
  pendingMarketProfile,
  account,
  copy,
}: Readonly<{
  pendingMarketProfile: Promise<MarketProfileResult>;
  account: Awaited<ReturnType<typeof getRequestDictionary>>["dictionary"]["interface"]["account"];
  copy: WorkspaceResilienceCopy;
}>) {
  const result = await pendingMarketProfile;
  if (!result.available) return <p role="status">{copy.marketProfileUnavailable}</p>;
  const claims = result.value.snapshot.claims.flatMap((claim) => {
    const visible = projectOrganizationCapabilityClaim(claim, "public");
    return visible ? [visible] : [];
  });
  return <>
    <p>{account.confirmedBody}</p>
    {claims.length ? (
      <ul className={styles.capabilityList}>
        {claims.map((claim) => <li key={claim.id}>{claim.label}</li>)}
      </ul>
    ) : <p>{account.publicCapabilitiesEmpty}</p>}
  </>;
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
  const account = dictionary.interface.account;

  return (
    <ParticipantShell activeItem="account" organizationName={profile.displayName}>
      <OperationalWorkspace ariaLabel={account.title}>
        <section className={styles.page}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>{account.title}</p>
            <h1>{profile.displayName}</h1>
            <p>{account.intro}</p>
          </header>

          <dl className={styles.progress}>
            <div><dt>{account.minimumProfile}</dt><dd>{profileCompletion?.status === "active" ? account.ready : account.incomplete}</dd></div>
            <div><dt>{account.mapVisibility}</dt><dd>{markerActivation?.status === "active" ? account.visible : account.inactive}</dd></div>
          </dl>

          <details className={styles.section} id="organization-identity">
            <summary>{account.identity}</summary>
            <div className={styles.sectionBody}>
              <dl className={styles.definitionList}>
                <dt>{account.organizationType}</dt><dd>{profile.organizationType ? readable(profile.organizationType) : account.notRecorded}</dd>
                <dt>{account.website}</dt><dd>{profile.website?.url ? <a href={profile.website.url} target="_blank" rel="noreferrer">{profile.website.url}</a> : account.notRecorded}</dd>
                <dt>{account.publicContact}</dt><dd>{profile.mainContact?.displayName ?? account.notRecorded}</dd>
              </dl>
            </div>
          </details>

          <details className={styles.section} id="organization-capabilities" open>
            <summary>{account.capabilities}</summary>
            <div className={styles.sectionBody}>
              <Suspense fallback={<OptionalPanelState title={copy.marketProfileTitle} message={copy.marketProfileLoading} />}>
                <MarketProfileSection pendingMarketProfile={pendingMarketProfile} organizationId={String(organizationId)} organizationName={profile.displayName} copy={copy} />
              </Suspense>
            </div>
          </details>

          <details className={styles.section} id="organization-public-presence">
            <summary>{account.publicPresence}</summary>
            <div className={styles.sectionBody}>
              <h2>{profile.displayName}</h2>
              <Suspense fallback={<p role="status">{copy.marketProfileLoading}</p>}>
                <PublicCapabilities pendingMarketProfile={pendingMarketProfile} account={account} copy={copy} />
              </Suspense>
              <h3>{account.badges}</h3>
              <p>{account.badgesUnavailable}</p>
              <Link className={styles.quietLink} href="/provider-application">{account.applyProvider}</Link>
            </div>
          </details>

          <details className={styles.section} id="organization-locations">
            <summary>{account.enrichment}</summary>
            <div className={styles.sectionBody}>
              <Link className={styles.quietLink} href="/organization-profile/public-data">{dictionary.interface.services.data.title}</Link>
              <Suspense fallback={<OptionalPanelState title={copy.geographyTitle} message={copy.geographyLoading} />}>
                <GeographyCard pendingMap={pendingMap} markerActive={markerActivation?.status === "active"} locationVisibility={location?.visibility ?? null} copy={copy} account={account} />
              </Suspense>
              <Suspense fallback={<OptionalPanelState title={copy.enrichmentTitle} message={copy.enrichmentLoading} />}>
                <EnrichmentSection pendingEnrichment={pendingEnrichment} pendingMap={pendingMap} organizationId={String(organizationId)} copy={copy} />
              </Suspense>
            </div>
          </details>

          <details className={styles.section} id="organization-settings">
            <summary>{account.settings}</summary>
            <div className={styles.sectionBody}>
              <Link className={styles.quietLink} href="/account/communications">{dictionary.interface.services.preferences.title}</Link>
              <h2>{account.mapPreferences}</h2>
              <MapMotionPreferenceToggle />
              <dl className={styles.definitionList}>
                <dt>{account.role}</dt><dd>{authorization ? readable(String(authorization.roleKey)) : account.notRecorded}</dd>
              </dl>
            </div>
          </details>
        </section>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
