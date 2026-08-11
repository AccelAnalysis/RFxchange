export type OrganizationActionId = "manage-profile" | "view-resources" | "start-referral" | "opportunities-rfx";

export interface OrganizationActionProjection {
  readonly id: OrganizationActionId;
  readonly availability: "available" | "unavailable";
  readonly href: string | null;
  readonly reason: "self-only" | "not-an-official-provider" | "rfx-runtime-unavailable" | null;
}

export function projectOrganizationActions(input: Readonly<{
  viewerOrganizationId: string;
  selectedOrganizationId: string;
  officialResourceProvider: boolean;
}>): readonly OrganizationActionProjection[] {
  const self = input.viewerOrganizationId === input.selectedOrganizationId;
  return Object.freeze([
    Object.freeze({
      id: "manage-profile" as const,
      availability: self ? "available" as const : "unavailable" as const,
      href: self ? "/organization-profile" : null,
      reason: self ? null : "self-only" as const,
    }),
    Object.freeze({
      id: "view-resources" as const,
      availability: self || input.officialResourceProvider ? "available" as const : "unavailable" as const,
      href: self
        ? "/resources"
        : input.officialResourceProvider
          ? `/resources?provider=${encodeURIComponent(input.selectedOrganizationId)}`
          : null,
      reason: self || input.officialResourceProvider ? null : "not-an-official-provider" as const,
    }),
    Object.freeze({
      id: "start-referral" as const,
      availability: "available" as const,
      href: self
        ? "/referrals"
        : `/referrals?organization=${encodeURIComponent(input.selectedOrganizationId)}`,
      reason: null,
    }),
    Object.freeze({
      id: "opportunities-rfx" as const,
      availability: "unavailable" as const,
      href: null,
      reason: "rfx-runtime-unavailable" as const,
    }),
  ]);
}
