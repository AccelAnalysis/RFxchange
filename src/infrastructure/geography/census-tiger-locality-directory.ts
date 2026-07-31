import {
  calculateBoundaryBounds,
  type AuthoritativeGeoJsonGeometry,
} from "../../domain/geography/boundary.ts";
import {
  createGeographyDefinition,
  type GeographyDefinition,
  type GeographyType,
} from "../../domain/geography/model.ts";
import { HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS } from "../../data/geography/hampton-roads-controlled-locality.ts";

const TIGERWEB_ORIGIN = "https://tigerweb.geo.census.gov";
const COUNTY_LAYER_PATH = "/arcgis/rest/services/TIGERweb/State_County/MapServer/1";
const PLACE_LAYER_PATH = "/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/4";
const TIGER_VINTAGE = "2025";

const STATE_FIPS: Readonly<Record<string, string>> = Object.freeze({
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06", CO: "08", CT: "09", DE: "10",
  DC: "11", FL: "12", GA: "13", HI: "15", ID: "16", IL: "17", IN: "18", IA: "19",
  KS: "20", KY: "21", LA: "22", ME: "23", MD: "24", MA: "25", MI: "26", MN: "27",
  MS: "28", MO: "29", MT: "30", NE: "31", NV: "32", NH: "33", NJ: "34", NM: "35",
  NY: "36", NC: "37", ND: "38", OH: "39", OK: "40", OR: "41", PA: "42", RI: "44",
  SC: "45", SD: "46", TN: "47", TX: "48", UT: "49", VT: "50", VA: "51", WA: "53",
  WV: "54", WI: "55", WY: "56", AS: "60", GU: "66", MP: "69", PR: "72", VI: "78",
});

const STATE_NAMES: Readonly<Record<string, string>> = Object.freeze({
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida",
  GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  AS: "American Samoa", GU: "Guam", MP: "Northern Mariana Islands", PR: "Puerto Rico",
  VI: "U.S. Virgin Islands",
});

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
type LayerKind = "county" | "place";

interface ArcGisAttributes {
  readonly GEOID?: unknown;
  readonly BASENAME?: unknown;
  readonly NAME?: unknown;
  readonly STATE?: unknown;
  readonly CENTLAT?: unknown;
  readonly CENTLON?: unknown;
  readonly LSADC?: unknown;
}

interface ArcGisSearchResponse {
  readonly features?: readonly Readonly<{ readonly attributes?: ArcGisAttributes }>[];
  readonly error?: Readonly<{ readonly message?: unknown }>;
}

interface GeoJsonFeatureCollection {
  readonly features?: readonly Readonly<{
    readonly properties?: Readonly<Record<string, unknown>>;
    readonly geometry?: unknown;
  }>[];
}

export interface CensusLocalityCandidate {
  readonly reference: string;
  readonly name: string;
  readonly stateCode: string;
  readonly stateName: string;
  readonly fipsCode: string;
  readonly type: GeographyType;
  readonly source: "U.S. Census Bureau TIGERweb";
}

export class CensusTigerLocalityError extends Error {
  readonly code: "invalid-query" | "invalid-state" | "provider-unavailable" | "not-found" | "malformed-response";

  constructor(code: CensusTigerLocalityError["code"], message: string) {
    super(message);
    this.name = "CensusTigerLocalityError";
    this.code = code;
  }
}

function normalizedStateCode(value: string): string {
  const stateCode = value.trim().toUpperCase();
  if (!STATE_FIPS[stateCode]) {
    throw new CensusTigerLocalityError("invalid-state", "Enter a valid two-letter U.S. state or territory code.");
  }
  return stateCode;
}

function layerPath(kind: LayerKind): string {
  return kind === "county" ? COUNTY_LAYER_PATH : PLACE_LAYER_PATH;
}

function dataset(kind: LayerKind): string {
  return kind === "county" ? "TIGERweb State_County" : "TIGERweb Places_CouSub_ConCity_SubMCD";
}

function geographyType(kind: LayerKind, stateCode: string, name: string): GeographyType {
  if (kind === "place") return "municipality";
  if (stateCode === "VA" && / city$/i.test(name)) return "independent-city";
  return "county-equivalent";
}

function candidateReference(kind: LayerKind, stateCode: string, geoid: string): string {
  return `census-tigerweb:${kind}:${stateCode}:${geoid}`;
}

