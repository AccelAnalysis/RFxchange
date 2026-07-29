import type {
  AdminPermissionDefinition,
  AdminPermissionKey,
  PlatformAdministratorAuthorityContext,
  PlatformAdministratorId,
} from "./model";
import type { AdminPermissionGrant, AdminPermissionGrantId } from "./grants";

export interface AdminPermissionCatalogRepository {
  getByKey(key: AdminPermissionKey): Promise<AdminPermissionDefinition | null>;
  listAll(): Promise<readonly AdminPermissionDefinition[]>;
}

export interface PlatformAdministratorAuthorityContextRepository {
  getByAdministratorId(
    administratorId: PlatformAdministratorId,
  ): Promise<PlatformAdministratorAuthorityContext | null>;
}

export interface AdminPermissionGrantRepository {
  getById(id: AdminPermissionGrantId): Promise<AdminPermissionGrant | null>;
  listByAdministratorId(
    administratorId: PlatformAdministratorId,
  ): Promise<readonly AdminPermissionGrant[]>;
  append(grant: AdminPermissionGrant): Promise<void>;
}

export interface AdminAuthorizationRepositories {
  readonly permissions: AdminPermissionCatalogRepository;
  readonly authorityContexts: PlatformAdministratorAuthorityContextRepository;
  readonly grants: AdminPermissionGrantRepository;
}
