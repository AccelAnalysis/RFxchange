import { matchesResourceDiscoveryTerms, resourceDiscoveryTerms } from "./resource-discovery-query.ts";

/** Public service information is a record, never an inferred Organization account. */
export interface PublicResourceListing {
  readonly id: string;
  readonly name: string;
  readonly service: string;
  readonly summary: string;
  readonly website: string | null;
  readonly aliases: readonly string[];
  readonly serviceAreas: readonly string[];
  readonly locality: string | null;
  readonly address: string | null;
  readonly coordinate: readonly [number, number] | null;
}

export function matchesPublicResourceListing(listing: PublicResourceListing, query: string): boolean {
  return matchesResourceDiscoveryTerms([
    listing.name, listing.service, listing.summary, listing.locality, listing.address,
    ...listing.aliases, ...listing.serviceAreas,
  ], resourceDiscoveryTerms(query));
}

