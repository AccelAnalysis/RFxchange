import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const exists = (path) => existsSync(new URL(path, root));

function loadRegistryContract() {
  const script = `
    import {
      PARTICIPANT_LENSES,
      PARTICIPANT_UTILITY_DESTINATIONS,
      participantLensForPathname,
      participantNavigationState,
      participantUtilityForPathname,
      isPersistentParticipantPath,
    } from "./src/application/participant/participant-lens-registry.ts";
    console.log(JSON.stringify({
      lenses: PARTICIPANT_LENSES,
      utilities: PARTICIPANT_UTILITY_DESTINATIONS,
      matches: {
        resources: participantLensForPathname("/resources"),
        resourceDetail: participantLensForPathname("/resources/detail"),
        intelligence: participantLensForPathname("/geography/canvas"),
        referrals: participantLensForPathname("/referrals"),
        account: participantNavigationState("/organization-profile"),
        providerApplication: participantNavigationState("/provider-application"),
        quickStart: participantUtilityForPathname("/quick-start"),
        noLens: participantNavigationState("/orientation"),
        opportunities: participantLensForPathname("/opportunities"),
      },
      persistent: {
        opportunities: isPersistentParticipantPath("/opportunities"),
        intelligence: isPersistentParticipantPath("/geography/canvas"),
        resources: isPersistentParticipantPath("/resources"),
        referrals: isPersistentParticipantPath("/referrals"),
        account: isPersistentParticipantPath("/organization-profile"),
        quickStart: isPersistentParticipantPath("/quick-start"),
        orientation: isPersistentParticipantPath("/orientation"),
        admin: isPersistentParticipantPath("/admin"),
      },
    }));
  `;
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-transform-types",
      "--experimental-loader",
      "./scripts/node-typescript-source-loader.mjs",
      "--input-type=module",
      "--eval",
      script,
    ],
    {
      cwd: new URL(".", root),
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const output = result.stdout.trim().split("\n").at(-1);
  assert.ok(output, "Registry subprocess did not return its behavioral contract.");
  return JSON.parse(output);
}

test("the typed registry preserves governed lens order, availability, routing, and utility separation", () => {
  const contract = loadRegistryContract();
  assert.deepEqual(
    contract.lenses.map(({ id }) => id),
    ["opportunities-rfx", "resources", "intelligence", "referrals"],
  );
  assert.deepEqual(
    contract.lenses.map(({ availability }) => availability),
    ["enabled", "enabled", "enabled", "enabled"],
  );
  assert.equal(contract.lenses[0].href, "/opportunities");
  assert.deepEqual(contract.lenses[0].activePathPrefixes, ["/opportunities"]);
  assert.equal(contract.lenses[1].href, "/resources");
  assert.equal(contract.lenses[2].href, "/geography/canvas");
  assert.equal(contract.lenses[3].href, "/referrals");
  assert.equal(contract.lenses.some(({ id }) => id === "network"), false);
  assert.deepEqual(contract.utilities, {
    account: { href: "/organization-profile" },
    "quick-start": { href: "/quick-start" },
  });
  assert.deepEqual(contract.matches, {
    resources: "resources",
    resourceDetail: "resources",
    intelligence: "intelligence",
    referrals: "referrals",
    account: "account",
    providerApplication: "account",
    quickStart: "quick-start",
    noLens: null,
    opportunities: "opportunities-rfx",
  });
  assert.deepEqual(contract.persistent, {
    opportunities: true,
    intelligence: true,
    resources: true,
    referrals: true,
    account: true,
    quickStart: true,
    orientation: false,
    admin: false,
  });
});

