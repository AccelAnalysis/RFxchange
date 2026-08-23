#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataRoot = path.join(root, "data", "convergence", "hampton-roads-va");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (quoted) throw new Error("CSV ended inside a quoted field.");
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/, ""));
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((values, rowIndex) => {
    if (values.length !== header.length) {
      throw new Error(`CSV row ${rowIndex + 2} has ${values.length} columns; expected ${header.length}.`);
    }
    return Object.freeze(Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
  });
}

function boolean(value, field, key) {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${key}.${field} must be true or false.`);
}

function uniqueBy(rows, field) {
  const seen = new Set();
  for (const row of rows) {
    const value = row[field];
    if (!value) throw new Error(`Missing ${field}.`);
    if (seen.has(value)) throw new Error(`Duplicate ${field}: ${value}.`);
    seen.add(value);
  }
}

export async function buildHamptonRoadsProviderMigrationPlan() {
  const [candidateText, locationText, geocodeText] = await Promise.all([
    readFile(path.join(dataRoot, "candidates.csv"), "utf8"),
    readFile(path.join(dataRoot, "locations.csv"), "utf8"),
    readFile(path.join(dataRoot, "geocodes.json"), "utf8"),
  ]);
  const candidates = parseCsv(candidateText);
  const locations = parseCsv(locationText);
  const geocodes = JSON.parse(geocodeText);
  uniqueBy(candidates, "seed_key");
  uniqueBy(locations, "location_key");

  if (geocodes.marketKey !== "hampton-roads-va" || geocodes.provider !== "census") {
    throw new Error("Unexpected Hampton Roads geocode manifest identity.");
  }
  const acceptedEntries = Object.entries(geocodes.accepted ?? {});
  const unresolvedEntries = Object.entries(geocodes.unresolved ?? {});
  if (acceptedEntries.length !== geocodes.summary?.accepted) throw new Error("Accepted geocode summary drift.");
  if (unresolvedEntries.filter(([, value]) => value.status === "review").length !== geocodes.summary?.review) {
    throw new Error("Review geocode summary drift.");
  }
  if (unresolvedEntries.filter(([, value]) => value.status === "failed").length !== geocodes.summary?.failed) {
    throw new Error("Failed geocode summary drift.");
  }

  const candidateByKey = new Map(candidates.map((candidate) => [candidate.seed_key, candidate]));
  const locationByKey = new Map(locations.map((location) => [location.location_key, location]));
  const heldOut = new Map((geocodes.heldOut ?? []).map((entry) => [entry.seedKey, entry.reason]));
  const accepted = new Map(acceptedEntries);
  const unresolved = new Map(unresolvedEntries);

  const records = candidates.map((candidate) => {
    const geocode = accepted.get(candidate.seed_key) ?? unresolved.get(candidate.seed_key) ?? null;
    const heldOutReason = heldOut.get(candidate.seed_key) ?? null;
    const location = geocode?.locationKey ? locationByKey.get(geocode.locationKey) ?? null : null;
    const classificationReview = boolean(candidate.classification_review_required, "classification_review_required", candidate.seed_key);
    const canonicalizationReview = boolean(candidate.canonicalization_review_required, "canonicalization_review_required", candidate.seed_key);
    const acceptedLocation = geocode && !geocode.status && Number.isFinite(geocode.latitude) && Number.isFinite(geocode.longitude);
    let disposition = "off_map_unresolved";
    if (heldOutReason) disposition = "held_out";
    else if (acceptedLocation && (classificationReview || canonicalizationReview)) disposition = "needs_identity_review";
    else if (acceptedLocation) disposition = "ready_for_canonical_comparison";
    else if (geocode?.status === "review") disposition = "needs_geocode_review";

    return Object.freeze({
      seedKey: candidate.seed_key,
      displayName: candidate.display_name,
      providerClass: candidate.provider_class_candidate,
      participationPolicy: candidate.participation_policy_candidate,
      providerType: candidate.provider_type_candidate,
      resourceCategory: candidate.resource_category_candidate,
      serviceName: candidate.service_name,
      serviceSummary: candidate.service_summary,
      website: candidate.website || null,
      aliases: candidate.aliases ? candidate.aliases.split("|").map((value) => value.trim()).filter(Boolean) : [],
      serviceAreaLabels: candidate.service_area_labels ? candidate.service_area_labels.split("|").map((value) => value.trim()).filter(Boolean) : [],
      primarySourceId: candidate.primary_source_id,
      entityShape: candidate.entity_shape_candidate,
      canonicalParentCandidate: candidate.canonical_parent_candidate || null,
      intendedClaimState: candidate.intended_claim_state,
      classificationReviewRequired: classificationReview,
      canonicalizationReviewRequired: canonicalizationReview,
      disposition,
      heldOutReason,
      location: location ? Object.freeze({
        locationKey: location.location_key,
        label: location.label,
        address1: location.address1,
        address2: location.address2 || null,
        city: location.city,
        state: location.state,
        postalCode: location.postal_code,
        locationKind: location.location_kind,
        sourceStatus: location.location_status,
        census: acceptedLocation ? Object.freeze({
          benchmark: geocodes.benchmark,
          matchedAddress: geocode.matchedAddress,
          latitude: geocode.latitude,
          longitude: geocode.longitude,
          matchType: geocode.matchType,
          lookupForm: geocode.lookupForm,
          geocodedAt: geocode.geocodedAt,
        }) : null,
      }) : null,
      unresolvedGeocode: geocode?.status ? Object.freeze({
        status: geocode.status,
        reason: geocode.reason,
        candidateCount: geocode.candidateCount,
        lookupForm: geocode.lookupForm,
        geocodedAt: geocode.geocodedAt,
      }) : null,
    });
  });

  for (const seedKey of [...accepted.keys(), ...unresolved.keys(), ...heldOut.keys()]) {
    if (!candidateByKey.has(seedKey)) throw new Error(`Geocode manifest references unknown candidate ${seedKey}.`);
  }

  const counts = Object.freeze(records.reduce((current, record) => {
    current[record.disposition] = (current[record.disposition] ?? 0) + 1;
    return current;
  }, {}));
  return Object.freeze({
    schemaVersion: 1,
    marketKey: geocodes.marketKey,
    donorRepository: "AccelAnalysis/TestRFx",
    donorCommit: "db19a0cc2171d0ddde4f34a20acc881ba7279248",
    geocodeProvider: geocodes.provider,
    geocodeBenchmark: geocodes.benchmark,
    geocodePolicy: geocodes.policy,
    generatedAt: new Date().toISOString(),
    sourceCounts: Object.freeze({ candidates: candidates.length, locations: locations.length, acceptedGeocodes: accepted.size, unresolvedGeocodes: unresolved.size, heldOut: heldOut.size }),
    dispositionCounts: counts,
    records,
  });
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const plan = await buildHamptonRoadsProviderMigrationPlan();
  const outputIndex = process.argv.indexOf("--output");
  const output = outputIndex >= 0 && process.argv[outputIndex + 1]
    ? path.resolve(process.argv[outputIndex + 1])
    : path.join(root, "artifacts", "hampton-roads-provider-migration-plan.json");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ output, sourceCounts: plan.sourceCounts, dispositionCounts: plan.dispositionCounts })}\n`);
}
