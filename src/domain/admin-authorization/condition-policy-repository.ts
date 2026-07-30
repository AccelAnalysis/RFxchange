import type { AdminPermissionKey } from "./model.ts";
import type { AdminSensitiveActionPolicy } from "./conditions.ts";

export interface AdminSensitiveActionPolicyRepository {
  getByPermission(permission: AdminPermissionKey): Promise<AdminSensitiveActionPolicy | null>;
  listAll(): Promise<readonly AdminSensitiveActionPolicy[]>;
  save(policy: AdminSensitiveActionPolicy): Promise<void>;
}
