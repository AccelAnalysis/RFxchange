import {
  AccelPoCommandError,
  type AnyCommandDefinition,
  type CommandHandlerContext,
  type JsonObject,
} from "../../../../src/application/accelpo/command-port.ts";
import {
  CP08_RFX_BRIDGE_COMMANDS,
  CP08_RFX_BRIDGE_VERSION,
  RFxBridgeError,
  type CanonicalRFxBridgePort,
  type RFxBridgeFlow,
  type SupplierSafeNeedProjection,
} from "./contracts.ts";
import { createSupplierSafeNeedProjection } from "./supplier-safe.ts";

const PURCHASE_CASE_COLLECTION = "accelpoPurchaseCases" as const;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,190}$/;

function record(value: unknown): Readonly<Record<string, unknown>> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : null;
}

function identifier(payload: JsonObject, field: string): string {
  const value = payload[field];
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new AccelPoCommandError("validation-failure", `${field} is invalid.`);
  }
  return value;
}

function flow(payload: JsonObject): RFxBridgeFlow {
  const value = payload.flow;
  if (value !== "source-first" && value !== "authorize-first") {
    throw new AccelPoCommandError("validation-failure", "Sourcing flow is invalid.");
  }
  return value;
}

function supplierSafeNeed(payload: JsonObject): SupplierSafeNeedProjection {
  const bridgeVersion = payload.bridgeVersion;
  const value = record(payload.supplierSafeNeed);
  const need = record(value?.need);
  const timing = record(value?.timing);
  const fulfillment = record(value?.fulfillment);
  if (bridgeVersion !== CP08_RFX_BRIDGE_VERSION || !value || !need || !timing || !fulfillment) {
    throw new AccelPoCommandError("validation-failure", "Supplier-safe sourcing information is invalid.");
  }
  try {
    return createSupplierSafeNeedProjection({
      title: need.title,
      specification: need.specification,
      quantity: need.quantity,
      quantityUnit: need.quantityUnit,
      neededBy: timing.neededBy,
      responseDeadline: timing.responseDeadline,
      fulfillmentMethod: fulfillment.method,
      fulfillmentGeography: fulfillment.geography,
      supplierRequirements: value.supplierRequirements,
      files: Array.isArray(value.releasedFiles)
        ? value.releasedFiles.map((item) => {
            const file = record(item);
            return file
              ? {
                  id: file.evidenceId,
                  originalFilename: file.originalFilename,
                  contentType: file.contentType,
                  size: file.size,
                  releaseStatus: "released",
                }
              : item;
          })
        : value.releasedFiles,
    });
  } catch (error) {
    if (error instanceof RFxBridgeError) {
      throw new AccelPoCommandError("validation-failure", error.message);
    }
    throw error;
  }
}

function target(payload: JsonObject) {
  return Object.freeze({
    collection: PURCHASE_CASE_COLLECTION,
    recordId: identifier(payload, "purchaseCaseId"),
    organizationField: "organizationId",
    versionField: "version",
  });
}

function canonicalError(error: unknown): never {
  if (error instanceof AccelPoCommandError) throw error;
  if (error instanceof RFxBridgeError) {
    switch (error.code) {
      case "invalid-input":
        throw new AccelPoCommandError("validation-failure", error.message);
      case "forbidden":
        throw new AccelPoCommandError("forbidden", error.message);
      case "not-found":
        throw new AccelPoCommandError("not-found", error.message);
      case "version-conflict":
        throw new AccelPoCommandError("version-conflict", error.message);
      default:
        throw new AccelPoCommandError("unavailable-service", "RFxchange is temporarily unavailable.");
    }
  }
  throw new AccelPoCommandError("unavailable-service", "RFxchange is temporarily unavailable.");
}

function nextVersion(context: CommandHandlerContext): number {
  if (context.currentVersion === null) {
    throw new AccelPoCommandError("version-conflict", "Purchase Case version is unavailable.");
  }
  return context.currentVersion + 1;
}

