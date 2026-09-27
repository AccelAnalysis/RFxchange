import { loadAuthorizedResourceWorkspace } from "@/src/infrastructure/resource-network/workspace-runtime";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ResourceNetworkWorkspace } from "@/src/components/resource-network/ResourceNetworkWorkspace";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";

interface Props {
  readonly searchParams?: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}

export interface ResourceSelectionOverride {
  readonly kind: "provider" | "resource" | "request";
  readonly id: string;
}

export async function renderResourcesPage({
  searchParams,
  selectionOverride = null,
}: Props & Readonly<{ selectionOverride?: ResourceSelectionOverride | null }>) {
  const access = await resolveParticipantRoute({
    sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Fresources");
  if (access.kind === "access-resolution-required") redirect(participantEntryDestination(access));
  if (access.kind === "activation-required") redirect(participantEntryDestination(access));
  if (access.kind === "wrong-organization") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }
  if (access.state.lifecycleState !== "open-platform") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }

  const workspace = await loadAuthorizedResourceWorkspace(access, await searchParams ?? {}, selectionOverride);
  return <ResourceNetworkWorkspace {...workspace} />;
}

export default async function ResourcesPage(props: Props) {
  return renderResourcesPage(props);
}
