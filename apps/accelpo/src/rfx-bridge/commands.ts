import {
  AccelPoCommandError,
  type AccelPoCommandRegistry,
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
  type RFxBridgeOpportunityState,
  type SupplierSafeNeedProjection,
} from "./contracts.ts";
import { createSupplierSafeNeedProjection } from "./supplier-safe.ts";

const PURCHASE_CASE_COLLECTION = "accelpoPurchaseCases" as const;
const EVIDENCE_COLLECTION = "accelpoEvidence" as const;
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

function canonicalOpportunityId(value: unknown, expected?: string): string {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new AccelPoCommandError(
      "unavailable-service",
      "RFxchange returned an invalid opportunity identity.",
    );
  }
  if (expected !== undefined && value !== expected) {
    throw new AccelPoCommandError(
      "unavailable-service",
      "RFxchange returned a different opportunity than the linked Purchase Case.",
    );
  }
  return value;
}

function canonicalState(
  value: unknown,
  expected?: "closed" | "withdrawn",
): RFxBridgeOpportunityState {
  if (value !== "open" && value !== "closed" && value !== "withdrawn") {
    throw new AccelPoCommandError(
      "unavailable-service",
      "RFxchange returned an invalid opportunity state.",
    );
  }
  if (expected !== undefined && value !== expected) {
    throw new AccelPoCommandError(
      "unavailable-service",
      "RFxchange returned an unexpected opportunity state.",
    );
  }
  return value;
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
    throw new AccelPoCommandError("unavailable-service", "The Purchase Case sourcing flow is unavailable.");
  }
  return value;
}

function authorizedSourcingFlow(
  context: CommandHandlerContext,
  requested: RFxBridgeFlow,
): RFxBridgeFlow {
  const resolved = linkedFlow(context);
  if (resolved !== requested) {
    throw new AccelPoCommandError("forbidden", "That sourcing flow is not authorized for this Purchase Case.");
  }
  if (context.target?.data?.sourcingPublicationAuthorized !== true) {
    throw new AccelPoCommandError("forbidden", "Community sourcing is not authorized for this Purchase Case.");
  }
  return resolved;
}

async function verifiedSupplierSafeNeed(
  context: CommandHandlerContext,
  purchaseCaseId: string,
): Promise<SupplierSafeNeedProjection> {
  const safe = supplierSafeNeed(context.command.payload);
  for (const file of safe.releasedFiles) {
    const snapshot = await context.transaction.get(`${EVIDENCE_COLLECTION}/${file.evidenceId}`);
    const data = snapshot.data;
    if (
      !snapshot.exists ||
      !data ||
      data.organizationId !== context.actor.organizationId ||
      data.purchaseCaseId !== purchaseCaseId ||
      data.status !== "uploaded" ||
      data.releaseStatus !== "released" ||
      data.originalFilename !== file.originalFilename ||
      data.contentType !== file.contentType ||
      data.size !== file.size
    ) {
      throw new AccelPoCommandError(
        "validation-failure",
        "A released sourcing file is unavailable or no longer approved for supplier access.",
      );
    }
  }
  return safe;
}

function result(
  purchaseCaseId: string,
  opportunityId: string,
  sourcingFlow: RFxBridgeFlow,
  state: RFxBridgeOpportunityState,
) {
  return Object.freeze({
    bridgeVersion: CP08_RFX_BRIDGE_VERSION,
    purchaseCaseId,
    canonicalOpportunityId: opportunityId,
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
    state: RFxBridgeOpportunityState;
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
      const sourcingFlow = authorizedSourcingFlow(context, flow(context.command.payload));
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
          supplierSafeNeed: await verifiedSupplierSafeNeed(context, purchaseCaseId),
          idempotencyKey: context.command.idempotencyKey ?? context.commandId,
        });
        const returnedOpportunityId = canonicalOpportunityId(canonicalResult.canonicalOpportunityId);
        const state = canonicalState(canonicalResult.state);
        const version = nextVersion(context);
        updateCaseLink(context, {
          purchaseCaseId,
          canonicalOpportunityId: returnedOpportunityId,
          flow: sourcingFlow,
          state,
          version,
        });
        return Object.freeze({
          data: result(purchaseCaseId, returnedOpportunityId, sourcingFlow, state),
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
      const linkedOpportunityId = identifier(context.command.payload, "canonicalOpportunityId");
      const sourcingFlow = authorizedSourcingFlow(context, flow(context.command.payload));
      ensureLinkedOpportunity(context, linkedOpportunityId);
      try {
        const canonicalResult = await canonical.updateOpportunity({
          organizationId: context.actor.organizationId,
          actorUserId: context.actor.userId,
          actorMembershipId: context.actor.membershipId,
          canonicalOpportunityId: linkedOpportunityId,
          supplierSafeNeed: await verifiedSupplierSafeNeed(context, purchaseCaseId),
          idempotencyKey: context.command.idempotencyKey ?? context.commandId,
        });
        const returnedOpportunityId = canonicalOpportunityId(
          canonicalResult.canonicalOpportunityId,
          linkedOpportunityId,
        );
        const state = canonicalState(canonicalResult.state);
        const version = nextVersion(context);
        updateCaseLink(context, {
          purchaseCaseId,
          canonicalOpportunityId: returnedOpportunityId,
          flow: sourcingFlow,
          state,
          version,
        });
        return Object.freeze({
          data: result(purchaseCaseId, returnedOpportunityId, sourcingFlow, state),
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
        const linkedOpportunityId = identifier(context.command.payload, "canonicalOpportunityId");
        ensureLinkedOpportunity(context, linkedOpportunityId);
        const sourcingFlow = linkedFlow(context);
        try {
          const expectedState = name === CP08_RFX_BRIDGE_COMMANDS.CLOSE_OPPORTUNITY
            ? "closed" as const
            : "withdrawn" as const;
          const canonicalResult = name === CP08_RFX_BRIDGE_COMMANDS.CLOSE_OPPORTUNITY
            ? await canonical.closeOpportunity({
                organizationId: context.actor.organizationId,
                actorUserId: context.actor.userId,
                actorMembershipId: context.actor.membershipId,
                canonicalOpportunityId: linkedOpportunityId,
                idempotencyKey: context.command.idempotencyKey ?? context.commandId,
              })
            : await canonical.withdrawOpportunity({
                organizationId: context.actor.organizationId,
                actorUserId: context.actor.userId,
                actorMembershipId: context.actor.membershipId,
                canonicalOpportunityId: linkedOpportunityId,
                idempotencyKey: context.command.idempotencyKey ?? context.commandId,
              });
          const returnedOpportunityId = canonicalOpportunityId(
            canonicalResult.canonicalOpportunityId,
            linkedOpportunityId,
          );
          const state = canonicalState(canonicalResult.state, expectedState);
          const version = nextVersion(context);
          updateCaseLink(context, {
            purchaseCaseId,
            canonicalOpportunityId: returnedOpportunityId,
            flow: sourcingFlow,
            state,
            version,
          });
          return Object.freeze({
            data: result(purchaseCaseId, returnedOpportunityId, sourcingFlow, state),
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

export function registerCP08RFxBridgeCommands(
  registry: AccelPoCommandRegistry,
  canonical: CanonicalRFxBridgePort,
): void {
  for (const definition of createCP08RFxBridgeCommandDefinitions(canonical)) {
    registry.register(definition);
  }
}
