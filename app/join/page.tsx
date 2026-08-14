import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthenticatedServerContext } from "@/src/application/auth/server-session";
import { ControlledLocalityMapService } from "@/src/application/geography/controlled-locality-map";
import { SpatialActivationExperience } from "@/src/components/onboarding/SpatialActivationExperience";
import { createControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { createFirestoreGeographyRepositories } from "@/src/infrastructure/firestore/geography-repositories";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { TigerWebBoundarySnapshotRepository } from "@/src/infrastructure/geography/tigerweb-boundary-snapshot";
import { createServerActivationJourneyService } from "@/src/infrastructure/onboarding/runtime";

interface Props {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

function first(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return Array.isArray(value) && value[0]?.trim() ? value[0].trim() : null;
}

async function activationMapModel(userId: AuthenticatedServerContext["user"]["id"] | null) {
  if (!userId) return createControlledLocalityPreview();
  const repositories = createFirestoreGeographyRepositories(getServerFirestore());
  const selection = await repositories.selections.getByUserId(userId);
  if (!selection) return createControlledLocalityPreview();

  return new ControlledLocalityMapService(
    repositories.definitions,
    new TigerWebBoundarySnapshotRepository(repositories.definitions),
  ).create(selection);
}

export default async function JoinPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const requestedStep = first(params.step);
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  let activationUserId: AuthenticatedServerContext["user"]["id"] | null = null;
  if (sessionCookie) {
    const access = await resolveParticipantRoute({ sessionCookie });
    if (access.kind === "access-resolution-required") {
      redirect(participantEntryDestination(access));
    }
    if (access.kind === "authorized") {
      const destination = access.state.controlledPlatformUrl ??
        (access.state.lifecycleState === "open-platform" ? "/exchange" : "/geography/canvas");
      const legalRemediationRequested =
        requestedStep === "legal" && access.state.lifecycleState === "controlled-platform";
      if (!legalRemediationRequested) redirect(destination);

      const activationState = await createServerActivationJourneyService().state(access.context);
      if (activationState.nextStep !== "legal") redirect(destination);
      activationUserId = access.context.user.id;
    }
    if (access.kind === "wrong-organization") {
      redirect(access.state.controlledPlatformUrl ?? "/geography/canvas");
    }
    if (access.kind === "activation-required") activationUserId = access.context.user.id;
  }

  const mapModel = await activationMapModel(activationUserId);
  return <SpatialActivationExperience mapModel={mapModel} />;
}
