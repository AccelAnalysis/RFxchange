#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildHamptonRoadsPromotionReviewManifest } from "../src/application/provider-seeding/hampton-roads-promotion-review.ts";
import { buildHamptonRoadsProviderMigrationPlan } from "./prepare-hampton-roads-provider-migration.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1]
    ? process.argv[index + 1]
    : null;
}

export async function prepareHamptonRoadsProviderPromotionReview(input = {}) {
  const plan = input.plan ?? (await buildHamptonRoadsProviderMigrationPlan());
  const geographyManifest = input.geographyManifest;
  if (!geographyManifest) {
    throw new Error(
      "Promotion review requires the offline Geography Fabric enrichment manifest; run resolve-hampton-roads-location-geographies.mjs first.",
    );
  }
  return buildHamptonRoadsPromotionReviewManifest({
    plan,
    geographyManifest,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  });
}

const invoked = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invoked) {
  const geographyPathArgument = argument("--geography-manifest");
  if (!geographyPathArgument) {
    throw new Error("--geography-manifest <path> is required.");
  }
  const geographyPath = path.resolve(geographyPathArgument);
  const geographyManifest = JSON.parse(await readFile(geographyPath, "utf8"));
  const review = await prepareHamptonRoadsProviderPromotionReview({
    geographyManifest,
    generatedAt: argument("--generated-at") ?? new Date().toISOString(),
  });
  const output = argument("--output")
    ? path.resolve(argument("--output"))
    : path.join(
        root,
        "artifacts",
        "hampton-roads-provider-promotion-review.json",
      );
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(review, null, 2)}\n`, "utf8");
  process.stdout.write(
    `${JSON.stringify({
      output,
      counts: review.counts,
      productionWrites: false,
      approvalsInferred: false,
    })}\n`,
  );
}