function ensureLinkedOpportunity(context: CommandHandlerContext, canonicalOpportunityId: string): void {
  const linked = context.target?.data?.canonicalOpportunityId;
  if (linked !== canonicalOpportunityId) {
    throw new AccelPoCommandError("not-found", "The linked RFxchange opportunity is unavailable.");
  }
}

function linkedFlow(context: CommandHandlerContext): RFxBridgeFlow {
  const value = context.target?.data?.sourcingFlow;
  if (value !== "source-first" && value !== "authorize-first") {
    throw new AccelPoCommandError("unavailable-service", "The linked sourcing flow is unavailable.");
  }
  return value;
}

function ensureFlow(context: CommandHandlerContext, requested: RFxBridgeFlow): void {
  const existing = context.target?.data?.sourcingFlow;
  if (existing !== undefined && existing !== null && existing !== requested) {
    throw new AccelPoCommandError("validation-failure", "The sourcing flow cannot be changed after publication.");
  }
}

function result(
  purchaseCaseId: string,
  canonicalOpportunityId: string,
  sourcingFlow: RFxBridgeFlow,
  state: "open" | "closed" | "withdrawn",
) {
  return Object.freeze({
    bridgeVersion: CP08_RFX_BRIDGE_VERSION,
    purchaseCaseId,
    canonicalOpportunityId,
    flow: sourcingFlow,
    state,
  });
}

function updateCaseLink(
  context: CommandHandlerContext,
  input: Readonly<{
    purchaseCaseId: string;
    canonicalOpportunityId: string;
    flow: RFxBridgeFlow;
    state: "open" | "closed" | "withdrawn";
    version: number;
  }>,
): void {
  context.transaction.update(`${PURCHASE_CASE_COLLECTION}/${input.purchaseCaseId}`, {
    canonicalOpportunityId: input.canonicalOpportunityId,
    sourcingFlow: input.flow,
    sourcingStatus: input.state,
    updatedAt: context.now,
    version: input.version,
  });
}

/**
 * Creates CP-03 definitions without registering a second write route. The injected canonical port
 * must be idempotent because Firestore transactions may retry a handler after the canonical RFx
 * operation has already committed.
 */
