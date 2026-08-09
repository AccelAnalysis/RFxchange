import { evaluateGeographyParticipation } from "../../domain/geography/policy.ts";
import type { ParticipantRouteResolution } from "../auth/participant-route-runtime.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import type { AuthenticatedMapProjection } from "../geography/participant-map-runtime.ts";
import { createServerResourceNetworkService } from "./runtime.ts";

type AuthorizedParticipant = Extract<ParticipantRouteResolution, { readonly kind: "authorized" }>;

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
  const projection = await createServerResourceNetworkService().discover({ viewerOrganizationId: String(input.access.membership.organizationId), selectedGeography: selected, selectedGeometry: feature.boundary.geometry, query: input.query, modality: input.modality, language: input.language, availability: input.availability, markers: input.markers });
  return Object.freeze({ available: true as const, projection });
}
