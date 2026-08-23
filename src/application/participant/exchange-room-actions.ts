import type { ParticipantLensId } from "./participant-lens-registry";

export const EXCHANGE_ROOM_ACTION_IDS = [
  "opportunities.create-view", "opportunities.manage-respond", "opportunities.team", "opportunities.watch",
  "resources.offer-request", "resources.manage-view", "resources.share", "resources.save",
  "intelligence.add-view", "intelligence.edit-note", "intelligence.compare", "intelligence.track",
  "capabilities.manage-view", "capabilities.classify-match", "capabilities.evidence-refer", "capabilities.gaps-save",
] as const;
export type ExchangeRoomActionId = (typeof EXCHANGE_ROOM_ACTION_IDS)[number];

export const LEGACY_EXCHANGE_ROOM_ACTION_IDS = [
  "opportunities.find", "opportunities.create-rfx", "opportunities.pursue-respond", "opportunities.team",
  "resources.find-providers", "resources.browse-resources", "resources.my-requests", "resources.provider-status",
  "intelligence.organizations", "intelligence.capabilities", "intelligence.locations", "intelligence.layers",
  "referrals.new", "referrals.sent", "referrals.received", "referrals.starred",
] as const;
export type LegacyExchangeRoomActionId = (typeof LEGACY_EXCHANGE_ROOM_ACTION_IDS)[number];

export type LegacyExchangeRoomActionDisposition =
  | Readonly<{ kind: "action"; actionId: ExchangeRoomActionId }>
  | Readonly<{ kind: "lens"; lens: ParticipantLensId }>
  | Readonly<{ kind: "utility"; href: string }>
  | Readonly<{
      kind: "deferred-utility";
      utility: "referrals";
      view: "sent" | "received" | "starred";
      reason: "not-operational";
    }>
  | Readonly<{ kind: "filter"; lens: "intelligence"; intent: "locations" | "layers" }>;

export const LEGACY_EXCHANGE_ROOM_ACTION_DISPOSITIONS: Readonly<
  Record<LegacyExchangeRoomActionId, LegacyExchangeRoomActionDisposition>
> = Object.freeze({
  "opportunities.find": Object.freeze({ kind: "action", actionId: "opportunities.create-view" }),
  "opportunities.create-rfx": Object.freeze({ kind: "action", actionId: "opportunities.create-view" }),
  "opportunities.pursue-respond": Object.freeze({ kind: "action", actionId: "opportunities.manage-respond" }),
  "opportunities.team": Object.freeze({ kind: "action", actionId: "opportunities.team" }),
  "resources.find-providers": Object.freeze({ kind: "action", actionId: "resources.offer-request" }),
  "resources.browse-resources": Object.freeze({ kind: "action", actionId: "resources.manage-view" }),
  "resources.my-requests": Object.freeze({ kind: "utility", href: "/resources" }),
  "resources.provider-status": Object.freeze({ kind: "utility", href: "/provider-application" }),
  "intelligence.organizations": Object.freeze({ kind: "action", actionId: "intelligence.add-view" }),
  "intelligence.capabilities": Object.freeze({ kind: "lens", lens: "capabilities" }),
  "intelligence.locations": Object.freeze({ kind: "filter", lens: "intelligence", intent: "locations" }),
  "intelligence.layers": Object.freeze({ kind: "filter", lens: "intelligence", intent: "layers" }),
  "referrals.new": Object.freeze({ kind: "utility", href: "/referrals?intent=manage" }),
  "referrals.sent": Object.freeze({ kind: "deferred-utility", utility: "referrals", view: "sent", reason: "not-operational" }),
  "referrals.received": Object.freeze({ kind: "deferred-utility", utility: "referrals", view: "received", reason: "not-operational" }),
  "referrals.starred": Object.freeze({ kind: "deferred-utility", utility: "referrals", view: "starred", reason: "not-operational" }),
});

export type ExchangeRoomActionDisabledReason = "not-operational" | "not-applicable" | "not-authorized";
export type ExchangeRoomActionVariant = "own" | "external";
export type ExchangeRoomActionLabelKey = `${ExchangeRoomActionId}.${ExchangeRoomActionVariant}`;
export type ExchangeRoomActionIntent = "opportunity-watch";
export type ExchangeRoomActionHandler =
  | Readonly<{ kind: "href"; href: string }>
  | Readonly<{ kind: "network-focus"; intent: "organizations" | "capabilities" }>
  | Readonly<{ kind: "intent"; intent: ExchangeRoomActionIntent }>;
