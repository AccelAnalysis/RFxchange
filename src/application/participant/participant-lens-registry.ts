export const PARTICIPANT_LENS_IDS = [
  "opportunities-rfx",
  "resources",
  "intelligence",
  "capabilities",
] as const;

export type ParticipantLensId = (typeof PARTICIPANT_LENS_IDS)[number];
export type ParticipantUtilityId = "account" | "quick-start" | "referrals";
export type ParticipantNavigationState = ParticipantLensId | ParticipantUtilityId | null;

export function migrateLegacyParticipantLensId(value: unknown): ParticipantLensId | null {
  if (value === "referrals") return "capabilities";
  return typeof value === "string" && PARTICIPANT_LENS_IDS.includes(value as ParticipantLensId)
    ? value as ParticipantLensId
    : null;
}

type ParticipantLensLabelKey =
  | "participantNavigation.opportunitiesRfx"
  | "participantNavigation.resources"
  | "participantNavigation.intelligence"
  | "participantNavigation.capabilities";

type ParticipantEnabledLensDefinition = Readonly<{
  id: ParticipantLensId;
  labelKey: ParticipantLensLabelKey;
  href: "/opportunities" | "/resources" | "/geography/canvas";
  availability: "enabled";
  activePathPrefixes: readonly string[];
}>;

type ParticipantUnavailableLensDefinition = Readonly<{
  id: "capabilities";
  labelKey: "participantNavigation.capabilities";
  href: null;
  availability: "unavailable";
  activePathPrefixes: readonly string[];
}>;

export type ParticipantLensDefinition =
  | ParticipantEnabledLensDefinition
  | ParticipantUnavailableLensDefinition;

/**
 * Stable participant information architecture.
 *
 * Availability controls action, not whether a governed permanent lens exists. Opportunities/RFx
 * becomes enabled only when an owning slice supplies a real authorized runtime.
 */
export const PARTICIPANT_LENSES: readonly ParticipantLensDefinition[] = Object.freeze([
  Object.freeze({
    id: "opportunities-rfx",
    labelKey: "participantNavigation.opportunitiesRfx",
    href: "/opportunities",
    availability: "enabled",
    activePathPrefixes: Object.freeze(["/opportunities"]),
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
    id: "capabilities",
    labelKey: "participantNavigation.capabilities",
    href: null,
    availability: "unavailable",
    activePathPrefixes: Object.freeze([]),
  }),
]);

export const PARTICIPANT_UTILITY_DESTINATIONS = Object.freeze({
  account: Object.freeze({ href: "/organization-profile" as const }),
  "quick-start": Object.freeze({ href: "/quick-start" as const }),
  referrals: Object.freeze({
    href: "/referrals" as const,
    managementHref: "/referrals?intent=manage" as const,
  }),
});

const PERSISTENT_PARTICIPANT_PATH_PREFIXES = Object.freeze([
  "/exchange",
  "/opportunities",
  "/geography/canvas",
  "/resources",
  "/referrals",
  "/organization-profile",
  "/quick-start",
  "/provider-application",
  "/commercial/founding",
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
  if (matchesPrefix(pathname, PARTICIPANT_UTILITY_DESTINATIONS.referrals.href)) {
    return "referrals";
  }
  return null;
}

export function participantNavigationState(pathname: string): ParticipantNavigationState {
  return participantLensForPathname(pathname) ?? participantUtilityForPathname(pathname);
}

export function isPersistentParticipantPath(pathname: string): boolean {
  return PERSISTENT_PARTICIPANT_PATH_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}
