import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ACQ-009 preserves authenticated-only shares through sign-in and incomplete activation", async () => {
  const [page, start, homeScene, runtime] = await Promise.all([
    read("app/opportunities/[reference]/page.tsx"),
    read("app/api/acquisition/start/route.ts"),
    read("app/api/onboarding/home-scene/route.ts"),
    read("src/infrastructure/acquisition/runtime.ts"),
  ]);

  assert.match(page, /resolveOpportunityPublicationAudience\(reference\)/);
  assert.match(page, /audience !== "authenticated-participants"/);
  assert.match(
    page,
    /access\.kind === "activation-required" \|\| access\.kind === "wrong-organization"[\s\S]{0,180}\/api\/acquisition\/start\?opportunityReference=/,
    "Incomplete authenticated participants must establish acquisition continuity before setup routing.",
  );
  assert.match(page, /access\.kind === "unauthenticated"[\s\S]{0,160}\/api\/acquisition\/start\?opportunityReference=/);
  assert.match(page, /resolvePublicOpportunityProjection\(reference, true\)/);
  assert.doesNotMatch(page, /lifecycleState === "open-platform"/);
  assert.doesNotMatch(page, /lifecycleState !== "open-platform"/);

  assert.match(start, /bindExistingActivation/);
  assert.match(start, /updateActivationJourneyContext\(current,[\s\S]{0,160}acquisitionContext: bound/);
  assert.match(start, /resolveParticipantRoute\(\{ sessionCookie \}\)/);
  assert.match(start, /access\.kind === "activation-required" \|\| access\.kind === "access-resolution-required"/);
  assert.match(start, /withAcquisitionCookie/);

  assert.match(homeScene, /savedAcquisition = access\.state\.acquisitionContext/);
  assert.match(homeScene, /savedAcquisition && savedAcquisition\.kind !== "direct"[\s\S]{0,80}"\/acquisition\/continue"/);
  assert.match(runtime, /return access\.kind === "authorized";/);
});

test("ACQ-009 public opportunities remain public before participant lifecycle routing", async () => {
  const page = await read("app/opportunities/[reference]/page.tsx");
  const publicLookup = page.indexOf("resolvePublicOpportunityProjection(reference)");
  const participantLookup = page.indexOf("resolveParticipantRoute");
  assert.ok(publicLookup >= 0 && participantLookup > publicLookup);
});
