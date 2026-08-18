import type {
  RecipientReferralProjection,
  ReferralNotificationStatus,
  ReferralSharedField,
  ReferralStatus,
  SenderReferralProjection,
} from "../../domain/referrals/model.ts";
import type { ExchangeRoomActionProjection } from "../participant/exchange-room-actions.ts";
import {
  createExchangeMapRelationshipProjection,
  createExchangeSelectionState,
  createExchangeSubjectIdentity,
  createLensResultCardModel,
  mobileLensActionRail,
  projectFavoriteState,
  projectRecordAction,
  type ExchangeMapRelationshipProjection,
  type ExchangeMediaModel,
  type ExchangeSelectionState,
  type LensActionRailContract,
  type LensResultCardModel,
  type RecordActionDefinition,
} from "../participant/mobile-exchange-contracts.ts";

export type ReferralMobileProjection = SenderReferralProjection | RecipientReferralProjection;

const REFERRAL_PATH_STATUSES: readonly ReferralStatus[] = Object.freeze([
  "sent",
  "accepted",
  "contacted",
  "closed",
]);

export interface ReferralMobileCopy {
  readonly translate: (
    key: string,
    values?: Readonly<Record<string, string>>,
  ) => string;
  readonly formatToken: (value: string) => string;
  readonly formatDate: (value: string) => string;
}

/**
 * This context must come from an already-authorized organization/map projection.
 * It is presentation context only and never upgrades Referral authority.
 */
export interface ReferralMobileCounterpartyContext {
  readonly organizationId: string;
  readonly displayName: string;
  readonly markerId: string | null;
  readonly locality: string | null;
  readonly media: ExchangeMediaModel | null;
  readonly pathEndpointEligible: boolean;
}

export type ReferralMobileRecordCommand =
  | Readonly<{
      id: string;
      kind: "transition";
      referralId: string;
      expectedVersion: number;
      action: "accepted" | "declined" | "contacted" | "closed";
    }>
  | Readonly<{
      id: string;
      kind: "retry-communication";
      referralId: string;
      expectedVersion: number;
      action: null;
    }>;

export interface ReferralMobileDetailProjection {
  readonly referralId: string;
  readonly version: number;
  readonly role: ReferralMobileProjection["role"];
  readonly counterpartyOrganizationId: string | null;
  readonly counterpartyLabel: string;
  readonly status: ReferralStatus;
  readonly need: ReferralMobileProjection["need"];
  readonly summary: string;
  readonly urgency: ReferralMobileProjection["urgency"];
  readonly preferredContactMethod: ReferralMobileProjection["preferredContactMethod"];
  readonly purpose: ReferralMobileProjection["purpose"];
  readonly opportunityReference: string | null;
  readonly sharedFields: readonly ReferralSharedField[];
  readonly notificationStatus: ReferralNotificationStatus;
  readonly expiresAt: string;
  readonly consentState: "recorded-evidence-minimized";
  readonly reportedOutcome: ReferralMobileProjection["outcome"];
  readonly outcomeAuthority: "participant-reported-non-verified" | null;
  readonly boundaryText: string;
}

export interface ReferralMobileRecordBinding {
  readonly identity: ReturnType<typeof createExchangeSubjectIdentity>;
  readonly card: LensResultCardModel;
  readonly selection: ExchangeSelectionState;
  readonly relationship: ExchangeMapRelationshipProjection;
  readonly detail: ReferralMobileDetailProjection;
  readonly recordActionCommands: readonly ReferralMobileRecordCommand[];
  readonly authoritySource: "server-derived";
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > 240) throw new Error(`${label} is invalid.`);
  return normalized;
}

export function referralMobileCounterpartyOrganizationId(
  referral: ReferralMobileProjection,
): string | null {
  return referral.role === "sender"
    ? referral.recipientOrganizationId
      ? String(referral.recipientOrganizationId)
      : null
    : String(referral.senderOrganizationId);
}

export function referralMobileCounterpartyLabel(
  referral: ReferralMobileProjection,
): string {
  return referral.role === "sender"
    ? required(referral.recipientLabel, "Referral recipient label")
    : required(referral.senderOrganizationName, "Referral sender organization name");
}

function assertViewerScope(
  referral: ReferralMobileProjection,
  viewerOrganizationId: string,
): void {
  const viewer = required(viewerOrganizationId, "Viewer organization id");
  if (referral.role === "sender") {
    if (String(referral.senderOrganizationId) !== viewer) {
      throw new Error("Sender Referral projection does not belong to the current viewer organization.");
    }
    return;
  }
  if (String(referral.recipientOrganizationId ?? "") !== viewer) {
    throw new Error("Recipient Referral projection does not belong to the current viewer organization.");
  }
}

function assertCounterpartyContext(
  referral: ReferralMobileProjection,
  counterparty: ReferralMobileCounterpartyContext | null,
): string | null {
  const organizationId = referralMobileCounterpartyOrganizationId(referral);
  if (!counterparty) return organizationId;
  if (!organizationId) {
    throw new Error("An external Referral recipient cannot be promoted to an organization counterparty.");
  }
  if (required(counterparty.organizationId, "Counterparty organization id") !== organizationId) {
    throw new Error("Referral counterparty context does not match the authorized Referral projection.");
  }
  return organizationId;
}

