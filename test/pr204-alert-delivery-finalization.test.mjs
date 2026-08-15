import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("alert creation links through the exact audience-gated opportunity route", async () => {
  const [durable, synchronous] = await Promise.all([
    read("functions/src/opportunity-discovery-evaluation-functions.ts"),
    read("src/application/rfx/opportunity-discovery-service.ts"),
  ]);
  for (const source of [durable, synchronous]) {
    assert.match(
      source,
      /\/opportunities\/\$\{encodeURIComponent\(projection\.reference\)\}/,
    );
    assert.doesNotMatch(
      source,
      /\/opportunities\?selected=\$\{encodeURIComponent\(projection\.reference\)\}/,
    );
  }
});

test("delivered opportunity-alert framing is localized and the chosen locale is persisted at claim", async () => {
  const [worker, localeCatalog] = await Promise.all([
    read("functions/src/opportunity-discovery-functions.ts"),
    read("functions/src/opportunity-alert-locales.ts"),
  ]);
  for (const locale of ["en-US", "es", "fr", "it", "de"]) {
    assert.ok(localeCatalog.includes(`"${locale}"`));
  }
  assert.match(worker, /normalizeOpportunityAlertLocale/);
  assert.match(worker, /renderOpportunityAlertMessage/);
  assert.match(
    worker,
    /intent\.request\.variables\.locale \?\? user\?\.preferredLocale \?\? user\?\.locale/,
  );
  assert.match(
    worker,
    /const claimedRequest = Object\.freeze\([\s\S]{0,260}locale: deliveryLocale/,
  );
  assert.match(
    worker,
    /transaction\.set\(ref, \{[\s\S]{0,100}\.\.\.claimedIntent/,
  );
  assert.match(localeCatalog, /return "en-US"/);
});

test("claimed or delivered daily digests are frozen and late matches use a deterministic follow-up intent", async () => {
  const [durable, synchronousRepository] = await Promise.all([
    read("functions/src/opportunity-discovery-evaluation-functions.ts"),
    read("src/infrastructure/firestore/opportunity-discovery.ts"),
  ]);
  assert.match(durable, /function alertFrozen/);
  assert.match(durable, /existing\.status !== "queued"/);
  assert.match(durable, /existing\.deliveryClaimId/);
  assert.match(durable, /Number\(existing\.attemptCount \?\? 0\) > 0/);
  assert.match(durable, /function followUpDailyAlertIdentity/);
  assert.match(durable, /projection\.aggregateVersion/);
  assert.match(durable, /projection\.digest/);
  assert.match(
    durable,
    /baseAlertSnapshot\?\.exists[\s\S]{0,160}alertFrozen\(baseExisting\)[\s\S]{0,300}transaction\.get\(followUpRef\)/,
  );
  assert.match(
    durable,
    /if \(frozen\) \{[\s\S]{0,100}if \(referenceAlreadyPresent\) return/,
  );

  assert.match(synchronousRepository, /function alertFrozen/);
  assert.match(synchronousRepository, /current\.status !== "queued"/);
  assert.match(synchronousRepository, /current\.deliveryClaimId/);
  assert.match(synchronousRepository, /Number\(current\.attemptCount \?\? 0\) > 0/);
  assert.match(synchronousRepository, /function followUpDailyAlert/);
  assert.match(synchronousRepository, /projection\.aggregateVersion/);
  assert.match(synchronousRepository, /projection\.digest/);
  assert.match(
    synchronousRepository,
    /baseAlertSnapshot\?\.exists[\s\S]{0,220}alertFrozen\(baseAlert\)[\s\S]{0,300}transaction\.get\(targetAlertRef\)/,
  );
  assert.match(
    synchronousRepository,
    /if \(alertFrozen\(targetCurrent\)\) \{[\s\S]{0,240}alreadyRepresented[\s\S]{0,160}return "created" as const/,
  );
  assert.match(
    synchronousRepository,
    /function mergeDailyAlert[\s\S]{0,360}alertFrozen\(current\)/,
  );
});
