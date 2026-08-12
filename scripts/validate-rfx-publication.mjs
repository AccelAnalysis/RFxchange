import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const files = Object.fromEntries(await Promise.all([
  ["domain", "src/domain/rfx/publication.ts"],
  ["service", "src/application/rfx/rfx-publication-service.ts"],
  ["repository", "src/infrastructure/firestore/rfx.ts"],
  ["runtime", "src/infrastructure/acquisition/runtime.ts"],
  ["adapter", "src/infrastructure/acquisition/firestore-published-opportunities.ts"],
  ["api", "app/api/rfx/route.ts"],
  ["issuer", "src/components/rfx/RFxPublicationPanel.tsx"],
  ["public", "src/components/rfx/PublicOpportunityView.tsx"],
  ["rules", "firestore.rules"],
  ["tracker", "docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md"],
  ["evidence", "docs/architecture/WAVE_4_SLICE_4_4.md"],
].map(async ([key, path]) => [key, await readFile(new URL(`../${path}`, import.meta.url), "utf8")] )));

assert.match(files.domain, /evaluatePublicationReadiness/);
assert.match(files.domain, /projectResponderOpportunity/);
assert.match(files.domain, /stableDigest\(payload\)/);
assert.match(files.domain, /lifecycleState: "published"/);
assert.match(files.service, /permission: "rfx\.create" \| "rfx\.publish"/);
assert.match(files.service, /preview\.digest !== input\.previewDigest/);
assert.match(files.service, /projection\.digest !== preview\.digest/);
assert.match(files.service, /evaluateRfxCapability\("basic-issuance"\)/);
assert.doesNotMatch(files.service, /checkout|subscription|founding/i);
for (const collection of [
  "aggregateRef",
  "snapshotRef",
  "projectionRef",
  "eventRef",
  "commandRef",
  "auditRef",
]) assert.match(files.repository, new RegExp(`transaction\\.(?:set|create)\\(${collection}`));
assert.match(files.repository, /geography\.releaseState !== "released"/);
assert.match(files.runtime, /FirestorePublishedOpportunityRepository/);
assert.doesNotMatch(files.runtime, /SeededPublicOpportunityProjectionRepository/);
assert.match(files.adapter, /projection\.audience === "authenticated-participants"/);
assert.match(files.adapter, /projection\.mode !== "published"/);
assert.match(files.api, /publication-readiness/);
assert.match(files.api, /action === "publish"/);
assert.match(files.issuer, /data-rfx-preview-digest/);
assert.match(files.issuer, /authority\.publish-unavailable/);
assert.match(files.public, /data-publication-digest/);
assert.doesNotMatch(files.public, /normalizedAddress|longitude|latitude|providerReference/);
assert.doesNotMatch(files.public, /ResponderOpportunityProjection/);
for (const collection of ["rfxPublicationSnapshots", "rfxOpportunityProjections"])
  assert.match(files.rules, new RegExp(`match \\/${collection}`));
assert.match(files.tracker, /438 total · 165 Done · 273 Not Started/);
assert.match(files.tracker, /4 - RFx Core: \*\*13\/41\*\*/);
for (const id of ["ISS-016", "ISS-018", "ISS-019", "ISS-020", "ACQ-009"])
  assert.match(files.tracker, new RegExp("- \\[x\\] `" + id + "`"));
assert.match(files.evidence, /B6c opportunity expression eligible for separately authorized work/);
assert.match(files.evidence, /Stabilization 2C remains incomplete/);

const localePaths = ["en-US", "es", "fr", "it", "de"].map(
  (locale) => new URL(`../src/i18n/messages/rfx/${locale}.json`, import.meta.url),
);
const locales = await Promise.all(localePaths.map(async (path) => JSON.parse(await readFile(path, "utf8"))));
const keys = (value, prefix = "") => Object.entries(value).flatMap(([key, child]) => {
  const path = prefix ? `${prefix}.${key}` : key;
  return child && typeof child === "object" && !Array.isArray(child) ? keys(child, path) : [path];
}).sort();
for (const locale of locales.slice(1)) assert.deepEqual(keys(locale), keys(locales[0]));

console.log("Slice 4.4 readiness, projection parity, publication atomicity, audience gating, free/basic policy, UI, and localization architecture passed.");
