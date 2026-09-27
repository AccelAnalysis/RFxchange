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
        capabilities: participantLensForPathname("/capabilities"),
        referrals: participantLensForPathname("/referrals"),
        referralUtility: participantUtilityForPathname("/referrals"),
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
        capabilities: isPersistentParticipantPath("/capabilities"),
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

test("the typed registry preserves governed lens order, enabled routing, and utility separation", () => {
  const contract = loadRegistryContract();
  assert.deepEqual(
    contract.lenses.map(({ id }) => id),
    ["opportunities-rfx", "resources", "intelligence", "capabilities"],
  );
  assert.deepEqual(
    contract.lenses.map(({ availability }) => availability),
    ["enabled", "enabled", "enabled", "enabled"],
  );
  assert.equal(contract.lenses[0].href, "/opportunities");
  assert.deepEqual(contract.lenses[0].activePathPrefixes, ["/opportunities"]);
  assert.equal(contract.lenses[1].href, "/resources");
  assert.equal(contract.lenses[2].href, "/geography/canvas");
  assert.equal(contract.lenses[3].href, "/capabilities");
  assert.deepEqual(contract.lenses[3].activePathPrefixes, ["/capabilities"]);
  assert.equal(contract.lenses.some(({ id }) => id === "network"), false);
  assert.deepEqual(contract.utilities, {
    account: { href: "/organization-profile" },
    "quick-start": { href: "/quick-start" },
    referrals: { href: "/referrals", managementHref: "/referrals?intent=manage" },
  });
  assert.deepEqual(contract.matches, {
    resources: "resources",
    resourceDetail: "resources",
    intelligence: "intelligence",
    capabilities: "capabilities",
    referrals: null,
    referralUtility: "referrals",
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
    capabilities: true,
    referrals: true,
    account: true,
    quickStart: true,
    orientation: false,
    admin: false,
  });
});

test("enabled Opportunities/RFx resolves to authorized discovery while issuer management remains private", () => {
  const contract = loadRegistryContract();
  const opportunity = contract.lenses[0];
  const page = read("app/opportunities/page.tsx");
  const managePage = read("app/opportunities/manage/page.tsx");
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
  assert.match(page, /OpportunityDiscoveryWorkspace/);
  assert.match(managePage, /resolveParticipantRoute/);
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
  assert.match(navigation, /data-mobile-menu-trigger/);
  assert.match(navigation, /<ExchangeLensIcon icon="menu"/);
  assert.match(adminProjection, /resolveAdminPortalAccess/);
  assert.match(adminProjection, /access\.kind === "authorized" \? "\/admin" : null/);
  assert.match(adminProjection, /catch[\s\S]*closedAdministrationContext/);
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
  assert.match(navigation, /intelligenceHref: storedIntelligenceHref\(\)/);
  assert.doesNotMatch(navigation, /authorize|permission|membership|tenancy/);
  assert.match(signOut, /clearParticipantIntelligenceContext\(\)[\s\S]*\.signOut\(\)/);
  assert.match(signIn, /method: "POST"[\s\S]*clearParticipantIntelligenceContext\(\)/);
  assert.match(activation, /method: "POST"[\s\S]*clearParticipantIntelligenceContext\(\)/);
  assert.match(activation, /clearParticipantIntelligenceContext\(\)[\s\S]*\.signOut\(\)/);
});

test("new shell, utility, and scoped-loading copy is complete in all supported locales", () => {
  const requiredKeys = [
    "menu",
    "opportunitiesRfx",
    "resources",
    "intelligence",
    "capabilities",
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
    "loadingCapabilitiesTitle",
    "loadingCapabilitiesBody",
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