type AuthorizationRule = "room-participant" | "open-platform" | "open-platform-rfx-create" | "open-platform-referral-manage" | "open-platform-resource-manage";
type HandlerRule =
  | "opportunity-discovery"
  | "opportunity-assessment"
  | "opportunity-watch"
  | "rfx-issuer"
  | "resource-target"
  | "resource-request"
  | "resource-offer"
  | "resource-edit"
  | "provider-status"
  | "network-organizations"
  | "network-capabilities"
  | "organization-profile"
  | null;

export interface ExchangeRoomActionDefinition {
  readonly id: ExchangeRoomActionId;
  readonly lens: ParticipantLensId;
  readonly order: 1 | 2 | 3 | 4;
  readonly canonicalLabel: string;
  readonly labelKey: ExchangeRoomActionLabelKey;
  readonly externalLabelKey: ExchangeRoomActionLabelKey;
  readonly operational: boolean;
  readonly externalOperational: boolean;
  readonly authorization: AuthorizationRule;
  readonly externalAuthorization: AuthorizationRule;
  readonly handler: HandlerRule;
  readonly externalHandler: HandlerRule;
}

export interface ExchangeRoomActionProjection
  extends Omit<ExchangeRoomActionDefinition,
    "labelKey" | "operational" | "authorization" | "handler"> {
  readonly labelKey: ExchangeRoomActionLabelKey;
  readonly variant: ExchangeRoomActionVariant;
  readonly operational: boolean;
  readonly applicable: boolean;
  readonly authorized: boolean;
  readonly authorization: AuthorizationRule;
  readonly availability: "active" | "disabled";
  readonly disabledReason: ExchangeRoomActionDisabledReason | null;
  /**
   * The server-derived route or intent candidate is retained even when the first
   * client projection is permission-denied. A fresh server permission result may
   * activate only this candidate; the browser never invents a handler.
   */
  readonly handlerCandidate: ExchangeRoomActionHandler | null;
  readonly resolvedHandler: ExchangeRoomActionHandler | null;
}

export interface ExchangeRoomActionProjectionInput {
  readonly activeLens: ParticipantLensId;
  readonly viewerOrganizationId: string;
  readonly selectedOrganizationId: string;
  readonly selectedOrganizationIsOfficialResourceProvider: boolean;
  readonly openPlatformActionsAuthorized: boolean;
  readonly networkDiscoveryAvailable?: boolean;
  readonly actionAuthorization?: Readonly<{ rfxCreate: boolean; referralManage: boolean; resourceManage: boolean }>;
  readonly currentOpportunityReference?: string | null;
}