function referralSelection(
  referral: ReferralMobileProjection,
  counterparty: ReferralMobileCounterpartyContext | null,
): ExchangeSelectionState {
  const referralKey = `referral:${required(referral.id, "Referral id")}`;
  const counterpartyOrganizationId = referralMobileCounterpartyOrganizationId(referral);
  const organizationKey = counterpartyOrganizationId
    ? `organization:${counterpartyOrganizationId}`
    : null;
  return createExchangeSelectionState({
    kind: "record",
    source: "restored",
    selectedRecord: Object.freeze({
      selectionKey: referralKey,
      recordType: "referral",
      recordId: referral.id,
      organizationId: counterpartyOrganizationId,
    }),
    selectedOrganization: counterparty && organizationKey
      ? Object.freeze({
          selectionKey: organizationKey,
          organizationId: counterparty.organizationId,
          associationRole: "counterparty" as const,
        })
      : null,
    selectedMarker: counterparty?.markerId && organizationKey
      ? Object.freeze({
          selectionKey: organizationKey,
          markerId: counterparty.markerId,
          role: "associated-organization" as const,
        })
      : null,
    selectedRelationship: Object.freeze({
      relationshipId: referral.id,
      authority: "server-revalidated" as const,
    }),
  });
}

function referralRelationship(
  referral: ReferralMobileProjection,
  viewerOrganizationId: string,
  counterparty: ReferralMobileCounterpartyContext | null,
  pathAuthorized: boolean,
  geometryReference: string | null,
  copy: ReferralMobileCopy,
): ExchangeMapRelationshipProjection {
  const counterpartyOrganizationId = referralMobileCounterpartyOrganizationId(referral);
  const pathStateAuthorized = pathAuthorized
    && counterparty !== null
    && counterpartyOrganizationId !== null
    && counterparty.pathEndpointEligible
    && REFERRAL_PATH_STATUSES.includes(referral.status);

  if (!pathStateAuthorized) {
    return createExchangeMapRelationshipProjection({
      relationshipId: referral.id,
      pathState: "no-path",
      accessibleLabel: copy.translate("referralWorkspace.path.unavailable"),
      layerIds: ["referrals.relationships"],
    });
  }

  return createExchangeMapRelationshipProjection({
    relationshipId: referral.id,
    pathState: "authorized-path",
    endpointOrganizationIds: [viewerOrganizationId, counterpartyOrganizationId],
    geometryReference,
    accessibleLabel: copy.translate("referralWorkspace.path.visible", {
      status: copy.formatToken(referral.status),
    }),
    layerIds: ["referrals.relationships"],
  });
}

function actionProjection(
  referral: ReferralMobileProjection,
  action: "accepted" | "declined" | "contacted" | "closed",
): Readonly<{
  action: RecordActionDefinition;
  command: ReferralMobileRecordCommand;
}> {
  const id = `referral.${action}`;
  return Object.freeze({
    action: projectRecordAction({
      id,
      labelKey: `referralWorkspace.actions.${action}`,
      operational: true,
      applicable: true,
      authorized: true,
      handler: Object.freeze({ kind: "intent" as const, intent: `referral.transition.${action}` }),
    }),
    command: Object.freeze({
      id,
      kind: "transition" as const,
      referralId: referral.id,
      expectedVersion: referral.version,
      action,
    }),
  });
}

function referralRecordActions(
  referral: ReferralMobileProjection,
): Readonly<{
  actions: readonly RecordActionDefinition[];
  commands: readonly ReferralMobileRecordCommand[];
}> {
  const entries: Array<Readonly<{
    action: RecordActionDefinition;
    command: ReferralMobileRecordCommand;
  }>> = [];

  if (referral.role === "recipient" && referral.status === "sent") {
    entries.push(actionProjection(referral, "accepted"), actionProjection(referral, "declined"));
  } else if (referral.status === "accepted") {
    entries.push(actionProjection(referral, "contacted"));
  } else if (referral.role === "sender" && referral.status === "contacted") {
    entries.push(actionProjection(referral, "closed"));
  }

  if (
    referral.role === "sender"
    && referral.status === "sent"
    && referral.notificationStatus === "retryable-failure"
    && !(referral.recipientKind === "external" && referral.recipientOrganizationId !== null)
  ) {
    const id = "referral.retry-communication";
    entries.push(Object.freeze({
      action: projectRecordAction({
        id,
        labelKey: "referralWorkspace.actions.retry",
        operational: true,
        applicable: true,
        authorized: true,
        handler: Object.freeze({ kind: "intent" as const, intent: "referral.retry-communication" }),
      }),
      command: Object.freeze({
        id,
        kind: "retry-communication" as const,
        referralId: referral.id,
        expectedVersion: referral.version,
        action: null,
      }),
    }));
  }

  return Object.freeze({
    actions: Object.freeze(entries.map((entry) => entry.action)),
    commands: Object.freeze(entries.map((entry) => entry.command)),
  });
}

