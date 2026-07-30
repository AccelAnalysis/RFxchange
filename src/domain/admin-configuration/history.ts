import type { PlatformAdministratorId } from "../admin-authorization/model.ts";
import type {
  GovernedConfigurationJson,
  GovernedConfigurationKey,
  GovernedConfigurationPolicyVersion,
  GovernedConfigurationTimestamp,
} from "./model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type GovernedConfigurationChangeRecordId = Brand<string, "GovernedConfigurationChangeRecordId">;

export interface GovernedConfigurationChangeRecord {
  readonly id: GovernedConfigurationChangeRecordId;
  readonly key: GovernedConfigurationKey;
  readonly revision: number;
  readonly previousValue: GovernedConfigurationJson | null;
  readonly newValue: GovernedConfigurationJson;
  readonly effectiveAt: GovernedConfigurationTimestamp;
  readonly recordedAt: GovernedConfigurationTimestamp;
  readonly actorAdministratorId: PlatformAdministratorId;
  readonly reason: string;
  readonly policyVersion: GovernedConfigurationPolicyVersion;
  readonly auditEventId: string;
}

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function changeRecordId(value: string): GovernedConfigurationChangeRecordId {
  const normalized = required(value, "Governed configuration change record id");
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,191}$/.test(normalized)) {
    throw new Error("Governed configuration change record id must be a stable identifier.");
  }
  return normalized as GovernedConfigurationChangeRecordId;
}

export function createGovernedConfigurationChangeRecord(input: Readonly<{
  id: string;
  key: GovernedConfigurationKey;
  revision: number;
  previousValue: GovernedConfigurationJson | null;
  newValue: GovernedConfigurationJson;
  effectiveAt: GovernedConfigurationTimestamp;
  recordedAt: GovernedConfigurationTimestamp;
  actorAdministratorId: PlatformAdministratorId;
  reason: string;
  policyVersion: GovernedConfigurationPolicyVersion;
  auditEventId: string;
}>): GovernedConfigurationChangeRecord {
  if (!Number.isInteger(input.revision) || input.revision < 1) {
    throw new Error("Governed configuration history revision must be a positive integer.");
  }
  if (input.revision === 1 && input.previousValue !== null) {
    throw new Error("Initial governed configuration history must have a null previous value.");
  }
  return Object.freeze({
    id: changeRecordId(input.id),
    key: input.key,
    revision: input.revision,
    previousValue: input.previousValue,
    newValue: input.newValue,
    effectiveAt: input.effectiveAt,
    recordedAt: input.recordedAt,
    actorAdministratorId: input.actorAdministratorId,
    reason: required(input.reason, "Governed configuration change reason"),
    policyVersion: input.policyVersion,
    auditEventId: required(input.auditEventId, "Governed configuration history audit event id"),
  });
}

export function resolveGovernedConfigurationValueAt(
  history: readonly GovernedConfigurationChangeRecord[],
  at: string,
): GovernedConfigurationChangeRecord | null {
  const parsed = Date.parse(at);
  if (!Number.isFinite(parsed)) throw new Error("Governed configuration history lookup timestamp must be valid.");
  const effective = history
    .filter((record) => Date.parse(record.effectiveAt) <= parsed)
    .sort((left, right) => {
      const byEffective = Date.parse(right.effectiveAt) - Date.parse(left.effectiveAt);
      if (byEffective !== 0) return byEffective;
      return right.revision - left.revision;
    });
  return effective[0] ?? null;
}
