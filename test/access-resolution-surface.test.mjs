import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("membership changes route to one non-authorizing localized access-resolution surface", async () => {
  const [classifier, destination, page, exchange, dictionary] = await Promise.all([
    read("src/infrastructure/auth/participant-route-classification.ts"),
    read("src/infrastructure/auth/participant-route-destination.ts"),
    read("app/access/resolve/page.tsx"),
    read("app/exchange/page.tsx"),
    read("src/i18n/get-dictionary.ts"),
  ]);

  assert.match(classifier, /kind: "access-resolution-required"/);
  assert.match(classifier, /controlled\/OPEN lifecycle is never copied/);
  assert.doesNotMatch(classifier, /stateForMembership/);
  assert.match(destination, /PARTICIPANT_ACCESS_RESOLUTION_PATH = "\/access\/resolve"/);
  assert.match(destination, /access-resolution-required/);
  assert.match(page, /PARTICIPANT_ACCESS_RESOLUTION_PATH/);
  assert.match(page, /access\.kind === "activation-required"/);
  assert.match(page, /access\.kind === "authorized"/);
  assert.match(page, /access\.options\.map/);
  assert.match(page, /access\.selectedOrganizationId/);
  assert.doesNotMatch(page, /updateActivationJourneyContext/);
  assert.doesNotMatch(page, /stateForMembership/);
  assert.match(exchange, /access\.kind === "access-resolution-required"/);
  assert.match(exchange, /participantEntryDestination\(access\)/);
  assert.match(dictionary, /recoveryEnUS/);
});
