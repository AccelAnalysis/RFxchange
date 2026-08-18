import { evaluateGeographyParticipation } from "../../domain/geography/policy.ts";
import { projectPublicOrganizationLocation } from "../../domain/organization-location/model.ts";
import { organizationId } from "../../domain/organizations/model.ts";
import type { ParticipantRouteResolution } from "../auth/participant-route-runtime.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import type { AuthenticatedMapProjection } from "../geography/participant-map-runtime.ts";
import { createServerResourceNetworkService } from "./runtime.ts";

type AuthorizedParticipant = Extract<ParticipantRouteResolution, { readonly kind: "authorized" }>;

const MAXIMUM_OPTIONAL_PROVIDER_STATUS_LOOKUPS = 25;

/**
 * Projects only the governed provider availability needed by already-authorized organization
 * results. This deliberately avoids full Resource discovery (including catalog/resource reads),
 * stays bounded to one Network result page plus one separately revalidated carried organization,
 * and fails closed because organization actions are an
 * optional Intelligence enhancement rather than a dependency of the spatial workspace.
 */
export async function loadOptionalOfficialResourceProviderOrganizationIds(input: Readonly<{
  access: AuthorizedParticipant;
  organizationIds: readonly string[];
  selectedGeographyId: string;
}>): Promise<readonly string[]> {
  if (input.access.state.lifecycleState !== "open-platform") return Object.freeze([]);
  const candidates = [...new Set(input.organizationIds.map((value) => value.trim()).filter(Boolean))];
  if (candidates.length > MAXIMUM_OPTIONAL_PROVIDER_STATUS_LOOKUPS) return Object.freeze([]);
  try {
    const service = createServerResourceNetworkService();
    const statuses = await Promise.all(candidates.map(async (candidate) => Object.freeze({
      organizationId: candidate,
      eligibility: await service.inspectProviderEligibility({
        organizationId: organizationId(candidate),
        serviceGeographyId: input.selectedGeographyId,
      }),
    })));
    return Object.freeze(statuses.flatMap((status) => status.eligibility.eligible ? [status.organizationId] : []));
  } catch {
    return Object.freeze([]);
  }
}

export async function loadAuthorizedResourceDiscovery(input: Readonly<{
  access: AuthorizedParticipant;
  mapProjection: AuthenticatedMapProjection;
  query?: string | null;
  modality?: string | null;
  language?: string | null;
  availability?: string | null;
  markers?: readonly Readonly<{ organizationId: string; marker: Readonly<{ id: string; coordinate: readonly [number, number]; accessibleLocationLabel: string }> }>[];
}>) {
  if (input.access.state.lifecycleState !== "open-platform") return Object.freeze({ available: false as const, reason: "open-required" as const });
  const selected = input.mapProjection.model.selectedGeography;
  const authorizations = await createFirestoreGeographyRepositories(getServerFirestore()).authorizations.listByUserAndGeography(input.access.context.user.id, selected.id);
  const decision = evaluateGeographyParticipation(selected, input.access.context.user.id, "network-participation", authorizations, new Date().toISOString());
  if (!decision.allowed) return Object.freeze({ available: false as const, reason: "geography-not-permitted" as const });
  const feature = input.mapProjection.model.features.find((candidate) => candidate.role === "selected");
  if (!feature) throw new Error("Resource discovery requires the selected authoritative boundary.");
  const locations = createFirestoreOrganizationLocationRepositories(getServerFirestore()).locations;
  const markers = Object.freeze((await Promise.all((input.markers ?? []).map(async (candidate) => {
    const location = await locations.getByOrganizationId(organizationId(candidate.organizationId));
    if (!location || String(location.geographyId) !== String(selected.id)) return null;
    const publicLocation = projectPublicOrganizationLocation(location, selected);
    if (publicLocation.visibility === "locality-only") return null;
    return Object.freeze({
      organizationId: candidate.organizationId,
      marker: Object.freeze({
        ...candidate.marker,
        coordinate: publicLocation.coordinate,
        privacyTreatment: publicLocation.visibility,
      }),
    });
  }))).flatMap((candidate) => candidate ? [candidate] : []));
  const projection = await createServerResourceNetworkService().discover({ viewerOrganizationId: String(input.access.membership.organizationId), selectedGeography: selected, selectedGeometry: feature.boundary.geometry, query: input.query, modality: input.modality, language: input.language, availability: input.availability, markers });
  return Object.freeze({ available: true as const, projection });
}
