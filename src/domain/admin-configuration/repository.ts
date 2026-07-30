import type { PlatformAdministrativeAuditEvent } from "../admin-authorization/admin-audit.ts";
import type { GovernedConfigurationChangeRecord } from "./history.ts";
import type {
  GovernedConfigurationKey,
  GovernedConfigurationState,
} from "./model.ts";

export interface GovernedConfigurationRepository {
  getByKey(key: GovernedConfigurationKey): Promise<GovernedConfigurationState | null>;
  listAll(): Promise<readonly GovernedConfigurationState[]>;
}

export interface GovernedConfigurationHistoryRepository {
  listHistoryByKey(key: GovernedConfigurationKey): Promise<readonly GovernedConfigurationChangeRecord[]>;
}

export interface GovernedConfigurationChangeCommit {
  readonly expectedRevision: number;
  readonly state: GovernedConfigurationState;
  readonly changeRecord: GovernedConfigurationChangeRecord;
  readonly auditEvent: PlatformAdministrativeAuditEvent;
}

/**
 * Atomic provider-neutral persistence boundary for a configuration mutation, its immutable
 * ADM-084 version record, and its immutable ADM-085 administrative audit evidence.
 */
export interface GovernedConfigurationChangeUnitOfWork {
  commitChange(input: GovernedConfigurationChangeCommit): Promise<void>;
}
