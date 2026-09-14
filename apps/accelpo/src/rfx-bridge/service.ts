import type { CommandJsonObject, CommandJsonValue } from "../command-port/contracts.ts";
import {
  CP08_RFX_BRIDGE_COMMANDS,
  CP08_RFX_BRIDGE_VERSION,
  RFxBridgeError,
  type RFxBridgeCommandPort,
  type RFxBridgeFlow,
  type RFxBridgeFulfillmentUpdate,
  type RFxBridgeOfferComparison,
  type RFxBridgeOpportunityLink,
  type RFxBridgePublishInput,
  type RFxBridgeQueryPort,
  type RFxBridgeStateChangeInput,
  type RFxBridgeUpdateInput,
  type SupplierSafeNeedProjection,
} from "./contracts.ts";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/;

export interface RFxBridgeServiceOptions {
  readonly commandPort: RFxBridgeCommandPort;
  readonly queryPort: RFxBridgeQueryPort;
  /** Canonical RFxchange opportunity route, including its trailing slash. */
  readonly rfxchangeOpportunityBaseUrl: string;
}

function stableIdentifier(value: string, label: string): string {
  const normalized = value.trim();
  if (!IDENTIFIER.test(normalized)) throw new RFxBridgeError("invalid-input", `${label} is invalid.`);
  return normalized;
}

function objectValue(value: unknown): Readonly<Record<string, unknown>> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nullableString(value: unknown): string | null {
  return stringValue(value);
}

function flowValue(value: unknown): RFxBridgeFlow | null {
  return value === "source-first" || value === "authorize-first" ? value : null;
}

function supplierSafeNeedJson(value: SupplierSafeNeedProjection): CommandJsonObject {
  return {
    bridgeVersion: value.bridgeVersion,
    need: {
      title: value.need.title,
      specification: value.need.specification,
      quantity: value.need.quantity,
      quantityUnit: value.need.quantityUnit,
    },
    timing: {
      neededBy: value.timing.neededBy,
      responseDeadline: value.timing.responseDeadline,
    },
    fulfillment: {
      method: value.fulfillment.method,
      geography: value.fulfillment.geography,
    },
    supplierRequirements: [...value.supplierRequirements],
    releasedFiles: value.releasedFiles.map((file) => ({
      evidenceId: file.evidenceId,
      originalFilename: file.originalFilename,
      contentType: file.contentType,
      size: file.size,
    })),
  };
}

function commandError(error: unknown): RFxBridgeError {
  const code = objectValue(error)?.code;
  if (code === "command-forbidden") return new RFxBridgeError("forbidden", "Community sourcing is not permitted for this purchase.");
  if (code === "command-not-found") return new RFxBridgeError("not-found", "The linked purchase or opportunity is unavailable.");
  if (code === "command-version-conflict") return new RFxBridgeError("version-conflict", "The purchase changed before community sourcing was updated.");
  if (code === "command-validation-failure") return new RFxBridgeError("invalid-input", "The community sourcing request is invalid.");
  return new RFxBridgeError("unavailable-service", "Community sourcing is temporarily unavailable.");
}

function resultLinkData(value: CommandJsonValue): Readonly<Record<string, unknown>> {
  const data = objectValue(value);
  if (!data) throw new RFxBridgeError("contract-mismatch", "RFxchange returned an invalid opportunity result.");
  if (data.bridgeVersion !== CP08_RFX_BRIDGE_VERSION) {
    throw new RFxBridgeError("contract-mismatch", "RFxchange bridge version does not match AccelPO.");
  }
  return data;
}

function projectionFailure(result: Awaited<ReturnType<RFxBridgeQueryPort["read"]>>): never {
  if (result.outcome === "failure") {
    if (result.code === "forbidden" || result.code === "unauthenticated") {
      throw new RFxBridgeError("forbidden", "You do not have access to this sourcing information.");
    }
    if (result.code === "not-found") throw new RFxBridgeError("not-found", "Sourcing information is unavailable.");
  }
  throw new RFxBridgeError("unavailable-service", "Sourcing information is temporarily unavailable.");
}

