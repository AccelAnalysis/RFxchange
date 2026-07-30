import type { PlatformAdministratorId } from "../admin-authorization/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type GovernedConfigurationTimestamp = Brand<string, "GovernedConfigurationTimestamp">;
export type GovernedConfigurationPolicyVersion = Brand<string, "GovernedConfigurationPolicyVersion">;
export type GovernedConfigurationJson =
  | null
  | boolean
  | number
  | string
  | readonly GovernedConfigurationJson[]
  | Readonly<{ readonly [key: string]: GovernedConfigurationJson }>;

export const GOVERNED_CONFIGURATION_KEYS = [
  "verification.evidence-types",
  "credibility.thresholds",
  "credibility.badge-expiration",
  "founding.capacity",
  "plans.limits",
  "referral.fee-rules",
  "referral.payout-thresholds",
  "providers.categories",
  "rfx.types",
  "capabilities.taxonomy",
  "notifications.defaults",
  "geography.release-states",
  "accounts.inactivity-windows",
  "admin.case-slas",
  "support.categories",
] as const;

export type GovernedConfigurationKey = (typeof GOVERNED_CONFIGURATION_KEYS)[number];

export interface GovernedConfigurationDefinition {
  readonly key: GovernedConfigurationKey;
  readonly displayName: string;
  readonly description: string;
}

export interface GovernedConfigurationState {
  readonly key: GovernedConfigurationKey;
  readonly value: GovernedConfigurationJson;
  readonly revision: number;
  readonly policyVersion: GovernedConfigurationPolicyVersion;
  readonly effectiveAt: GovernedConfigurationTimestamp;
  readonly updatedAt: GovernedConfigurationTimestamp;
  readonly updatedByAdministratorId: PlatformAdministratorId;
}

const DEFINITIONS: readonly Readonly<[GovernedConfigurationKey, string, string]>[] = [
  ["verification.evidence-types", "Verification evidence types", "Accepted evidence categories for organization verification."],
  ["credibility.thresholds", "Credibility thresholds", "Threshold parameters used by configurable credibility criteria."],
  ["credibility.badge-expiration", "Badge expiration", "Expiration and review windows for time-bound credibility states."],
  ["founding.capacity", "Founding capacity", "Approved maximum capacity for the Founding organization cohort."],
  ["plans.limits", "Plan limits", "Plan and entitlement quantity limits that are policy rather than code."],
  ["referral.fee-rules", "Referral fee rules", "Governed referral-economics rules and fee parameters."],
  ["referral.payout-thresholds", "Referral payout thresholds", "Minimum payout and related settlement thresholds."],
  ["providers.categories", "Resource-provider categories", "Approved resource-provider category taxonomy."],
  ["rfx.types", "RFx types", "Approved RFx/request types exposed by the Exchange."],
  ["capabilities.taxonomy", "Capability taxonomy", "Configuration reference for the approved capability taxonomy."],
  ["notifications.defaults", "Notification defaults", "Default notification behavior before user or organization overrides."],
  ["geography.release-states", "Geography release states", "Governed state vocabulary for staged locality release."],
  ["accounts.inactivity-windows", "Inactivity windows", "Account inactivity warning and lifecycle windows."],
  ["admin.case-slas", "Administrative case SLAs", "Default administrative case service-level targets by case type/severity."],
  ["support.categories", "Support categories", "Approved categories for support and feedback intake."],
] as const;

export const GOVERNED_CONFIGURATION_DEFINITIONS: readonly GovernedConfigurationDefinition[] = Object.freeze(
  DEFINITIONS.map(([key, displayName, description]) => Object.freeze({ key, displayName, description })),
);

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function timestamp(value: string, field: string): GovernedConfigurationTimestamp {
  const parsed = Date.parse(required(value, field));
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString() as GovernedConfigurationTimestamp;
}

