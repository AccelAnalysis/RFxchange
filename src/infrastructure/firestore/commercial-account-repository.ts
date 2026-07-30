import type { Firestore } from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model.ts";
import type {
  CommercialAccountId,
  OrganizationCommercialAccount,
} from "../../domain/commercial/model.ts";
import type { OrganizationCommercialAccountRepository } from "../../domain/commercial/repository.ts";
import {
  createMutableFirestoreRecord,
  getFirstFirestoreRecord,
  getFirestoreRecordById,
  saveMutableFirestoreRecord,
} from "./support.ts";
import { firestoreCollectionName } from "./schema.ts";

export class FirestoreOrganizationCommercialAccountRepository
  implements OrganizationCommercialAccountRepository
{
  constructor(private readonly db: Firestore) {}

  getById(id: CommercialAccountId): Promise<OrganizationCommercialAccount | null> {
    return getFirestoreRecordById<OrganizationCommercialAccount>(
      this.db,
      "organizationCommercialAccounts",
      id,
    );
  }

  getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationCommercialAccount | null> {
    return getFirstFirestoreRecord<OrganizationCommercialAccount>(
      this.db
        .collection(firestoreCollectionName("organizationCommercialAccounts"))
        .where("organizationId", "==", organizationId),
      "organizationCommercialAccounts",
    );
  }

  create(account: OrganizationCommercialAccount): Promise<void> {
    return createMutableFirestoreRecord(
      this.db,
      "organizationCommercialAccounts",
      account.id,
      account,
    );
  }

  save(account: OrganizationCommercialAccount): Promise<void> {
    return saveMutableFirestoreRecord(
      this.db,
      "organizationCommercialAccounts",
      account.id,
      account,
    );
  }
}
