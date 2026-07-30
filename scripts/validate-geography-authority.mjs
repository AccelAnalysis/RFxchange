import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const model = await read("src/domain/geography/model.ts");
const policy = await read("src/domain/geography/policy.ts");
const service = await read("src/application/geography/primary-operating-geography.ts");
const repositories = await read("src/infrastructure/firestore/geography-repositories.ts");
const schema = await read("src/infrastructure/firestore/schema.ts");
const rules = await read("firestore.rules");
const ci = await read(".github/workflows/ci.yml");

for (const requirement of [
  "FipsCode",
  "AuthoritativeBoundaryReference",
  "GeographyBounds",
  "GeographyDefaultCamera",
  "parentGeographyId",
  "adjacentGeographyIds",
  "visible-unreleased",
  "limited",
  "restricted",
  "resolveGeographyCameraPlan",
]) {
  assert.ok(model.includes(requirement), `Slice 2.1 geography model is missing ${requirement}.`);
}

for (const releaseState of [
  'case "released"',
  'case "visible-unreleased"',
  'case "limited"',
  'case "restricted"',
]) {
  assert.ok(policy.includes(releaseState), `Geography release policy is missing ${releaseState}.`);
}
assert.ok(
  policy.includes("explicit-authorization") &&
    policy.includes("authorization.status === \"active\"") &&
    policy.includes("authorization.expiresAt"),
  "Restricted geography must require a current active server-side authorization.",
);

for (const requirement of [
  "AuthenticatedServerContext",
  "access-journey-not-owned",
  "unknown-geography",
  "evaluateGeographyParticipation",
  "primary-geography-selection",
  "requireForOrientation",
  "unitOfWork",
]) {
  assert.ok(service.includes(requirement), `Primary geography service is missing ${requirement}.`);
}
assert.ok(
  !service.includes('from "firebase') && !service.includes("firebase-admin"),
  "Primary geography application authority must remain provider-independent.",
);

for (const collection of [
  "geographies",
  "primaryGeographySelections",
  "geographyParticipationAuthorizations",
]) {
  assert.ok(schema.includes(`${collection}: "${collection}"`), `Missing ${collection} schema registration.`);
  assert.ok(
    rules.includes(`match /${collection}/{documentId}`),
    `Missing deny-by-default rules coverage for ${collection}.`,
  );
}
assert.ok(
  repositories.includes("saveMutableFirestoreRecordsAtomically") &&
    repositories.includes('"primaryGeographySelections"') &&
    repositories.includes('"accessJourneys"'),
  "Primary geography selection and lifecycle transition must share one Firestore transaction.",
);
assert.ok(
  ci.includes("smoke-geography-authority-emulator.mjs"),
  "Production CI must run the Slice 2.1 Firestore emulator acceptance.",
);

console.log(
  "Slice 2.1 geography authority validated: canonical metadata, server authorization, release policy, atomic selection, and camera contract.",
);
