export const PARTICIPANT_LENS_IDS = [
  "opportunities-rfx",
  "resources",
  "intelligence",
  "referrals",
] as const;

export type ParticipantLensId = (typeof PARTICIPANT_LENS_IDS)[number];
export type ParticipantUtilityId = "account" | "quick-start";
export type ParticipantNavigationState = ParticipantLensId | ParticipantUtilityId | null;

type ParticipantLensLabelKey =
  | "participantNavigation.opportunitiesRfx"
  | "participantNavigation.resources"
  | "participantNavigation.intelligence"
  | "participantNavigation.referrals";

type ParticipantEnabledLensDefinition = Readonly<{
  id: Exclude<ParticipantLensId, "opportunities-rfx">;
  labelKey: ParticipantLensLabelKey;
  href: "/resources" | "/geography/canvas" | "/referrals";
  availability: "enabled";
  activePathPrefixes: readonly string[];
}>;

type ParticipantUnavailableLensDefinition = Readonly<{
  id: "opportunities-rfx";
  labelKey: "participantNavigation.opportunitiesRfx";
  href: null;
  availability: "unavailable";
  activePathPrefixes: readonly [];
}>;

export type ParticipantLensDefinition =
  | ParticipantEnabledLensDefinition
  | ParticipantUnavailableLensDefinition;

/**
 * Stable participant information architecture.
 *
 * Availability controls action, not whether a governed permanent lens exists. The unavailable
 * Opportunities/RFx lens deliberately has no href and can never resolve as the current page.
 */
export const PARTICIPANT_LENSES: readonly ParticipantLensDefinition[] = Object.freeze([
  Object.freeze({
    id: "opportunities-rfx",
    labelKey: "participantNavigation.opportunitiesRfx",
    href: null,
    availability: "unavailable",
    activePathPrefixes: Object.freeze([]) as readonly [],
  }),
  Object.freeze({
    id: "resources",
    labelKey: "participantNavigation.resources",
    href: "/resources",
    availability: "enabled",
    activePathPrefixes: Object.freeze(["/resources"]),
  }),
  Object.freeze({
    id: "intelligence",
    labelKey: "participantNavigation.intelligence",
    href: "/geography/canvas",
    availability: "enabled",
    activePathPrefixes: Object.freeze(["/geography/canvas"]),
  }),
  Object.freeze({
    id: "referrals",
    labelKey: "participantNavigation.referrals",
    href: "/referrals",
    availability: "enabled",
    activePathPrefixes: Object.freeze(["/referrals"]),
  }),
]);

export const PARTICIPANT_UTILITY_DESTINATIONS = Object.freeze({
  account: Object.freeze({ href: "/organization-profile" as const }),
  "quick-start": Object.freeze({ href: "/quick-start" as const }),
});

const PERSISTENT_PARTICIPANT_PATH_PREFIXES = Object.freeze([
  "/exchange",
  "/geography/canvas",
  "/resources",
  "/referrals",
  "/organization-profile",
  "/quick-start",
  "/provider-application",
]);

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function participantLensForPathname(pathname: string): ParticipantLensId | null {
  for (const lens of PARTICIPANT_LENSES) {
    if (
      lens.availability === "enabled" &&
      lens.activePathPrefixes.some((prefix) => matchesPrefix(pathname, prefix))
    ) {
      return lens.id;
    }
  }
  return null;
}

export function participantUtilityForPathname(pathname: string): ParticipantUtilityId | null {
  if (
    matchesPrefix(pathname, PARTICIPANT_UTILITY_DESTINATIONS.account.href)
    || matchesPrefix(pathname, "/provider-application")
  ) {
    return "account";
  }
  if (matchesPrefix(pathname, PARTICIPANT_UTILITY_DESTINATIONS["quick-start"].href)) {
    return "quick-start";
  }
  return null;
}

export function participantNavigationState(pathname: string): ParticipantNavigationState {
  return participantLensForPathname(pathname) ?? participantUtilityForPathname(pathname);
}

export function isPersistentParticipantPath(pathname: string): boolean {
  return PERSISTENT_PARTICIPANT_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}
