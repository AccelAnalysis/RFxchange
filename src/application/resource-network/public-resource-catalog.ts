import catalog from "../../data/resources/public-resource-catalog.json" with { type: "json" };
import { matchesPublicResourceListing, type PublicResourceListing } from "./public-resource-listing.ts";

const DISCOVERY_LOCALITIES = new Set([
  "us-va-portsmouth", "us-va-norfolk", "us-va-chesapeake", "us-va-suffolk",
  "us-va-virginia-beach", "us-va-hampton", "us-va-newport-news",
  "us-va-williamsburg", "us-va-james-city", "us-va-james-city-county",
  "us-va-york", "us-va-york-county", "us-va-isle-of-wight",
  "us-va-isle-of-wight-county", "us-va-poquoson", "us-va-franklin",
  "us-va-southampton", "us-va-surry",
]);

// Caller must first resolve the participant and evaluate selected-geography access.
// These are public office/service records, not participation in those offices' localities.
export function discoverPublicResourceListings(input: Readonly<{
  geographyId: string;
  releaseState: string;
  query?: string | null;
  availability?: string | null;
}>): readonly PublicResourceListing[] {
  if (!DISCOVERY_LOCALITIES.has(input.geographyId)
    || !["released", "limited"].includes(input.releaseState)
    || (input.availability && !["all", "unknown"].includes(input.availability))) return [];
  return Object.freeze(catalog.flatMap((entry) => {
    const coordinate = entry.coordinate;
    if (coordinate && (coordinate.length !== 2 || !coordinate.every(Number.isFinite)
      || Math.abs(coordinate[0]!) > 180 || Math.abs(coordinate[1]!) > 90)) return [];
    const website = entry.website ? new URL(entry.website) : null;
    if (website && (website.protocol !== "https:" && website.protocol !== "http:"
      || website.username || website.password)) return [];
    const listing: PublicResourceListing = Object.freeze({
      ...entry,
      coordinate: coordinate ? Object.freeze([coordinate[0]!, coordinate[1]!] as const) : null,
    });
    return matchesPublicResourceListing(listing, input.query ?? "") ? [listing] : [];
  }));
}
