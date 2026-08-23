import {
  acceptedPointFingerprint,
  createCanonicalGeography,
  createGeographyDatasetSource,
  createGeographyVersion,
  geographyPoint,
  geographyReference,
  type CanonicalGeographyType,
  type GeographyPoint,
  type GeographyReference,
  type GeographySourceSystem,
  type GeographyVersionId,
  type OverlayGeographyType,
  type PhysicalGeographyHierarchy,
  type PhysicalGeographyType,
} from "../../domain/geography-fabric/model.ts";
import type {
  AcceptedPointGeographyResolution,
  AcceptedPointGeographyResolver,
  ResolvedGeographyEntry,
} from "../../domain/geography-fabric/resolver.ts";

export const CENSUS_COORDINATE_GEOGRAPHY_URL =
  "https://geocoding.geo.census.gov/geocoder/geographies/coordinates";
export const CENSUS_GEOGRAPHY_BENCHMARK = "Public_AR_Current";
export const CENSUS_GEOGRAPHY_VINTAGE = "Current_Current";

export type CensusGeographyAttributes = Readonly<
  Record<string, string | number | null | undefined>
>;

export interface CensusCoordinateGeographyResponse {
  readonly result?: Readonly<{
    geographies?: Readonly<Record<string, readonly CensusGeographyAttributes[]>>;
    input?: Readonly<Record<string, unknown>>;
  }>;
}

export interface CensusCoordinateResolverOptions {
  readonly fetchImpl?: typeof fetch;
  readonly endpoint?: string;
  readonly benchmark?: string;
  readonly vintage?: string;
  readonly timeoutMs?: number;
  readonly maximumAttempts?: number;
  readonly now?: () => string;
}

const STATE_FIPS_TO_ABBREVIATION: Readonly<Record<string, string>> = Object.freeze({
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
  "60": "AS",
  "66": "GU",
  "69": "MP",
  "72": "PR",
  "78": "VI",
});

interface LayerCandidate {
  readonly layer: string;
  readonly normalizedLayer: string;
  readonly type: CanonicalGeographyType;
  readonly attributes: CensusGeographyAttributes;
  readonly geoid: string;
  readonly name: string;
  readonly stateCode: string | null;
}

const PHYSICAL_TYPE_ORDER: readonly PhysicalGeographyType[] = Object.freeze([
  "country",
  "state",
  "county-equivalent",
  "place",
  "census-tract",
  "block-group",
  "census-block",
]);

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function normalizeLayerName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function stableFragment(value: string): string {
  const result = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!result) throw new Error("Census geography identity fragment is empty.");
  return result;
}

function typeForLayer(layerName: string): CanonicalGeographyType | null {
  const layer = normalizeLayerName(layerName);
  if (layer.includes("census block groups")) return "block-group";
  if (layer.includes("census blocks") || /^blocks?\b/.test(layer)) return "census-block";
  if (layer.includes("census tracts")) return "census-tract";
  if (layer.includes("combined statistical areas")) return "csa";
  if (
    layer.includes("metropolitan statistical areas")
    || layer.includes("metropolitan micropolitan statistical areas")
  ) {
    return "msa";
  }
  if (layer.includes("zip code tabulation")) return "zip-zcta";
  if (layer.includes("congressional districts")) return "congressional-district";
  if (
    layer.includes("state legislative")
    && (layer.includes("upper") || layer.includes("senate"))
  ) {
    return "state-legislative-upper";
  }
  if (
    layer.includes("state legislative")
    && (layer.includes("lower") || layer.includes("house"))
  ) {
    return "state-legislative-lower";
  }
  if (layer.includes("unified school districts")) return "school-district-unified";
  if (layer.includes("elementary school districts")) {
    return "school-district-elementary";
  }
  if (layer.includes("secondary school districts")) {
    return "school-district-secondary";
  }
  if (layer.includes("county subdivisions")) return "county-subdivision";
  if (
    layer.includes("urban areas")
    || layer.includes("urbanized areas")
    || layer.includes("urban clusters")
  ) {
    return "urban-area";
  }
  if (
    layer.includes("incorporated places")
    || layer.includes("census designated places")
  ) {
    return "place";
  }
  if (layer.includes("counties")) return "county-equivalent";
  if (layer === "states" || layer.startsWith("states ")) return "state";
  return null;
}

