#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createHamptonRoadsMarketOverlay } from "../src/application/geography-fabric/market-overlays.ts";
import { acceptedPointFingerprint, geographyPoint } from "../src/domain/geography-fabric/model.ts";
import { CensusAcceptedPointGeographyResolver } from "../src/infrastructure/geography/census-geography-resolver.ts";
import { buildHamptonRoadsProviderMigrationPlan } from "./prepare-hampton-roads-provider-migration.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function normalizedTimestamp(value, label) {
  const parsed = Date.parse(String(value));
  if (Number.isNaN(parsed)) throw new Error(`${label} must be ISO-compatible.`);
  return new Date(parsed).toISOString();
}

function normalizedLocationKey(value) {
  const key = String(value ?? "").trim();
  if (!key) throw new Error("Accepted Hampton Roads location requires a location key.");
  return key;
}

function publicError(error) {
  if (error instanceof Error) return error.message.slice(0, 500);
  return "Unknown geography resolution failure.";
}

function stableLocationInputs(plan) {
  const byLocationKey = new Map();
  for (const record of plan.records) {
    const location = record.location;
    const census = location?.census;
    if (!location || !census) continue;
    const locationKey = normalizedLocationKey(location.locationKey);
    const point = geographyPoint({
      longitude: census.longitude,
      latitude: census.latitude,
    });
    const fingerprint = acceptedPointFingerprint(point);
    const existing = byLocationKey.get(locationKey);
    if (existing && existing.acceptedPointFingerprint !== fingerprint) {
      throw new Error(
        `Accepted Hampton Roads location ${locationKey} has conflicting coordinates.`,
      );
    }
    if (existing) {
      existing.seedKeys.push(record.seedKey);
      existing.dispositions.add(record.disposition);
      continue;
    }
    byLocationKey.set(locationKey, {
      locationKey,
      seedKeys: [record.seedKey],
      dispositions: new Set([record.disposition]),
      acceptedPoint: point,
      acceptedPointFingerprint: fingerprint,
      matchedAddress: census.matchedAddress,
      benchmark: census.benchmark,
      sourceGeocodedAt: census.geocodedAt,
    });
  }
  return Object.freeze(
    [...byLocationKey.values()]
      .sort((left, right) => left.locationKey.localeCompare(right.locationKey))
      .map((value) =>
        Object.freeze({
          ...value,
          seedKeys: Object.freeze([...value.seedKeys].sort()),
          dispositions: Object.freeze([...value.dispositions].sort()),
        }),
      ),
  );
}

function serializedEntry(entry) {
  return Object.freeze({
    geography: entry.geography,
    version: entry.version,
    reference: entry.reference,
  });
}

function serializedResolution(input, resolution, market) {
  if (
    resolution.acceptedPointFingerprint !== input.acceptedPointFingerprint
    || acceptedPointFingerprint(resolution.acceptedPoint) !== input.acceptedPointFingerprint
  ) {
    throw new Error(
      `Resolver returned geography for a different point than accepted location ${input.locationKey}.`,
    );
  }
  return Object.freeze({
    status: "ready_for_profile_materialization",
    locationKey: input.locationKey,
    seedKeys: input.seedKeys,
    dispositions: input.dispositions,
    acceptedPoint: input.acceptedPoint,
    acceptedPointFingerprint: input.acceptedPointFingerprint,
    matchedAddress: input.matchedAddress,
    sourceGeocodedAt: input.sourceGeocodedAt,
    resolver: resolution.resolver,
    benchmark: resolution.benchmark,
    vintage: resolution.vintage,
    resolvedAt: resolution.resolvedAt,
    hierarchy: resolution.hierarchy,
    overlays: Object.freeze([
      ...resolution.overlays,
      market.entry.reference,
    ]),
    datasetSources: Object.freeze([
      ...resolution.datasetSources,
      market.datasetSource,
    ]),
    entries: Object.freeze([
      ...resolution.entries.map(serializedEntry),
      serializedEntry(market.entry),
    ]),
    marketOverlay: Object.freeze({
      geographyId: market.entry.geography.id,
      geographyVersionId: market.entry.version.id,
      type: market.entry.reference.type,
      derivation: "governed-import",
    }),
  });
}

export async function buildHamptonRoadsGeographyEnrichmentManifest(input = {}) {
  const generatedAt = normalizedTimestamp(
    input.generatedAt ?? new Date().toISOString(),
    "Manifest generation timestamp",
  );
  const plan = input.plan ?? (await buildHamptonRoadsProviderMigrationPlan());
  if (plan.marketKey !== "hampton-roads-va") {
    throw new Error("Unexpected provider migration market identity.");
  }
  const resolver = input.resolver;
  if (!resolver || typeof resolver.resolveAcceptedPoint !== "function") {
    throw new Error("Hampton Roads geography enrichment requires a resolver.");
  }

  const market = createHamptonRoadsMarketOverlay(generatedAt);
  const locations = stableLocationInputs(plan);
  const results = [];
  for (const location of locations) {
    try {
      const resolution = await resolver.resolveAcceptedPoint(location.acceptedPoint);
      results.push(serializedResolution(location, resolution, market));
    } catch (error) {
      results.push(
        Object.freeze({
          status: "needs_geography_resolution",
          locationKey: location.locationKey,
          seedKeys: location.seedKeys,
          dispositions: location.dispositions,
          acceptedPoint: location.acceptedPoint,
          acceptedPointFingerprint: location.acceptedPointFingerprint,
          matchedAddress: location.matchedAddress,
          sourceGeocodedAt: location.sourceGeocodedAt,
          error: publicError(error),
        }),
      );
    }
  }

  const ready = results.filter(
    (result) => result.status === "ready_for_profile_materialization",
  ).length;
  const needsResolution = results.length - ready;
  return Object.freeze({
    schemaVersion: 1,
    marketKey: plan.marketKey,
    sourcePlanSchemaVersion: plan.schemaVersion,
    sourceProviderCandidateCount: plan.sourceCounts.candidates,
    sourceAcceptedGeocodeCount: plan.sourceCounts.acceptedGeocodes,
    generatedAt,
    productionWrites: false,
    marketOverlay: Object.freeze({
      geographyId: market.entry.geography.id,
      geographyVersionId: market.entry.version.id,
      datasetSourceId: market.datasetSource.id,
      type: market.entry.reference.type,
    }),
    counts: Object.freeze({
      uniqueAcceptedLocations: locations.length,
      readyForProfileMaterialization: ready,
      needsGeographyResolution: needsResolution,
    }),
    locations: Object.freeze(results),
  });
}

const invoked = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invoked) {
  const resolver = new CensusAcceptedPointGeographyResolver();
  const manifest = await buildHamptonRoadsGeographyEnrichmentManifest({ resolver });
  const outputIndex = process.argv.indexOf("--output");
  const output = outputIndex >= 0 && process.argv[outputIndex + 1]
    ? path.resolve(process.argv[outputIndex + 1])
    : path.join(
        root,
        "artifacts",
        "hampton-roads-geography-enrichment-manifest.json",
      );
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(
    `${JSON.stringify({ output, counts: manifest.counts, productionWrites: false })}\n`,
  );
}
