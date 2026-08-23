import {
  createCanonicalGeography,
  createGeographyDatasetSource,
  createGeographyVersion,
  geographyReference,
  type GeographyDatasetSource,
} from "../../domain/geography-fabric/model.ts";
import type { ResolvedGeographyEntry } from "../../domain/geography-fabric/resolver.ts";

export interface GovernedMarketOverlay {
  readonly datasetSource: GeographyDatasetSource;
  readonly entry: ResolvedGeographyEntry;
}

function fragment(value: string, label: string): string {
  const result = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!result) throw new Error(`${label} is required.`);
  return result;
}

export function createGovernedMarketOverlay(input: Readonly<{
  key: string;
  name: string;
  externalId?: string;
  countryCode?: string;
  stateCode?: string | null;
  vintage: string;
  authority: string;
  sourceUrl?: string | null;
  licenseOrUseBasis?: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  now: string;
}>): GovernedMarketOverlay {
  const key = fragment(input.key, "Market key");
  const vintage = fragment(input.vintage, "Market vintage");
  const datasetSource = createGeographyDatasetSource({
    id: `rfxchange-market:${key}:${vintage}`,
    sourceSystem: "rfxchange-market",
    name: `${input.name} market definition`,
    authority: input.authority,
    sourceUrl: input.sourceUrl,
    licenseOrUseBasis:
      input.licenseOrUseBasis ?? "RFxchange governed operating-market definition",
    vintage: input.vintage,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    importedAt: input.now,
  });
  const geographyId = `market:${key}`;
  const versionId = `${geographyId}:${vintage}`;
  const geography = createCanonicalGeography({
    id: geographyId,
    type: "region-market",
    name: input.name,
    countryCode: input.countryCode ?? "US",
    stateCode: input.stateCode ?? null,
    externalId: input.externalId ?? key,
    sourceSystem: "rfxchange-market",
    currentVersionId: versionId,
    now: input.now,
  });
  const version = createGeographyVersion({
    id: versionId,
    geographyId: geography.id,
    datasetSourceId: datasetSource.id,
    sourceLayer: "region-market",
    vintage: input.vintage,
    name: `${input.name} (${input.vintage})`,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo,
    now: input.now,
  });
  return Object.freeze({
    datasetSource,
    entry: Object.freeze({
      geography,
      version,
      reference: geographyReference({ geography, version }),
    }),
  });
}

export function createHamptonRoadsMarketOverlay(now: string): GovernedMarketOverlay {
  return createGovernedMarketOverlay({
    key: "hampton-roads-va",
    name: "Hampton Roads",
    externalId: "hampton-roads-va",
    countryCode: "US",
    stateCode: "VA",
    vintage: "2026",
    authority: "RFxchange governed market authority",
    licenseOrUseBasis:
      "RFxchange governed market overlay; physical containment remains Census-derived",
    now,
  });
}