export function governedConfigurationKey(value: string): GovernedConfigurationKey {
  const normalized = required(value, "Governed configuration key");
  if (!(GOVERNED_CONFIGURATION_KEYS as readonly string[]).includes(normalized)) {
    throw new Error(`Unknown governed configuration key: ${normalized}.`);
  }
  return normalized as GovernedConfigurationKey;
}

export function governedConfigurationPolicyVersion(value: string): GovernedConfigurationPolicyVersion {
  const normalized = required(value, "Governed configuration policy version");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(normalized)) {
    throw new Error("Governed configuration policy version must be a stable version identifier.");
  }
  return normalized as GovernedConfigurationPolicyVersion;
}

function cloneJson(value: unknown, path = "configuration value"): GovernedConfigurationJson {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${path} cannot contain a non-finite number.`);
    return value;
  }
  if (Array.isArray(value)) return Object.freeze(value.map((entry, index) => cloneJson(entry, `${path}[${index}]`)));
  if (value && typeof value === "object") {
    const output: Record<string, GovernedConfigurationJson> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (!key.trim()) throw new Error(`${path} cannot contain an empty object key.`);
      if (nested === undefined) throw new Error(`${path}.${key} cannot be undefined.`);
      output[key] = cloneJson(nested, `${path}.${key}`);
    }
    return Object.freeze(output);
  }
  throw new Error(`${path} must be JSON-compatible.`);
}

export function createGovernedConfigurationState(input: Readonly<{
  key: string;
  value: unknown;
  revision: number;
  policyVersion: string;
  effectiveAt: string;
  updatedAt: string;
  updatedByAdministratorId: PlatformAdministratorId;
}>): GovernedConfigurationState {
  if (!Number.isInteger(input.revision) || input.revision < 1) {
    throw new Error("Governed configuration revision must be a positive integer.");
  }
  const effectiveAt = timestamp(input.effectiveAt, "Governed configuration effective timestamp");
  const updatedAt = timestamp(input.updatedAt, "Governed configuration update timestamp");
  if (Date.parse(effectiveAt) > Date.parse(updatedAt)) {
    throw new Error("Governed configuration effective timestamp cannot be after the update timestamp.");
  }
  return Object.freeze({
    key: governedConfigurationKey(input.key),
    value: cloneJson(input.value),
    revision: input.revision,
    policyVersion: governedConfigurationPolicyVersion(input.policyVersion),
    effectiveAt,
    updatedAt,
    updatedByAdministratorId: input.updatedByAdministratorId,
  });
}

export function proposeGovernedConfigurationChange(input: Readonly<{
  current: GovernedConfigurationState | null;
  key: string;
  value: unknown;
  expectedRevision: number;
  policyVersion: string;
  effectiveAt: string;
  updatedAt: string;
  updatedByAdministratorId: PlatformAdministratorId;
}>): GovernedConfigurationState {
  const key = governedConfigurationKey(input.key);
  const currentRevision = input.current?.revision ?? 0;
  if (input.expectedRevision !== currentRevision) {
    throw new Error(`Governed configuration ${key} revision mismatch: expected ${input.expectedRevision}, current ${currentRevision}.`);
  }
  if (input.current && input.current.key !== key) {
    throw new Error("Governed configuration change current record belongs to a different key.");
  }
  const next = createGovernedConfigurationState({
    key,
    value: input.value,
    revision: currentRevision + 1,
    policyVersion: input.policyVersion,
    effectiveAt: input.effectiveAt,
    updatedAt: input.updatedAt,
    updatedByAdministratorId: input.updatedByAdministratorId,
  });
  if (
    input.current &&
    JSON.stringify(input.current.value) === JSON.stringify(next.value) &&
    input.current.policyVersion === next.policyVersion &&
    input.current.effectiveAt === next.effectiveAt
  ) {
    throw new Error(`Governed configuration ${key} change does not alter the effective policy value.`);
  }
  return next;
}
