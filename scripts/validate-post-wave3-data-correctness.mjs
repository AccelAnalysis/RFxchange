import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [
  releaseText,
  catalogText,
  referralModel,
  referralWorkspace,
  marketService,
  marketRuntime,
  marketRepository,
  marketPanel,
  participantWorkspace,
  participantTopNavigation,
  participantLensRegistry,
  dictionary,
  authority,
  tracker,
] = await Promise.all([
  read("src/generated/naics/2022/release.json"),
  read("src/generated/naics/2022/catalog.json"),
  read("src/domain/referrals/model.ts"),
  read("src/components/referrals/ReferralWorkspace.tsx"),
  read("src/application/market-profile/market-profile.ts"),
  read("src/infrastructure/market-profile/runtime.ts"),
  read("src/infrastructure/firestore/market-profile.ts"),
  read("src/components/market-profile/MarketProfilePanel.tsx"),
  read("src/components/participant/ParticipantWorkspace.tsx"),
  read("src/components/participant/ParticipantTopNavigation.tsx"),
  read("src/application/participant/participant-lens-registry.ts"),
  read("src/i18n/get-dictionary.ts"),
  read("docs/architecture/POST_WAVE_3_STABILIZATION_6_DATA_CORRECTNESS.md"),
  read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md"),
]);

const release = JSON.parse(releaseText);
const catalog = JSON.parse(catalogText);
assert.deepEqual(
  {
    version: release.version,
    sourceName: release.sourceName,
    sourceUrl: release.sourceUrl,
    sourceSha256: release.sourceSha256,
    level: release.level,
    entryCount: release.entryCount,
  },
  {
    version: "2022",
    sourceName: "U.S. Census Bureau",
    sourceUrl: "https://www.census.gov/naics/2022NAICS/2022_NAICS_Structure.xlsx",
    sourceSha256: "217c9e0d4d74e7517bc288f5f308b73aa0de5ee787976a6dd222412be28ada22",
    level: 6,
    entryCount: 1012,
  },
);
assert.equal(catalog.length, release.entryCount);
assert.equal(new Set(catalog.map((entry) => entry.code)).size, catalog.length);
assert.ok(catalog.every((entry) => /^\d{6}$/.test(entry.code) && typeof entry.title === "string" && entry.title.trim()));
assert.deepEqual(catalog.find((entry) => entry.code === "236220"), {
  code: "236220",
  title: "Commercial and Institutional Building Construction",
});

assert.match(referralModel, /senderOrganizationId: referral\.senderOrganizationId/);
assert.match(referralModel, /recipientOrganizationId: referral\.attachedRecipientOrganizationId/);
assert.match(referralWorkspace, /String\(selected\.senderOrganizationId\)/);
assert.doesNotMatch(referralWorkspace, /displayName === selected\.senderOrganizationName/);

assert.match(marketService, /naicsCatalog\.getIndustry/);
assert.match(marketService, /Participant selected from \$\{release\.sourceName\}/);
assert.match(marketService, /repository\.getIndustryProfile/);
assert.match(marketService, /preserveExistingNaics/);
assert.match(marketService, /isCanonicalGovernedDescriptor/);
assert.match(marketService, /expectedIndustryRevision/);
assert.match(marketService, /MAX_GOVERNED_NAICS_SELECTIONS/);
assert.match(marketService, /MAX_PRESERVED_HISTORICAL_NAICS/);
assert.doesNotMatch(marketService, /selectedIdentities/);
assert.doesNotMatch(marketRepository, /normalizedTimestamp|toDate\(\)\.toISOString/);
assert.match(marketRepository, /expectedRecordRevision/);
assert.match(marketRepository, /Industry context changed before persistence/);
assert.match(marketRuntime, /loadImmutableNaicsCatalog/);
assert.match(marketPanel, /marketProfile\.catalog\.resultCount/);
assert.match(marketPanel, /setCapabilityResultLimit/);
assert.match(marketPanel, /marketProfile\.industry\.resultCount/);
assert.match(marketPanel, /selectedNaicsCodes/);
assert.match(marketPanel, /selectedNaics\.map/);
assert.match(marketPanel, /preservedSnapshotNaics/);
assert.match(marketPanel, /preserveExistingNaics/);
assert.doesNotMatch(marketPanel, /name="naicsTitle"|name="naicsCode"|name="naicsVersion"/);

const opportunitiesIndex = participantLensRegistry.indexOf('id: "opportunities-rfx"');
const resourcesIndex = participantLensRegistry.indexOf('id: "resources"');
const intelligenceIndex = participantLensRegistry.indexOf('id: "intelligence"');
const referralsIndex = participantLensRegistry.indexOf('id: "referrals"');
assert.ok(
  opportunitiesIndex >= 0 &&
    opportunitiesIndex < resourcesIndex &&
    resourcesIndex < intelligenceIndex &&
    intelligenceIndex < referralsIndex,
  "The permanent participant lenses must retain the governed order.",
);
assert.match(participantLensRegistry, /id: "opportunities-rfx"[\s\S]*?href: "\/opportunities"[\s\S]*?availability: "enabled"/);
assert.match(participantLensRegistry, /id: "resources"[\s\S]*?href: "\/resources"/);
assert.match(participantLensRegistry, /id: "intelligence"[\s\S]*?href: "\/geography\/canvas"/);
assert.match(participantLensRegistry, /id: "referrals"[\s\S]*?href: "\/referrals"/);
assert.doesNotMatch(participantLensRegistry, /id: "network"/);
assert.match(participantLensRegistry, /PARTICIPANT_UTILITY_DESTINATIONS/);
assert.match(participantLensRegistry, /account:[\s\S]*?\/organization-profile/);
assert.match(participantLensRegistry, /"quick-start":[\s\S]*?\/quick-start/);
assert.match(participantWorkspace, /ParticipantTopNavigation/);
assert.match(participantWorkspace, /usePersistentParticipantShell/);
assert.match(participantTopNavigation, /PARTICIPANT_LENSES\.map/);
assert.match(participantTopNavigation, /PARTICIPANT_LENSES\.map/);
assert.match(participantTopNavigation, /role="menu"/);
assert.match(dictionary, /participantNavigation/);

for (const locale of ["en-US", "es", "fr", "it", "de"]) {
  const [marketCopyText, navigationCopyText] = await Promise.all([
    read(`src/i18n/messages/market-profile/${locale}.json`),
    read(`src/i18n/messages/participant-navigation/${locale}.json`),
  ]);
  const navigationCopy = JSON.parse(navigationCopyText);
  assert.match(marketCopyText, /"resultCount"/);
  assert.match(marketCopyText, /"selectorTitle"/);
  assert.equal(navigationCopy.opportunitiesRfx, "Opportunities/RFx");
  assert.equal(typeof navigationCopy.resources, "string");
  assert.equal(typeof navigationCopy.intelligence, "string");
  assert.equal(typeof navigationCopy.referrals, "string");
  assert.equal(typeof navigationCopy.notYetAvailable, "string");
  assert.equal(typeof navigationCopy.accountUtilities, "string");
}

assert.match(authority, /438 total · 152 Done · 286 Not Started/);
assert.match(authority, /does not make Opportunities\/RFx available/);
assert.match(authority, /does not implement any RFx Feature ID/);
assert.match(tracker, /438 total/);
assert.match(tracker, /160 Done/);
assert.match(tracker, /278 Not Started/);

console.log("Post-Wave 3 Stabilization 6 data correctness and permanent participant-lens reconciliation validated.");
