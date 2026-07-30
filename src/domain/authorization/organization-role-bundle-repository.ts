import type {
  OrganizationRoleBundle,
  OrganizationRoleBundleKey,
} from "./organization-role-bundles.ts";

export interface OrganizationRoleBundleRepository {
  getByKey(key: OrganizationRoleBundleKey): Promise<OrganizationRoleBundle | null>;
  listAll(): Promise<readonly OrganizationRoleBundle[]>;
  save(bundle: OrganizationRoleBundle): Promise<void>;
}