const DEFINITIONS: readonly ExchangeRoomActionDefinition[] = Object.freeze([
  Object.freeze({ id: "opportunities.create-view", lens: "opportunities-rfx", order: 1, canonicalLabel: "Create RFx / View RFx Detail", labelKey: "opportunities.create-view.own", externalLabelKey: "opportunities.create-view.external", operational: true, externalOperational: true, authorization: "open-platform-rfx-create", externalAuthorization: "open-platform", handler: "rfx-issuer", externalHandler: "opportunity-discovery" }),
  Object.freeze({ id: "opportunities.manage-respond", lens: "opportunities-rfx", order: 2, canonicalLabel: "Edit / Manage RFx / Respond", labelKey: "opportunities.manage-respond.own", externalLabelKey: "opportunities.manage-respond.external", operational: true, externalOperational: true, authorization: "open-platform-rfx-create", externalAuthorization: "open-platform", handler: "rfx-issuer", externalHandler: "opportunity-assessment" }),
  Object.freeze({ id: "opportunities.team", lens: "opportunities-rfx", order: 3, canonicalLabel: "Invite Team / Team", labelKey: "opportunities.team.own", externalLabelKey: "opportunities.team.external", operational: false, externalOperational: true, authorization: "open-platform", externalAuthorization: "open-platform", handler: null, externalHandler: "opportunity-assessment" }),
  Object.freeze({ id: "opportunities.watch", lens: "opportunities-rfx", order: 4, canonicalLabel: "Track / Watch / Watch", labelKey: "opportunities.watch.own", externalLabelKey: "opportunities.watch.external", operational: false, externalOperational: true, authorization: "open-platform", externalAuthorization: "open-platform", handler: null, externalHandler: "opportunity-watch" }),
  Object.freeze({ id: "resources.offer-request", lens: "resources", order: 1, canonicalLabel: "Offer Resource / Request Resource", labelKey: "resources.offer-request.own", externalLabelKey: "resources.offer-request.external", operational: true, externalOperational: true, authorization: "open-platform-resource-manage", externalAuthorization: "open-platform-referral-manage", handler: "resource-offer", externalHandler: "resource-request" }),
  Object.freeze({ id: "resources.manage-view", lens: "resources", order: 2, canonicalLabel: "Edit Resource / View Resource Detail", labelKey: "resources.manage-view.own", externalLabelKey: "resources.manage-view.external", operational: true, externalOperational: true, authorization: "open-platform-resource-manage", externalAuthorization: "open-platform", handler: "resource-edit", externalHandler: "resource-target" }),
  Object.freeze({ id: "resources.share", lens: "resources", order: 3, canonicalLabel: "Share", labelKey: "resources.share.own", externalLabelKey: "resources.share.external", operational: false, externalOperational: false, authorization: "open-platform", externalAuthorization: "open-platform", handler: null, externalHandler: null }),
  Object.freeze({ id: "resources.save", lens: "resources", order: 4, canonicalLabel: "Save / Archive / Save", labelKey: "resources.save.own", externalLabelKey: "resources.save.external", operational: false, externalOperational: false, authorization: "open-platform-resource-manage", externalAuthorization: "open-platform", handler: null, externalHandler: null }),
  Object.freeze({ id: "intelligence.add-view", lens: "intelligence", order: 1, canonicalLabel: "Add Insight / View Insight Detail", labelKey: "intelligence.add-view.own", externalLabelKey: "intelligence.add-view.external", operational: false, externalOperational: false, authorization: "room-participant", externalAuthorization: "room-participant", handler: null, externalHandler: null }),
  Object.freeze({ id: "intelligence.edit-note", lens: "intelligence", order: 2, canonicalLabel: "Edit Insight / Add Note", labelKey: "intelligence.edit-note.own", externalLabelKey: "intelligence.edit-note.external", operational: false, externalOperational: false, authorization: "room-participant", externalAuthorization: "room-participant", handler: null, externalHandler: null }),
  Object.freeze({ id: "intelligence.compare", lens: "intelligence", order: 3, canonicalLabel: "Compare", labelKey: "intelligence.compare.own", externalLabelKey: "intelligence.compare.external", operational: false, externalOperational: false, authorization: "room-participant", externalAuthorization: "room-participant", handler: null, externalHandler: null }),
  Object.freeze({ id: "intelligence.track", lens: "intelligence", order: 4, canonicalLabel: "Track / Follow / Track", labelKey: "intelligence.track.own", externalLabelKey: "intelligence.track.external", operational: false, externalOperational: false, authorization: "room-participant", externalAuthorization: "room-participant", handler: null, externalHandler: null }),
  Object.freeze({ id: "capabilities.manage-view", lens: "capabilities", order: 1, canonicalLabel: "Manage Capabilities / View Capabilities", labelKey: "capabilities.manage-view.own", externalLabelKey: "capabilities.manage-view.external", operational: false, externalOperational: false, authorization: "open-platform", externalAuthorization: "room-participant", handler: null, externalHandler: null }),
  Object.freeze({ id: "capabilities.classify-match", lens: "capabilities", order: 2, canonicalLabel: "AI to AMACS / Match to RFx", labelKey: "capabilities.classify-match.own", externalLabelKey: "capabilities.classify-match.external", operational: false, externalOperational: false, authorization: "open-platform", externalAuthorization: "open-platform", handler: null, externalHandler: null }),
  Object.freeze({ id: "capabilities.evidence-refer", lens: "capabilities", order: 3, canonicalLabel: "Add / Edit Evidence / Refer", labelKey: "capabilities.evidence-refer.own", externalLabelKey: "capabilities.evidence-refer.external", operational: false, externalOperational: false, authorization: "open-platform", externalAuthorization: "open-platform-referral-manage", handler: null, externalHandler: null }),
  Object.freeze({ id: "capabilities.gaps-save", lens: "capabilities", order: 4, canonicalLabel: "Capability Gaps / Save / Follow", labelKey: "capabilities.gaps-save.own", externalLabelKey: "capabilities.gaps-save.external", operational: false, externalOperational: false, authorization: "open-platform", externalAuthorization: "open-platform", handler: null, externalHandler: null }),
]);
export const EXCHANGE_ROOM_ACTION_REGISTRY = DEFINITIONS;

