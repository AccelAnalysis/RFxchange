/**
 * CP-05 PolicyResolver contracts.
 *
 * The resolver is intentionally data-driven. Amount/category/provider conditions come from a
 * versioned organization policy supplied by trusted server infrastructure; no company-independent
 * purchasing threshold is defined here.
 */

export const CP05_POLICY_CONTRACT_VERSION = 1 as const;

export const ACCELPO_PURCHASING_MODES = Object.freeze([
  "direct-provider",
  "source-first",
  "authorize-first",
] as const);
export type AccelPOPurchasingMode = (typeof ACCELPO_PURCHASING_MODES)[number];

export const ACCELPO_EVIDENCE_REQUIREMENTS = Object.freeze([
  "none",
  "receipt",
  "photo",
  "receipt-or-photo",
  "receipt-and-photo",
  "service-completion",
] as const);
export type AccelPOEvidenceRequirement = (typeof ACCELPO_EVIDENCE_REQUIREMENTS)[number];

export type AccelPOApprovalStrategy = "none" | "sequential" | "parallel";
export type AccelPOBudgetMode = "none" | "organization-entered";
export type AccelPOBudgetEnforcement = "informational" | "approval-required" | "hard-stop";
export type AccelPOExceptionBehavior = "deny" | "allow" | "route";
export type AccelPOPurchasingStep = "authorize" | "source" | "award" | "fulfill" | "evidence";

export interface PolicyMoneyContext {
  readonly amount: number;
  readonly currency: string;
}

export interface PolicyProviderContext {
  readonly providerId: string | null;
  readonly relationship: "existing" | "new" | "community" | null;
}

/** Requester permissions must be derived from CP-01/server authorization, never trusted from UI state. */
export interface TrustedPolicyRequester {
  readonly userId: string;
  readonly permissions: readonly string[];
}

export interface PolicyResolutionContext {
  readonly organizationId: string;
  readonly departmentId: string | null;
  readonly costAreaId: string | null;
  readonly categoryId: string | null;
  readonly money: PolicyMoneyContext;
  readonly provider: PolicyProviderContext | null;
  readonly neededBy: string | null;
  readonly requester: TrustedPolicyRequester;
  readonly purchasingMode: AccelPOPurchasingMode;
  readonly exceptionCodes: readonly string[];
}

export interface ApprovalStage {
  readonly stageId: string;
  readonly label: string;
  readonly approverKind: "capability" | "user" | "role";
  readonly approverId: string;
  readonly minimumApprovals: number;
}

export interface ApprovalRoute {
  readonly strategy: AccelPOApprovalStrategy;
  readonly stages: readonly ApprovalStage[];
}

export interface DelegationPolicy {
  readonly allowed: boolean;
  readonly requiredDelegateCapabilities: readonly string[];
}

export interface ExceptionPolicy {
  readonly behavior: AccelPOExceptionBehavior;
  readonly route: ApprovalRoute | null;
}

export interface BudgetPolicy {
  readonly mode: AccelPOBudgetMode;
  readonly budgetKey: string | null;
  readonly enforcement: AccelPOBudgetEnforcement;
}

export interface EvidencePolicy {
  readonly requirement: AccelPOEvidenceRequirement;
}

export interface DepartmentRoutingPolicy {
  readonly departmentId: string | null;
  readonly costAreaId: string | null;
  readonly routeKey: string | null;
}

export interface SourcingPolicy {
  readonly allowedPurchasingModes: readonly AccelPOPurchasingMode[];
  readonly orderByMode: Readonly<Partial<Record<AccelPOPurchasingMode, readonly AccelPOPurchasingStep[]>>>;
  readonly publishRequiredCapabilities: readonly string[];
}

export interface PolicyDecisionTemplate {
  readonly departmentRouting: DepartmentRoutingPolicy;
  readonly approval: ApprovalRoute;
  readonly delegation: DelegationPolicy;
  readonly exceptions: ExceptionPolicy;
  readonly budget: BudgetPolicy;
  readonly evidence: EvidencePolicy;
  readonly sourcing: SourcingPolicy;
}

export interface PolicyRuleCondition {
  readonly departmentIds?: readonly string[];
  readonly costAreaIds?: readonly string[];
  readonly categoryIds?: readonly string[];
  readonly minAmountInclusive?: number;
  readonly maxAmountExclusive?: number;
  readonly currency?: string;
  readonly providerIds?: readonly string[];
  readonly providerRelationships?: readonly NonNullable<PolicyProviderContext["relationship"]>[];
  readonly neededByOnOrAfter?: string;
  readonly neededByOnOrBefore?: string;
  readonly requesterIds?: readonly string[];
  readonly requesterPermissionsAny?: readonly string[];
  readonly purchasingModes?: readonly AccelPOPurchasingMode[];
  readonly exceptionCodesAny?: readonly string[];
}

