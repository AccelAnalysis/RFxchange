import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ACQ-009 preserves authenticated-only shares without anonymous persistence or OPEN gating", async () => {
  const [page, start, session, homeScene, continuation, contextService, candidate, activationRepository, runtime] = await Promise.all([
    read("app/opportunities/[reference]/page.tsx"),
    read("app/api/acquisition/start/route.ts"),
    read("app/api/auth/session/route.ts"),
    read("app/api/onboarding/home-scene/route.ts"),
    read("app/acquisition/continue/page.tsx"),
    read("src/application/acquisition/acquisition-context.ts"),
    read("src/application/acquisition/opaque-opportunity-candidate.ts"),
    read("src/infrastructure/firestore/activation-journey.ts"),
    read("src/infrastructure/acquisition/runtime.ts"),
  ]);

  const pageBody = page.slice(page.indexOf("export default async function PublicOpportunityPage"));
  const participantLookup = pageBody.indexOf("resolveParticipantRoute");
  const audienceLookup = pageBody.indexOf("resolveOpportunityPublicationAudience(reference)");
  assert.ok(participantLookup >= 0 && audienceLookup > participantLookup,
    "Protected audience lookup must occur only after participant route resolution.");
  assert.match(
    pageBody,
    /access\.kind === "unauthenticated"[\s\S]{0,260}access\.kind === "access-resolution-required"[\s\S]{0,260}access\.kind === "activation-required"[\s\S]{0,300}\/api\/acquisition\/start\?opportunityReference=/,
  );
  assert.match(pageBody, /resolvePublicOpportunityProjection\(reference, true\)/);
  assert.doesNotMatch(pageBody, /lifecycleState === "open-platform"/);
  assert.doesNotMatch(pageBody, /lifecycleState !== "open-platform"/);

  const startBody = start.slice(start.indexOf("export async function GET"));
  const unauthBranch = startBody.indexOf("if (!sessionCookie)");
  const participantRoute = startBody.indexOf("resolveParticipantRoute({ sessionCookie })");
  const protectedLookup = startBody.indexOf("resolveOpportunityPublicationAudience(reference)");
  const persistentIssue = startBody.indexOf("persistAndBindCandidate(request, reference, userId)");
  assert.ok(unauthBranch >= 0 && participantRoute > unauthBranch && protectedLookup > participantRoute && persistentIssue > participantRoute);
  assert.match(startBody, /withOpaqueCandidateCookie\(signInResponse\(request, reference\), reference\)/);
  assert.match(candidate, /deliberately non-authorizing/);
  assert.match(candidate, /candidate\.v1\./);
  assert.match(contextService, /non-authorizing/);
  assert.match(contextService, /valid-but-nonexistent references/);

  assert.match(session, /canBootstrapActivation = Boolean\(existingContext \|\| provisionalOrganizationName\)/);
  assert.doesNotMatch(session, /existingContext \|\| provisionalOrganizationName \|\| boundAcquisition/);
  assert.match(session, /if \(acquisitionCookie && canBootstrapActivation\)/);
  assert.match(session, /parseOpaqueOpportunityCandidate\(acquisitionCookie\)/);
  assert.match(session, /activation\.bootstrap\(issued\.context, provisionalOrganizationName\)/);
  assert.match(session, /attachAcquisitionContext\(/);

  assert.match(activationRepository, /runTransaction/);
  assert.match(activationRepository, /transaction\.update\(ref,[\s\S]{0,120}acquisitionContext/);
  assert.doesNotMatch(start, /contexts\.save\(/);

  assert.match(homeScene, /savedAcquisition = access\.state\.acquisitionContext/);
  assert.match(homeScene, /savedAcquisition && savedAcquisition\.kind !== "direct"[\s\S]{0,80}"\/acquisition\/continue"/);
  assert.match(continuation, /createServerAcquisitionContextService\(\)\.resume/);
  assert.match(continuation, /catch \{[\s\S]{0,120}redirect\(canonicalWorkspace\)/);
  assert.match(continuation, /if \(acquisition\.kind === "opportunity"\)[\s\S]{0,240}redirect\(canonicalWorkspace\)/);
  assert.match(runtime, /return access\.kind === "authorized";/);
});

test("ACQ-009 public opportunities remain public before participant lifecycle routing", async () => {
  const page = await read("app/opportunities/[reference]/page.tsx");
  const body = page.slice(page.indexOf("export default async function PublicOpportunityPage"));
  const publicLookup = body.indexOf("resolvePublicOpportunityProjection(reference)");
  const participantLookup = body.indexOf("resolveParticipantRoute");
  assert.ok(publicLookup >= 0 && participantLookup > publicLookup);
});
