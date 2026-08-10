import {
  ActivationRequestValidationError,
  type ActivationJourneyService,
} from "../../../../src/application/onboarding/activation-journey.ts";

type ActivationRequestBody = Readonly<Record<string, unknown>>;
type SaveProfileInput = Parameters<ActivationJourneyService["saveProfile"]>[1];

export function parseWebsiteIdentityFields(
  body: ActivationRequestBody,
): Readonly<{
  website?: string;
  websiteNotApplicable?: boolean;
}> {
  const hasWebsiteNotApplicable = Object.prototype.hasOwnProperty.call(
    body,
    "websiteNotApplicable",
  );

  if (
    hasWebsiteNotApplicable &&
    typeof body.websiteNotApplicable !== "boolean"
  ) {
    throw new ActivationRequestValidationError(
      "websiteNotApplicable must be a boolean when supplied.",
    );
  }

  return Object.freeze({
    ...(typeof body.website === "string"
      ? { website: body.website }
      : {}),
    ...(hasWebsiteNotApplicable
      ? { websiteNotApplicable: body.websiteNotApplicable as boolean }
      : {}),
  });
}

export function parseSaveProfileBody(
  body: ActivationRequestBody,
): SaveProfileInput {
  const contactRole =
    typeof body.contactRole === "string"
      ? body.contactRole.trim().replace(/\s+/g, " ")
      : "";
  if (!contactRole || contactRole.length > 120) {
    throw new ActivationRequestValidationError(
      "Organization contact role is required and cannot exceed 120 characters.",
    );
  }
  return Object.freeze({
    ...parseWebsiteIdentityFields(body),
    contactRole,
    contactPubliclyVisible:
      body.contactPubliclyVisible === true,
    capabilityKind:
      typeof body.capabilityKind === "string"
        ? body.capabilityKind
        : "service",
    capabilityCategory:
      typeof body.capabilityCategory === "string"
        ? body.capabilityCategory
        : "",
    ...(typeof body.capabilityOtherCategory === "string" &&
    body.capabilityOtherCategory.trim()
      ? {
          capabilityOtherCategory:
            body.capabilityOtherCategory,
        }
      : {}),
    capabilityName:
      typeof body.capabilityName === "string"
        ? body.capabilityName
        : "",
    capabilityDescription:
      typeof body.capabilityDescription === "string"
        ? body.capabilityDescription
        : "",
  });
}