export function createCP08RFxBridgeCommandDefinitions(
  canonical: CanonicalRFxBridgePort,
): readonly AnyCommandDefinition[] {
  const createOpportunity: AnyCommandDefinition = Object.freeze({
    name: CP08_RFX_BRIDGE_COMMANDS.CREATE_OPPORTUNITY,
    permission: "rfx.publish",
    idempotency: "required",
    requiresExpectedVersion: true,
    target,
    handle: async (context: CommandHandlerContext) => {
      const purchaseCaseId = identifier(context.command.payload, "purchaseCaseId");
      const sourcingFlow = flow(context.command.payload);
      if (context.target?.data?.canonicalOpportunityId) {
        throw new AccelPoCommandError("validation-failure", "This Purchase Case is already linked to RFxchange.");
      }
      try {
        const canonicalResult = await canonical.createOpportunity({
          organizationId: context.actor.organizationId,
          actorUserId: context.actor.userId,
          actorMembershipId: context.actor.membershipId,
          purchaseCaseId,
          flow: sourcingFlow,
          supplierSafeNeed: supplierSafeNeed(context.command.payload),
          idempotencyKey: context.command.idempotencyKey ?? context.commandId,
        });
        const version = nextVersion(context);
        updateCaseLink(context, {
          purchaseCaseId,
          canonicalOpportunityId: canonicalResult.canonicalOpportunityId,
          flow: sourcingFlow,
          state: canonicalResult.state,
          version,
        });
        return Object.freeze({
          data: result(
            purchaseCaseId,
            canonicalResult.canonicalOpportunityId,
            sourcingFlow,
            canonicalResult.state,
          ),
          resultingVersion: version,
        });
      } catch (error) {
        return canonicalError(error);
      }
    },
  });

  const updateOpportunity: AnyCommandDefinition = Object.freeze({
    name: CP08_RFX_BRIDGE_COMMANDS.UPDATE_OPPORTUNITY,
    permission: "rfx.publish",
    idempotency: "required",
    requiresExpectedVersion: true,
    target,
    handle: async (context: CommandHandlerContext) => {
      const purchaseCaseId = identifier(context.command.payload, "purchaseCaseId");
      const canonicalOpportunityId = identifier(context.command.payload, "canonicalOpportunityId");
      const sourcingFlow = flow(context.command.payload);
      ensureLinkedOpportunity(context, canonicalOpportunityId);
      ensureFlow(context, sourcingFlow);
      try {
        const canonicalResult = await canonical.updateOpportunity({
          organizationId: context.actor.organizationId,
          actorUserId: context.actor.userId,
          actorMembershipId: context.actor.membershipId,
          canonicalOpportunityId,
          supplierSafeNeed: supplierSafeNeed(context.command.payload),
          idempotencyKey: context.command.idempotencyKey ?? context.commandId,
        });
        const version = nextVersion(context);
        updateCaseLink(context, {
          purchaseCaseId,
          canonicalOpportunityId: canonicalResult.canonicalOpportunityId,
          flow: sourcingFlow,
          state: canonicalResult.state,
          version,
        });
        return Object.freeze({
          data: result(
            purchaseCaseId,
            canonicalResult.canonicalOpportunityId,
            sourcingFlow,
            canonicalResult.state,
          ),
          resultingVersion: version,
        });
      } catch (error) {
        return canonicalError(error);
      }
    },
  });

  function terminalDefinition(
    name: typeof CP08_RFX_BRIDGE_COMMANDS.CLOSE_OPPORTUNITY | typeof CP08_RFX_BRIDGE_COMMANDS.WITHDRAW_OPPORTUNITY,
  ): AnyCommandDefinition {
    return Object.freeze({
      name,
      permission: "rfx.publish",
      idempotency: "required",
      requiresExpectedVersion: true,
      target,
      handle: async (context: CommandHandlerContext) => {
        const purchaseCaseId = identifier(context.command.payload, "purchaseCaseId");
        const canonicalOpportunityId = identifier(context.command.payload, "canonicalOpportunityId");
        ensureLinkedOpportunity(context, canonicalOpportunityId);
        const sourcingFlow = linkedFlow(context);
        try {
          const canonicalResult = name === CP08_RFX_BRIDGE_COMMANDS.CLOSE_OPPORTUNITY
            ? await canonical.closeOpportunity({
                organizationId: context.actor.organizationId,
                actorUserId: context.actor.userId,
                actorMembershipId: context.actor.membershipId,
                canonicalOpportunityId,
                idempotencyKey: context.command.idempotencyKey ?? context.commandId,
              })
            : await canonical.withdrawOpportunity({
                organizationId: context.actor.organizationId,
                actorUserId: context.actor.userId,
                actorMembershipId: context.actor.membershipId,
                canonicalOpportunityId,
                idempotencyKey: context.command.idempotencyKey ?? context.commandId,
              });
          const version = nextVersion(context);
          updateCaseLink(context, {
            purchaseCaseId,
            canonicalOpportunityId: canonicalResult.canonicalOpportunityId,
            flow: sourcingFlow,
            state: canonicalResult.state,
            version,
          });
          return Object.freeze({
            data: result(
              purchaseCaseId,
              canonicalResult.canonicalOpportunityId,
              sourcingFlow,
              canonicalResult.state,
            ),
            resultingVersion: version,
          });
        } catch (error) {
          return canonicalError(error);
        }
      },
    });
  }

  return Object.freeze([
    createOpportunity,
    updateOpportunity,
    terminalDefinition(CP08_RFX_BRIDGE_COMMANDS.CLOSE_OPPORTUNITY),
    terminalDefinition(CP08_RFX_BRIDGE_COMMANDS.WITHDRAW_OPPORTUNITY),
  ]);
}
