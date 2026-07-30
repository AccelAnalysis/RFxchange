import type { PlatformAdministrativeAuditEvent } from "../admin-authorization/admin-audit.ts";
import type {
  GovernedConfigurationKey,
  GovernedConfigurationState,
} from "./model.ts";

export interface GovernedConfigurationRepository {
  getByKey(key: GovernedConfigurationKey): Promise<GovernedConfigurationState | null>;
  listAll(): Promise<readonly GovernedConfigurationState[]>;
}

export interface GovernedConfigurationChangeCommit {
  readonly expectedRevision: number;
  readonly state: GovernedConfigurationState;
  readonly auditEvent: PlatformAdministrativeAuditEvent;
}

/**
 * Atomic provider-neutral persistence boundary for a configuration mutation and its immutable
 * ADM-085 administrative audit evidence.
 */
export interface GovernedConfigurationChangeUnitOfWork {
  commitChange(input: GovernedConfigurationChangeCommit): Promise<void>;
}