export function createReferralMobileRecordBinding(input: Readonly<{
  referral: ReferralMobileProjection;
  viewerOrganizationId: string;
  counterparty: ReferralMobileCounterpartyContext | null;
  pathAuthorized: boolean;
  relationshipGeometryReference?: string | null;
  copy: ReferralMobileCopy;
}>): ReferralMobileRecordBinding {
  const { referral, copy } = input;
  assertViewerScope(referral, input.viewerOrganizationId);
  const counterpartyOrganizationId = assertCounterpartyContext(referral, input.counterparty);
  const counterpartyLabel = referralMobileCounterpartyLabel(referral);
  const identity = createExchangeSubjectIdentity({
    subjectKind: "record",
    selectionKey: `referral:${referral.id}`,
    organizationId: counterpartyOrganizationId,
    recordType: "referral",
    recordId: referral.id,
  });
  const favorite = projectFavoriteState({
    visible: false,
    favorited: null,
    operational: false,
    applicable: false,
    authorized: false,
    handler: null,
  });
  const recordActions = referralRecordActions(referral);
  const card = createLensResultCardModel({
    identity,
    title: counterpartyLabel,
    organizationIdentity: counterpartyOrganizationId,
    locality: input.counterparty?.locality ?? null,
    summary: referral.summary,
    indicator: Object.freeze({
      label: copy.translate(
        referral.role === "sender"
          ? "referralWorkspace.roles.sender"
          : "referralWorkspace.roles.recipient",
      ),
      value: copy.formatToken(referral.status),
      emphasis: referral.status === "declined" || referral.status === "expired"
        ? "attention" as const
        : "neutral" as const,
    }),
    metadata: Object.freeze([
      Object.freeze({
        id: "purpose",
        label: copy.translate("referralWorkspace.fields.purpose"),
        value: copy.formatToken(referral.purpose),
      }),
      Object.freeze({
        id: "urgency",
        label: copy.translate("referralWorkspace.fields.urgency"),
        value: copy.formatToken(referral.urgency),
      }),
      Object.freeze({
        id: "contact",
        label: copy.translate("referralWorkspace.fields.contact"),
        value: copy.formatToken(referral.preferredContactMethod),
      }),
      Object.freeze({
        id: "notification",
        label: copy.translate("referralWorkspace.fields.notification"),
        value: referral.notificationStatus === "delivery-outcome-unknown"
          ? copy.translate("referralWorkspace.notificationStates.deliveryOutcomeUnknown")
          : copy.formatToken(referral.notificationStatus),
      }),
      Object.freeze({
        id: "expires",
        label: copy.translate("referralWorkspace.fields.expires"),
        value: copy.formatDate(referral.expiresAt),
      }),
    ]),
    media: input.counterparty?.media ?? null,
    favorite,
    recordActions: recordActions.actions,
    canonicalHref: `/referrals?referral=${encodeURIComponent(referral.id)}`,
    returnLens: "referrals",
  });
  const relationship = referralRelationship(
    referral,
    input.viewerOrganizationId,
    input.counterparty,
    input.pathAuthorized,
    input.relationshipGeometryReference ?? null,
    copy,
  );
  const reportedOutcome = referral.status === "closed" ? referral.outcome : null;
  const detail: ReferralMobileDetailProjection = Object.freeze({
    referralId: referral.id,
    version: referral.version,
    role: referral.role,
    counterpartyOrganizationId,
    counterpartyLabel,
    status: referral.status,
    need: referral.need,
    summary: referral.summary,
    urgency: referral.urgency,
    preferredContactMethod: referral.preferredContactMethod,
    purpose: referral.purpose,
    opportunityReference: referral.opportunityReference,
    sharedFields: Object.freeze([...referral.sharedFields]),
    notificationStatus: referral.notificationStatus,
    expiresAt: referral.expiresAt,
    consentState: "recorded-evidence-minimized",
    reportedOutcome,
    outcomeAuthority: reportedOutcome ? "participant-reported-non-verified" : null,
    boundaryText: copy.translate("referralWorkspace.detail.boundary"),
  });

  return Object.freeze({
    identity,
    card,
    selection: referralSelection(referral, input.counterparty),
    relationship,
    detail,
    recordActionCommands: recordActions.commands,
    authoritySource: "server-derived",
  });
}

export function createReferralMobileActionRail(
  projections: readonly ExchangeRoomActionProjection[],
): LensActionRailContract {
  return mobileLensActionRail("referrals", projections);
}

export const REFERRAL_MOBILE_COMPOSITION_POLICY = Object.freeze({
  sharedShellOnly: true,
  sharedMapOnly: true,
  sharedSheetOnly: true,
  sharedCardOnly: true,
  sharedSelectionOnly: true,
  sharedActionRailOnly: true,
  favoritePersistenceAvailable: false,
  clientSelectionGrantsAuthority: false,
  pathRequiresCurrentDomainAuthorization: true,
  noPathDisclosesEndpoints: false,
  consentEvidenceIsMinimized: true,
  outcomeIsNeverVerifiedByReferralState: true,
} as const);