export class RFxBridgeService {
  private readonly commandPort: RFxBridgeCommandPort;
  private readonly queryPort: RFxBridgeQueryPort;
  private readonly opportunityBaseUrl: URL;

  constructor(options: RFxBridgeServiceOptions) {
    this.commandPort = options.commandPort;
    this.queryPort = options.queryPort;
    try {
      const normalized = options.rfxchangeOpportunityBaseUrl.endsWith("/")
        ? options.rfxchangeOpportunityBaseUrl
        : `${options.rfxchangeOpportunityBaseUrl}/`;
      this.opportunityBaseUrl = new URL(normalized);
    } catch {
      throw new RFxBridgeError("invalid-input", "RFxchange opportunity link configuration is invalid.");
    }
  }

  linkToRFxchange(canonicalOpportunityId: string): string {
    return new URL(encodeURIComponent(stableIdentifier(canonicalOpportunityId, "Opportunity identity")), this.opportunityBaseUrl).toString();
  }

  private parseOpportunityLink(
    data: CommandJsonValue,
    expected: Readonly<{ purchaseCaseId: string; flow: RFxBridgeFlow }>,
  ): RFxBridgeOpportunityLink {
    const record = resultLinkData(data);
    const canonicalOpportunityId = stringValue(record.canonicalOpportunityId);
    const purchaseCaseId = stringValue(record.purchaseCaseId);
    const flow = flowValue(record.flow);
    const state = record.state;
    if (
      !canonicalOpportunityId ||
      purchaseCaseId !== expected.purchaseCaseId ||
      flow !== expected.flow ||
      (state !== "open" && state !== "closed" && state !== "withdrawn")
    ) {
      throw new RFxBridgeError("contract-mismatch", "RFxchange returned an invalid opportunity result.");
    }
    return Object.freeze({
      bridgeVersion: CP08_RFX_BRIDGE_VERSION,
      purchaseCaseId,
      canonicalOpportunityId,
      flow,
      state,
      rfxchangeHref: this.linkToRFxchange(canonicalOpportunityId),
    });
  }

  async publishSupplierSafeNeed(input: RFxBridgePublishInput): Promise<RFxBridgeOpportunityLink> {
    const organizationId = stableIdentifier(input.organizationId, "Organization identity");
    const purchaseCaseId = stableIdentifier(input.purchaseCaseId, "Purchase Case identity");
    const idempotencyKey = input.idempotencyKey
      ? stableIdentifier(input.idempotencyKey, "Idempotency key")
      : `rfxbridge:create:${purchaseCaseId}`;
    const payload: CommandJsonObject = {
      bridgeVersion: CP08_RFX_BRIDGE_VERSION,
      purchaseCaseId,
      flow: input.flow,
      supplierSafeNeed: supplierSafeNeedJson(input.supplierSafeNeed),
    };
    try {
      const result = await this.commandPort.execute({
        commandName: CP08_RFX_BRIDGE_COMMANDS.CREATE_OPPORTUNITY,
        organizationContext: { organizationId },
        payload,
        ...(input.expectedVersion === undefined ? {} : { expectedVersion: input.expectedVersion }),
        idempotencyKey,
        requestId: stableIdentifier(input.requestId, "Request identity"),
      });
      return this.parseOpportunityLink(result.data, { purchaseCaseId, flow: input.flow });
    } catch (error) {
      if (error instanceof RFxBridgeError) throw error;
      throw commandError(error);
    }
  }

