import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ControlledLocalityMapService } from "@/src/application/geography/controlled-locality-map";
import { SpatialActivationExperience } from "@/src/components/onboarding/SpatialActivationExperience";
import { createControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { createFirestoreGeographyRepositories } from "@/src/infrastructure/firestore/geography-repositories";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { TigerWebBoundarySnapshotRepository } from "@/src/infrastructure/geography/tigerweb-boundary-snapshot";

async function activationMapModel() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return createControlledLocalityPreview();

  let context;
  try {
    context = await createServerAuthenticationBoundary().authenticateSessionCookie({
      sessionCookie,
      now: new Date().toISOString(),
    });
  } catch {
    return createControlledLocalityPreview();
  }

  const repositories = createFirestoreGeographyRepositories(getServerFirestore());
  const selection = await repositories.selections.getByUserId(context.user.id);
  if (!selection) return createControlledLocalityPreview();

  return new ControlledLocalityMapService(
    repositories.definitions,
    new TigerWebBoundarySnapshotRepository(repositories.definitions),
  ).create(selection);
}

export default async function JoinPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    const access = await resolveParticipantRoute({ sessionCookie });
    if (access.kind === "access-resolution-required") {
      redirect(participantEntryDestination(access));
    }
  }

  const mapModel = await activationMapModel();
  return <SpatialActivationExperience mapModel={mapModel} />;
}
