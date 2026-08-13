import type { ParticipantLensId } from "./participant-lens-registry";

export const EXCHANGE_ROOM_ACTION_IDS = [
  "opportunities.find",
  "opportunities.create-rfx",
  "opportunities.pursue-respond",
  "opportunities.team",
  "resources.find-providers",
  "resources.browse-resources",
  "resources.my-requests",
  "resources.provider-status",
  "intelligence.organizations",
  "intelligence.capabilities",
  "intelligence.locations",
  "intelligence.layers",
  "referrals.new",
  "referrals.sent",
  "referrals.received",
  "referrals.starred",
] as const;

export type ExchangeRoomActionId = (typeof EXCHANGE_ROOM_ACTION_IDS)[number];
export type ExchangeRoomActionDisabledReason =
  | "not-operational"
  | "not-applicable"
  | "not-authorized";

export type ExchangeRoomActionHandler =
  | Readonly<{ kind: "href"; href: string }>
  | Readonly<{ kind: "network-focus"; intent: "organizations" | "capabilities" }>;

type ApplicabilityRule = "any" | "viewer-organization" | "opportunity-context";
type AuthorizationRule = "room-participant" | "open-platform";
type HandlerRule =
  | "opportunity-discovery"
  | "rfx-issuer"
  | "opportunity-detail"
  | "resource-discovery"
  | "resource-browse"
  | "resource-requests"
  | "provider-status"
  | "network-organizations"
  | "network-capabilities"
  | "referral-new"
  | "referral-sent"
  | "referral-received"
  | null;

export interface ExchangeRoomActionDefinition {
  readonly id: ExchangeRoomActionId;
  readonly lens: ParticipantLensId;
  readonly order: 1 | 2 | 3 | 4;
  readonly canonicalLabel: string;
  readonly labelKey: string;
  readonly operational: boolean;
  readonly applicability: ApplicabilityRule;
  readonly authorization: AuthorizationRule;
  readonly handler: HandlerRule;
}

export interface ExchangeRoomActionProjection extends ExchangeRoomActionDefinition {
  readonly operational: boolean;
  readonly applicable: boolean;
  readonly authorized: boolean;
  readonly availability: "active" | "disabled";
  readonly disabledReason: ExchangeRoomActionDisabledReason | null;
  readonly resolvedHandler: ExchangeRoomActionHandler | null;
}

export interface ExchangeRoomActionProjectionInput {
  readonly activeLens: ParticipantLensId;
  readonly viewerOrganizationId: string;
  readonly selectedOrganizationId: string;
  readonly selectedOrganizationIsOfficialResourceProvider: boolean;
  readonly openPlatformActionsAuthorized: boolean;
  readonly currentOpportunityReference?: string | null;
}