function geoidFor(attributes: CensusGeographyAttributes): string {
  return text(
    attributes.GEOID
      ?? attributes.GEOIDFQ
      ?? attributes.GEOID20
      ?? attributes.GEOID10,
  );
}

function stateCodeFor(attributes: CensusGeographyAttributes): string | null {
  const explicit = text(attributes.STUSAB).toUpperCase();
  if (/^[A-Z]{2}$/.test(explicit)) return explicit;
  const fips = text(attributes.STATE).padStart(2, "0");
  return STATE_FIPS_TO_ABBREVIATION[fips] ?? null;
}

function metadataFor(
  attributes: CensusGeographyAttributes,
): Readonly<Record<string, string | number | boolean | null>> {
  const metadata: Record<string, string | number | boolean | null> = {};
  for (const key of [
    "STATE",
    "COUNTY",
    "TRACT",
    "BLKGRP",
    "BLOCK",
    "BASENAME",
    "LSADC",
    "FUNCSTAT",
    "MTFCC",
  ]) {
    const value = attributes[key];
    if (
      typeof value === "string"
      || typeof value === "number"
      || value === null
    ) {
      metadata[key.toLowerCase()] = value;
    }
  }
  return Object.freeze(metadata);
}

function collectCandidates(
  geographies: Readonly<Record<string, readonly CensusGeographyAttributes[]>>,
): readonly LayerCandidate[] {
  const candidates: LayerCandidate[] = [];
  for (const [layer, values] of Object.entries(geographies)) {
    const type = typeForLayer(layer);
    if (!type) continue;
    const normalizedLayer = normalizeLayerName(layer);
    for (const attributes of values ?? []) {
      const geoid = geoidFor(attributes);
      const name = text(attributes.NAME ?? attributes.NAMELSAD ?? attributes.BASENAME);
      if (!geoid || !name) continue;
      candidates.push(
        Object.freeze({
          layer,
          normalizedLayer,
          type,
          attributes,
          geoid,
          name,
          stateCode: stateCodeFor(attributes),
        }),
      );
    }
  }
  return Object.freeze(candidates);
}

function selectPhysicalCandidate(
  candidates: readonly LayerCandidate[],
  type: Exclude<PhysicalGeographyType, "country">,
): LayerCandidate | null {
  const matches = candidates.filter((candidate) => candidate.type === type);
  if (type === "place") {
    return matches.find((candidate) => candidate.normalizedLayer.includes("incorporated"))
      ?? matches[0]
      ?? null;
  }
  return matches[0] ?? null;
}

function datasetSource(
  benchmark: string,
  vintage: string,
  resolvedAt: string,
) {
  return createGeographyDatasetSource({
    id: `census-geocoder:${stableFragment(benchmark)}:${stableFragment(vintage)}`,
    sourceSystem: "census-geocoder",
    name: `U.S. Census Geocoder ${benchmark} / ${vintage}`,
    authority: "United States Census Bureau",
    sourceUrl: CENSUS_COORDINATE_GEOGRAPHY_URL,
    licenseOrUseBasis: "United States Government public data",
    vintage,
    importedAt: resolvedAt,
  });
}

function createEntry(input: Readonly<{
  type: CanonicalGeographyType;
  name: string;
  geoid: string;
  stateCode: string | null;
  sourceSystem?: GeographySourceSystem;
  sourceLayer: string;
  vintage: string;
  datasetSourceId: string;
  parentVersionId?: GeographyVersionId | null;
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
  now: string;
}>): ResolvedGeographyEntry {
  const geographyId = `census:${input.type}:${stableFragment(input.geoid)}`;
  const versionId = `${geographyId}:${stableFragment(input.vintage)}`;
  const geography = createCanonicalGeography({
    id: geographyId,
    type: input.type,
    name: input.name,
    countryCode: "US",
    stateCode: input.stateCode,
    externalId: input.geoid,
    sourceSystem: input.sourceSystem ?? "census-geocoder",
    currentVersionId: versionId,
    now: input.now,
  });
  const version = createGeographyVersion({
    id: versionId,
    geographyId: geography.id,
    datasetSourceId: input.datasetSourceId,
    sourceLayer: input.sourceLayer,
    vintage: input.vintage,
    name: `${input.name} (${input.vintage})`,
    parentVersionId: input.parentVersionId ?? null,
    metadata: input.metadata,
    now: input.now,
  });
  return Object.freeze({
    geography,
    version,
    reference: geographyReference({ geography, version }),
  });
}