  async updateSupplierSafeNeed(input: RFxBridgeUpdateInput): Promise<RFxBridgeOpportunityLink> {
    const organizationId = stableIdentifier(input.organizationId, "Organization identity");
    const purchaseCaseId = stableIdentifier(input.purchaseCaseId, "Purchase Case identity");
    const canonicalOpportunityId = stableIdentifier(input.canonicalOpportunityId, "Opportunity identity");
    const sourceRevision = stableIdentifier(input.sourceRevision, "Source revision");
    const payload: CommandJsonObject = {
      bridgeVersion: CP08_RFX_BRIDGE_VERSION,
      purchaseCaseId,
      canonicalOpportunityId,
      flow: input.flow,
      supplierSafeNeed: supplierSafeNeedJson(input.supplierSafeNeed),
    };
    try {
      const result = await this.commandPort.execute({
        commandName: CP08_RFX_BRIDGE_COMMANDS.UPDATE_OPPORTUNITY,
        organizationContext: { organizationId },
        payload,
        ...(input.expectedVersion === undefined ? {} : { expectedVersion: input.expectedVersion }),
        idempotencyKey: `rfxbridge:update:${canonicalOpportunityId}:${sourceRevision}`,
        requestId: stableIdentifier(input.requestId, "Request identity"),
      });
      return this.parseOpportunityLink(result.data, { purchaseCaseId, flow: input.flow });
    } catch (error) {
      if (error instanceof RFxBridgeError) throw error;
      throw commandError(error);
    }
  }

  private async changeOpportunityState(
    commandName: typeof CP08_RFX_BRIDGE_COMMANDS.CLOSE_OPPORTUNITY | typeof CP08_RFX_BRIDGE_COMMANDS.WITHDRAW_OPPORTUNITY,
    input: RFxBridgeStateChangeInput,
  ): Promise<RFxBridgeOpportunityLink> {
    const organizationId = stableIdentifier(input.organizationId, "Organization identity");
    const purchaseCaseId = stableIdentifier(input.purchaseCaseId, "Purchase Case identity");
    const canonicalOpportunityId = stableIdentifier(input.canonicalOpportunityId, "Opportunity identity");
    const mutationId = stableIdentifier(input.mutationId, "Mutation identity");
    const payload: CommandJsonObject = {
      bridgeVersion: CP08_RFX_BRIDGE_VERSION,
      purchaseCaseId,
      canonicalOpportunityId,
    };
    try {
      const result = await this.commandPort.execute({
        commandName,
        organizationContext: { organizationId },
        payload,
        ...(input.expectedVersion === undefined ? {} : { expectedVersion: input.expectedVersion }),
        idempotencyKey: `rfxbridge:${commandName.endsWith("close-opportunity") ? "close" : "withdraw"}:${canonicalOpportunityId}:${mutationId}`,
        requestId: stableIdentifier(input.requestId, "Request identity"),
      });
      const record = resultLinkData(result.data);
      const flow = flowValue(record.flow);
      if (!flow) {
        throw new RFxBridgeError("contract-mismatch", "RFxchange returned an invalid opportunity flow.");
      }
      return this.parseOpportunityLink(result.data, { purchaseCaseId, flow });
    } catch (error) {
      if (error instanceof RFxBridgeError) throw error;
      throw commandError(error);
    }
  }

  closeOpportunity(input: RFxBridgeStateChangeInput): Promise<RFxBridgeOpportunityLink> {
    return this.changeOpportunityState(CP08_RFX_BRIDGE_COMMANDS.CLOSE_OPPORTUNITY, input);
  }

  withdrawOpportunity(input: RFxBridgeStateChangeInput): Promise<RFxBridgeOpportunityLink> {
    return this.changeOpportunityState(CP08_RFX_BRIDGE_COMMANDS.WITHDRAW_OPPORTUNITY, input);
  }