function parseReference(value: string): Readonly<{ kind: LayerKind; stateCode: string; geoid: string }> {
  const match = /^census-tigerweb:(county|place):([A-Z]{2}):(\d{5}|\d{7})$/.exec(value.trim());
  if (!match) throw new CensusTigerLocalityError("not-found", "The selected Census locality reference is invalid or expired.");
  const stateCode = normalizedStateCode(match[2]);
  if (!match[3].startsWith(STATE_FIPS[stateCode])) {
    throw new CensusTigerLocalityError("not-found", "The selected Census locality does not belong to the requested state.");
  }
  return Object.freeze({ kind: match[1] as LayerKind, stateCode, geoid: match[3] });
}

function stringAttribute(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numericAttribute(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function normalizedGeometry(value: unknown): AuthoritativeGeoJsonGeometry {
  if (!value || typeof value !== "object") {
    throw new CensusTigerLocalityError("malformed-response", "Census TIGERweb did not return locality geometry.");
  }
  const geometry = value as { type?: unknown; coordinates?: unknown };
  if ((geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") || !Array.isArray(geometry.coordinates)) {
    throw new CensusTigerLocalityError("malformed-response", "Census TIGERweb returned unsupported locality geometry.");
  }
  return geometry as AuthoritativeGeoJsonGeometry;
}

function canonicalId(fipsCode: string): string {
  const bundled = HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS.find(
    (definition) => String(definition.fipsCode ?? "") === fipsCode,
  );
  return bundled ? String(bundled.id) : `us-census-${fipsCode}`;
}

export class CensusTigerLocalityDirectory {
  private readonly fetcher: FetchLike;
  private readonly now: () => string;
  private readonly timeoutMs: number;

  constructor(input: Readonly<{ fetcher?: FetchLike; now?: () => string; timeoutMs?: number }> = {}) {
    this.fetcher = input.fetcher ?? fetch;
    this.now = input.now ?? (() => new Date().toISOString());
    this.timeoutMs = input.timeoutMs ?? 8_000;
  }

  private async fetchJson<T>(url: URL): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(url, {
        method: "GET",
        headers: { accept: "application/json" },
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new CensusTigerLocalityError("provider-unavailable", `Census TIGERweb returned HTTP ${response.status}.`);
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof CensusTigerLocalityError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new CensusTigerLocalityError("provider-unavailable", "Census TIGERweb locality lookup timed out.");
      }
      throw new CensusTigerLocalityError("provider-unavailable", "Census TIGERweb locality lookup failed.");
    } finally {
      clearTimeout(timeout);
    }
  }

  private async searchLayer(kind: LayerKind, stateCode: string): Promise<readonly CensusLocalityCandidate[]> {
    const url = new URL(`${layerPath(kind)}/query`, TIGERWEB_ORIGIN);
    url.searchParams.set("where", `STATE='${STATE_FIPS[stateCode]}'`);
    url.searchParams.set("outFields", "GEOID,BASENAME,NAME,STATE,CENTLAT,CENTLON,LSADC");
    url.searchParams.set("returnGeometry", "false");
    url.searchParams.set("resultRecordCount", "2000");
    url.searchParams.set("f", "json");
    const body = await this.fetchJson<ArcGisSearchResponse>(url);
    if (!Array.isArray(body.features)) {
      throw new CensusTigerLocalityError("malformed-response", "Census TIGERweb search response did not include features.");
    }
    return Object.freeze(body.features.flatMap((feature) => {
      const geoid = stringAttribute(feature.attributes?.GEOID);
      const baseName = stringAttribute(feature.attributes?.BASENAME) ?? stringAttribute(feature.attributes?.NAME);
      if (!geoid || !baseName) return [];
      return [Object.freeze({
        reference: candidateReference(kind, stateCode, geoid),
        name: baseName,
        stateCode,
        stateName: STATE_NAMES[stateCode],
        fipsCode: geoid,
        type: geographyType(kind, stateCode, stringAttribute(feature.attributes?.NAME) ?? baseName),
        source: "U.S. Census Bureau TIGERweb" as const,
      })];
    }));
  }

  async search(input: Readonly<{ query: string; stateCode: string }>): Promise<readonly CensusLocalityCandidate[]> {
    const query = input.query.trim().replace(/\s+/g, " ");
    if (query.length < 2 || query.length > 100) {
      throw new CensusTigerLocalityError("invalid-query", "Enter at least two characters of a city, county, or locality name.");
    }
    const stateCode = normalizedStateCode(input.stateCode);
    const normalizedQuery = query.toLocaleLowerCase();
    const [counties, places] = await Promise.all([
      this.searchLayer("county", stateCode),
      this.searchLayer("place", stateCode),
    ]);
    const matches = [...counties, ...places]
      .filter((candidate) => candidate.name.toLocaleLowerCase().includes(normalizedQuery))
      .sort((left, right) => {
        const leftName = left.name.toLocaleLowerCase();
        const rightName = right.name.toLocaleLowerCase();
        const leftRank = leftName === normalizedQuery ? 0 : leftName.startsWith(normalizedQuery) ? 1 : 2;
        const rightRank = rightName === normalizedQuery ? 0 : rightName.startsWith(normalizedQuery) ? 1 : 2;
        return leftRank - rightRank || left.name.localeCompare(right.name) || left.fipsCode.localeCompare(right.fipsCode);
      });
    return Object.freeze(matches.slice(0, 12));
  }

  async resolve(reference: string): Promise<GeographyDefinition> {
    const resolved = parseReference(reference);
    const url = new URL(`${layerPath(resolved.kind)}/query`, TIGERWEB_ORIGIN);
    url.searchParams.set("where", `GEOID='${resolved.geoid}'`);
    url.searchParams.set("outFields", "GEOID,BASENAME,NAME,STATE,CENTLAT,CENTLON,LSADC");
    url.searchParams.set("returnGeometry", "true");
    url.searchParams.set("outSR", "4326");
    url.searchParams.set("f", "geojson");
    const body = await this.fetchJson<GeoJsonFeatureCollection>(url);
    const feature = body.features?.[0];
    if (!feature) throw new CensusTigerLocalityError("not-found", "Census TIGERweb no longer resolves the selected locality.");
    const geoid = stringAttribute(feature.properties?.GEOID);
    const baseName = stringAttribute(feature.properties?.BASENAME) ?? stringAttribute(feature.properties?.NAME);
    if (geoid !== resolved.geoid || !baseName) {
      throw new CensusTigerLocalityError("malformed-response", "Census TIGERweb returned a locality that does not match the selected reference.");
    }
    const geometry = normalizedGeometry(feature.geometry);
    const bounds = calculateBoundaryBounds(geometry);
    const longitude = numericAttribute(feature.properties?.CENTLON);
    const latitude = numericAttribute(feature.properties?.CENTLAT);
    const center = longitude != null && latitude != null && longitude >= bounds.west && longitude <= bounds.east && latitude >= bounds.south && latitude <= bounds.north
      ? { longitude, latitude }
      : { longitude: (bounds.west + bounds.east) / 2, latitude: (bounds.south + bounds.north) / 2 };
    const fullName = stringAttribute(feature.properties?.NAME) ?? baseName;
    const bundled = HAMPTON_ROADS_CONTROLLED_LOCALITY_DEFINITIONS.find(
      (definition) => String(definition.fipsCode ?? "") === geoid,
    );
    return createGeographyDefinition({
      id: canonicalId(geoid),
      countryCode: "US",
      fipsCode: geoid,
      name: baseName,
      type: geographyType(resolved.kind, resolved.stateCode, fullName),
      boundary: {
        authority: "United States Census Bureau",
        dataset: dataset(resolved.kind),
        vintage: TIGER_VINTAGE,
        sourceFeatureId: geoid,
      },
      releaseState: "released",
      parentGeographyId: `us-${resolved.stateCode.toLowerCase()}`,
      adjacentGeographyIds: bundled?.adjacentGeographyIds.map(String) ?? [],
      bounds,
      defaultCamera: {
        center,
        pitchDegrees: 38,
        bearingDegrees: 0,
        paddingPixels: 56,
        maximumZoom: 13,
      },
      now: this.now(),
    });
  }
}

export function tigerWebLayerPathForFips(fipsCode: string): string | null {
  if (/^\d{5}$/.test(fipsCode)) return COUNTY_LAYER_PATH;
  if (/^\d{7}$/.test(fipsCode)) return PLACE_LAYER_PATH;
  return null;
}

export const CENSUS_TIGERWEB_ORIGIN = TIGERWEB_ORIGIN;
export const CENSUS_TIGERWEB_VINTAGE = TIGER_VINTAGE;
