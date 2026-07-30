import type { UserId } from "../users/model";
import type {
  GeographyDefinition,
  GeographyParticipationActivity,
  GeographyParticipationAuthorization,
} from "./model";

export type GeographyParticipationDecision =
  | Readonly<{
      readonly allowed: true;
      readonly authority: "released" | "limited-release-policy" | "explicit-authorization";
    }>
  | Readonly<{
      readonly allowed: false;
      readonly reason:
        | "visible-unreleased"
        | "limited-activity-not-permitted"
        | "restricted-authorization-required";
    }>;

function hasActiveUserAuthorization(
  authorizations: readonly GeographyParticipationAuthorization[],
  geography: GeographyDefinition,
  userId: UserId,
  activity: GeographyParticipationActivity,
  now: string,
): boolean {
  const instant = Date.parse(now);
  if (Number.isNaN(instant)) throw new Error("Authorization evaluation time must be valid.");
  return authorizations.some(
    (authorization) =>
      authorization.geographyId === geography.id &&
      authorization.subject.kind === "user" &&
      authorization.subject.userId === userId &&
      authorization.status === "active" &&
      authorization.activities.includes(activity) &&
      (!authorization.expiresAt || Date.parse(authorization.expiresAt) > instant),
  );
}

export function evaluateGeographyParticipation(
  geography: GeographyDefinition,
  userId: UserId,
  activity: GeographyParticipationActivity,
  authorizations: readonly GeographyParticipationAuthorization[],
  now: string,
): GeographyParticipationDecision {
  switch (geography.releaseState) {
    case "released":
      return Object.freeze({ allowed: true as const, authority: "released" as const });
    case "visible-unreleased":
      return Object.freeze({ allowed: false as const, reason: "visible-unreleased" as const });
    case "limited":
      return geography.limitedParticipationActivities.includes(activity)
        ? Object.freeze({
            allowed: true as const,
            authority: "limited-release-policy" as const,
          })
        : Object.freeze({
            allowed: false as const,
            reason: "limited-activity-not-permitted" as const,
          });
    case "restricted":
      return hasActiveUserAuthorization(authorizations, geography, userId, activity, now)
        ? Object.freeze({
            allowed: true as const,
            authority: "explicit-authorization" as const,
          })
        : Object.freeze({
            allowed: false as const,
            reason: "restricted-authorization-required" as const,
          });
  }
}