  async readOfferComparisons(
    organizationId: string,
    purchaseCaseId: string,
  ): Promise<readonly RFxBridgeOfferComparison[]> {
    const orgId = stableIdentifier(organizationId, "Organization identity");
    const caseId = stableIdentifier(purchaseCaseId, "Purchase Case identity");
    const result = await this.queryPort.read({
      requestedOrganizationId: orgId,
      query: {
        projection: "offer-summary",
        scope: "list",
        filters: [{ field: "purchaseCaseId", operator: "==", value: caseId }],
        limit: 100,
      },
    });
    if (result.outcome === "failure") projectionFailure(result);
    if (result.outcome === "empty") return Object.freeze([]);

    return Object.freeze(result.items.map((item) => {
      const record = objectValue(item);
      const id = record ? stringValue(record.id) : null;
      const projectedCaseId = record ? stringValue(record.purchaseCaseId) : null;
      const canonicalOfferId = record ? stringValue(record.canonicalOfferId) : null;
      if (!id || projectedCaseId !== caseId || !canonicalOfferId) {
        throw new RFxBridgeError("contract-mismatch", "RFxchange returned an invalid offer summary.");
      }
      const priceRecord = objectValue(record?.priceComponents);
      return Object.freeze({
        id,
        purchaseCaseId: projectedCaseId,
        canonicalOfferId,
        supplierName: nullableString(record?.providerName ?? record?.supplierName),
        quantity: numberValue(record?.quantity),
        fitSummary: nullableString(record?.fitSummary ?? record?.fit),
        price: Object.freeze({
          subtotalAmount: numberValue(priceRecord?.subtotalAmount ?? record?.subtotalAmount),
          shippingAmount: numberValue(priceRecord?.shippingAmount ?? record?.shippingAmount),
          taxAmount: numberValue(priceRecord?.taxAmount ?? record?.taxAmount),
          feeAmount: numberValue(priceRecord?.feeAmount ?? record?.feeAmount),
          otherAmount: numberValue(priceRecord?.otherAmount ?? record?.otherAmount),
          allInAmount: numberValue(priceRecord?.allInAmount ?? record?.allInAmount),
          currency: nullableString(priceRecord?.currency ?? record?.currency),
        }),
        fulfillmentTiming: nullableString(record?.fulfillmentTiming),
        validUntil: nullableString(record?.validUntil),
        terms: nullableString(record?.terms),
        deviations: nullableString(record?.deviations),
        quoteEvidenceId: nullableString(record?.quoteEvidenceId),
        quoteEvidenceStatus: nullableString(record?.quoteEvidenceStatus),
        status: nullableString(record?.status),
      });
    }));
  }

  async readFulfillmentUpdates(
    organizationId: string,
    purchaseCaseId: string,
  ): Promise<readonly RFxBridgeFulfillmentUpdate[]> {
    const orgId = stableIdentifier(organizationId, "Organization identity");
    const caseId = stableIdentifier(purchaseCaseId, "Purchase Case identity");
    const result = await this.queryPort.read({
      requestedOrganizationId: orgId,
      query: {
        projection: "fulfillment-summary",
        scope: "list",
        filters: [{ field: "purchaseCaseId", operator: "==", value: caseId }],
        limit: 100,
      },
    });
    if (result.outcome === "failure") projectionFailure(result);
    if (result.outcome === "empty") return Object.freeze([]);

    return Object.freeze(result.items.map((item) => {
      const record = objectValue(item);
      const id = record ? stringValue(record.id) : null;
      const projectedCaseId = record ? stringValue(record.purchaseCaseId) : null;
      const state = record ? stringValue(record.state) : null;
      if (!id || projectedCaseId !== caseId || !state) {
        throw new RFxBridgeError("contract-mismatch", "RFxchange returned an invalid fulfillment update.");
      }
      return Object.freeze({
        id,
        purchaseCaseId: projectedCaseId,
        canonicalOpportunityId: nullableString(record?.canonicalOpportunityId),
        canonicalOfferId: nullableString(record?.canonicalOfferId),
        supplierName: nullableString(record?.providerName ?? record?.supplierName),
        state,
        orderReference: nullableString(record?.orderReference),
        confirmationAt: nullableString(record?.confirmationAt),
        neededBy: nullableString(record?.neededBy),
        deliveredAt: nullableString(record?.deliveredAt),
        receivedAt: nullableString(record?.receivedAt),
        exceptionCode: nullableString(record?.exceptionCode),
        exceptionSummary: nullableString(record?.exceptionSummary),
      });
    }));
  }
}
