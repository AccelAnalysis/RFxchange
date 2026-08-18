import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const exists = (path) => existsSync(new URL(path, root));

function loadBehavioralContract() {
  const source = `
    import {
      createParticipantSpatialContext,
      parseParticipantSpatialContext,
      PARTICIPANT_SPATIAL_ACTIVE_KEY,
      participantSpatialIntelligenceHref,
      participantSpatialLensHref,
      participantSpatialStorageKey,
      serializeParticipantSpatialContext,
    } from "./src/application/participant/participant-spatial-context.ts";
    import { mapViewModeForPitch, PARTICIPANT_MAP_VIEW_OPTIONS } from "./src/application/geography/map-view.ts";
    import { projectOrganizationActions } from "./src/application/participant/organization-actions.ts";
    import { resolveNetworkDiscoveryPage } from "./src/application/network-discovery/network-discovery.ts";
    import { organizationId } from "./src/domain/organizations/model.ts";
    import { participantLifecycleDestination } from "./src/infrastructure/auth/participant-workspace-state.ts";
    const scope = { participantId: "user-a", membershipId: "member-a", organizationId: "org-a", geographyId: "geo-a" };
    const state = createParticipantSpatialContext({ scope, homeMarkerId: "marker-a" });
    const restored = parseParticipantSpatialContext(serializeParticipantSpatialContext({
      ...state,
      camera: { longitude: -76.2, latitude: 36.8, zoom: 13, pitch: 0, bearing: 0, viewMode: "2d" },
      selection: { organizationId: "org-b", markerId: "marker-b", relationshipId: "ref-b" },
    }), scope);
    const storageKey = participantSpatialStorageKey(scope);
    const storageValues = new Map([
      [PARTICIPANT_SPATIAL_ACTIVE_KEY, storageKey],
      [storageKey, serializeParticipantSpatialContext(restored)],
    ]);
    globalThis.window = {
      sessionStorage: {
        getItem: (key) => storageValues.get(key) ?? null,
      },
    };
    console.log(JSON.stringify({
      storageKey,
      restored,
      intelligenceHref: participantSpatialLensHref("intelligence"),
      intelligenceHrefWithSafeQueryBase: participantSpatialIntelligenceHref(
        restored,
        "/geography/canvas?query=preserved&selectedOrganization=stale",
      ),
      homeIntelligenceHrefWithSafeQueryBase: participantSpatialIntelligenceHref(
        state,
        "/geography/canvas?query=preserved&selectedOrganization=org-a",
      ),
      crossScope: parseParticipantSpatialContext(serializeParticipantSpatialContext(state), { ...scope, membershipId: "member-b" }),
      viewModes: PARTICIPANT_MAP_VIEW_OPTIONS,
      resolvedPitches: [mapViewModeForPitch(0), mapViewModeForPitch(35), mapViewModeForPitch(75)],
      selfActions: projectOrganizationActions({ viewerOrganizationId: "org-a", selectedOrganizationId: "org-a", officialResourceProvider: false }),
      externalActions: projectOrganizationActions({ viewerOrganizationId: "org-a", selectedOrganizationId: "org-b", officialResourceProvider: false }),
      providerActions: projectOrganizationActions({ viewerOrganizationId: "org-a", selectedOrganizationId: "org-b", officialResourceProvider: true }),
      mapOnlyActions: projectOrganizationActions({ viewerOrganizationId: "org-a", selectedOrganizationId: "org-a", officialResourceProvider: false, operationalActionsAvailable: false }),
      focusedPage: resolveNetworkDiscoveryPage({
        organizations: Array.from({ length: 27 }, (_, index) => ({ organizationId: organizationId(
          index === 25 ? "org-carried" : "org-result-" + index,
        ) })),
        requestedPage: 1,
        pageCount: 2,
        focusOrganizationId: organizationId("org-carried"),
      }),
      destinations: {
        incomplete: participantLifecycleDestination("controlled-platform", "org-a"),
        orientationComplete: participantLifecycleDestination("controlled-platform", "org-a"),
        open: participantLifecycleDestination("open-platform", "org-a"),
      },
    }));
  `;
  const result = spawnSync(process.execPath, [
    "--experimental-transform-types",
    "--experimental-loader",
    "./scripts/node-typescript-source-loader.mjs",
    "--input-type=module",
    "--eval",
    source,
  ], { cwd: new URL(".", root), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout.trim().split("\n").at(-1));
}

test("participant spatial context is scoped, versioned, non-authorizing, and rejects cross-scope restoration", () => {
  const contract = loadBehavioralContract();
  assert.match(contract.storageKey, /user-a:member-a:org-a:geo-a$/);
  assert.equal(contract.restored.selection.organizationId, "org-b");
  assert.equal(contract.restored.camera.viewMode, "2d");
  assert.equal(contract.intelligenceHref, "/geography/canvas?selectedOrganization=org-b");
  assert.equal(contract.intelligenceHrefWithSafeQueryBase, "/geography/canvas?query=preserved&selectedOrganization=org-b");
  assert.equal(contract.homeIntelligenceHrefWithSafeQueryBase, "/geography/canvas?query=preserved&selectedOrganization=org-a");
  assert.equal(contract.crossScope, null);
  const source = read("src/application/participant/participant-spatial-context.ts");
  assert.match(source, /storesAuthorization: false/);
  assert.match(source, /serverRevalidatesSelectedObjectsAndActions: true/);
  assert.match(read("src/components/auth/SignOutButton.tsx"), /clearParticipantSpatialContexts\(\)/);
  assert.match(read("src/components/auth/SignInClient.tsx"), /clearParticipantSpatialContexts\(\)/);
  assert.match(read("src/components/onboarding/ActivationJourneyClient.tsx"), /clearParticipantSpatialContexts\(\)/);
  const hook = read("src/components/participant/useParticipantSpatialContext.ts");
  assert.match(hook, /resolveParticipantSpatialStorage\([\s\S]*fallbackSnapshot/);
  assert.match(hook, /commitParticipantSpatialStorage\(window\.sessionStorage, input\.scope, resolution\)/);
  assert.match(hook, /!\(event instanceof StorageEvent\)[\s\S]*memory\.clear\(\)/);
  const storage = read("src/application/participant/participant-spatial-context.ts");
  assert.match(storage, /catch \{[\s\S]*\}[\s\S]*window\.dispatchEvent\(new Event\(PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT\)\)/);
});

test("one settled-pitch contract governs 2D, Perspective, and 3D without selection camera replay", () => {
  const contract = loadBehavioralContract();
  assert.deepEqual(contract.viewModes.map(({ id, pitch }) => [id, pitch]), [["2d", 0], ["perspective", 35], ["3d", 75]]);
  assert.deepEqual(contract.resolvedPitches, ["2d", "perspective", "3d"]);
  const scene = read("src/components/map/ExchangeSpatialScene.tsx");
  assert.match(scene, /data-map-view-mode=\{viewMode\}/);
  assert.match(scene, /data-map-pitch=\{settledPitch\.toFixed\(2\)\}/);
  assert.doesNotMatch(scene, /const focusedMarker = focusedMarkerIdRef/);
  assert.match(scene, /initialCameraRef\.current/);
  assert.match(scene, /if \(!sceneInitializationStartedRef\.current\) initialCameraRef\.current = initialCamera/);
  assert.match(scene, /map\.on\("moveend", \(\) => \{[\s\S]*if \(!sceneInitializationStartedRef\.current\) return/);
  assert.match(scene, /sceneInitializationStartedRef\.current = true;[\s\S]*applyScene\(\)/);
  assert.match(scene, /setViewMode\(settledMode\)/);
  assert.match(read("src/components/map/MapboxLocalityCanvas.tsx"), /maxPitch: 85/);
});

test("permanent participant lenses converge on one Exchange spatial scene and preserve real overlays", () => {
  const resources = read("src/components/resource-network/ResourceNetworkWorkspace.tsx");
  const referrals = read("src/components/referrals/ReferralWorkspace.tsx");
  assert.match(resources, /<ExchangeSpatialScene/);
  assert.match(referrals, /<ExchangeSpatialScene/);
  assert.doesNotMatch(resources, /MapboxLocalityCanvas/);
  assert.doesNotMatch(referrals, /MapboxLocalityCanvas/);
  assert.match(resources, /serviceFields=\{serviceFields\}/);
  assert.match(referrals, /relationshipPaths=\{relationshipPaths\}/);
});

test("marker hierarchy and account utility express organization identity without RF product glyphs or desktop chrome", () => {
  const scene = read("src/components/map/ExchangeSpatialScene.tsx");
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  const navigationStyles = read("src/components/participant/ParticipantTopNavigation.module.css");
  assert.match(scene, /cluster: true/);
  assert.match(scene, /NETWORK_SELECTED_MARKER_SOURCE_ID/);
  assert.match(scene, /organizationMarkers\.filter\(\(candidate\) => candidate\.id !== focusedMarkerId\)/);
  assert.match(scene, /data-rendered-selected-marker-count/);
  assert.match(scene, /organizationInitials/);
  assert.doesNotMatch(scene, /"text-field": "RF"/);
  assert.doesNotMatch(navigation, /className=\{styles\.accountText\}|className=\{styles\.chevron\}/);
  assert.match(navigationStyles, /\.accountButton[\s\S]*width: 44px[\s\S]*border: 0/);
  assert.match(navigation, /aria-label=\{buttonLabel\}/);
});

test("organization actions expose private RFx creation only for the selected home organization", () => {
  const contract = loadBehavioralContract();
  assert.equal(contract.selfActions.find(({ id }) => id === "manage-profile").href, "/organization-profile");
  assert.equal(contract.externalActions.find(({ id }) => id === "manage-profile").availability, "unavailable");
  assert.equal(contract.externalActions.find(({ id }) => id === "view-resources").href, null);
  assert.equal(contract.externalActions.find(({ id }) => id === "start-referral").href, "/referrals?organization=org-b");
  assert.match(contract.providerActions.find(({ id }) => id === "view-resources").href, /^\/resources\?provider=/);
  assert.deepEqual(contract.selfActions.find(({ id }) => id === "opportunities-rfx"), {
    id: "opportunities-rfx",
    availability: "available",
    href: "/opportunities",
    reason: null,
  });
  assert.deepEqual(contract.externalActions.find(({ id }) => id === "opportunities-rfx"), {
    id: "opportunities-rfx", availability: "unavailable", href: null, reason: "self-only",
  });
  assert.equal(contract.mapOnlyActions.find(({ id }) => id === "manage-profile").availability, "available");
  for (const action of contract.mapOnlyActions.filter(({ id }) => id !== "manage-profile")) {
    assert.deepEqual(
      { availability: action.availability, href: action.href, reason: action.reason },
      { availability: "unavailable", href: null, reason: "exchange-action-unavailable" },
    );
  }
});

test("a carried referral recipient is revalidated into its authorized discovery page without substitution", () => {
  const contract = loadBehavioralContract();
  assert.equal(contract.focusedPage, 2);
  const page = read("app/referrals/page.tsx");
  const runtime = read("src/infrastructure/network-discovery/runtime.ts");
  const workspace = read("src/components/referrals/ReferralWorkspace.tsx");
  const navigation = read("src/application/participant/organization-actions.ts");
  assert.match(page, /loadAuthorizedNetworkDiscovery\(\{ access, mapProjection, focusedOrganizationId \}\)/);
  assert.match(runtime, /organizationId\(input\.focusedOrganizationId\)/);
  assert.match(navigation, /\/referrals\?organization=/);
  assert.doesNotMatch(workspace, /: organizations\[0\]/);
});

test("Resource providers and existing referral counterparties hydrate their authorized marker page", () => {
  const resourcesPage = read("app/resources/page.tsx");
  const resourcesWorkspace = read("src/components/resource-network/ResourceNetworkWorkspace.tsx");
  const referralsPage = read("app/referrals/page.tsx");
  const referralsWorkspace = read("src/components/referrals/ReferralWorkspace.tsx");
  assert.match(resourcesPage, /focusedOrganizationId: queryState\.organizationId \?\? queryState\.providerId/);
  assert.match(resourcesWorkspace, /queryState\.providerId[\s\S]*selection: Object\.freeze\([\s\S]*organizationId: organization\.organizationId/);
  assert.match(referralsPage, /referralCounterpartyOrganizationId/);
  assert.match(referralsPage, /referralsPromise\.then\(\(referrals\) => referrals\[0\]/);
  assert.match(referralsWorkspace, /next\.set\("organization", counterpartyId\)[\s\S]*counterpartyId && !other/);
  assert.match(referralsWorkspace, /relationshipId: activeReferral\.id/);
});

test("focused Network organizations are hydrated independently of the bounded locality candidate page", () => {
  const discovery = read("src/application/network-discovery/network-discovery.ts");
  const runtime = read("src/infrastructure/network-discovery/runtime.ts");
  assert.match(discovery, /getByOrganizationId\([\s\S]*organizationId: OrganizationId/);
  assert.match(discovery, /Promise\.all\([\s\S]*listByBaseGeographyId[\s\S]*getByOrganizationId\(input\.focusOrganizationId\)/);
  assert.match(discovery, /focusedActivation[\s\S]*listedActivations\.some[\s\S]*Object\.freeze\(\[\.\.\.listedActivations, focusedActivation\]\)/);
  assert.match(discovery, /activation\.geographyId === input\.selectedGeography\.id/);
  assert.match(runtime, /getFirestoreRecordById<OrganizationMarkerActivation>/);
});

test("returning to Intelligence revalidates a carried organization without discarding stored filters", () => {
  const navigation = read("src/application/participant/participant-spatial-context.ts");
  const topNavigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  const page = read("app/geography/canvas/page.tsx");
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  assert.match(navigation, /destination\.searchParams\.set\("selectedOrganization", context\.selection\.organizationId\)/);
  assert.match(topNavigation, /readActiveParticipantSpatialContext\(\)[\s\S]*safeIntelligenceHref\(readParticipantIntelligenceContext\(\)\)[\s\S]*participantSpatialIntelligenceHref/);
  assert.match(page, /focusedOrganizationId: selectedOrganizationId/);
  assert.match(page, /if \(selectedOrganizationId && !focusedOrganization\)[\s\S]*focusedDiscovery/);
  assert.match(workspace, /focusedOrganization[\s\S]*appliedFocusedOrganizationIdRef/);
  assert.match(workspace, /if \(!focusedOrganization\) \{[\s\S]*appliedFocusedOrganizationIdRef\.current = null/);
  assert.match(workspace, /focusedOrganization\.marker\.id/);
});

test("a referral marker click cannot leave a hidden composer recipient behind the selected referral", () => {
  const page = read("app/referrals/page.tsx");
  const workspace = read("src/components/referrals/ReferralWorkspace.tsx");
  assert.match(workspace, /selectedCounterpartyId === organizationId/);
  assert.match(workspace, /if \(!keepsSelectedReferral\)[\s\S]*setSelectedId\(null\)/);
  assert.match(workspace, /next\.delete\("referral"\)/);
  assert.match(workspace, /relationshipId: keepsSelectedReferral \? selected\.id : null/);
  assert.match(workspace, /setRecipientOrganizationId\(organization\?\.organizationId \?\? ""\)/);
  assert.match(page, /requestedOrganizationId=\{authorizedRequestedOrganizationId\}/);
  assert.match(page, /preferOrganizationSelection=\{Boolean\(authorizedRequestedOrganizationId && !authorizedRequestedReferralId\)\}/);
  assert.match(workspace, /requestedOrganizationId && organizations\.some[\s\S]*\? requestedOrganizationId/);
});

test("selecting an existing referral synchronizes the composer recipient and authoritative URL projection", () => {
  const workspace = read("src/components/referrals/ReferralWorkspace.tsx");
  assert.match(workspace, /function selectReferral[\s\S]*next\.set\("referral", referral\.id\)/);
  assert.match(workspace, /if \(counterpartyId\) \{[\s\S]*next\.set\("organization", counterpartyId\)[\s\S]*setRecipientOrganizationId\(counterpartyId\)/);
  assert.match(workspace, /else \{[\s\S]*next\.delete\("organization"\)[\s\S]*setRecipientOrganizationId\(""\)/);
  assert.match(workspace, /startNavigation\(\(\) => router\.replace\(`\$\{pathname\}\$\{next\.size/);
  assert.match(workspace, /if \(counterpartyId && !other\) \{[\s\S]*return/);
});

test("Exchange participant routing skips orientation and release reads", () => {
  const workspaceState = read("src/infrastructure/auth/participant-workspace-state.ts");
  assert.doesNotMatch(workspaceState, /FirestoreFirstValueSelectionRepository/);
  assert.doesNotMatch(workspaceState, /FirestoreOrientationJourneyRepository|orientations\.getById/);
  assert.doesNotMatch(workspaceState, /workspace-state\.firestore-controlled-release-stage/);
});

test("overlay-side changes update real Mapbox padding without recomposing the camera", () => {
  const scene = read("src/components/map/ExchangeSpatialScene.tsx");
  assert.match(scene, /map\.jumpTo\(\{ padding: cameraPadding\(activationOverlay, workspaceOverlay\) \}\)/);
  assert.match(scene, /map\.jumpTo\(\{ padding: cameraPadding\(activationOverlay, workspaceOverlay\) \}\);[\s\S]*setSettledPadding\(renderedMapPadding\(map\)\)/);
  assert.match(scene, /persistedCamera[\s\S]*map\.jumpTo\([\s\S]*setSettledPadding\(renderedMapPadding\(map\)\)/);
  assert.match(scene, /if \(!mapLoadedRef\.current \|\| !map \|\| !mapReady\) return;[\s\S]*const previous = appliedOverlayRef\.current[\s\S]*appliedOverlayRef\.current = \{ activationOverlay, workspaceOverlay \}/);
  assert.match(scene, /repairGovernedPaddingAfterMovement[\s\S]*if \(map\.isMoving\(\)\)[\s\S]*requestAnimationFrame\(repair\)[\s\S]*if \(paddingIsSettled\) return;[\s\S]*map\.jumpTo\(\{ padding: expectedPadding \}\)/);
  assert.match(scene, /map\.on\("moveend"[\s\S]*repairGovernedPaddingAfterMovement\(\)/);
  assert.match(scene, /\[activationOverlay, mapReady, workspaceOverlay\]/);
  assert.doesNotMatch(scene, /\[activationOverlay, applyScene, continuousMotion, mode\]/);
  assert.match(scene, /data-map-padding=/);
});

test("Intelligence provider actions use a bounded fail-closed status projection", () => {
  const page = read("app/geography/canvas/page.tsx");
  const runtime = read("src/infrastructure/resource-network/discovery-runtime.ts");
  assert.match(page, /loadOptionalOfficialResourceProviderOrganizationIds/);
  assert.doesNotMatch(page, /loadAuthorizedResourceDiscovery/);
  assert.match(runtime, /MAXIMUM_OPTIONAL_PROVIDER_STATUS_LOOKUPS = 25/);
  assert.doesNotMatch(page, /slice\(0, 24\)/);
  assert.match(page, /selectedGeographyId: String\(authenticated\.mapProjection\.model\.selectedGeography\.id\)/);
  assert.match(runtime, /inspectProviderEligibility\([\s\S]*serviceGeographyId: input\.selectedGeographyId/);
  assert.match(read("src/application/resource-network/resource-network.ts"), /!input\.serviceGeographyId \|\| source\.serviceGeography\.serviceGeographyIds\.map\(String\)\.includes\(input\.serviceGeographyId\)/);
  assert.match(runtime, /catch \{[\s\S]*return Object\.freeze\(\[\]\)/);
});

test("Resource marker focus survives server revalidation independently of provider detail", () => {
  const page = read("app/resources/page.tsx");
  const query = read("src/application/resource-network/resource-network-workspace.ts");
  const workspace = read("src/components/resource-network/ResourceNetworkWorkspace.tsx");
  assert.match(query, /organizationId: workspaceId\(params\.organization\)/);
  assert.match(page, /focusedOrganizationId: queryState\.organizationId \?\? queryState\.providerId/);
  assert.match(page, /selectedOrganizationId = authorizedWorkspaceSelection/);
  assert.match(workspace, /organization: organization \? organizationId : null/);
  assert.match(workspace, /provider: providers\.some/);
  assert.match(workspace, /crossGeographyProvider[\s\S]*candidate\.marker === null/);
  assert.match(workspace, /!organization && crossGeographyProvider[\s\S]*organizationId: spatialScope\.organizationId[\s\S]*markerId: homeMarker\.id/);
  assert.match(workspace, /else \{[\s\S]*updateWorkspaceQuery\(\{ organization: null, provider: organizationId \}\)[\s\S]*organizationId: spatialScope\.organizationId[\s\S]*markerId: homeMarker\.id/);
});

test("controlled and OPEN participants resolve to the Exchange while protected lenses keep their gates", () => {
  const contract = loadBehavioralContract();
  assert.deepEqual(contract.destinations, { incomplete: "/exchange", orientationComplete: "/exchange", open: "/exchange" });
  assert.doesNotMatch(read("app/geography/canvas/page.tsx"), /lifecycleState !== "open-platform"/);
  for (const path of ["app/resources/page.tsx", "app/referrals/page.tsx", "app/quick-start/page.tsx", "app/provider-application/page.tsx"]) {
    assert.match(read(path), /access\.state\.controlledPlatformUrl \?\? "\/join"/, path);
  }
  const activation = read("src/application/onboarding/activation-journey.ts");
  const continuation = read("app/acquisition/continue/page.tsx");
  assert.match(activation, /controlledPlatformUrl: participantLifecycleDestination/);
  assert.doesNotMatch(activation, /orientations\.getById/);
  assert.doesNotMatch(activation, /controlledPlatformUrl:[\s\S]*\? "\/acquisition\/continue"/);
  assert.match(continuation, /access\.state\.controlledPlatformUrl \?\? "\/exchange"/);
  assert.match(continuation, /mapUrl === "\/exchange" \? "Enter the Exchange"/);
});

test("warm routes have no segment takeover and corrected participant copy is localized", () => {
  for (const path of ["app/geography/canvas/loading.tsx", "app/resources/loading.tsx", "app/referrals/loading.tsx", "app/organization-profile/loading.tsx", "app/quick-start/loading.tsx", "app/provider-application/loading.tsx", "app/exchange/loading.tsx"]) {
    assert.equal(exists(path), false, path);
  }
  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  assert.doesNotMatch(workspace, /Approximate location|locality-level public location|privacyTreatment|coordinateSource|participant projection|lifecycle state/);
  const reference = JSON.parse(read("src/i18n/messages/network/en-US.json"));
  const referenceKeys = Object.keys(reference.detail).sort();
  for (const locale of ["es", "fr", "de", "it"]) {
    const dictionary = JSON.parse(read(`src/i18n/messages/network/${locale}.json`));
    assert.deepEqual(Object.keys(dictionary.detail).sort(), referenceKeys, `${locale} network detail key drift`);
    assert.equal(typeof dictionary.detail.nearLocation, "string");
    assert.equal(typeof dictionary.actions["opportunities-rfx"], "string");
  }
});