const DEFINITIONS: readonly ExchangeRoomActionDefinition[] = Object.freeze([
  Object.freeze({
    id: "opportunities.find",
    lens: "opportunities-rfx",
    order: 1,
    canonicalLabel: "Find Opportunities",
    labelKey: "networkWorkspace.exchangeRoom.actions.opportunities.find",
    operational: true,
    applicability: "any",
    authorization: "open-platform",
    handler: "opportunity-discovery",
  }),
  Object.freeze({
    id: "opportunities.create-rfx",
    lens: "opportunities-rfx",
    order: 2,
    canonicalLabel: "Create RFx",
    labelKey: "networkWorkspace.exchangeRoom.actions.opportunities.createRfx",
    operational: true,
    applicability: "viewer-organization",
    authorization: "open-platform",
    handler: "rfx-issuer",
  }),
  Object.freeze({
    id: "opportunities.pursue-respond",
    lens: "opportunities-rfx",
    order: 3,
    canonicalLabel: "Pursue / Respond",
    labelKey: "networkWorkspace.exchangeRoom.actions.opportunities.pursueRespond",
    operational: true,
    applicability: "opportunity-context",
    authorization: "open-platform",
    handler: "opportunity-detail",
  }),
  Object.freeze({
    id: "opportunities.team",
    lens: "opportunities-rfx",
    order: 4,
    canonicalLabel: "Team",
    labelKey: "networkWorkspace.exchangeRoom.actions.opportunities.team",
    operational: false,
    applicability: "opportunity-context",
    authorization: "open-platform",
    handler: null,
  }),
  Object.freeze({
    id: "resources.find-providers",
    lens: "resources",
    order: 1,
    canonicalLabel: "Find Providers",
    labelKey: "networkWorkspace.exchangeRoom.actions.resources.findProviders",
    operational: true,
    applicability: "any",
    authorization: "open-platform",
    handler: "resource-discovery",
  }),
  Object.freeze({
    id: "resources.browse-resources",
    lens: "resources",
    order: 2,
    canonicalLabel: "Browse Resources",
    labelKey: "networkWorkspace.exchangeRoom.actions.resources.browseResources",
    operational: true,
    applicability: "any",
    authorization: "open-platform",
    handler: "resource-browse",
  }),
  Object.freeze({
    id: "resources.my-requests",
    lens: "resources",
    order: 3,
    canonicalLabel: "My Requests",
    labelKey: "networkWorkspace.exchangeRoom.actions.resources.myRequests",
    operational: true,
    applicability: "any",
    authorization: "open-platform",
    handler: "resource-requests",
  }),
  Object.freeze({
    id: "resources.provider-status",
    lens: "resources",
    order: 4,
    canonicalLabel: "Provider Status",
    labelKey: "networkWorkspace.exchangeRoom.actions.resources.providerStatus",
    operational: true,
    applicability: "viewer-organization",
    authorization: "open-platform",
    handler: "provider-status",
  }),
  Object.freeze({
    id: "intelligence.organizations",
    lens: "intelligence",
    order: 1,
    canonicalLabel: "Organizations",
    labelKey: "networkWorkspace.exchangeRoom.actions.intelligence.organizations",
    operational: true,
    applicability: "any",
    authorization: "room-participant",
    handler: "network-organizations",
  }),
  Object.freeze({
    id: "intelligence.capabilities",
    lens: "intelligence",
    order: 2,
    canonicalLabel: "Capabilities",
    labelKey: "networkWorkspace.exchangeRoom.actions.intelligence.capabilities",
    operational: true,
    applicability: "any",
    authorization: "room-participant",
    handler: "network-capabilities",
  }),
  Object.freeze({
    id: "intelligence.locations",
    lens: "intelligence",
    order: 3,
    canonicalLabel: "Locations",
    labelKey: "networkWorkspace.exchangeRoom.actions.intelligence.locations",
    operational: false,
    applicability: "any",
    authorization: "room-participant",
    handler: null,
  }),
  Object.freeze({
    id: "intelligence.layers",
    lens: "intelligence",
    order: 4,
    canonicalLabel: "Intelligence Layers",
    labelKey: "networkWorkspace.exchangeRoom.actions.intelligence.layers",
    operational: false,
    applicability: "any",
    authorization: "room-participant",
    handler: null,
  }),
  Object.freeze({
    id: "referrals.new",
    lens: "referrals",
    order: 1,
    canonicalLabel: "New Referral",
    labelKey: "networkWorkspace.exchangeRoom.actions.referrals.new",
    operational: true,
    applicability: "any",
    authorization: "open-platform",
    handler: "referral-new",
  }),
  Object.freeze({
    id: "referrals.sent",
    lens: "referrals",
    order: 2,
    canonicalLabel: "Sent",
    labelKey: "networkWorkspace.exchangeRoom.actions.referrals.sent",
    operational: true,
    applicability: "any",
    authorization: "open-platform",
    handler: "referral-sent",
  }),
  Object.freeze({
    id: "referrals.received",
    lens: "referrals",
    order: 3,
    canonicalLabel: "Received",
    labelKey: "networkWorkspace.exchangeRoom.actions.referrals.received",
    operational: true,
    applicability: "any",
    authorization: "open-platform",
    handler: "referral-received",
  }),
  Object.freeze({
    id: "referrals.starred",
    lens: "referrals",
    order: 4,
    canonicalLabel: "Starred",
    labelKey: "networkWorkspace.exchangeRoom.actions.referrals.starred",
    operational: false,
    applicability: "any",
    authorization: "open-platform",
    handler: null,
  }),
]);

