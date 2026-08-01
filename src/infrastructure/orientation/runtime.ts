import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";

import { OrientationJourneyService, type OrientationJourneyScope } from "../../application/orientation/orientation-journey.ts";
import type { ParticipantRouteResolution } from "../auth/participant-route-runtime.ts";
import { FirestoreOrientationJourneyRepository } from "../firestore/orientation-journey.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { createFirestoreOrganizationMarkerRepositories } from "../firestore/organization-marker.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { accessJourneyId } from "../../domain/lifecycle/model.ts";

type AuthorizedParticipant = Extract<ParticipantRouteResolution, { readonly kind: "authorized" }>;

export function createServerOrientationJourneyService(
  db: Firestore = getServerFirestore(),
  now: () => string = () => new Date().toISOString(),
): OrientationJourneyService {
  return new OrientationJourneyService({
    journeys: new FirestoreOrientationJourneyRepository(db),
    ids: { event: () => `orientation-event-${randomUUID()}` },
    now,
  });
}

export async function resolveAuthorizedOrientationScope(
  access: AuthorizedParticipant,
  db: Firestore = getServerFirestore(),
): Promise<OrientationJourneyScope | null> {
  const organizationId = access.membership.organizationId;
  const [location, marker, selection] = await Promise.all([
    createFirestoreOrganizationLocationRepositories(db).locations.getByOrganizationId(organizationId),
    createFirestoreOrganizationMarkerRepositories(db).activations.getByOrganizationId(organizationId),
    createFirestoreGeographyRepositories(db).selections.getByUserId(access.context.user.id),
  ]);
  if (
    !location || marker?.status !== "active" || !selection ||
    marker.geographyId !== location.geographyId || selection.geographyId !== location.geographyId
  ) return null;
  return Object.freeze({
    userId: access.context.user.id,
    accessJourneyId: accessJourneyId(access.state.accessJourneyId),
    organizationId,
    geographyId: location.geographyId,
  });
}
