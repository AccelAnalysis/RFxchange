import { cookies } from "next/headers";

import { ControlledLocalityMapService } from "@/src/application/geography/controlled-locality-map";
import { ActivationJourneyClient } from "@/src/components/onboarding/ActivationJourneyClient";
import { createControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { createFirestoreGeographyRepositories } from "@/src/infrastructure/firestore/geography-repositories";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { TigerWebBoundarySnapshotRepository } from "@/src/infrastructure/geography/tigerweb-boundary-snapshot";

async function activationMapModel() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return createControlledLocalityPreview();
    const context = await createServerAuthenticationBoundary().authenticateSessionCookie({
      sessionCookie,
      now: new Date().toISOString(),
    });
    const repositories = createFirestoreGeographyRepositories(getServerFirestore());
    const selection = await repositories.selections.getByUserId(context.user.id);
    if (!selection) return createControlledLocalityPreview();
    return new ControlledLocalityMapService(
      repositories.definitions,
      new TigerWebBoundarySnapshotRepository(repositories.definitions),
    ).create(selection);
  } catch {
    return createControlledLocalityPreview();
  }
}

export default async function JoinPage() {
  const mapModel = await activationMapModel();
  return <ActivationJourneyClient mapModel={mapModel} />;
}
