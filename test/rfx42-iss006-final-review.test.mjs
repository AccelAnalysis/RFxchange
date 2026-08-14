import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ISS-006 multiple-location validation rejects malformed items before dereference", async () => {
  const source = await read("src/application/rfx/iss006-governed-draft-service.ts");
  const multiple = source.indexOf('selection.mode === "multiple"');
  const itemGuard = source.indexOf("!item ||", multiple);
  const arrayGuard = source.indexOf("Array.isArray(item)", multiple);
  const modeGuard = source.indexOf('typeof item.mode !== "string"', multiple);
  const dispatch = source.indexOf("validateSingleLocation(item", multiple);
  assert.ok(multiple >= 0 && itemGuard > multiple);
  assert.ok(arrayGuard > itemGuard && modeGuard > arrayGuard);
  assert.ok(dispatch > modeGuard, "Malformed multiple-location entries must fail before single-location dispatch.");
});

test("ISS-006 transaction binds organization-derived location snapshots before package write", async () => {
  const source = await read("src/infrastructure/rfx/iss006-governed-rfx-repository.ts");
  const replay = source.indexOf("transaction.get(commandRef)");
  const locationRead = source.indexOf("transaction.get(organizationLocationRef)");
  const canonicalProjection = source.indexOf("performanceLocationFromConfirmed({");
  const locationGuard = source.indexOf("sameOrganizationLocationProjection(item, currentLocation)");
  const write = source.indexOf("transaction.set(aggregateRef");
  assert.ok(replay >= 0 && locationRead > replay, "Exact replay must precede current organization-location reads.");
  assert.ok(canonicalProjection >= 0 && locationGuard > canonicalProjection);
  assert.ok(write > locationGuard, "Authoritative organization-location comparison must precede RFx package persistence.");
  assert.match(source, /ORGANIZATION_LOCATIONS = "organizationLocations"/);
  assert.match(source, /String\(currentLocation\.organizationId\) !== String\(bundle\.aggregate\.issuerOrganizationId\)/);
});
