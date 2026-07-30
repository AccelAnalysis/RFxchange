import type { PlatformAdministratorId } from "./model.ts";
import type { PlatformAdministratorRoleConfiguration } from "./role-configuration.ts";

export interface PlatformAdministratorRoleConfigurationRepository {
  getByAdministratorId(
    administratorId: PlatformAdministratorId,
  ): Promise<PlatformAdministratorRoleConfiguration | null>;
  save(configuration: PlatformAdministratorRoleConfiguration): Promise<void>;
}
