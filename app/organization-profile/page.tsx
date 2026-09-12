import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { MapMotionPreferenceToggle } from "@/src/components/account/MapMotionPreferenceToggle";
import { OrganizationProfilePortal } from "@/src/components/account/OrganizationProfilePortal";
import { ProfileTaskSheet } from "@/src/components/account/ProfileTaskSheet";
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
import {
  projectPublicCredential,
  projectPublicProfileAsset,
} from "@/src/domain/organization-enrichment/model";
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
import { loadAuthorizedParticipantMapProjection } from "@/src/infrastructure/geography/participant-map-runtime";
import { loadAuthorizedMarketProfile } from "@/src/infrastructure/market-profile/runtime";
import { loadAuthorizedOrganizationEnrichment } from "@/src/infrastructure/organization-enrichment/runtime";
import { getRequestDictionary } from "@/src/i18n/server";
import {
  settleOptionalWorkspacePanel,
  type OptionalWorkspacePanelResult,
} from "@/src/application/workspace/optional-workspace-panel";

import styles from "./page.module.css";

function readable(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

type Dictionary = Awaited<ReturnType<typeof getRequestDictionary>>["dictionary"];
type EssentialProfile = ReturnType<typeof hydrateEssentialOrganizationProfile>;
type MarketProfileData = Awaited<ReturnType<typeof loadAuthorizedMarketProfile>>;
type EnrichmentData = Awaited<ReturnType<typeof loadAuthorizedOrganizationEnrichment>>;
type MapProjectionData = Awaited<ReturnType<typeof loadAuthorizedParticipantMapProjection>>;
type MarketProfileResult = OptionalWorkspacePanelResult<MarketProfileData>;
type EnrichmentResult = OptionalWorkspacePanelResult<EnrichmentData>;
type MapProjectionResult = OptionalWorkspacePanelResult<MapProjectionData>;
type WorkspaceResilienceCopy = Dictionary["workspaceResilience"];

type PendingProfilePanels = Readonly<{
  market: Promise<MarketProfileResult>;
  enrichment: Promise<EnrichmentResult>;
  map: Promise<MapProjectionResult>;
}>;

function OptionalPanelState({
  title,
  message,
}: Readonly<{ title: string; message: string }>) {
  return (
    <section className={styles.unavailable} role="status">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  );
}

function MarketEditor({
  marketProfile,
  editorKey,
  organizationId,
  organizationName,
}: Readonly<{
  marketProfile: MarketProfileData;
  editorKey: string;
  organizationId: string;
  organizationName: string;
}>) {
  return (
    <MarketProfilePanel
      key={`${editorKey}:${organizationId}:${marketProfile.snapshot.industry?.revision ?? 0}`}
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

function EnrichmentEditor({
  enrichment,
  organizationId,
}: Readonly<{
  enrichment: EnrichmentData;
  organizationId: string;
}>) {
  return (
    <OrganizationEnrichmentPanel
      organizationId={organizationId}
      snapshot={enrichment.snapshot}
      locationMap={null}
    />
  );
}

async function OverviewPanel({
  pending,
  dictionary,
  profile,
  profileCompletionActive,
  markerVisible,
}: Readonly<{
  pending: PendingProfilePanels;
  dictionary: Dictionary;
  profile: EssentialProfile;
  profileCompletionActive: boolean;
  markerVisible: boolean;
}>) {
  const [marketResult, enrichmentResult, mapResult] = await Promise.all([
    pending.market,
    pending.enrichment,
    pending.map,
  ]);
  const marketProfile = marketResult.available ? marketResult.value : null;
  const enrichment = enrichmentResult.available ? enrichmentResult.value : null;
  const mapData = mapResult.available ? mapResult.value : null;
  const account = dictionary.interface.account;
  const portal = dictionary.organizationEnrichment.portal;
  const claims = marketProfile?.snapshot.claims ?? [];
  const publicClaims = claims.flatMap((claim) => {
    const projected = projectOrganizationCapabilityClaim(claim, "public");
    return projected ? [projected] : [];
  });
  const activeCredentials = enrichment?.snapshot.credentials.filter((record) => record.status !== "retired") ?? [];
  const publicCredentials = activeCredentials.flatMap((record) => {
    const projected = projectPublicCredential(record);
    return projected ? [projected] : [];
  });
  const activeAssets = enrichment?.snapshot.profileAssets.filter((record) => record.publicationStatus !== "retired") ?? [];
  const publicAssets = activeAssets.flatMap((record) => {
    const projected = projectPublicProfileAsset(record);
    return projected ? [projected] : [];
  });
  const selectedGeography = mapData?.model.selectedGeography ?? null;
  const progressSignals = [
    profileCompletionActive,
    claims.length > 0,
    activeCredentials.length > 0,
    Boolean(selectedGeography && markerVisible),
    activeAssets.length > 0,
    Boolean(marketProfile?.snapshot.preferences),
  ];
  const sectionsSetUp = progressSignals.filter(Boolean).length;
  const nextStep = !progressSignals[0]
    ? portal.identityNeedsAttention
    : !progressSignals[1]
      ? portal.capabilitiesNext
      : !progressSignals[3]
        ? portal.locationsNext
        : !progressSignals[2]
          ? portal.credentialsNext
          : !progressSignals[4]
            ? portal.mediaNext
            : !progressSignals[5]
              ? portal.preferencesNext
              : portal.identityReady;

  return (
    <div className={styles.stack}>
      <section className={styles.overviewGrid}>
        <div className={styles.progressPanel}>
          <p className={styles.sectionEyebrow}>{portal.profileProgress}</p>
          <div className={styles.progressHeading}>
            <strong>{sectionsSetUp} / {progressSignals.length}</strong>
            <span>{portal.sectionsSetUp}</span>
          </div>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progressSignals.length}
            aria-valuenow={sectionsSetUp}
            aria-label={portal.profileProgress}
          >
            <span style={{ width: `${Math.round((sectionsSetUp / progressSignals.length) * 100)}%` }} />
          </div>
          <p>{portal.progressBody}</p>
          <div className={styles.nextStep}>
            <strong>{portal.nextStep}</strong>
            <span>{nextStep}</span>
          </div>
        </div>

        <div className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <div>
              <p className={styles.sectionEyebrow}>{portal.publicPreview}</p>
              <h2>{profile.displayName}</h2>
            </div>
            <span>{selectedGeography?.name ?? portal.notRecorded}</span>
          </div>
          <p className={styles.muted}>{portal.previewBody}</p>
          <div className={styles.previewSection}>
            <h3>{portal.publicCapabilities}</h3>
            {publicClaims.length ? (
              <ul className={styles.inlineList}>
                {publicClaims.slice(0, 5).map((claim) => <li key={claim.id}>{claim.label}</li>)}
              </ul>
            ) : <p className={styles.muted}>{portal.noPublicCapabilities}</p>}
          </div>
          <div className={styles.previewStats}>
            <div><strong>{publicCredentials.length}</strong><span>{portal.publicCredentials}</span></div>
            <div><strong>{publicAssets.length}</strong><span>{portal.publicMedia}</span></div>
          </div>
        </div>
      </section>

      <section className={styles.flatSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>{portal.profileBasics}</p>
            <h2>{profile.displayName}</h2>
          </div>
          <Link className={styles.quietLink} href="/organization-profile/public-data">
            {dictionary.interface.services.data.title}
          </Link>
        </div>
        <dl className={styles.definitionList}>
          <dt>{account.organizationType}</dt>
          <dd>{profile.organizationType ? readable(profile.organizationType) : portal.notRecorded}</dd>
          <dt>{account.website}</dt>
          <dd>{profile.website?.url ? <a href={profile.website.url} target="_blank" rel="noreferrer">{profile.website.url}</a> : portal.notRecorded}</dd>
          <dt>{account.publicContact}</dt>
          <dd>{profile.mainContact?.displayName ?? portal.notRecorded}</dd>
          <dt>{portal.basedIn}</dt>
          <dd>{selectedGeography?.name ?? portal.notRecorded}</dd>
          <dt>{portal.mapVisibility}</dt>
          <dd>{markerVisible ? portal.visible : portal.notVisible}</dd>
        </dl>
      </section>
    </div>
  );
}

async function CapabilitiesPanel({
  pendingMarket,
  dictionary,
  organizationId,
  organizationName,
}: Readonly<{
  pendingMarket: Promise<MarketProfileResult>;
  dictionary: Dictionary;
  organizationId: string;
  organizationName: string;
}>) {
  const result = await pendingMarket;
  const copy = dictionary.workspaceResilience;
  if (!result.available) {
    return <OptionalPanelState title={copy.marketProfileTitle} message={copy.marketProfileUnavailable} />;
  }
  const marketProfile = result.value;
  const portal = dictionary.organizationEnrichment.portal;
  const claims = marketProfile.snapshot.claims;

  return (
    <div className={styles.stack}>
      <section className={styles.flatSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>{portal.capabilities}</h2>
            <p>{portal.capabilityIntro}</p>
          </div>
          <ProfileTaskSheet
            title={portal.capabilities}
            triggerLabel={portal.manageCapabilities}
            hideChildChrome
            tone="primary"
          >
            <MarketEditor marketProfile={marketProfile} editorKey="capabilities" organizationId={organizationId} organizationName={organizationName} />
          </ProfileTaskSheet>
        </div>
        {claims.length ? (
          <ul className={styles.recordList}>
            {claims.map((claim) => (
              <li key={claim.id}>
                <div><strong>{claim.labelSnapshot}</strong><span>{claim.domainLabelSnapshot} · {claim.familyLabelSnapshot}</span></div>
                <span>{readable(claim.visibility)}</span>
              </li>
            ))}
          </ul>
        ) : <p className={styles.empty}>{dictionary.marketProfile.confirmed.emptyBody}</p>}
      </section>

      <section className={styles.flatSection}>
        <h2>Market context</h2>
        <div className={styles.actionRow}>
          <ProfileTaskSheet
            title={dictionary.marketProfile.industry.title}
            triggerLabel={portal.editIndustry}
            activateSelector="nav button:nth-of-type(2)"
            hideChildChrome
          >
            <MarketEditor marketProfile={marketProfile} editorKey="industry" organizationId={organizationId} organizationName={organizationName} />
          </ProfileTaskSheet>
          <ProfileTaskSheet
            title={dictionary.marketProfile.experience.title}
            triggerLabel={portal.addExperience}
            activateSelector="nav button:nth-of-type(3)"
            hideChildChrome
          >
            <MarketEditor marketProfile={marketProfile} editorKey="experience" organizationId={organizationId} organizationName={organizationName} />
          </ProfileTaskSheet>
        </div>
      </section>
    </div>
  );
}

async function CredentialsPanel({
  pendingEnrichment,
  dictionary,
  organizationId,
}: Readonly<{
  pendingEnrichment: Promise<EnrichmentResult>;
  dictionary: Dictionary;
  organizationId: string;
}>) {
  const result = await pendingEnrichment;
  const copy = dictionary.workspaceResilience;
  if (!result.available) {
    return <OptionalPanelState title={copy.enrichmentTitle} message={copy.enrichmentUnavailable} />;
  }
  const enrichment = result.value;
  const portal = dictionary.organizationEnrichment.portal;
  const activeCredentials = enrichment.snapshot.credentials.filter((record) => record.status !== "retired");

  return (
    <div className={styles.stack}>
      <section className={styles.flatSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>{portal.credentials}</h2>
            <p>{portal.credentialsIntro}</p>
          </div>
          <ProfileTaskSheet
            title={dictionary.organizationEnrichment.credentials.add}
            triggerLabel={portal.addCredential}
            activateSelector="#organization-enrichment-tab-credentials"
            hideChildChrome
            tone="primary"
          >
            <EnrichmentEditor enrichment={enrichment} organizationId={organizationId} />
          </ProfileTaskSheet>
        </div>
        {activeCredentials.length ? (
          <ul className={styles.recordList}>
            {activeCredentials.map((record) => (
              <li key={record.id}>
                <div><strong>{record.label}</strong><span>{record.issuer}{record.identifierValue ? ` · ${record.identifierValue}` : ""}</span></div>
                <span>{readable(record.visibility)}</span>
              </li>
            ))}
          </ul>
        ) : <p className={styles.empty}>{dictionary.organizationEnrichment.credentials.empty}</p>}
      </section>

      <section className={styles.flatSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>{portal.badgesTitle}</h2>
            <p>{portal.badgesBody}</p>
          </div>
        </div>
        <div className={styles.statusRow}>
          <div><strong>{portal.providerBadge}</strong><span>{portal.organizationProvided}</span></div>
          <Link className={styles.quietLink} href="/provider-application">{portal.providerAction}</Link>
        </div>
      </section>
    </div>
  );
}

async function LocationsPanel({
  pendingEnrichment,
  pendingMap,
  dictionary,
  organizationId,
  locationVisibility,
  markerVisible,
}: Readonly<{
  pendingEnrichment: Promise<EnrichmentResult>;
  pendingMap: Promise<MapProjectionResult>;
  dictionary: Dictionary;
  organizationId: string;
  locationVisibility: string | null;
  markerVisible: boolean;
}>) {
  const [enrichmentResult, mapResult] = await Promise.all([pendingEnrichment, pendingMap]);
  const copy = dictionary.workspaceResilience;
  if (!enrichmentResult.available) {
    return <OptionalPanelState title={copy.enrichmentTitle} message={copy.enrichmentUnavailable} />;
  }
  const enrichment = enrichmentResult.value;
  const mapData = mapResult.available ? mapResult.value : null;
  const portal = dictionary.organizationEnrichment.portal;
  const activeLocations = enrichment.snapshot.additionalLocations.filter((record) => record.lifecycleStatus === "active");
  const selectedGeography = mapData?.model.selectedGeography ?? null;

  return (
    <div className={styles.stack}>
      <section className={styles.flatSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>{portal.locations}</h2>
            <p>{portal.locationsIntro}</p>
          </div>
          <ProfileTaskSheet
            title={dictionary.organizationEnrichment.locations.add}
            triggerLabel={portal.addLocation}
            activateSelector="#organization-enrichment-tab-locations"
            hideChildChrome
            tone="primary"
          >
            <EnrichmentEditor enrichment={enrichment} organizationId={organizationId} />
          </ProfileTaskSheet>
        </div>
        <div className={styles.statusRow}>
          <div><strong>{selectedGeography?.name ?? portal.notRecorded}</strong><span>{locationVisibility ? readable(locationVisibility) : portal.notRecorded}</span></div>
          <span>{markerVisible ? portal.visible : portal.notVisible}</span>
        </div>
        {activeLocations.length ? (
          <ul className={styles.recordList}>
            {activeLocations.map((record) => (
              <li key={record.id}>
                <div><strong>{record.label}</strong><span>{record.physicalAddress.locality}, {record.physicalAddress.regionCode}</span></div>
                <span>{readable(record.visibility)}</span>
              </li>
            ))}
          </ul>
        ) : <p className={styles.empty}>{dictionary.organizationEnrichment.locations.empty}</p>}
      </section>
      {mapData ? (
        <section className={styles.mapSection}>
          <OrganizationEnrichmentLocationMap
            snapshot={enrichment.snapshot}
            mapModel={mapData.model}
            homeMarker={mapData.homeMarker}
          />
        </section>
      ) : (
        <section className={styles.unavailable} role="status">
          <p>{copy.geographyUnavailable}</p>
        </section>
      )}
    </div>
  );
}

async function MediaPanel({
  pendingEnrichment,
  dictionary,
  organizationId,
}: Readonly<{
  pendingEnrichment: Promise<EnrichmentResult>;
  dictionary: Dictionary;
  organizationId: string;
}>) {
  const result = await pendingEnrichment;
  const copy = dictionary.workspaceResilience;
  if (!result.available) {
    return <OptionalPanelState title={copy.enrichmentTitle} message={copy.enrichmentUnavailable} />;
  }
  const enrichment = result.value;
  const portal = dictionary.organizationEnrichment.portal;
  const activeAssets = enrichment.snapshot.profileAssets.filter((record) => record.publicationStatus !== "retired");

  return (
    <section className={styles.flatSection}>
      <div className={styles.sectionHeader}>
        <div>
          <h2>{portal.media}</h2>
          <p>{portal.mediaIntro}</p>
        </div>
        <ProfileTaskSheet
          title={dictionary.organizationEnrichment.media.add}
          triggerLabel={portal.uploadMedia}
          activateSelector="#organization-enrichment-tab-media"
          hideChildChrome
          tone="primary"
        >
          <EnrichmentEditor enrichment={enrichment} organizationId={organizationId} />
        </ProfileTaskSheet>
      </div>
      {activeAssets.length ? (
        <ul className={styles.recordList}>
          {activeAssets.map((asset) => (
            <li key={asset.id}>
              <div><strong>{asset.title}</strong><span>{readable(asset.kind)}</span></div>
              <span>{readable(asset.publicationStatus)}</span>
            </li>
          ))}
        </ul>
      ) : <p className={styles.empty}>{dictionary.organizationEnrichment.media.empty}</p>}
    </section>
  );
}

async function PreferencesPanel({
  pendingMarket,
  dictionary,
  organizationId,
  organizationName,
}: Readonly<{
  pendingMarket: Promise<MarketProfileResult>;
  dictionary: Dictionary;
  organizationId: string;
  organizationName: string;
}>) {
  const result = await pendingMarket;
  const copy = dictionary.workspaceResilience;
  const portal = dictionary.organizationEnrichment.portal;

  return (
    <div className={styles.stack}>
      <section className={styles.flatSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>{portal.preferences}</h2>
            <p>{portal.preferencesIntro}</p>
          </div>
          {result.available ? (
            <ProfileTaskSheet
              title={dictionary.marketProfile.preferences.title}
              triggerLabel={portal.editPreferences}
              activateSelector="nav button:nth-of-type(4)"
              hideChildChrome
              tone="primary"
            >
              <MarketEditor marketProfile={result.value} editorKey="preferences" organizationId={organizationId} organizationName={organizationName} />
            </ProfileTaskSheet>
          ) : null}
        </div>
        {!result.available ? <p className={styles.empty}>{copy.marketProfileUnavailable}</p> : null}
        <Link className={styles.quietLink} href="/account/communications">{portal.communications}</Link>
      </section>
      <section className={styles.flatSection}>
        <h2>{portal.mapPreferences}</h2>
        <MapMotionPreferenceToggle />
      </section>
    </div>
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

  const pending: PendingProfilePanels = Object.freeze({
    market: settleOptionalWorkspacePanel("market-profile", loadAuthorizedMarketProfile(access)),
    enrichment: settleOptionalWorkspacePanel("organization-enrichment", loadAuthorizedOrganizationEnrichment(access)),
    map: settleOptionalWorkspacePanel("participant-map", loadAuthorizedParticipantMapProjection(access)),
  });

  const db = getServerFirestore();
  const foundation = createServerFirestoreFoundationRepositories(db);
  const locations = createFirestoreOrganizationLocationRepositories(db);
  const markerRepositories = createFirestoreOrganizationMarkerRepositories(db);
  const profileRepositories = createFirestoreEssentialOrganizationProfileRepositories(db);
  const organizationId = access.membership.organizationId;

  const [
    profileRecord,
    markerActivation,
    profileCompletion,
    location,
    { dictionary },
  ] = await Promise.all([
    foundation.organizations.profiles.getByOrganizationId(organizationId),
    markerRepositories.activations.getByOrganizationId(organizationId),
    profileRepositories.completions.getByOrganizationId(organizationId),
    locations.locations.getByOrganizationId(organizationId),
    getRequestDictionary(),
  ]);

  if (!profileRecord) {
    throw new ParticipantRouteDependencyUnavailableError(
      "workspace-state",
      new Error("Authorized organization profile identity is incomplete."),
    );
  }

  const profile = hydrateEssentialOrganizationProfile(profileRecord);
  const account = dictionary.interface.account;
  const portal = dictionary.organizationEnrichment.portal;
  const copy: WorkspaceResilienceCopy = dictionary.workspaceResilience;
  const organizationIdValue = String(organizationId);
  const markerVisible = markerActivation?.status === "active";

  return (
    <ParticipantShell activeItem="account" organizationName={profile.displayName}>
      <OperationalWorkspace ariaLabel={account.title}>
        <section className={styles.page}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>{account.title}</p>
            <h1>{profile.displayName}</h1>
            <p>{account.intro}</p>
          </header>

          <OrganizationProfilePortal
            ariaLabel={portal.ariaLabel}
            labels={{
              overview: portal.overview,
              capabilities: portal.capabilities,
              credentials: portal.credentials,
              locations: portal.locations,
              media: portal.media,
              preferences: portal.preferences,
            }}
            overview={(
              <Suspense fallback={<OptionalPanelState title={portal.overview} message={copy.marketProfileLoading} />}>
                <OverviewPanel
                  pending={pending}
                  dictionary={dictionary}
                  profile={profile}
                  profileCompletionActive={profileCompletion?.status === "active"}
                  markerVisible={markerVisible}
                />
              </Suspense>
            )}
            capabilities={(
              <Suspense fallback={<OptionalPanelState title={copy.marketProfileTitle} message={copy.marketProfileLoading} />}>
                <CapabilitiesPanel
                  pendingMarket={pending.market}
                  dictionary={dictionary}
                  organizationId={organizationIdValue}
                  organizationName={profile.displayName}
                />
              </Suspense>
            )}
            credentials={(
              <Suspense fallback={<OptionalPanelState title={copy.enrichmentTitle} message={copy.enrichmentLoading} />}>
                <CredentialsPanel
                  pendingEnrichment={pending.enrichment}
                  dictionary={dictionary}
                  organizationId={organizationIdValue}
                />
              </Suspense>
            )}
            locations={(
              <Suspense fallback={<OptionalPanelState title={copy.geographyTitle} message={copy.geographyLoading} />}>
                <LocationsPanel
                  pendingEnrichment={pending.enrichment}
                  pendingMap={pending.map}
                  dictionary={dictionary}
                  organizationId={organizationIdValue}
                  locationVisibility={location?.visibility ?? null}
                  markerVisible={markerVisible}
                />
              </Suspense>
            )}
            media={(
              <Suspense fallback={<OptionalPanelState title={copy.enrichmentTitle} message={copy.enrichmentLoading} />}>
                <MediaPanel
                  pendingEnrichment={pending.enrichment}
                  dictionary={dictionary}
                  organizationId={organizationIdValue}
                />
              </Suspense>
            )}
            preferences={(
              <Suspense fallback={<OptionalPanelState title={copy.marketProfileTitle} message={copy.marketProfileLoading} />}>
                <PreferencesPanel
                  pendingMarket={pending.market}
                  dictionary={dictionary}
                  organizationId={organizationIdValue}
                  organizationName={profile.displayName}
                />
              </Suspense>
            )}
          />
        </section>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