test("the persistent shell owns navigation while page-local shells collapse to content", () => {
  const layout = read("app/layout.tsx");
  const persistent = read("src/components/participant/PersistentParticipantShell.tsx");
  const compatibility = read("src/components/participant/ParticipantWorkspace.tsx");
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  const accountPage = read("app/organization-profile/page.tsx");
  const exchangePage = read("app/exchange/page.tsx");
  const providerApplicationPage = read("app/provider-application/page.tsx");

  assert.match(layout, /<PersistentParticipantShell>\{children\}<\/PersistentParticipantShell>/);
  assert.match(persistent, /data-participant-shell=\{authorizedParticipant \? "persistent" : undefined\}/);
  assert.match(persistent, /data-participant-shell-instance=\{authorizedParticipant \? shellInstanceId : undefined\}/);
  assert.match(persistent, /data-participant-content-region/);
  assert.match(persistent, /reportAuthorizedOrganizationName/);
  assert.match(persistent, /reportAuthorizedParticipant/);
  assert.match(persistent, /data-participant-authorized=\{authorizedParticipant \? "true" : "false"\}/);
  assert.match(persistent, /\{authorizedParticipant \? \(/);
  assert.match(persistent, /registerExplicitActiveItem/);
  assert.match(persistent, /activeItem=\{explicitActiveItem\?\.activeItem\}/);
  assert.match(compatibility, /usePersistentParticipantShellContext\(\)/);
  assert.match(compatibility, /if \(persistent\) return <>\{children\}<\/>/);
  assert.match(compatibility, /reportAuthorizedOrganizationName\(organizationName\)/);
  assert.match(compatibility, /reportAuthorizedParticipant\(\)/);
  assert.match(compatibility, /registerExplicitActiveItem\(activeItem\)/);
  assert.match(accountPage, /<ParticipantShell activeItem="account" organizationName=\{profile\.displayName\}>/);
  assert.match(exchangePage, /<ParticipantShell activeItem=\{destination\.workspace/);
  assert.match(providerApplicationPage, /<ParticipantShell activeItem="Account">/);
  assert.doesNotMatch(navigation, /fetch\("\/api\/participant-shell"/);
  assert.equal(
    exists("app/api/participant-shell/route.ts"),
    false,
    "The persistent shell must not repeat session or organization hydration.",
  );
});

test("enabled Opportunities/RFx resolves only to the authorized private draft runtime", () => {
  const contract = loadRegistryContract();
  const opportunity = contract.lenses[0];
  const page = read("app/opportunities/page.tsx");
  const route = read("app/api/rfx/route.ts");
  const workspace = read("src/components/rfx/RFxDraftWorkspace.tsx");

  assert.deepEqual(opportunity, {
    id: "opportunities-rfx",
    labelKey: "participantNavigation.opportunitiesRfx",
    href: "/opportunities",
    availability: "enabled",
    activePathPrefixes: ["/opportunities"],
  });
  assert.match(page, /resolveParticipantRoute/);
  assert.match(route, /createServerRfxDraftService/);
  assert.match(workspace, /privateDraft/);
  assert.doesNotMatch(workspace, /opportunity beacon|publishAction|match responder/i);
});

test("Account and Quick Start stay outside primary lenses and Administration remains server-authoritative", () => {
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  const registry = read("src/application/participant/participant-lens-registry.ts");
  const adminProjection = read("app/api/participant-shell/administration/route.ts");

  const primaryRegistry = registry.slice(
    registry.indexOf("export const PARTICIPANT_LENSES"),
    registry.indexOf("export const PARTICIPANT_UTILITY_DESTINATIONS"),
  );
  assert.doesNotMatch(primaryRegistry, /quick-start|organization-profile|account/);
  assert.match(navigation, /role="menu"/);
  assert.match(navigation, /role="menuitem"/);
  assert.match(navigation, /ArrowDown/);
  assert.match(navigation, /ArrowUp/);
  assert.match(navigation, /Escape/);
  assert.match(adminProjection, /resolveAdminPortalAccess/);
  assert.match(adminProjection, /access\.kind === "authorized" \? "\/admin" : null/);
  assert.match(adminProjection, /catch[\s\S]*closedAdministrationContext/);
});

test("ordinary participant navigation uses Next links and immediate transition evidence without a document reload", () => {
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");

  assert.match(navigation, /import Link, \{ useLinkStatus \} from "next\/link"/);
  assert.match(navigation, /const \{ pending \} = useLinkStatus\(\)/);
  assert.match(navigation, /pendingTransition\.current = null/);
  assert.match(navigation, /data-link-pending="true"/);
  assert.match(navigation, /performance\.mark/);
  assert.match(navigation, /performance\.measure/);
  assert.match(navigation, /performance\.getEntriesByType\("navigation"\)\.length/);
  assert.match(navigation, /rfxchange:participant-transition/);
  assert.doesNotMatch(
    navigation,
    /location\.(?:assign|replace)\s*\(|(?:window|document)\.location\s*=|setTimeout/,
  );
});

test("Intelligence context preservation is bounded to the canonical same-origin route and remains non-authorizing", () => {
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  const storage = read("src/application/participant/intelligence-context-storage.ts");
  const signOut = read("src/components/auth/SignOutButton.tsx");
  const signIn = read("src/components/auth/SignInClient.tsx");
  const activation = read("src/components/onboarding/ActivationJourneyClient.tsx");

  assert.match(storage, /PARTICIPANT_INTELLIGENCE_CONTEXT_STORAGE_KEY/);
  assert.match(navigation, /safeIntelligenceHref/);
  assert.match(navigation, /parsed\.origin !== window\.location\.origin/);
  assert.match(navigation, /parsed\.pathname !== CANONICAL_INTELLIGENCE_HREF/);
  assert.match(navigation, /useSearchParams/);
  assert.match(navigation, /participantNavigationState\(pathname\) !== "intelligence"/);
  assert.match(navigation, /writeParticipantIntelligenceContext\(currentHref\)/);
  assert.match(storage, /window\.sessionStorage\.setItem/);
  assert.match(storage, /window\.sessionStorage\.getItem/);
  assert.match(storage, /window\.sessionStorage\.removeItem/);
  assert.match(navigation, /useSyncExternalStore/);
  assert.match(navigation, /lens\.id === "intelligence"[\s\S]*intelligenceHref[\s\S]*lens\.id === "resources"[\s\S]*resourceHref/);
  assert.doesNotMatch(navigation, /authorize|permission|membership|tenancy/);
  assert.match(signOut, /clearParticipantIntelligenceContext\(\)[\s\S]*\.signOut\(\)/);
  assert.match(signIn, /method: "POST"[\s\S]*clearParticipantIntelligenceContext\(\)/);
  assert.match(activation, /method: "POST"[\s\S]*clearParticipantIntelligenceContext\(\)/);
  assert.match(activation, /clearParticipantIntelligenceContext\(\)[\s\S]*\.signOut\(\)/);
});

test("warm participant navigation preserves current content and no route takeover can return", () => {
  assert.equal(exists("app/loading.tsx"), false, "The root loading takeover must stay removed.");
  const routeLoading = [
    ["app/geography/canvas/loading.tsx", "intelligence"],
    ["app/resources/loading.tsx", "resources"],
    ["app/referrals/loading.tsx", "referrals"],
    ["app/organization-profile/loading.tsx", "account"],
    ["app/quick-start/loading.tsx", "quick-start"],
    ["app/provider-application/loading.tsx", "provider-application"],
    ["app/exchange/loading.tsx", "exchange-entry"],
  ];

  for (const [path] of routeLoading) {
    assert.equal(exists(path), false, `${path} would replace the current warm workspace.`);
  }
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  const navigationCss = read("src/components/participant/ParticipantTopNavigation.module.css");
  assert.match(navigation, /useLinkStatus/);
  assert.match(navigation, /aria-live="polite"/);
  assert.doesNotMatch(navigationCss, /spinner|pendingPulse|progress/);
  assert.doesNotMatch(navigation, /Preparing this page|Loading RFxchange|setTimeout/);
});

test("new shell, unavailable, utility, and scoped-loading copy is complete in all supported locales", () => {
  const requiredKeys = [
    "opportunitiesRfx",
    "resources",
    "intelligence",
    "referrals",
    "notYetAvailable",
    "quickStart",
    "account",
    "accountUtilities",
    "organizationProfile",
    "administration",
    "signOut",
    "signingOut",
    "loadingDestination",
    "loadingEyebrow",
    "loadingIntelligenceTitle",
    "loadingIntelligenceBody",
    "loadingResourcesTitle",
    "loadingResourcesBody",
    "loadingReferralsTitle",
    "loadingReferralsBody",
    "loadingAccountTitle",
    "loadingAccountBody",
    "loadingQuickStartTitle",
    "loadingQuickStartBody",
    "loadingProviderTitle",
    "loadingProviderBody",
    "loadingExchangeTitle",
    "loadingExchangeBody",
  ];
  const locales = ["en-US", "es", "fr", "it", "de"];
  const dictionaries = locales.map((locale) => [
    locale,
    JSON.parse(read(`src/i18n/messages/participant-navigation/${locale}.json`)),
  ]);
  const referenceKeys = Object.keys(dictionaries[0][1]).sort();

  for (const [locale, dictionary] of dictionaries) {
    assert.deepEqual(Object.keys(dictionary).sort(), referenceKeys, `${locale} key drift`);
    assert.equal(dictionary.opportunitiesRfx, "Opportunities/RFx", `${locale} governed name`);
    for (const key of requiredKeys) {
      assert.equal(typeof dictionary[key], "string", `${locale}.${key}`);
      assert.ok(dictionary[key].trim(), `${locale}.${key}`);
    }
  }
});

test("the participant shell preserves 390px, focus, Light Appearance, and reduced-motion contracts", () => {
  const navigationCss = read("src/components/participant/ParticipantTopNavigation.module.css");
  const persistentCss = read("src/components/participant/PersistentParticipantShell.module.css");

  assert.match(navigationCss, /@media \(max-width: 390px\)/);
  assert.match(navigationCss, /focus-visible/);
  assert.doesNotMatch(navigationCss, /animation:/);
  assert.match(persistentCss, /overflow-x: clip/);
  assert.doesNotMatch(`${navigationCss}\n${persistentCss}`, /dark|prefers-color-scheme/);
});

test("the configured browser runner links every canonical source import before acceptance", () => {
  const runner = read("scripts/acceptance-exchange-shell-emulator.mjs");
  const sourceImports = [...runner.matchAll(
    /^import(?:\s+[\s\S]*?\s+from\s+)?["'](\.\.\/src\/[^"']+)["'];/gm,
  )].map((match) => match[0].replace(match[1], match[1].replace("../src/", "./src/")));

  assert.ok(sourceImports.length > 0, "Configured browser runner has no source imports to validate.");
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-transform-types",
      "--experimental-loader",
      "./scripts/node-typescript-source-loader.mjs",
      "--input-type=module",
      "--eval",
      sourceImports.join("\n"),
    ],
    {
      cwd: new URL(".", root),
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.doesNotMatch(runner, /domain\/organization-authorization|domain\/geography-selection/);
  assert.match(runner, /Intelligence context captured before an in-content exit/);
  assert.match(runner, /intelligenceContextCapturedForInContentExit: true/);
  assert.match(runner, /intelligenceContextClearedOnSignOut: true/);
  assert.match(runner, /authorizedOrganizationContextReported: true/);
  assert.match(runner, /providerAliasAccountCurrentWhileLoading: aliasLoadingState\.accountCurrent/);
  assert.match(runner, /unauthorizedParticipantShellObserved: unauthorizedState\.shellObserved/);
  assert.match(runner, /\[data-participant-navigation\], \[data-participant-shell='persistent'\]/);
  assert.match(runner, /authorized organization identity in Account utility/);
  assert.match(runner, /Signing out retained another participant's Intelligence context/);
  assert.match(runner, /assert\.equal\(diagnostics\.exceptions\.length, 0/);
});
