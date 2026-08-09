import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("membership changes route to a non-authorizing localized access-resolution surface", async () => {
  const [classifier, page, exchange, dictionary] = await Promise.all([
    read("src/infrastructure/auth/participant-route-classification.ts"),
    read("app/access-resolution/page.tsx"),
    read("app/exchange/page.tsx"),
    read("src/i18n/get-dictionary.ts"),
  ]);

  assert.match(classifier, /kind: "access-resolution-required"/);
  assert.match(classifier, /previous organization's controlled\/OPEN lifecycle is never copied/);
  assert.doesNotMatch(classifier, /stateForMembership/);
  assert.match(page, /access\.kind === "activation-required"/);
  assert.match(page, /access\.kind === "authorized"/);
  assert.match(page, /access\.options\.map/);
  assert.match(page, /access\.selectedOrganizationId/);
  assert.doesNotMatch(page, /fetch\(/);
  assert.doesNotMatch(page, /updateActivationJourneyContext/);
  assert.match(exchange, /access\.kind === "access-resolution-required"/);
  assert.match(exchange, /redirect\("\/access-resolution"\)/);
  assert.match(dictionary, /accessResolution/);
});
