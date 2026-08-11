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
        quickStart: participantUtilityForPathname("/quick-start"),
        noLens: participantNavigationState("/orientation"),
        unavailable: participantLensForPathname("/opportunities"),
      },
      persistent: {
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
    ["unavailable", "enabled", "enabled", "enabled"],
  );
  assert.equal(contract.lenses[0].href, null);
  assert.deepEqual(contract.lenses[0].activePathPrefixes, []);
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
    quickStart: "quick-start",
    noLens: null,
    unavailable: null,
  });
  assert.deepEqual(contract.persistent, {
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

  assert.match(layout, /<PersistentParticipantShell>\{children\}<\/PersistentParticipantShell>/);
  assert.match(persistent, /data-participant-shell="persistent"/);
  assert.match(persistent, /data-participant-shell-instance=\{shellInstanceId\}/);
  assert.match(persistent, /data-participant-content-region/);
  assert.match(persistent, /reportAuthorizedOrganizationName/);
  assert.match(compatibility, /usePersistentParticipantShellContext\(\)/);
  assert.match(compatibility, /if \(shellContext\.persistent\) return <>\{children\}<\/>/);
  assert.match(compatibility, /reportAuthorizedOrganizationName\(organizationName\)/);
  assert.doesNotMatch(navigation, /fetch\("\/api\/participant-shell"/);
  assert.equal(
    exists("app/api/participant-shell/route.ts"),
    false,
    "The persistent shell must not repeat session or organization hydration.",
  );
});

test("unavailable Opportunities/RFx is perceivable but has no dead or synthetic route", () => {
  const contract = loadRegistryContract();
  const navigation = read("src/components/participant/ParticipantTopNavigation.tsx");
  const unavailable = contract.lenses[0];

  assert.deepEqual(unavailable, {
    id: "opportunities-rfx",
    labelKey: "participantNavigation.opportunitiesRfx",
    href: null,
    availability: "unavailable",
    activePathPrefixes: [],
  });
  assert.match(navigation, /role="link"/);
  assert.match(navigation, /aria-disabled="true"/);
  assert.match(navigation, /aria-describedby=\{descriptionId\}/);
  assert.match(navigation, /participantNavigation\.notYetAvailable/);
  assert.doesNotMatch(navigation, /href=\{[^}]*opportunit/i);
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

  assert.match(navigation, /import Link from "next\/link"/);
  assert.match(navigation, /setPendingDestination\(destination\)/);
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

  assert.match(navigation, /INTELLIGENCE_CONTEXT_STORAGE_KEY/);
  assert.match(navigation, /safeIntelligenceHref/);
  assert.match(navigation, /parsed\.origin !== window\.location\.origin/);
  assert.match(navigation, /parsed\.pathname !== CANONICAL_INTELLIGENCE_HREF/);
  assert.match(navigation, /window\.sessionStorage\.setItem/);
  assert.match(navigation, /lens\.id === "intelligence" \? intelligenceHref : lens\.href/);
  assert.doesNotMatch(navigation, /authorize|permission|membership|tenancy/);
});

test("loading is scoped below the persistent shell and the page-wide takeover cannot return", () => {
  assert.equal(exists("app/loading.tsx"), false, "The root loading takeover must stay removed.");
  const sharedLoading = read("src/components/participant/ParticipantContentLoading.tsx");
  const routeLoading = [
    ["app/geography/canvas/loading.tsx", "intelligence"],
    ["app/resources/loading.tsx", "resources"],
    ["app/referrals/loading.tsx", "referrals"],
    ["app/organization-profile/loading.tsx", "account"],
    ["app/quick-start/loading.tsx", "quick-start"],
    ["app/provider-application/loading.tsx", "provider-application"],
    ["app/exchange/loading.tsx", "exchange-entry"],
  ];

  assert.match(sharedLoading, /data-participant-content-loading=\{target\}/);
  assert.match(sharedLoading, /role="status"/);
  assert.match(sharedLoading, /aria-live="polite"/);
  assert.match(sharedLoading, /aria-busy="true"/);
  assert.doesNotMatch(sharedLoading, /Preparing this page|Loading RFxchange|setTimeout/);
  for (const [path, target] of routeLoading) {
    const source = read(path);
    assert.match(source, /ParticipantContentLoading/);
    assert.match(source, new RegExp(`target="${target}"`));
  }
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
  const loadingCss = read("src/components/participant/ParticipantContentLoading.module.css");

  assert.match(navigationCss, /@media \(max-width: 390px\)/);
  assert.match(navigationCss, /focus-visible/);
  assert.match(navigationCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(loadingCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(persistentCss, /overflow-x: clip/);
  assert.doesNotMatch(`${navigationCss}\n${persistentCss}\n${loadingCss}`, /dark|prefers-color-scheme/);
});
