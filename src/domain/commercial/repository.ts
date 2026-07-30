import type { OrganizationId } from "../organizations/model.ts";
import type { CommercialAccountId, OrganizationCommercialAccount } from "./model.ts";

export interface OrganizationCommercialAccountRepository {
  getById(id: CommercialAccountId): Promise<OrganizationCommercialAccount | null>;
  getByOrganizationId(organizationId: OrganizationId): Promise<OrganizationCommercialAccount | null>;
  create(account: OrganizationCommercialAccount): Promise<void>;
  save(account: OrganizationCommercialAccount): Promise<void>;
}
