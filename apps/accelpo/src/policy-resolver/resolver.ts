import type { PolicyResolverPort } from "../chassis/ports.ts";
import {
  ACCELPO_EVIDENCE_REQUIREMENTS,
  ACCELPO_PURCHASING_MODES,
  CP05_POLICY_CONTRACT_VERSION,
  PolicyResolverError,
  type ApplicablePolicyVersion,
  type ApprovalRoute,
  type AuthorizationPolicySnapshot,
  type PolicyDecisionTemplate,
  type PolicyResolution,
  type PolicyResolutionContext,
  type PolicyRuleCondition,
  type PolicyRuleEffect,
  type PolicyVersionSource,
  type PurchasingPolicyRule,
  type PurchasingPolicyVersion,
  type ResolvedPurchasingPolicy,
  type ResolvedSourcingPolicy,
} from "./contracts.ts";

const APPROVAL_STRATEGIES = new Set(["none", "sequential", "parallel"]);
const EXCEPTION_BEHAVIORS = new Set(["deny", "allow", "route"]);
const BUDGET_MODES = new Set(["none", "organization-entered"]);
const BUDGET_ENFORCEMENT = new Set(["informational", "approval-required", "hard-stop"]);
const SOURCING_STEPS = new Set(["authorize", "source", "award", "fulfill", "evidence"]);

function nonBlank(value: string): boolean {
  return value.trim().length > 0;
}

