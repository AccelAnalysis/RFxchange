import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ACQ-009 sends authenticated incomplete participants to canonical entry instead of sign-in", async () => {
  const page = await read("app/opportunities/[reference]/page.tsx");

  assert.match(page, /resolveParticipantRoute/);
  assert.match(page, /participantEntryDestination/);
  assert.match(
    page,
    /access\.kind === "access-resolution-required"[\s\S]{0,120}participantEntryDestination\(access\)/,
  );
  assert.match(
    page,
    /access\.kind === "activation-required"[\s\S]{0,120}participantEntryDestination\(access\)/,
  );
  assert.match(page, /access\.kind === "wrong-organization"/);
  assert.match(page, /access\.kind === "restricted"/);
  assert.match(
    page,
    /access\.kind === "authorized" && access\.state\.lifecycleState === "open-platform"/,
  );
  assert.match(
    page,
    /!opportunity && access\.kind === "unauthenticated"/,
    "Only genuinely unauthenticated visitors may be routed into acquisition/sign-in.",
  );
});
