import type { StructuredPostalAddress } from "./model.ts";
import type { GeographicPosition } from "../geography/boundary.ts";

export interface GeocodingProviderCandidate {
  readonly providerCandidateId: string;
  readonly coordinate: GeographicPosition;
  readonly matchedAddress: string;
  readonly quality: "rooftop" | "parcel" | "address-range" | "street" | "locality";
  readonly provider: string;
  readonly providerReference: string;
  readonly benchmark: string;
  readonly retrievedAt: string;
}

export interface OrganizationGeocodingProvider {
  locate(input: Readonly<{
    address: StructuredPostalAddress;
    correlationId: string;
  }>): Promise<readonly GeocodingProviderCandidate[]>;
}
