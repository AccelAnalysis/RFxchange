export const NETWORK_EDUCATION_CATALOG_VERSION = 1 as const;

export const NETWORK_EDUCATION_PATH_KEYS = [
  "quick-start",
  "business",
  "issuer",
  "resource-provider",
] as const;

export type NetworkEducationPathKey = (typeof NETWORK_EDUCATION_PATH_KEYS)[number];
export type NetworkEducationAvailability = "available" | "planned";
export type NetworkEducationRoute =
  | "/organization-profile"
  | "/geography/canvas"
  | "/referrals"
  | "/provider-application"
  | "/resources";

export interface NetworkEducationItem {
  readonly key: string;
  readonly messageKey: string;
  readonly availability: NetworkEducationAvailability;
  readonly route: NetworkEducationRoute | null;
}

export interface NetworkEducationPath {
  readonly key: NetworkEducationPathKey;
  readonly messageKey: string;
  readonly items: readonly NetworkEducationItem[];
}

function item(
  key: string,
  messageKey: string,
  availability: NetworkEducationAvailability,
  route: NetworkEducationRoute | null,
): NetworkEducationItem {
  if ((availability === "available") !== Boolean(route)) {
    throw new Error("Live education items require an allow-listed route; planned items cannot expose one.");
  }
  return Object.freeze({ key, messageKey, availability, route });
}

export const NETWORK_EDUCATION_PATHS: readonly NetworkEducationPath[] = Object.freeze([
  Object.freeze({
    key: "quick-start",
    messageKey: "quickStart",
    items: Object.freeze([
      item("quick-start-understand", "quickStart.items.understand", "available", "/organization-profile"),
      item("quick-start-discover", "quickStart.items.discover", "available", "/geography/canvas"),
      item("quick-start-connect", "quickStart.items.connect", "available", "/referrals"),
      item("quick-start-act", "quickStart.items.act", "available", "/resources"),
    ]),
  }),
  Object.freeze({
    key: "business",
    messageKey: "business",
    items: Object.freeze([
      item("business-profile", "business.items.profile", "available", "/organization-profile"),
      item("business-discovery", "business.items.discovery", "available", "/geography/canvas"),
      item("business-referrals", "business.items.referrals", "available", "/referrals"),
      item("business-resources", "business.items.resources", "available", "/resources"),
      item("business-rfx", "business.items.rfx", "planned", null),
      item("business-credibility", "business.items.credibility", "planned", null),
    ]),
  }),
  Object.freeze({
    key: "issuer",
    messageKey: "issuer",
    items: Object.freeze([
      item("issuer-market", "issuer.items.market", "available", "/geography/canvas"),
      item("issuer-resources", "issuer.items.resources", "available", "/resources"),
      item("issuer-rfx", "issuer.items.rfx", "planned", null),
      item("issuer-evaluation", "issuer.items.evaluation", "planned", null),
    ]),
  }),
  Object.freeze({
    key: "resource-provider",
    messageKey: "resourceProvider",
    items: Object.freeze([
      item("provider-application", "resourceProvider.items.application", "available", "/provider-application"),
      item("provider-profile", "resourceProvider.items.profile", "available", "/provider-application"),
      item("provider-discovery", "resourceProvider.items.discovery", "available", "/resources"),
      item("provider-requests", "resourceProvider.items.requests", "available", "/resources"),
      item("provider-publication", "resourceProvider.items.publication", "available", "/resources"),
      item("provider-credentials", "resourceProvider.items.credentials", "planned", null),
    ]),
  }),
]);

export const NETWORK_EDUCATION_ITEM_KEYS = Object.freeze(
  NETWORK_EDUCATION_PATHS.flatMap((path) => path.items.map((entry) => entry.key)),
);

export const NETWORK_EXPLAINER_KEYS = [
  "profile-confirmation",
  "capability-suggestion",
  "credential-evidence",
  "media-visibility",
  "additional-location",
  "referral-consent",
  "referral-response",
  "provider-application",
  "provider-connection",
  "provider-response",
  "provider-resource-publication",
] as const;

export type NetworkExplainerKey = (typeof NETWORK_EXPLAINER_KEYS)[number];

export function educationPath(key: string): NetworkEducationPath {
  const result = NETWORK_EDUCATION_PATHS.find((path) => path.key === key);
  if (!result) throw new Error("Education path is unsupported.");
  return result;
}

export function assertEducationItem(pathKey: string, itemKey: string): NetworkEducationItem {
  const result = educationPath(pathKey).items.find((entry) => entry.key === itemKey);
  if (!result) throw new Error("Education item does not belong to this path.");
  return result;
}

export function assertExplainerKey(value: string): NetworkExplainerKey {
  if (!NETWORK_EXPLAINER_KEYS.includes(value as NetworkExplainerKey)) {
    throw new Error("Workflow explainer is unsupported.");
  }
  return value as NetworkExplainerKey;
}

export function recommendedEducationPath(officialResourceProvider: boolean): NetworkEducationPathKey {
  return officialResourceProvider ? "resource-provider" : "business";
}