function countryEntry(
  vintage: string,
  datasetSourceId: string,
  now: string,
): ResolvedGeographyEntry {
  return createEntry({
    type: "country",
    name: "United States",
    geoid: "US",
    stateCode: null,
    sourceLayer: "country",
    vintage,
    datasetSourceId,
    now,
  });
}

function hierarchyFrom(
  entries: ReadonlyMap<PhysicalGeographyType, ResolvedGeographyEntry>,
): PhysicalGeographyHierarchy {
  const country = entries.get("country")?.reference;
  if (!country) throw new Error("Census geography resolution is missing country identity.");
  return Object.freeze({
    country,
    state: entries.get("state")?.reference ?? null,
    countyEquivalent: entries.get("county-equivalent")?.reference ?? null,
    place: entries.get("place")?.reference ?? null,
    censusTract: entries.get("census-tract")?.reference ?? null,
    blockGroup: entries.get("block-group")?.reference ?? null,
    censusBlock: entries.get("census-block")?.reference ?? null,
  });
}

export function parseCensusCoordinateGeographies(input: Readonly<{
  payload: CensusCoordinateGeographyResponse;
  acceptedPoint: GeographyPoint;
  benchmark?: string;
  vintage?: string;
  resolvedAt: string;
}>): AcceptedPointGeographyResolution {
  const acceptedPoint = geographyPoint(input.acceptedPoint);
  const benchmark = input.benchmark?.trim() || CENSUS_GEOGRAPHY_BENCHMARK;
  const vintage = input.vintage?.trim() || CENSUS_GEOGRAPHY_VINTAGE;
  const geographies = input.payload.result?.geographies ?? {};
  if (!Object.keys(geographies).length) {
    throw new Error("U.S. Census geoLookup returned no geography for the accepted point.");
  }
  const source = datasetSource(benchmark, vintage, input.resolvedAt);
  const candidates = collectCandidates(geographies);
  const physicalEntries = new Map<PhysicalGeographyType, ResolvedGeographyEntry>();
  const country = countryEntry(vintage, source.id, input.resolvedAt);
  physicalEntries.set("country", country);

  const candidateByType = new Map<
    Exclude<PhysicalGeographyType, "country">,
    LayerCandidate | null
  >();
  for (const type of PHYSICAL_TYPE_ORDER.slice(1) as readonly Exclude<
    PhysicalGeographyType,
    "country"
  >[]) {
    candidateByType.set(type, selectPhysicalCandidate(candidates, type));
  }

  const stateCandidate = candidateByType.get("state") ?? null;
  if (stateCandidate) {
    physicalEntries.set(
      "state",
      createEntry({
        type: "state",
        name: stateCandidate.name,
        geoid: stateCandidate.geoid,
        stateCode: stateCandidate.stateCode,
        sourceLayer: stateCandidate.layer,
        vintage,
        datasetSourceId: source.id,
        parentVersionId: country.version.id,
        metadata: metadataFor(stateCandidate.attributes),
        now: input.resolvedAt,
      }),
    );
  }

  const parentByType: Readonly<
    Record<Exclude<PhysicalGeographyType, "country" | "state">, PhysicalGeographyType>
  > = Object.freeze({
    "county-equivalent": "state",
    place: "county-equivalent",
    "census-tract": "county-equivalent",
    "block-group": "census-tract",
    "census-block": "block-group",
  });
  for (const type of PHYSICAL_TYPE_ORDER.slice(2) as readonly Exclude<
    PhysicalGeographyType,
    "country" | "state"
  >[]) {
    const candidate = candidateByType.get(type) ?? null;
    if (!candidate) continue;
    const parent = physicalEntries.get(parentByType[type]);
    physicalEntries.set(
      type,
      createEntry({
        type,
        name: candidate.name,
        geoid: candidate.geoid,
        stateCode: candidate.stateCode ?? stateCandidate?.stateCode ?? null,
        sourceLayer: candidate.layer,
        vintage,
        datasetSourceId: source.id,
        parentVersionId: parent?.version.id ?? null,
        metadata: metadataFor(candidate.attributes),
        now: input.resolvedAt,
      }),
    );
  }

  const selectedPhysicalIdentity = new Set(
    [...physicalEntries.values()].map(
      (entry) => `${entry.reference.type}:${entry.reference.externalId}`,
    ),
  );
  const overlayEntries: ResolvedGeographyEntry[] = [];
  const seenOverlays = new Set<string>();
  for (const candidate of candidates) {
    if ((PHYSICAL_TYPE_ORDER as readonly string[]).includes(candidate.type)) continue;
    const identity = `${candidate.type}:${candidate.geoid}`;
    if (selectedPhysicalIdentity.has(identity) || seenOverlays.has(identity)) continue;
    seenOverlays.add(identity);
    overlayEntries.push(
      createEntry({
        type: candidate.type as OverlayGeographyType,
        name: candidate.name,
        geoid: candidate.geoid,
        stateCode: candidate.stateCode ?? stateCandidate?.stateCode ?? null,
        sourceLayer: candidate.layer,
        vintage,
        datasetSourceId: source.id,
        metadata: metadataFor(candidate.attributes),
        now: input.resolvedAt,
      }),
    );
  }

  const entries = Object.freeze([
    ...PHYSICAL_TYPE_ORDER.map((type) => physicalEntries.get(type)).filter(
      (entry): entry is ResolvedGeographyEntry => Boolean(entry),
    ),
    ...overlayEntries,
  ]);
  return Object.freeze({
    acceptedPoint,
    acceptedPointFingerprint: acceptedPointFingerprint(acceptedPoint),
    datasetSources: Object.freeze([source]),
    entries,
    hierarchy: hierarchyFrom(physicalEntries),
    overlays: Object.freeze(overlayEntries.map((entry) => entry.reference)),
    resolver: "US Census Geocoder geoLookup layers=all",
    benchmark,
    vintage,
    resolvedAt: new Date(input.resolvedAt).toISOString(),
  });
}

