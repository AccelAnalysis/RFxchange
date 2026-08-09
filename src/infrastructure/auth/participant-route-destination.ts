import type { ParticipantRouteResolution } from "./participant-route-classification.ts";

type ActivationRequired = Extract<ParticipantRouteResolution, { readonly kind: "activation-required" }>;
type AccessResolutionRequired = Extract<ParticipantRouteResolution, { readonly kind: "access-resolution-required" }>;

export const PARTICIPANT_ACCESS_RESOLUTION_PATH = "/access/resolve" as const;

export function participantEntryDestination(
  access: ActivationRequired | AccessResolutionRequired,
  activationDestination = "/join",
): string {
  if (access.kind === "activation-required") return activationDestination;

  const params = new URLSearchParams({ reason: access.reason });
  if (access.selectedOrganizationId) {
    params.set("organizationId", access.selectedOrganizationId);
  }
  return `${PARTICIPANT_ACCESS_RESOLUTION_PATH}?${params.toString()}`;
}
