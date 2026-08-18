import type { IntelligenceMobilePublicEnrichment } from "../../application/intelligence/intelligence-mobile-composition.ts";
import { geographyId } from "../../domain/geography/model.ts";
import {
  projectPublicAdditionalLocation,
  projectPublicProfileAsset,
} from "../../domain/organization-enrichment/model.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { FirestoreOrganizationEnrichmentRepository } from "../firestore/organization-enrichment.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

/**
 * Load only already-published organization enrichment for organizations that the
 * caller has obtained from the current server-authorized Network discovery projection.
 * This helper never returns private credentials, private media records, private source
 * assets, unpublished locations, or canonical/private coordinates.
 */
export async function loadPublicIntelligenceMobileEnrichment(input: Readonly<{
  organizationIds: readonly string[];
  selectedGeographyId: string;
}>): Promise<Readonly<Record<string, IntelligenceMobilePublicEnrichment>>> {
  const uniqueOrganizationIds = Object.freeze([
    ...new Set(input.organizationIds.map((value) => String(organizationId(value)))),
  ]);
  const selectedGeography = geographyId(input.selectedGeographyId);
  const db = getServerFirestore();
  const repository = new FirestoreOrganizationEnrichmentRepository(db);
  const geography = createFirestoreGeographyRepositories(db);
  const definition = await geography.definitions.getById(selectedGeography);
  if (!definition) return Object.freeze({});

  const entries = await Promise.all(uniqueOrganizationIds.map(async (rawOrganizationId) => {
    const id = organizationId(rawOrganizationId);
    const [profileAssets, additionalLocations] = await Promise.all([
      repository.listProfileAssets(id),
      repository.listAdditionalLocations(id),
    ]);
    const assets = Object.freeze(
      profileAssets.flatMap((record) => projectPublicProfileAsset(record) ?? []),
    );
    const locations = Object.freeze(additionalLocations
      .filter((record) => record.geographyId === String(selectedGeography))
      .flatMap((record) => projectPublicAdditionalLocation(record, definition) ?? []));
    const projection: IntelligenceMobilePublicEnrichment = Object.freeze({
      assets,
      additionalLocations: locations,
    });
    return [rawOrganizationId, projection] as const;
  }));

  return Object.freeze(Object.fromEntries(entries));
}
