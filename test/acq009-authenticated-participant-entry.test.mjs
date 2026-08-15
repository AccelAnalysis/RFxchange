import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ACQ-009 preserves authenticated-only shares through sign-in, access resolution, and activation without OPEN gating", async () => {
  const [page, start, session, homeScene, continuation, contextService, runtime] = await Promise.all([
    read("app/opportunities/[reference]/page.tsx"),
    read("app/api/acquisition/start/route.ts"),
    read("app/api/auth/session/route.ts"),
    read("app/api/onboarding/home-scene/route.ts"),
    read("app/acquisition/continue/page.tsx"),
    read("src/application/acquisition/acquisition-context.ts"),
    read("src/infrastructure/acquisition/runtime.ts"),
  ]);

  const participantLookup = page.indexOf("resolveParticipantRoute");
  const audienceLookup = page.indexOf("resolveOpportunityPublicationAudience(reference)");
  assert.ok(participantLookup >= 0 && audienceLookup > participantLookup,
    "Protected audience lookup must occur only after participant route resolution.");
  assert.match(
    page,
    /access\.kind === "unauthenticated"[\s\S]{0,220}access\.kind === "access-resolution-required"[\s\S]{0,220}access\.kind === "activation-required"[\s\S]{0,220}\/api\/acquisition\/start\?opportunityReference=/,
  );
  assert.match(page, /resolvePublicOpportunityProjection\(reference, true\)/);
  assert.doesNotMatch(page, /lifecycleState === "open-platform"/);
  assert.doesNotMatch(page, /lifecycleState !== "open-platform"/);

  const unauthBranch = start.indexOf("if (!sessionCookie)");
  const startAudienceLookup = start.indexOf("resolveOpportunityPublicationAudience(reference)");
  assert.ok(unauthBranch >= 0 && startAudienceLookup > unauthBranch,
    "Anonymous acquisition entry must not inspect protected publication authority.");
  assert.match(start, /issueOpaqueOpportunityCandidate/);
  assert.match(start, /access\.kind === "authorized"[\s\S]{0,180}resolveOpportunityPublicationAudience/);
  assert.match(start, /bindExistingActivation/);
  assert.match(start, /updateActivationJourneyContext\(current,[\s\S]{0,160}acquisitionContext: bound/);
  assert.match(contextService, /non-authorizing/);
  assert.match(contextService, /valid-but-nonexistent references/);

  assert.match(session, /existingContext \|\| provisionalOrganizationName \|\| boundAcquisition/);
  assert.match(session, /activation\.bootstrap\(issued\.context, provisionalOrganizationName\)/);
  assert.match(session, /acquisitionContext: boundAcquisition/);

  assert.match(homeScene, /savedAcquisition = access\.state\.acquisitionContext/);
  assert.match(homeScene, /savedAcquisition && savedAcquisition\.kind !== "direct"[\s\S]{0,80}"\/acquisition\/continue"/);
  assert.match(continuation, /createServerAcquisitionContextService\(\)\.resume/);
  assert.match(continuation, /catch \{[\s\S]{0,260}redirect\(canonicalWorkspace\)/);
  assert.match(continuation, /resolvePublicOpportunityProjection\([\s\S]{0,100}true/);
  assert.match(runtime, /return access\.kind === "authorized";/);
});

test("ACQ-009 public opportunities remain public before participant lifecycle routing", async () => {
  const page = await read("app/opportunities/[reference]/page.tsx");
  const publicLookup = page.indexOf("resolvePublicOpportunityProjection(reference)");
  const participantLookup = page.indexOf("resolveParticipantRoute");
  assert.ok(publicLookup >= 0 && participantLookup > publicLookup);
});
