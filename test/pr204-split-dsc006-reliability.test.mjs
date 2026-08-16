import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("DSC-006 creates a durable publication-to-evaluation handoff", async () => {
  const [index, queue, runtime] = await Promise.all([
    read("functions/src/index.ts"),
    read("functions/src/opportunity-discovery-queue-functions.ts"),
    read("src/infrastructure/rfx/opportunity-discovery-runtime.ts"),
  ]);

  assert.match(index, /queueOpportunityDiscoveryEvaluationOnPublication/);
  assert.match(index, /scheduledOpportunityDiscoveryEvaluation/);
  assert.match(index, /scheduledOpportunityAlertDelivery/);
  assert.match(queue, /rfxOpportunityProjections\/\{reference\}/);
  assert.match(queue, /onDocumentCreated/);
  assert.match(queue, /evaluationAt: new Date\(Date\.parse\(projection\.publishedAt\)\)\.toISOString\(\)/);
  assert.match(queue, /status: "queued"/);
  assert.match(queue, /transaction\.create\(ref/);
  assert.match(runtime, /override async evaluatePublishedProjection/);
  assert.match(runtime, /queued for durable processing/);
  assert.doesNotMatch(runtime, /saveMatch\(/);
});

test("DSC-006 durable evaluator is exhaustive, checkpointed, and authority-bound", async () => {
  const [evaluation, admin] = await Promise.all([
    read("functions/src/opportunity-discovery-evaluation-functions.ts"),
    read("functions/src/runtime/firebase-admin.ts"),
  ]);

  assert.match(evaluation, /savedSearchCursorId/);
  assert.match(evaluation, /checkpointEvaluation/);
  assert.match(evaluation, /await checkpointEvaluation\(db, evaluationId, claimId, document\.id\)/);
  assert.match(evaluation, /SavedSearchAuthorityChangedError/);
  assert.match(evaluation, /if \(!\(error instanceof SavedSearchAuthorityChangedError\)\) throw error/);
  assert.match(evaluation, /providerAccountAuthoritative/);
  assert.match(evaluation, /getFunctionsAuth\(\)\.getUser/);
  assert.match(evaluation, /evaluationAt/);
  assert.match(evaluation, /alertFrozen/);
  assert.match(evaluation, /followUpDailyAlertIdentity/);
  assert.match(evaluation, /\/opportunities\/\$\{encodeURIComponent\(projection\.reference\)\}/);
  assert.match(admin, /getFunctionsAuth/);
});

test("DSC-006 delivery preserves valid digest constituents and never mutates an attempted payload", async () => {
  const delivery = await read("functions/src/opportunity-alert-delivery-functions.ts");

  assert.match(delivery, /const validMatches = matches\.filter/);
  assert.match(delivery, /matchAuthoritative/);
  assert.match(delivery, /validMatches\.length === 0/);
  assert.match(delivery, /replaced-after-authority-change/);
  assert.match(delivery, /const replacementId = stableId/);
  assert.match(delivery, /attempted && constituentsChanged/);
  assert.match(delivery, /providerAccountAuthoritative/);
  assert.match(delivery, /releaseClaimForRetry/);
  assert.match(delivery, /secrets: \["RFXCHANGE_MICROSOFT_CLIENT_SECRET"\]/);
  assert.match(delivery, /executeReliableTransactionalEmailJob/);
  assert.match(delivery, /normalizeOpportunityAlertLocale/);
  assert.match(delivery, /\/opportunities\/\$\{encodeURIComponent\(firstReference\)\}/);
  assert.doesNotMatch(delivery, /searches\.every\([\s\S]{0,250}status === "active"/);
});

test("DSC-006 synchronous persistence freezes claimed digests and deduplicates summaries", async () => {
  const repository = await read("src/infrastructure/firestore/opportunity-discovery.ts");

  assert.match(repository, /function alertFrozen/);
  assert.match(repository, /deliveryClaimId/);
  assert.match(repository, /attemptCount/);
  assert.match(repository, /function followUpDailyAlert/);
  assert.match(repository, /nextUniqueReferences/);
  assert.match(repository, /opportunitySummary/);
});

test("DSC-006 alert copy remains available in all five supported locales", async () => {
  const locale = await read("functions/src/opportunity-alert-locales.ts");
  for (const value of ["en-US", "es", "fr", "it", "de"]) {
    assert.match(locale, new RegExp(`(?:\\"${value}\\"|${value}:)`));
  }
  assert.match(locale, /normalizeOpportunityAlertLocale/);
  assert.match(locale, /renderOpportunityAlertMessage/);
});

test("DSC-006 does not introduce Exchange-entry or lens gating", async () => {
  const [exchange, canvas] = await Promise.all([
    read("app/exchange/page.tsx"),
    read("app/geography/canvas/page.tsx"),
  ]);
  assert.match(exchange, /geography\/canvas/);
  assert.doesNotMatch(canvas, /lifecycleState !== "open-platform"/);
});
