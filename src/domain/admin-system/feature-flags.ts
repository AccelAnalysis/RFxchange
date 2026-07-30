import type { PlatformAdministrativeAuditEvent } from "../admin-authorization/admin-audit.ts";
import type { PlatformAdministratorId } from "../admin-authorization/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export const APPROVED_FEATURE_FLAG_KEYS = [
  "founding-membership-checkout",
  "rfx-publishing",
  "rfx-response-submission",
  "referrals",
  "teaming",
  "resource-provider-applications",
  "sam-gov-ingestion",
] as const;

export type ApprovedFeatureFlagKey = (typeof APPROVED_FEATURE_FLAG_KEYS)[number];
export type FeatureFlagEnvironment = "development" | "staging" | "production";
export type FeatureFlagScopeKind = "global" | "geography" | "organization";
export type FeatureFlagStateId = Brand<string, "FeatureFlagStateId">;

export interface FeatureFlagScope {
  readonly kind: FeatureFlagScopeKind;
  readonly id: string | null;
}

export interface FeatureFlagState {
  readonly id: FeatureFlagStateId;
  readonly flag: ApprovedFeatureFlagKey;
  readonly environment: FeatureFlagEnvironment;
  readonly scope: FeatureFlagScope;
  readonly enabled: boolean;
  readonly revision: number;
  readonly updatedAt: string;
  readonly updatedByAdministratorId: PlatformAdministratorId;
}

export interface FeatureFlagChangeRecord {
  readonly id: string;
  readonly stateId: FeatureFlagStateId;
  readonly revision: number;
  readonly previousEnabled: boolean | null;
  readonly enabled: boolean;
  readonly reason: string;
  readonly changedAt: string;
  readonly actorAdministratorId: PlatformAdministratorId;
  readonly auditEventId: string;
}

export interface FeatureFlagRepository {
  getById(id: FeatureFlagStateId): Promise<FeatureFlagState | null>;
  listAll(): Promise<readonly FeatureFlagState[]>;
}

export interface FeatureFlagChangeUnitOfWork {
  commitChange(input: Readonly<{
    expectedRevision: number;
    state: FeatureFlagState;
    changeRecord: FeatureFlagChangeRecord;
    auditEvent: PlatformAdministrativeAuditEvent;
  }>): Promise<void>;
}

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

export function approvedFeatureFlagKey(value: string): ApprovedFeatureFlagKey {
  const normalized = required(value, "Feature flag key");
  if (!(APPROVED_FEATURE_FLAG_KEYS as readonly string[]).includes(normalized)) {
    throw new Error(`Feature flag is not approved for administrative control: ${normalized}.`);
  }
  return normalized as ApprovedFeatureFlagKey;
}

export function featureFlagEnvironment(value: string): FeatureFlagEnvironment {
  const normalized = required(value, "Feature flag environment").toLowerCase();
  if (!["development", "staging", "production"].includes(normalized)) {
    throw new Error(`Unsupported feature flag environment: ${normalized}.`);
  }
  return normalized as FeatureFlagEnvironment;
}

export function featureFlagScope(kind: string, id?: string | null): FeatureFlagScope {
  const normalizedKind = required(kind, "Feature flag scope kind").toLowerCase();
  if (!["global", "geography", "organization"].includes(normalizedKind)) {
    throw new Error(`Unsupported feature flag scope: ${normalizedKind}.`);
  }
  if (normalizedKind === "global") {
    if (id?.trim()) throw new Error("Global feature flag scope cannot include a scope id.");
    return Object.freeze({ kind: "global" as const, id: null });
  }
  return Object.freeze({
    kind: normalizedKind as "geography" | "organization",
    id: required(id ?? "", "Feature flag scope id"),
  });
}

export function featureFlagStateId(input: Readonly<{
  flag: string;
  environment: string;
  scopeKind: string;
  scopeId?: string | null;
}>): FeatureFlagStateId {
  const flag = approvedFeatureFlagKey(input.flag);
  const environment = featureFlagEnvironment(input.environment);
  const scope = featureFlagScope(input.scopeKind, input.scopeId);
  return `${flag}:${environment}:${scope.kind}:${scope.id ?? "global"}` as FeatureFlagStateId;
}

function iso(value: string, field: string): string {
  const parsed = Date.parse(required(value, field));
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString();
}

export function proposeFeatureFlagChange(input: Readonly<{
  current: FeatureFlagState | null;
  flag: string;
  environment: string;
  scopeKind: string;
  scopeId?: string | null;
  enabled: boolean;
  expectedRevision: number;
  changedAt: string;
  administratorId: PlatformAdministratorId;
}>): FeatureFlagState {
  const flag = approvedFeatureFlagKey(input.flag);
  const environment = featureFlagEnvironment(input.environment);
  const scope = featureFlagScope(input.scopeKind, input.scopeId);
  const id = featureFlagStateId({ flag, environment, scopeKind: scope.kind, scopeId: scope.id });
  const revision = input.current?.revision ?? 0;
  if (revision !== input.expectedRevision) {
    throw new Error(`Feature flag ${id} revision mismatch: expected ${input.expectedRevision}, current ${revision}.`);
  }
  if (input.current && input.current.id !== id) throw new Error("Feature flag current state belongs to a different flag scope.");
  if (input.current?.enabled === input.enabled) throw new Error(`Feature flag ${id} already has enabled=${input.enabled}.`);
  return Object.freeze({
    id,
    flag,
    environment,
    scope,
    enabled: input.enabled,
    revision: revision + 1,
    updatedAt: iso(input.changedAt, "Feature flag changed timestamp"),
    updatedByAdministratorId: input.administratorId,
  });
}
