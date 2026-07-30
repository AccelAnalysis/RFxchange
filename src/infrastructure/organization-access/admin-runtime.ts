import { OrganizationAccessAdministrationService } from "../../application/admin/organization-access-administration.ts";
import { FirestoreOrganizationAccessAdministrationUnitOfWork } from "../firestore/organization-access-admin-unit-of-work.ts";
import { FirestoreOrganizationRoleBundleRepository } from "../firestore/organization-role-bundle-repository.ts";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "../firestore/runtime.ts";

export function createServerOrganizationAccessAdministrationService(): OrganizationAccessAdministrationService {
  const db = getServerFirestore();
  const repositories = createServerFirestoreFoundationRepositories(db);
  return new OrganizationAccessAdministrationService({
    memberships: repositories.users.memberships,
    authorizations: repositories.organizationAuthorization,
    roleBundles: new FirestoreOrganizationRoleBundleRepository(db),
    unitOfWork: new FirestoreOrganizationAccessAdministrationUnitOfWork(db),
  });
}