function validIsoDate(value: string): boolean {
  return nonBlank(value) && Number.isFinite(Date.parse(value));
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function validContext(context: PolicyResolutionContext): boolean {
  return nonBlank(context.organizationId)
    && nonBlank(context.requester.userId)
    && Number.isFinite(context.money.amount)
    && context.money.amount >= 0
    && nonBlank(context.money.currency)
    && ACCELPO_PURCHASING_MODES.includes(context.purchasingMode)
    && (context.neededBy === null || validIsoDate(context.neededBy));
}

function validApprovalRoute(route: ApprovalRoute): boolean {
  if (!APPROVAL_STRATEGIES.has(route.strategy)) return false;
  if (route.strategy === "none") return route.stages.length === 0;
  if (route.stages.length === 0) return false;
  return route.stages.every((stage) =>
    nonBlank(stage.stageId)
    && nonBlank(stage.label)
    && ["capability", "user", "role"].includes(stage.approverKind)
    && nonBlank(stage.approverId)
    && Number.isInteger(stage.minimumApprovals)
    && stage.minimumApprovals > 0
  );
}

function validSourcing(decision: PolicyDecisionTemplate): boolean {
  const sourcing = decision.sourcing;
  if (sourcing.allowedPurchasingModes.some((mode) => !ACCELPO_PURCHASING_MODES.includes(mode))) return false;
  if (new Set(sourcing.allowedPurchasingModes).size !== sourcing.allowedPurchasingModes.length) return false;
  if (sourcing.publishRequiredCapabilities.some((capability) => !nonBlank(capability))) return false;
  for (const [mode, order] of Object.entries(sourcing.orderByMode)) {
    if (!ACCELPO_PURCHASING_MODES.includes(mode as (typeof ACCELPO_PURCHASING_MODES)[number])) return false;
    if (!Array.isArray(order) || order.length === 0 || order.some((step) => !SOURCING_STEPS.has(step))) return false;
  }
  return sourcing.allowedPurchasingModes.every((mode) => (sourcing.orderByMode[mode]?.length ?? 0) > 0);
}

function validDecision(decision: PolicyDecisionTemplate): boolean {
  if (!validApprovalRoute(decision.approval)) return false;
  if (!EXCEPTION_BEHAVIORS.has(decision.exceptions.behavior)) return false;
  if (decision.exceptions.behavior === "route") {
    if (decision.exceptions.route === null || !validApprovalRoute(decision.exceptions.route)) return false;
  } else if (decision.exceptions.route !== null) return false;
  if (decision.delegation.requiredDelegateCapabilities.some((value) => !nonBlank(value))) return false;
  if (!BUDGET_MODES.has(decision.budget.mode) || !BUDGET_ENFORCEMENT.has(decision.budget.enforcement)) return false;
  if (decision.budget.mode === "none" && decision.budget.budgetKey !== null) return false;
  if (decision.budget.mode === "organization-entered" && (decision.budget.budgetKey === null || !nonBlank(decision.budget.budgetKey))) return false;
  if (!ACCELPO_EVIDENCE_REQUIREMENTS.includes(decision.evidence.requirement)) return false;
  return validSourcing(decision);
}

function validStringList(values: readonly string[] | undefined): boolean {
  return values === undefined || values.every(nonBlank);
}

function validCondition(condition: PolicyRuleCondition): boolean {
  if (!validStringList(condition.departmentIds)
    || !validStringList(condition.costAreaIds)
    || !validStringList(condition.categoryIds)
    || !validStringList(condition.providerIds)
    || !validStringList(condition.requesterIds)
    || !validStringList(condition.requesterPermissionsAny)
    || !validStringList(condition.exceptionCodesAny)) return false;
  if (condition.currency !== undefined && !nonBlank(condition.currency)) return false;
  if (condition.minAmountInclusive !== undefined && (!Number.isFinite(condition.minAmountInclusive) || condition.minAmountInclusive < 0)) return false;
  if (condition.maxAmountExclusive !== undefined && (!Number.isFinite(condition.maxAmountExclusive) || condition.maxAmountExclusive <= 0)) return false;
  if (condition.minAmountInclusive !== undefined && condition.maxAmountExclusive !== undefined && condition.minAmountInclusive >= condition.maxAmountExclusive) return false;
  if (condition.neededByOnOrAfter !== undefined && !validIsoDate(condition.neededByOnOrAfter)) return false;
  if (condition.neededByOnOrBefore !== undefined && !validIsoDate(condition.neededByOnOrBefore)) return false;
  return true;
}

function validRuleEffect(effect: PolicyRuleEffect): boolean {
  if (Object.values(effect).length === 0) return false;
  if (effect.approval !== undefined && !validApprovalRoute(effect.approval)) return false;
  if (effect.exceptions !== undefined) {
    if (!EXCEPTION_BEHAVIORS.has(effect.exceptions.behavior)) return false;
    if (effect.exceptions.behavior === "route" && (effect.exceptions.route === null || !validApprovalRoute(effect.exceptions.route))) return false;
    if (effect.exceptions.behavior !== "route" && effect.exceptions.route !== null) return false;
  }
  if (effect.budget !== undefined) {
    if (!BUDGET_MODES.has(effect.budget.mode) || !BUDGET_ENFORCEMENT.has(effect.budget.enforcement)) return false;
    if (effect.budget.mode === "none" && effect.budget.budgetKey !== null) return false;
    if (effect.budget.mode === "organization-entered" && (effect.budget.budgetKey === null || !nonBlank(effect.budget.budgetKey))) return false;
  }
  if (effect.evidence !== undefined && !ACCELPO_EVIDENCE_REQUIREMENTS.includes(effect.evidence.requirement)) return false;
  if (effect.delegation?.requiredDelegateCapabilities.some((value) => !nonBlank(value))) return false;
  if (effect.sourcing !== undefined) {
    const synthetic: PolicyDecisionTemplate = {
      departmentRouting: { departmentId: null, costAreaId: null, routeKey: null },
      approval: { strategy: "none", stages: [] },
      delegation: { allowed: false, requiredDelegateCapabilities: [] },
      exceptions: { behavior: "deny", route: null },
      budget: { mode: "none", budgetKey: null, enforcement: "informational" },
      evidence: { requirement: "none" },
      sourcing: effect.sourcing,
    };
    if (!validSourcing(synthetic)) return false;
  }
  return true;
}

function validRule(rule: PurchasingPolicyRule): boolean {
  return nonBlank(rule.ruleId)
    && Number.isFinite(rule.priority)
    && validCondition(rule.condition)
    && validRuleEffect(rule.effect);
}

function validPolicy(policy: PurchasingPolicyVersion): boolean {
  return policy.contractVersion === CP05_POLICY_CONTRACT_VERSION
    && nonBlank(policy.policyId)
    && nonBlank(policy.organizationId)
    && nonBlank(policy.versionId)
    && Number.isInteger(policy.version)
    && policy.version > 0
    && policy.status === "active"
    && validIsoDate(policy.effectiveAt)
    && validDecision(policy.defaults)
    && policy.rules.every(validRule)
    && new Set(policy.rules.map((rule) => rule.ruleId)).size === policy.rules.length;
}

function stringIn(value: string | null, values: readonly string[]): boolean {
  return value !== null && values.includes(value);
}

function conditionMatches(condition: PolicyRuleCondition, context: PolicyResolutionContext): boolean {
  if (condition.departmentIds !== undefined && !stringIn(context.departmentId, condition.departmentIds)) return false;
  if (condition.costAreaIds !== undefined && !stringIn(context.costAreaId, condition.costAreaIds)) return false;
  if (condition.categoryIds !== undefined && !stringIn(context.categoryId, condition.categoryIds)) return false;
  if (condition.minAmountInclusive !== undefined && context.money.amount < condition.minAmountInclusive) return false;
  if (condition.maxAmountExclusive !== undefined && context.money.amount >= condition.maxAmountExclusive) return false;
  if (condition.currency !== undefined && context.money.currency !== condition.currency) return false;
  if (condition.providerIds !== undefined && !stringIn(context.provider?.providerId ?? null, condition.providerIds)) return false;
  if (condition.providerRelationships !== undefined) {
    const relationship = context.provider?.relationship ?? null;
    if (relationship === null || !condition.providerRelationships.includes(relationship)) return false;
  }
  if (condition.neededByOnOrAfter !== undefined && (context.neededBy === null || Date.parse(context.neededBy) < Date.parse(condition.neededByOnOrAfter))) return false;
  if (condition.neededByOnOrBefore !== undefined && (context.neededBy === null || Date.parse(context.neededBy) > Date.parse(condition.neededByOnOrBefore))) return false;
  if (condition.requesterIds !== undefined && !condition.requesterIds.includes(context.requester.userId)) return false;
  if (condition.requesterPermissionsAny !== undefined && !condition.requesterPermissionsAny.some((permission) => context.requester.permissions.includes(permission))) return false;
  if (condition.purchasingModes !== undefined && !condition.purchasingModes.includes(context.purchasingMode)) return false;
  if (condition.exceptionCodesAny !== undefined && !condition.exceptionCodesAny.some((code) => context.exceptionCodes.includes(code))) return false;
  return true;
}

function applyEffect(decision: PolicyDecisionTemplate, effect: PolicyRuleEffect): PolicyDecisionTemplate {
  return {
    departmentRouting: clone(effect.departmentRouting ?? decision.departmentRouting),
    approval: clone(effect.approval ?? decision.approval),
    delegation: clone(effect.delegation ?? decision.delegation),
    exceptions: clone(effect.exceptions ?? decision.exceptions),
    budget: clone(effect.budget ?? decision.budget),
    evidence: clone(effect.evidence ?? decision.evidence),
    sourcing: clone(effect.sourcing ?? decision.sourcing),
  };
}

function applicablePolicy(policy: PurchasingPolicyVersion): ApplicablePolicyVersion {
  return Object.freeze({
    policyId: policy.policyId,
    versionId: policy.versionId,
    version: policy.version,
    effectiveAt: policy.effectiveAt,
  });
}

function resolveSourcing(decision: PolicyDecisionTemplate, context: PolicyResolutionContext): ResolvedSourcingPolicy {
  const allowed = decision.sourcing.allowedPurchasingModes.includes(context.purchasingMode);
  const publishRequiredCapabilities = [...decision.sourcing.publishRequiredCapabilities];
  return deepFreeze({
    requestedMode: context.purchasingMode,
    allowed,
    order: allowed ? [...decision.sourcing.orderByMode[context.purchasingMode] ?? []] : [],
    publishRequiredCapabilities,
    requesterMayPublish: allowed && publishRequiredCapabilities.every((permission) => context.requester.permissions.includes(permission)),
  });
}

export class PolicyResolver implements PolicyResolverPort<PolicyResolutionContext, PolicyResolution> {
  private readonly source: PolicyVersionSource;
  private readonly now: () => Date;

  constructor(input: Readonly<{ source: PolicyVersionSource; now?: () => Date }>) {
    this.source = input.source;
    this.now = input.now ?? (() => new Date());
  }

  async resolve(context: PolicyResolutionContext): Promise<PolicyResolution> {
    if (!validContext(context)) {
      throw new PolicyResolverError("invalid-context", "The purchasing policy context is invalid.");
    }

    const resolvedAt = this.now().toISOString();
    const policy = await this.source.getActivePolicyVersion({ organizationId: context.organizationId, at: resolvedAt });
    if (policy === null) {
      return Object.freeze({
        status: "not-configured" as const,
        contractVersion: CP05_POLICY_CONTRACT_VERSION,
        organizationId: context.organizationId,
        resolvedAt,
      });
    }
    if (policy.organizationId !== context.organizationId) {
      throw new PolicyResolverError("tenant-mismatch", "The policy source returned a policy for another organization.");
    }
    if (!validPolicy(policy) || Date.parse(policy.effectiveAt) > Date.parse(resolvedAt)) {
      throw new PolicyResolverError("invalid-policy", "The active purchasing policy is invalid.");
    }

    const matched = policy.rules
      .filter((rule) => conditionMatches(rule.condition, context))
      .sort((left, right) => left.priority - right.priority || left.ruleId.localeCompare(right.ruleId));

    let decision = clone(policy.defaults);
    for (const rule of matched) decision = applyEffect(decision, rule.effect);

    const resolved: ResolvedPurchasingPolicy = {
      status: "resolved",
      contractVersion: CP05_POLICY_CONTRACT_VERSION,
      organizationId: context.organizationId,
      applicablePolicy: applicablePolicy(policy),
      departmentRouting: clone(decision.departmentRouting),
      approval: clone(decision.approval),
      amountCategoryConditions: matched.map((rule) => ({
        ruleId: rule.ruleId,
        priority: rule.priority,
        condition: clone(rule.condition),
      })),
      delegation: clone(decision.delegation),
      exceptions: clone(decision.exceptions),
      budget: clone(decision.budget),
      evidence: clone(decision.evidence),
      sourcing: resolveSourcing(decision, context),
      matchedRuleIds: matched.map((rule) => rule.ruleId),
      resolvedAt,
    };
    return deepFreeze(resolved);
  }
}

/**
 * Capture the exact resolved policy decision at authorization submission. The consuming command
 * persists this detached snapshot with the authorization round through CP-03; later policy changes
 * must never be re-resolved over historical decisions.
 */
export function captureAuthorizationPolicySnapshot(
  resolution: ResolvedPurchasingPolicy,
  capturedAt: string = resolution.resolvedAt,
): AuthorizationPolicySnapshot {
  if (!validIsoDate(capturedAt)) {
    throw new PolicyResolverError("invalid-context", "The policy snapshot capture time is invalid.");
  }
  return deepFreeze({
    contractVersion: CP05_POLICY_CONTRACT_VERSION,
    organizationId: resolution.organizationId,
    applicablePolicy: clone(resolution.applicablePolicy),
    departmentRouting: clone(resolution.departmentRouting),
    approval: clone(resolution.approval),
    amountCategoryConditions: clone(resolution.amountCategoryConditions),
    delegation: clone(resolution.delegation),
    exceptions: clone(resolution.exceptions),
    budget: clone(resolution.budget),
    evidence: clone(resolution.evidence),
    sourcing: clone(resolution.sourcing),
    matchedRuleIds: [...resolution.matchedRuleIds],
    capturedAt,
  });
}
