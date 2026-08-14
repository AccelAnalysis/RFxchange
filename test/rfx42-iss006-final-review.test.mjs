import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ISS-006 multiple-location validation rejects malformed and oversized input before authority reads", async () => {
  const source = await read("src/application/rfx/iss006-governed-draft-service.ts");
  const multiple = source.indexOf('selection.mode === "multiple"');
  const minimum = source.indexOf("selection.locations.length < 2", multiple);
  const maximum = source.indexOf("selection.locations.length > 8", multiple);
  const loop = source.indexOf("for (const item of selection.locations)", multiple);
  const itemGuard = source.indexOf("!item ||", loop);
  const arrayGuard = source.indexOf("Array.isArray(item)", loop);
  const modeGuard = source.indexOf('typeof item.mode !== "string"', loop);
  const allowedModes = source.indexOf('"issuer-primary-location"', loop);
  const dispatch = source.indexOf("validateSingleLocation(item", loop);
  assert.ok(multiple >= 0 && minimum > multiple && maximum > minimum);
  assert.ok(loop > maximum, "Cardinality must fail before any per-location authority read.");
  assert.ok(itemGuard > loop && arrayGuard > itemGuard && modeGuard > arrayGuard);
  assert.ok(allowedModes > modeGuard && dispatch > allowedModes, "Malformed/unsupported nested locations must fail before single-location dispatch.");
});

test("ISS-006 transaction binds locality label and bounds to the current geography snapshot", async () => {
  const source = await read("src/infrastructure/rfx/iss006-governed-rfx-repository.ts");
  const replay = source.indexOf("transaction.get(commandRef)");
  const geographyRead = source.indexOf("transaction.getAll(", replay);
  const localityProjection = source.indexOf("sameLocalityProjection(item, geography)", geographyRead);
  const label = source.indexOf("current.name === item.localityLabel");
  const bounds = source.indexOf("sameBounds(item.localityBounds, current.bounds)");
  const write = source.indexOf("transaction.set(aggregateRef");
  assert.ok(replay >= 0 && geographyRead > replay, "Exact replay must precede current geography reads.");
  assert.ok(label >= 0 && bounds > label);
  assert.ok(localityProjection > geographyRead && write > localityProjection, "Current locality snapshot must be compared before persistence.");
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
