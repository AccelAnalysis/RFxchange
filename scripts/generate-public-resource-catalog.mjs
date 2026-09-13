import { writeFile, mkdir } from "node:fs/promises";
import { buildHamptonRoadsProviderMigrationPlan } from "./prepare-hampton-roads-provider-migration.mjs";

// Explicit public read model. Never ship seed review notes, approval state,
// participant identities, or inferred account/Official Provider authority.
const plan = await buildHamptonRoadsProviderMigrationPlan();
const listings = plan.records.map((record) => {
  const location = record.location;
  const accepted = location?.census;
  return {
    id: record.seedKey,
    name: record.displayName,
    service: record.serviceName,
    summary: record.serviceSummary,
    website: record.website,
    aliases: record.aliases,
    serviceAreas: record.serviceAreaLabels,
    locality: location?.city ?? null,
    address: accepted ? [location.address1, location.address2, `${location.city}, ${location.state} ${location.postalCode}`].filter(Boolean).join(", ") : null,
    coordinate: accepted ? [accepted.longitude, accepted.latitude] : null,
  };
});
const destination = new URL("../src/data/resources/public-resource-catalog.json", import.meta.url);
await mkdir(new URL("../src/data/resources/", import.meta.url), { recursive: true });
await writeFile(destination, `${JSON.stringify(listings, null, 2)}\n`);
console.log(`Public resource catalog: ${listings.length} listings, ${listings.filter((entry) => entry.coordinate).length} accepted map locations.`);
