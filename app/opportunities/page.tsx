import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { RfxDraftError } from "@/src/application/rfx/rfx-draft-service";
import { RFxDraftWorkspace } from "@/src/components/rfx/RFxDraftWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerRfxDraftService } from "@/src/infrastructure/rfx/runtime";

interface Props {
  readonly searchParams?: Promise<
    Readonly<Record<string, string | string[] | undefined>>
  >;
}

export default async function OpportunitiesPage({ searchParams }: Props) {
  const access = await resolveParticipantRoute({
    sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated")
    redirect("/signin?returnTo=%2Fopportunities");
  if (
    access.kind === "access-resolution-required" ||
    access.kind === "activation-required"
  ) {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "wrong-organization")
    redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted")
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState !== "open-platform")
    redirect(access.state.controlledPlatformUrl ?? "/join");

  const service = await createServerRfxDraftService();
  const scope = Object.freeze({
    context: access.context,
    organizationId: String(access.membership.organizationId),
    membershipId: String(access.membership.id),
  });
  let workspace;
  let canCreate = true;
  try {
    workspace = await service.workspace(scope);
  } catch (error) {
    if (!(error instanceof RfxDraftError) || error.code !== "forbidden")
      throw error;
    canCreate = false;
    workspace = Object.freeze({
      drafts: Object.freeze([]),
      requestFamilies: await service.requestFamilies(),
      definitionCatalog: await service.definitionCatalog(),
      performanceLocationOption: null,
    });
  }
  const params: Readonly<Record<string, string | string[] | undefined>> =
    searchParams ? await searchParams : {};
  const requestedDraft =
    typeof params.draft === "string"
      ? params.draft
      : Array.isArray(params.draft)
        ? params.draft[0]
        : null;
  const selectedDraftId =
    requestedDraft &&
    workspace.drafts.some((draft) => draft.id === requestedDraft)
      ? requestedDraft
      : (workspace.drafts[0]?.id ?? null);

  return (
    <RFxDraftWorkspace
      canCreate={canCreate}
      initialDrafts={workspace.drafts}
      requestFamilies={workspace.requestFamilies}
      selectedDraftId={selectedDraftId}
      commandRecoveryScope={`${scope.organizationId}:${scope.membershipId}`}
      organizationId={scope.organizationId}
      performanceLocationOption={workspace.performanceLocationOption}
      definitionCatalog={workspace.definitionCatalog}
    />
  );
}
