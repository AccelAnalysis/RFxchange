import type { AdminRolePreset, AdminRolePresetKey } from "./role-presets.ts";

export interface AdminRolePresetRepository {
  getByKey(key: AdminRolePresetKey): Promise<AdminRolePreset | null>;
  listAll(): Promise<readonly AdminRolePreset[]>;
  save(preset: AdminRolePreset): Promise<void>;
}