export const EXCHANGE_ROOM_ACTION_REGISTRY = DEFINITIONS;

function applicable(
  definition: ExchangeRoomActionDefinition,
  input: ExchangeRoomActionProjectionInput,
): boolean {
  if (definition.applicability === "viewer-organization") {
    return input.viewerOrganizationId === input.selectedOrganizationId;
  }
  if (definition.applicability === "opportunity-context") {
    return Boolean(input.currentOpportunityReference);
  }
  return true;
}

function authorized(
  definition: ExchangeRoomActionDefinition,
  input: ExchangeRoomActionProjectionInput,
): boolean {
  return definition.authorization === "room-participant"
    ? true
    : input.openPlatformActionsAuthorized;
}

function resourceTarget(input: ExchangeRoomActionProjectionInput): string {
  if (
    input.selectedOrganizationId !== input.viewerOrganizationId
    && input.selectedOrganizationIsOfficialResourceProvider
  ) {
    const selected = encodeURIComponent(input.selectedOrganizationId);
    return `/resources?organization=${selected}&provider=${selected}`;
  }
  return "/resources";
}

function resolveHandler(
  definition: ExchangeRoomActionDefinition,
  input: ExchangeRoomActionProjectionInput,
): ExchangeRoomActionHandler | null {
  switch (definition.handler) {
    case "opportunity-discovery":
      return Object.freeze({ kind: "href", href: "/opportunities" });
    case "rfx-issuer":
      return Object.freeze({ kind: "href", href: "/opportunities/manage" });
    case "opportunity-detail":
      return input.currentOpportunityReference
        ? Object.freeze({
            kind: "href",
            href: `/opportunities/${encodeURIComponent(input.currentOpportunityReference)}`,
          })
        : null;
    case "resource-discovery":
    case "resource-browse":
      return Object.freeze({ kind: "href", href: resourceTarget(input) });
    case "resource-requests":
      return Object.freeze({ kind: "href", href: "/resources" });
    case "provider-status":
      return Object.freeze({ kind: "href", href: "/provider-application" });
    case "network-organizations":
      return Object.freeze({ kind: "network-focus", intent: "organizations" });
    case "network-capabilities":
      return Object.freeze({ kind: "network-focus", intent: "capabilities" });
    case "referral-new":
      return Object.freeze({
        kind: "href",
        href: input.selectedOrganizationId === input.viewerOrganizationId
          ? "/referrals"
          : `/referrals?organization=${encodeURIComponent(input.selectedOrganizationId)}`,
      });
    case "referral-sent":
    case "referral-received":
      return Object.freeze({ kind: "href", href: "/referrals" });
    default:
      return null;
  }
}

export function exchangeRoomActionDefinitionsForLens(
  lens: ParticipantLensId,
): readonly ExchangeRoomActionDefinition[] {
  return Object.freeze(DEFINITIONS.filter((definition) => definition.lens === lens));
}

export function projectExchangeRoomActions(
  input: ExchangeRoomActionProjectionInput,
): readonly ExchangeRoomActionProjection[] {
  return Object.freeze(exchangeRoomActionDefinitionsForLens(input.activeLens).map((definition) => {
    const isOperational = definition.operational;
    const isApplicable = applicable(definition, input);
    const isAuthorized = authorized(definition, input);
    const resolvedHandler = isOperational && isApplicable && isAuthorized
      ? resolveHandler(definition, input)
      : null;
    const disabledReason: ExchangeRoomActionDisabledReason | null = !isOperational
      ? "not-operational"
      : !isApplicable
        ? "not-applicable"
        : !isAuthorized
          ? "not-authorized"
          : resolvedHandler
            ? null
            : "not-operational";

    return Object.freeze({
      ...definition,
      operational: isOperational,
      applicable: isApplicable,
      authorized: isAuthorized,
      availability: resolvedHandler ? "active" as const : "disabled" as const,
      disabledReason,
      resolvedHandler,
    });
  }));
}
