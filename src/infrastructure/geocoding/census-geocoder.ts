import type {
  GeocodingProviderCandidate,
  OrganizationGeocodingProvider,
} from "../../domain/organization-location/geocoding.ts";

const CENSUS_GEOCODER_ORIGIN = "https://geocoding.geo.census.gov";
const CENSUS_GEOCODER_PATH = "/geocoder/locations/onelineaddress";

type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

interface CensusAddressMatch {
  readonly matchedAddress?: unknown;
  readonly coordinates?: Readonly<{
    readonly x?: unknown;
    readonly y?: unknown;
  }>;
  readonly tigerLine?: Readonly<{
    readonly tigerLineId?: unknown;
  }>;
}

interface CensusGeocoderResponse {
  readonly result?: Readonly<{
    readonly input?: Readonly<{
      readonly benchmark?: Readonly<{
        readonly benchmarkName?: unknown;
      }>;
    }>;
    readonly addressMatches?: unknown;
  }>;
}

export class CensusGeocoderError extends Error {
  readonly code:
    | "timeout"
    | "provider-unavailable"
    | "malformed-response";

  constructor(code: CensusGeocoderError["code"], message: string) {
    super(message);
    this.name = "CensusGeocoderError";
    this.code = code;
  }
}

function oneLineAddress(
  address: Parameters<OrganizationGeocodingProvider["locate"]>[0]["address"],
): string {
  return [
    address.addressLine1,
    address.addressLine2,
    address.locality,
    address.regionCode,
    address.postalCode,
    address.countryCode,
  ]
    .filter(Boolean)
    .join(", ")
    .slice(0, 100);
}

function finiteCoordinate(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseMatches(
  body: CensusGeocoderResponse,
  retrievedAt: string,
): readonly GeocodingProviderCandidate[] {
  const matches = body.result?.addressMatches;
  if (!Array.isArray(matches)) {
    throw new CensusGeocoderError(
      "malformed-response",
      "Census Geocoder response did not include an address-match collection.",
    );
  }
  const benchmark =
    typeof body.result?.input?.benchmark?.benchmarkName === "string"
      ? body.result.input.benchmark.benchmarkName
      : "Public_AR_Current";
  return Object.freeze(
    (matches as CensusAddressMatch[])
      .slice(0, 5)
      .flatMap((match, index) => {
        const longitude = finiteCoordinate(match.coordinates?.x);
        const latitude = finiteCoordinate(match.coordinates?.y);
        if (
          longitude == null ||
          latitude == null ||
          typeof match.matchedAddress !== "string"
        ) {
          return [];
        }
        const tigerLineId =
          typeof match.tigerLine?.tigerLineId === "string"
            ? match.tigerLine.tigerLineId
            : `candidate-${index + 1}`;
        return [
          Object.freeze({
            providerCandidateId: tigerLineId,
            coordinate: Object.freeze([longitude, latitude] as const),
            matchedAddress: match.matchedAddress,
            quality: "address-range" as const,
            provider: "U.S. Census Geocoder",
            providerReference: `tiger-line:${tigerLineId}`,
            benchmark,
            retrievedAt,
          }),
        ];
      }),
  );
}

export class CensusOrganizationGeocodingProvider
  implements OrganizationGeocodingProvider {
  private readonly fetcher: FetchLike;
  private readonly now: () => string;
  private readonly timeoutMs: number;

  constructor(input: Readonly<{
    fetcher?: FetchLike;
    now: () => string;
    timeoutMs?: number;
  }>) {
    this.fetcher = input.fetcher ?? fetch;
    this.now = input.now;
    this.timeoutMs = input.timeoutMs ?? 8_000;
  }

  async locate(
    input: Parameters<OrganizationGeocodingProvider["locate"]>[0],
  ): Promise<readonly GeocodingProviderCandidate[]> {
    const url = new URL(CENSUS_GEOCODER_PATH, CENSUS_GEOCODER_ORIGIN);
    url.searchParams.set("address", oneLineAddress(input.address));
    url.searchParams.set("benchmark", "Public_AR_Current");
    url.searchParams.set("format", "json");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-rfxchange-correlation-id": input.correlationId,
        },
        redirect: "error",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new CensusGeocoderError(
          "provider-unavailable",
          `Census Geocoder returned HTTP ${response.status}.`,
        );
      }
      return parseMatches(
        (await response.json()) as CensusGeocoderResponse,
        this.now(),
      );
    } catch (error) {
      if (error instanceof CensusGeocoderError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new CensusGeocoderError("timeout", "Census Geocoder request timed out.");
      }
      throw new CensusGeocoderError(
        "provider-unavailable",
        "Census Geocoder request failed.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
