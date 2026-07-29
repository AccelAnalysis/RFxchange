import type { OrganizationId } from "../organizations/model";
import type { OrganizationAssetKind, OrganizationScoped, OrganizationScopedAsset } from "./model";

/**
 * Persistence ports for organization-owned records must support tenant-scoped lookup.
 * Concrete feature repositories may extend this contract with feature-specific operations.
 */
export interface OrganizationScopedRepository<TAsset extends OrganizationScoped> {
  listByOrganizationId(organizationId: OrganizationId): Promise<readonly TAsset[]>;
  create(asset: TAsset): Promise<void>;
}

/**
 * Optional cross-domain ownership index for resolving lightweight asset ownership without
 * loading a feature-specific aggregate.
 */
export interface OrganizationAssetOwnershipRepository {
  getByKindAndId(
    kind: OrganizationAssetKind,
    id: OrganizationScopedAsset["id"],
  ): Promise<OrganizationScopedAsset | null>;
  listByOrganizationId(organizationId: OrganizationId): Promise<readonly OrganizationScopedAsset[]>;
}