export interface PolicyRuleEffect {
  readonly departmentRouting?: DepartmentRoutingPolicy;
  readonly approval?: ApprovalRoute;
  readonly delegation?: DelegationPolicy;
  readonly exceptions?: ExceptionPolicy;
  readonly budget?: BudgetPolicy;
  readonly evidence?: EvidencePolicy;
  readonly sourcing?: SourcingPolicy;
}

export interface PurchasingPolicyRule {
  readonly ruleId: string;
  readonly priority: number;
  readonly condition: PolicyRuleCondition;
  readonly effect: PolicyRuleEffect;
}

export interface PurchasingPolicyVersion {
  readonly contractVersion: typeof CP05_POLICY_CONTRACT_VERSION;
  readonly policyId: string;
  readonly organizationId: string;
  readonly versionId: string;
  readonly version: number;
  readonly status: "active" | "retired";
  readonly effectiveAt: string;
  readonly defaults: PolicyDecisionTemplate;
  readonly rules: readonly PurchasingPolicyRule[];
}

export interface PolicyVersionSource {
  /** Must be organization-scoped at source. It must never perform a broad client-visible read. */
  getActivePolicyVersion(input: Readonly<{
    organizationId: string;
    at: string;
  }>): Promise<PurchasingPolicyVersion | null>;
}

export interface AppliedPolicyCondition {
  readonly ruleId: string;
  readonly priority: number;
  readonly condition: PolicyRuleCondition;
}

export interface ResolvedSourcingPolicy {
  readonly requestedMode: AccelPOPurchasingMode;
  readonly allowed: boolean;
  readonly order: readonly AccelPOPurchasingStep[];
  readonly publishRequiredCapabilities: readonly string[];
  readonly requesterMayPublish: boolean;
}

export interface ApplicablePolicyVersion {
  readonly policyId: string;
  readonly versionId: string;
  readonly version: number;
  readonly effectiveAt: string;
}

export interface ResolvedPurchasingPolicy {
  readonly status: "resolved";
  readonly contractVersion: typeof CP05_POLICY_CONTRACT_VERSION;
  readonly organizationId: string;
  readonly applicablePolicy: ApplicablePolicyVersion;
  readonly departmentRouting: DepartmentRoutingPolicy;
  readonly approval: ApprovalRoute;
  readonly amountCategoryConditions: readonly AppliedPolicyCondition[];
  readonly delegation: DelegationPolicy;
  readonly exceptions: ExceptionPolicy;
  readonly budget: BudgetPolicy;
  readonly evidence: EvidencePolicy;
  readonly sourcing: ResolvedSourcingPolicy;
  readonly matchedRuleIds: readonly string[];
  readonly resolvedAt: string;
}

export interface PolicyNotConfigured {
  readonly status: "not-configured";
  readonly contractVersion: typeof CP05_POLICY_CONTRACT_VERSION;
  readonly organizationId: string;
  readonly resolvedAt: string;
}

export type PolicyResolution = ResolvedPurchasingPolicy | PolicyNotConfigured;

/** Persist this detached immutable snapshot with an authorization round at submission time. */
export interface AuthorizationPolicySnapshot {
  readonly contractVersion: typeof CP05_POLICY_CONTRACT_VERSION;
  readonly organizationId: string;
  readonly applicablePolicy: ApplicablePolicyVersion;
  readonly departmentRouting: DepartmentRoutingPolicy;
  readonly approval: ApprovalRoute;
  readonly amountCategoryConditions: readonly AppliedPolicyCondition[];
  readonly delegation: DelegationPolicy;
  readonly exceptions: ExceptionPolicy;
  readonly budget: BudgetPolicy;
  readonly evidence: EvidencePolicy;
  readonly sourcing: ResolvedSourcingPolicy;
  readonly matchedRuleIds: readonly string[];
  readonly capturedAt: string;
}

export type PolicyResolverErrorCode =
  | "invalid-context"
  | "invalid-policy"
  | "tenant-mismatch";

export class PolicyResolverError extends Error {
  readonly code: PolicyResolverErrorCode;

  constructor(code: PolicyResolverErrorCode, message: string) {
    super(message);
    this.name = "PolicyResolverError";
    this.code = code;
  }
}
