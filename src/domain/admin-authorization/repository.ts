import type {
  AdminPermissionDefinition,
  AdminPermissionKey,
  PlatformAdministratorAuthorityContext,
  PlatformAdministratorId,
} from "./model";

export interface AdminPermissionCatalogRepository {
  getByKey(key: AdminPermissionKey): Promise<AdminPermissionDefinition | null>;
  listAll(): Promise<readonly AdminPermissionDefinition[]>;
}

export interface PlatformAdministratorAuthorityContextRepository {
  getByAdministratorId(
    administratorId: PlatformAdministratorId,
  ): Promise<PlatformAdministratorAuthorityContext | null>;
}

export interface AdminAuthorizationRepositories {
  readonly permissions: AdminPermissionCatalogRepository;
  readonly authorityContexts: PlatformAdministratorAuthorityContextRepository;
}
