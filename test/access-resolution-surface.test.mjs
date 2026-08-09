import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

async function collectParticipantPages(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const pages = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      pages.push(...await collectParticipantPages(new URL(`${entry.name}/`, directoryUrl)));
      continue;
    }
    if (entry.isFile() && entry.name === "page.tsx") {
      pages.push(new URL(entry.name, directoryUrl));
    }
  }

  return pages;
}

function firstAuthorityRead(source, startIndex) {
  const indexes = [
    source.indexOf("access.state", startIndex),
    source.indexOf("access.membership", startIndex),
  ].filter((index) => index >= 0);
  return indexes.length > 0 ? Math.min(...indexes) : -1;
}

test("membership changes route to one non-authorizing localized access-resolution surface", async () => {
  const [classifier, destination, page, exchange, acquisitionContinuation, dictionary] = await Promise.all([
    read("src/infrastructure/auth/participant-route-classification.ts"),
    read("src/infrastructure/auth/participant-route-destination.ts"),
    read("app/access/resolve/page.tsx"),
    read("app/exchange/page.tsx"),
    read("app/acquisition/continue/page.tsx"),
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
  assert.match(acquisitionContinuation, /access\.kind === "access-resolution-required"/);
  assert.match(acquisitionContinuation, /participantEntryDestination\(access\)/);
  assert.ok(
    acquisitionContinuation.indexOf('access.kind === "access-resolution-required"') <
      acquisitionContinuation.indexOf("access.state.acquisitionContext"),
    "Acquisition continuation must resolve membership changes before reading stale acquisition context",
  );
  assert.ok(
    acquisitionContinuation.indexOf('access.kind === "access-resolution-required"') <
      acquisitionContinuation.indexOf('access.state.lifecycleState === "open-platform"'),
    "Acquisition continuation must resolve membership changes before any lifecycle-dependent rendering",
  );
  assert.match(dictionary, /recoveryEnUS/);
});

test("every participant page handles access resolution before consuming organization authority", async () => {
  const pages = await collectParticipantPages(new URL("../app/", import.meta.url));
  const canonicalResolutionPage = "/app/access/resolve/page.tsx";
  const violations = [];
  let participantPageCount = 0;

  for (const pageUrl of pages) {
    const source = await readFile(pageUrl, "utf8");
    if (!source.includes("resolveParticipantRoute")) continue;
    participantPageCount += 1;

    if (pageUrl.pathname.endsWith(canonicalResolutionPage)) continue;

    const resolverIndex = source.indexOf("resolveParticipantRoute");
    const resolutionIndex = source.indexOf('access.kind === "access-resolution-required"', resolverIndex);
    if (resolutionIndex < 0) {
      violations.push(`${pageUrl.pathname}: missing access-resolution-required handling`);
      continue;
    }

    const authorityReadIndex = firstAuthorityRead(source, resolverIndex);
    if (authorityReadIndex >= 0 && resolutionIndex > authorityReadIndex) {
      violations.push(`${pageUrl.pathname}: reads access.state/access.membership before access resolution`);
    }
  }

  assert.ok(participantPageCount > 1, "Expected multiple participant route consumers to be guarded");
  assert.deepEqual(
    violations,
    [],
    `Participant access-resolution guard violations:\n${violations.join("\n")}`,
  );
});
