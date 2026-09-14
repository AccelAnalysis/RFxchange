import type {
  AccelPOCommandRequest,
  AccelPOCommandResult,
  CommandJsonValue,
} from "../command-port/contracts.ts";
import type {
  QueryProjectionInput,
  QueryProjectionResult,
} from "../query-projection/contracts.ts";

export const CP08_RFX_BRIDGE_VERSION = 1 as const;

export const CP08_RFX_BRIDGE_COMMANDS = Object.freeze({
  CREATE_OPPORTUNITY: "rfxbridge.create-opportunity",
  UPDATE_OPPORTUNITY: "rfxbridge.update-opportunity",
  CLOSE_OPPORTUNITY: "rfxbridge.close-opportunity",
  WITHDRAW_OPPORTUNITY: "rfxbridge.withdraw-opportunity",
} as const);

export type RFxBridgeCommandName =
  (typeof CP08_RFX_BRIDGE_COMMANDS)[keyof typeof CP08_RFX_BRIDGE_COMMANDS];

export type RFxBridgeFlow = "source-first" | "authorize-first";
export type RFxBridgeOpportunityState = "open" | "closed" | "withdrawn";

export interface RFxBridgeReleasedFile {
  readonly evidenceId: string;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly size: number | null;
}

/**
 * The only Purchase Case facts that may cross the supplier-facing bridge.
 * Purchase Case identity and organization identity stay in the trusted command envelope and are
 * not included in this supplier projection.
 */
export interface SupplierSafeNeedProjection {
  readonly bridgeVersion: typeof CP08_RFX_BRIDGE_VERSION;
  readonly need: Readonly<{
    readonly title: string;
    readonly specification: string | null;
    readonly quantity: number | null;
    readonly quantityUnit: string | null;
  }>;
  readonly timing: Readonly<{
    readonly neededBy: string | null;
    readonly responseDeadline: string;
  }>;
  readonly fulfillment: Readonly<{
    readonly method: string | null;
    readonly geography: string | null;
  }>;
  readonly supplierRequirements: readonly string[];
  readonly releasedFiles: readonly RFxBridgeReleasedFile[];
}

export interface RFxBridgeOpportunityLink {
  readonly bridgeVersion: typeof CP08_RFX_BRIDGE_VERSION;
  readonly purchaseCaseId: string;
  readonly canonicalOpportunityId: string;
  readonly flow: RFxBridgeFlow;
  readonly state: RFxBridgeOpportunityState;
  readonly rfxchangeHref: string;
}

export interface RFxBridgePriceComponents {
  readonly subtotalAmount: number | null;
  readonly shippingAmount: number | null;
  readonly taxAmount: number | null;
  readonly feeAmount: number | null;
  readonly otherAmount: number | null;
  readonly allInAmount: number | null;
  readonly currency: string | null;
}

export interface RFxBridgeOfferComparison {
  readonly id: string;
  readonly purchaseCaseId: string;
  readonly canonicalOfferId: string;
  readonly supplierName: string | null;
  readonly quantity: number | null;
  readonly fitSummary: string | null;
  readonly price: RFxBridgePriceComponents;
  readonly fulfillmentTiming: string | null;
  readonly validUntil: string | null;
  readonly terms: string | null;
  readonly deviations: string | null;
  readonly quoteEvidenceId: string | null;
  readonly quoteEvidenceStatus: string | null;
  readonly status: string | null;
}

export interface RFxBridgeFulfillmentUpdate {
  readonly id: string;
  readonly purchaseCaseId: string;
  readonly canonicalOpportunityId: string | null;
  readonly canonicalOfferId: string | null;
  readonly supplierName: string | null;
  readonly state: string;
  readonly orderReference: string | null;
  readonly confirmationAt: string | null;
  readonly neededBy: string | null;
  readonly deliveredAt: string | null;
  readonly receivedAt: string | null;
  readonly exceptionCode: string | null;
  readonly exceptionSummary: string | null;
}

export interface RFxBridgeCommandPort {
  execute<Result extends CommandJsonValue = CommandJsonValue>(
    request: AccelPOCommandRequest,
  ): Promise<AccelPOCommandResult<Result>>;
}

/** Must be backed by CP-04. CP-08 never reads canonical supplier data directly in the browser. */
export interface RFxBridgeQueryPort {
  read(input: Readonly<{
    requestedOrganizationId?: string | null;
    query: QueryProjectionInput;
  }>): Promise<QueryProjectionResult>;
}

export interface RFxBridgePublishInput {
  readonly organizationId: string;
  readonly purchaseCaseId: string;
  readonly flow: RFxBridgeFlow;
  readonly supplierSafeNeed: SupplierSafeNeedProjection;
  readonly requestId: string;
  readonly expectedVersion: number;
  readonly idempotencyKey?: string;
}

export interface RFxBridgeUpdateInput extends RFxBridgePublishInput {
  readonly canonicalOpportunityId: string;
  /** Stable source revision supplied by the Purchase Case; used to make update retries idempotent. */
  readonly sourceRevision: string;
}

export interface RFxBridgeStateChangeInput {
  readonly organizationId: string;
  readonly purchaseCaseId: string;
  readonly canonicalOpportunityId: string;
  readonly requestId: string;
  readonly expectedVersion: number;
  /** Stable user/domain intent identity. Retrying the same intent must reuse this value. */
  readonly mutationId: string;
}

export type RFxBridgeErrorCode =
  | "invalid-input"
  | "forbidden"
  | "not-found"
  | "version-conflict"
  | "contract-mismatch"
  | "unavailable-service";

export class RFxBridgeError extends Error {
  readonly code: RFxBridgeErrorCode;

  constructor(code: RFxBridgeErrorCode, message: string) {
    super(message);
    this.name = "RFxBridgeError";
    this.code = code;
  }
}

/**
 * Server-side adapter contract. Its implementation must call the canonical RFxchange opportunity,
 * offer, and fulfillment services; it is not a second marketplace repository.
 */
export interface CanonicalRFxBridgePort {
  createOpportunity(input: Readonly<{
    organizationId: string;
    actorUserId: string;
    actorMembershipId: string;
    purchaseCaseId: string;
    flow: RFxBridgeFlow;
    supplierSafeNeed: SupplierSafeNeedProjection;
    idempotencyKey: string;
  }>): Promise<Readonly<{
    canonicalOpportunityId: string;
    state: RFxBridgeOpportunityState;
  }>>;
  updateOpportunity(input: Readonly<{
    organizationId: string;
    actorUserId: string;
    actorMembershipId: string;
    canonicalOpportunityId: string;
    supplierSafeNeed: SupplierSafeNeedProjection;
    idempotencyKey: string;
  }>): Promise<Readonly<{
    canonicalOpportunityId: string;
    state: RFxBridgeOpportunityState;
  }>>;
  closeOpportunity(input: Readonly<{
    organizationId: string;
    actorUserId: string;
    actorMembershipId: string;
    canonicalOpportunityId: string;
    idempotencyKey: string;
  }>): Promise<Readonly<{
    canonicalOpportunityId: string;
    state: "closed";
  }>>;
  withdrawOpportunity(input: Readonly<{
    organizationId: string;
    actorUserId: string;
    actorMembershipId: string;
    canonicalOpportunityId: string;
    idempotencyKey: string;
  }>): Promise<Readonly<{
    canonicalOpportunityId: string;
    state: "withdrawn";
  }>>;
}