function shouldRetry(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

export class CensusAcceptedPointGeographyResolver
  implements AcceptedPointGeographyResolver
{
  private readonly fetchImpl: typeof fetch;
  private readonly endpoint: string;
  private readonly benchmark: string;
  private readonly vintage: string;
  private readonly timeoutMs: number;
  private readonly maximumAttempts: number;
  private readonly now: () => string;

  constructor(options: CensusCoordinateResolverOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.endpoint = options.endpoint ?? CENSUS_COORDINATE_GEOGRAPHY_URL;
    this.benchmark = options.benchmark ?? CENSUS_GEOGRAPHY_BENCHMARK;
    this.vintage = options.vintage ?? CENSUS_GEOGRAPHY_VINTAGE;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.maximumAttempts = options.maximumAttempts ?? 3;
    this.now = options.now ?? (() => new Date().toISOString());
    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs < 1_000) {
      throw new Error("Census resolver timeout must be at least 1000 milliseconds.");
    }
    if (!Number.isSafeInteger(this.maximumAttempts) || this.maximumAttempts < 1 || this.maximumAttempts > 5) {
      throw new Error("Census resolver attempts must be between one and five.");
    }
  }

  async resolveAcceptedPoint(point: GeographyPoint): Promise<AcceptedPointGeographyResolution> {
    const acceptedPoint = geographyPoint(point);
    const url = new URL(this.endpoint);
    url.searchParams.set("x", String(acceptedPoint.longitude));
    url.searchParams.set("y", String(acceptedPoint.latitude));
    url.searchParams.set("benchmark", this.benchmark);
    url.searchParams.set("vintage", this.vintage);
    url.searchParams.set("layers", "all");
    url.searchParams.set("format", "json");

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= this.maximumAttempts; attempt += 1) {
      try {
        const response = await this.fetchImpl(url, {
          method: "GET",
          headers: Object.freeze({
            accept: "application/json",
            "user-agent": "RFxchange-Geography-Fabric/1.0",
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok) {
          const error = new Error(`U.S. Census Geocoder returned HTTP ${response.status}.`);
          if (!shouldRetry(response.status) || attempt === this.maximumAttempts) throw error;
          lastError = error;
          continue;
        }
        const payload = (await response.json()) as CensusCoordinateGeographyResponse;
        return parseCensusCoordinateGeographies({
          payload,
          acceptedPoint,
          benchmark: this.benchmark,
          vintage: this.vintage,
          resolvedAt: this.now(),
        });
      } catch (error) {
        lastError = error;
        if (attempt === this.maximumAttempts) break;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("U.S. Census Geocoder request failed.");
  }
}
