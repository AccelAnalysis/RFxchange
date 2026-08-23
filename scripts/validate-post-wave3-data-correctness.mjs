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

const participantLensDefinitions = participantLensRegistry.slice(
  participantLensRegistry.indexOf("export const PARTICIPANT_LENSES"),
);
const opportunitiesIndex = participantLensDefinitions.indexOf('id: "opportunities-rfx"');
const resourcesIndex = participantLensDefinitions.indexOf('id: "resources"');
const intelligenceIndex = participantLensDefinitions.indexOf('id: "intelligence"');
const capabilitiesIndex = participantLensDefinitions.indexOf('id: "capabilities"');
assert.ok(
  opportunitiesIndex >= 0 &&
    opportunitiesIndex < resourcesIndex &&
    resourcesIndex < intelligenceIndex &&
    intelligenceIndex < capabilitiesIndex,
  "The permanent participant lenses must retain the governed order.",
);
assert.match(participantLensRegistry, /id: "opportunities-rfx"[\s\S]*?href: "\/opportunities"[\s\S]*?availability: "enabled"/);
assert.match(participantLensRegistry, /id: "resources"[\s\S]*?href: "\/resources"[\s\S]*?availability: "enabled"/);
assert.match(participantLensRegistry, /id: "intelligence"[\s\S]*?href: "\/geography\/canvas"[\s\S]*?availability: "enabled"/);
assert.match(participantLensRegistry, /id: "capabilities"[\s\S]*?href: "\/capabilities"[\s\S]*?availability: "enabled"/);
assert.match(participantLensRegistry, /referrals:[\s\S]*?href: "\/referrals"/);
assert.doesNotMatch(participantLensRegistry, /id: "network"/);
assert.match(participantLensRegistry, /PARTICIPANT_UTILITY_DESTINATIONS/);
assert.match(participantLensRegistry, /account:[\s\S]*?\/organization-profile/);
assert.match(participantLensRegistry, /"quick-start":[\s\S]*?\/quick-start/);
assert.match(participantWorkspace, /ParticipantTopNavigation/);
assert.match(participantWorkspace, /usePersistentParticipantShell/);
assert.match(participantTopNavigation, /PARTICIPANT_LENSES\.map/);
assert.match(participantTopNavigation, /role="menu"/);
assert.match(participantTopNavigation, /data-mobile-menu-trigger/);
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
  assert.equal(typeof navigationCopy.menu, "string");
  assert.equal(typeof navigationCopy.resources, "string");
  assert.equal(typeof navigationCopy.intelligence, "string");
  assert.equal(typeof navigationCopy.capabilities, "string");
  assert.equal(typeof navigationCopy.referrals, "string");
  assert.equal(typeof navigationCopy.notYetAvailable, "string");
  assert.equal(typeof navigationCopy.accountUtilities, "string");
}

assert.match(authority, /438 total · 152 Done · 286 Not Started/);
assert.match(authority, /does not make Opportunities\/RFx available/);