function actionVariant(
  definition: ExchangeRoomActionDefinition,
  input: ExchangeRoomActionProjectionInput,
): ExchangeRoomActionVariant {
  if (definition.lens === "opportunities-rfx") {
    return input.currentOpportunityReference ? "external" : "own";
  }
  return input.viewerOrganizationId === input.selectedOrganizationId ? "own" : "external";
}

function authorized(rule: AuthorizationRule, input: ExchangeRoomActionProjectionInput): boolean {
  if (rule === "room-participant") return true;
  if (!input.openPlatformActionsAuthorized) return false;
  if (rule === "open-platform-rfx-create") return input.actionAuthorization?.rfxCreate ?? false;
  if (rule === "open-platform-referral-manage") return input.actionAuthorization?.referralManage ?? false;
  if (rule === "open-platform-resource-manage") return input.actionAuthorization?.resourceManage ?? false;
  return true;
}

function resourceTarget(input: ExchangeRoomActionProjectionInput): string | null {
  if (input.selectedOrganizationId !== input.viewerOrganizationId
    && input.selectedOrganizationIsOfficialResourceProvider) {
    const selected = encodeURIComponent(input.selectedOrganizationId);
    return `/resources?organization=${selected}&provider=${selected}`;
  }
  return null;
}

function resolveHandler(
  rule: HandlerRule,
  input: ExchangeRoomActionProjectionInput,
): ExchangeRoomActionHandler | null {
  switch (rule) {
    case "opportunity-discovery": {
      const reference = input.currentOpportunityReference?.trim();
      return reference
        ? Object.freeze({ kind: "href", href: `/opportunities/${encodeURIComponent(reference)}` })
        : null;
    }
    case "opportunity-assessment": {
      const reference = input.currentOpportunityReference?.trim();
      return reference
        ? Object.freeze({ kind: "href", href: `/opportunities/${encodeURIComponent(reference)}/assess` })
        : null;
    }
    case "opportunity-watch": return input.currentOpportunityReference?.trim()
      ? Object.freeze({ kind: "intent", intent: "opportunity-watch" })
      : null;
    case "rfx-issuer": return Object.freeze({ kind: "href", href: "/opportunities/manage" });
    case "resource-target":
    case "resource-request": {
      const href = resourceTarget(input);
      return href ? Object.freeze({ kind: "href", href }) : null;
    }
    case "resource-offer": return Object.freeze({ kind: "href", href: "/resources?manage=offer" });
    case "resource-edit": return Object.freeze({ kind: "href", href: "/resources?manage=edit" });
    case "provider-status": return Object.freeze({ kind: "href", href: "/provider-application" });
    case "network-organizations": return Object.freeze({ kind: "network-focus", intent: "organizations" });
    case "network-capabilities": return Object.freeze({ kind: "network-focus", intent: "capabilities" });
    case "organization-profile": return Object.freeze({ kind: "href", href: "/organization-profile" });
    default: return null;
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
    const variant = actionVariant(definition, input);
    const isExternal = variant === "external";
    const operational = isExternal ? definition.externalOperational : definition.operational;
    const authorization = isExternal ? definition.externalAuthorization : definition.authorization;
    const handlerRule = isExternal ? definition.externalHandler : definition.handler;
    const labelKey = isExternal ? definition.externalLabelKey : definition.labelKey;
    const isAuthorized = authorized(authorization, input);
    const handlerCandidate = operational ? resolveHandler(handlerRule, input) : null;
    const applicable = handlerCandidate !== null || !operational;
    const resolvedHandler = applicable && isAuthorized ? handlerCandidate : null;
    const disabledReason: ExchangeRoomActionDisabledReason | null = !operational
      ? "not-operational"
      : !applicable
        ? "not-applicable"
        : !isAuthorized
          ? "not-authorized"
          : resolvedHandler
            ? null
            : "not-operational";
    return Object.freeze({
      ...definition,
      labelKey,
      variant,
      operational,
      applicable,
      authorized: isAuthorized,
      authorization,
      availability: resolvedHandler ? "active" as const : "disabled" as const,
      disabledReason,
      handlerCandidate,
      resolvedHandler,
    });
  }));
}
