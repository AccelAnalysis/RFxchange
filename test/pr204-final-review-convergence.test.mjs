import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public RFx projection is resolved before participant lifecycle redirects", async () => {
  const page = await read("app/opportunities/[reference]/page.tsx");
  const publicLookup = page.indexOf("const publicOpportunity = await resolvePublicOpportunityProjection(reference)");
  const participantResolution = page.indexOf("const access = await resolveParticipantRoute");
  assert.ok(publicLookup >= 0 && participantResolution > publicLookup,
    "Public publications must remain anonymously/publicly readable before participant activation routing is considered.");
  assert.match(page, /if \(publicOpportunity\) return opportunityView\(publicOpportunity\)/);
  assert.match(page, /access\.state\.lifecycleState !== "open-platform"[\s\S]{0,180}controlledPlatformUrl/);
});

test("opportunity alert delivery revalidates Firebase provider account before provider send", async () => {
  const [worker, adminRuntime] = await Promise.all([
    read("functions/src/opportunity-discovery-functions.ts"),
    read("functions/src/runtime/firebase-admin.ts"),
  ]);
  assert.match(adminRuntime, /export function getFunctionsAuth\(\)/);
  assert.match(worker, /getFunctionsAuth\(\)\.getUser\(providerSubject\)/);
  assert.match(worker, /!account\.disabled/);
  assert.match(worker, /account\.emailVerified/);
  assert.match(worker, /auth\/user-not-found/);
  assert.match(worker, /suppressionReason: reason/);
  const accountCheck = worker.indexOf("providerAccountAuthoritative(claimed.providerSubject, request)");
  const delivery = worker.indexOf("executeReliableTransactionalEmailJob");
  assert.ok(accountCheck >= 0 && delivery > accountCheck,
    "Firebase provider-account authority must be revalidated before transactional email delivery begins.");
});

test("opportunity evaluation freezes one time and digest window across retries", async () => {
  const [reliability, worker, service] = await Promise.all([
    read("src/infrastructure/rfx/opportunity-discovery-reliability.ts"),
    read("functions/src/opportunity-discovery-evaluation-functions.ts"),
    read("src/application/rfx/opportunity-discovery-service.ts"),
  ]);
  assert.match(reliability, /readonly evaluationAt: string/);
  assert.match(reliability, /evaluationAt: current\.evaluationAt \?\? evaluationAt/);
  assert.match(reliability, /evaluationAt,/);
  assert.match(worker, /readonly evaluationAt\?: string/);
  assert.match(worker, /const evaluationAt = claimed\.record\.evaluationAt \?\? projection\.publishedAt/);
  assert.match(worker, /new Date\(evaluationAt\)\.toISOString\(\)/);
  assert.doesNotMatch(
    worker,
    /processAllActiveSearches\([\s\S]{0,260}new Date\(\)\.toISOString\(\)/,
    "Durable retry must not recalculate the digest window from invocation time.",
  );
  assert.match(service, /const now = projection\.publishedAt \?\? this\.now\(\)/,
    "The synchronous publication pass must use the same frozen publication time as durable evaluation.");
});

test("opportunity cursor parser has no artificial ten-thousand offset ceiling", async () => {
  const service = await read("src/application/rfx/opportunity-discovery-service.ts");
  assert.match(service, /Number\.isSafeInteger\(offset\)/);
  assert.doesNotMatch(service, /offset > 10_000/);
});
