import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [journey, journeyStyles, spatial, spatialStyles, roadmap] = await Promise.all([
  read("src/components/onboarding/ActivationJourneyClient.tsx"),
  read("src/components/onboarding/ActivationJourneyClient.module.css"),
  read("src/components/onboarding/SpatialActivationExperience.tsx"),
  read("src/components/onboarding/SpatialActivationExperience.module.css"),
  read("docs/brand/BRAND_IMPLEMENTATION_ROADMAP.md"),
]);

for (const preserved of [
  "search-geographies",
  "select-census-geography",
  "MapboxLocalityCanvas",
  "Confirm this map position",
  "websiteNotApplicable",
  "Send verification email",
  "I accept the current RFxchange",
  "Terms of Service",
  "Platform Rules / conduct requirements",
  "Privacy Policy",
  "Enter the Exchange",
  "Your organization is ready",
]) {
  assert.ok(journey.includes(preserved), `Brand B5 must preserve activation contract: ${preserved}.`);
}

for (const prohibited of [
  "business objectives",
  "participation role",
  "organization type is required",
  "apply as a resource provider during registration",
  "controlled exchange",
]) {
  assert.equal(journey.toLowerCase().includes(prohibited), false, `Brand B5 cannot reintroduce ${prohibited}.`);
}

assert.ok(
  journey.includes('authMode === "register"') &&
    journey.includes('authMode === "signin"') &&
    journey.includes('authMode === "register" ? (') &&
    journey.includes("Organization name"),
  "Brand B5 must preserve register/sign-in separation and keep organization data out of the sign-in-only fields.",
);

assert.ok(
  spatial.includes('window.matchMedia("(prefers-reduced-motion: reduce)")') &&
    spatial.includes("reducedMotion ? 50 : 900") &&
    spatial.includes(">Enter now</") &&
    !spatial.includes("3_400") &&
    spatial.includes("Activation progress is preserved") &&
    spatial.includes("Your organization is now visible. Entering The RFxchange.") &&
    spatial.includes("StatusPill"),
  "Brand B5 must provide state-preserving activation continuity and a non-blocking reduced-motion handoff.",
);
assert.ok(
  spatial.includes("ExchangeSpatialScene") &&
    spatial.includes('mode={sceneMode}') &&
    spatial.includes('marker={homeMarker}') &&
    spatial.includes('activationOverlay={!homeMarker}'),
  "Brand B5 must preserve spatial continuity and authoritative marker handoff.",
);

assert.equal(
  /#(?:0b0b0d|f7f3ea|252932|d6a23a|8a6418|2e5eaa|3b7b57)\b/i.test(`${journeyStyles}\n${spatialStyles}`),
  false,
  "Brand B5 activation styling must consume semantic tokens rather than approved raw palette literals.",
);
assert.ok(
  journeyStyles.includes("focus-visible") &&
    journeyStyles.includes("@media (prefers-reduced-motion: reduce)") &&
    journeyStyles.includes("@media (prefers-reduced-transparency: reduce)") &&
    spatialStyles.includes("@media (prefers-reduced-motion: reduce)") &&
    spatialStyles.includes("@media (prefers-reduced-transparency: reduce)"),
  "Brand B5 must preserve keyboard, reduced-motion and reduced-transparency behavior.",
);

assert.equal(`${journey}\n${spatial}`.includes("new Audio("), false, "Brand B5 cannot add ungoverned activation sound.");
assert.equal(`${journey}\n${spatial}`.includes("<audio"), false, "Brand B5 cannot add activation audio markup.");

assert.ok(
  roadmap.includes("Brand Gate B5 — Onboarding and activation experience") &&
    roadmap.includes("every Wave 2 activation gate remains authoritative") &&
    roadmap.includes("configured-browser acceptance covers no-website and available-website paths"),
  "Brand B5 must remain aligned with canonical acceptance.",
);

console.log(
  "Brand Gate B5 activation validated: semantic calm UI, preserved account/locality/organization/location/profile/marker/OPEN authority, state continuity, non-blocking reduced-motion handoff, website paths and no provider/role/objective/sound regression.",
);
