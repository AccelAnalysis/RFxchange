import type { OrganizationId } from "../organizations/model";
import type { StoredAsset, StoredAssetId } from "./model";

export interface StoredAssetRepository {
  getById(id: StoredAssetId): Promise<StoredAsset | null>;
  listByOrganizationId(organizationId: OrganizationId): Promise<readonly StoredAsset[]>;
  create(asset: StoredAsset): Promise<void>;
  save(asset: StoredAsset): Promise<void>;
}
