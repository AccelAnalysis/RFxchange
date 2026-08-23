import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

function behavioralContract() {
  const source = `
    import { participantLifecycleDestination } from "./src/application/auth/participant-lifecycle-destination.ts";
    import { projectOrganizationActions } from "./src/application/participant/organization-actions.ts";
    console.log(JSON.stringify({
      destinations: {
        controlled: participantLifecycleDestination("controlled-platform", "org-a"),
        open: participantLifecycleDestination("open-platform", "org-a"),
        missingOrganization: participantLifecycleDestination("controlled-platform", null),
      },
      mapOnlyActions: projectOrganizationActions({
        viewerOrganizationId: "org-a",
        selectedOrganizationId: "org-b",
        officialResourceProvider: true,
        operationalActionsAvailable: false,
      }),
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

test("controlled and OPEN participants enter the same map-first Exchange shell", () => {
  const contract = behavioralContract();
  assert.deepEqual(contract.destinations, {
    controlled: "/exchange",
    open: "/exchange",
    missingOrganization: null,
  });

  const exchange = read("app/exchange/page.tsx");
  const canvas = read("app/geography/canvas/page.tsx");
  const discovery = read("src/infrastructure/network-discovery/runtime.ts");
  assert.match(exchange, /redirect\(mapUrl\)/);
  assert.match(exchange, /appendFoundingAcquisitionIntent\("\/geography\/canvas"\)/);
  assert.doesNotMatch(exchange, /openRelease|gate\.remediation|service\.evaluate/);
  assert.doesNotMatch(canvas, /lifecycleState !== "open-platform"/);
  assert.doesNotMatch(discovery, /open-required/);
  assert.match(discovery, /evaluateGeographyParticipation/);
  assert.match(discovery, /listByUserAndGeography/);
});

test("unfinished record actions remain visible/non-actionable while all four permanent lenses are routed", () => {
  const contract = behavioralContract();
  const actions = new Map(contract.mapOnlyActions.map((action) => [action.id, action]));
  assert.equal(actions.get("manage-profile").availability, "unavailable");
  for (const id of ["view-resources", "start-referral", "opportunities-rfx"]) {
    assert.deepEqual(actions.get(id), {
      id,
      availability: "unavailable",
      href: null,
      reason: "exchange-action-unavailable",
    });
  }

  const workspace = read("src/components/participant/ExistingWorkspaceFoundation.tsx");
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  const registry = read("src/application/participant/participant-lens-registry.ts");
  const compatibilityShell = read("src/components/participant/ParticipantWorkspace.tsx");
  const persistentShell = read("src/components/participant/PersistentParticipantShell.tsx");
  assert.doesNotMatch(workspace, /MAP_ONLY_UNAVAILABLE_LENSES/);
  assert.match(workspace, /activeItem=\{activeLens\}/);
  assert.match(workspace, /operationalActionsAvailable/);
  assert.match(workspace, /ExchangeRoomActionController/);
  assert.match(navigation, /data-mobile-lens-navigation="persistent-bottom"/);
  assert.match(navigation, /data-mobile-menu-trigger/);
  assert.match(registry, /id: "opportunities-rfx"[\s\S]*availability: "enabled"/);
  assert.match(registry, /id: "resources"[\s\S]*availability: "enabled"/);
  assert.match(registry, /id: "intelligence"[\s\S]*availability: "enabled"/);
  assert.match(registry, /id: "capabilities"[\s\S]*href: "\/capabilities"[\s\S]*availability: "enabled"/);
  assert.doesNotMatch(registry.split("export const PARTICIPANT_UTILITY_DESTINATIONS")[0], /id: "referrals"/);
  assert.match(compatibilityShell, /registerUnavailableDestinations/);
  assert.match(persistentShell, /unavailableLensIds=\{unavailableDestinations\?\.lensIds\}/);
});

test("progressive presentation does not weaken protected domain routes", () => {
  for (const path of [
    "app/opportunities/page.tsx",
    "app/resources/page.tsx",
    "app/referrals/page.tsx",
    "app/quick-start/page.tsx",
    "app/provider-application/page.tsx",
  ]) {
    assert.match(read(path), /lifecycleState !== "open-platform"/, path);
  }
  const capabilities = read("app/capabilities/page.tsx");
  assert.match(capabilities, /resolveParticipantRoute/);
  assert.match(capabilities, /lifecycleState !== "open-platform"/);

  const firstValueApi = read("app/api/first-value/route.ts");
  const firstValueClient = read("src/components/first-value/FirstValueChoiceClient.tsx");
  assert.match(firstValueApi, /selectAndRelease/);
  assert.match(firstValueApi, /nextUrl: "\/exchange"/);
  assert.match(firstValueClient, /if \(result\.nextUrl\)/);
  assert.match(firstValueClient, /Enter the Exchange without choosing/);
  assert.doesNotMatch(firstValueClient, /OPEN remains safely closed|remediation/);
  assert.doesNotMatch(firstValueClient, /one final activation step|release OPEN/);
});

test("map-only action explanations are localized in every supported locale", () => {
  for (const locale of ["en-US", "es", "fr", "it", "de"]) {
    const dictionary = JSON.parse(read(`src/i18n/messages/network/${locale}.json`));
    assert.equal(typeof dictionary.actionReasons["exchange-action-unavailable"], "string");
    assert.ok(dictionary.actionReasons["exchange-action-unavailable"].trim());
  }
});
