import { OrganizationInvitationService } from "../../application/organization-access/organization-invitation-service.ts";
import {
  FirestoreOrganizationInvitationAcceptanceUnitOfWork,
  FirestoreOrganizationUserInvitationRepository,
} from "../firestore/organization-user-invitations.ts";
import {
  createServerFirestoreFoundationRepositories,
  getServerFirestore,
} from "../firestore/runtime.ts";

export function createServerOrganizationInvitationService(): OrganizationInvitationService {
  const db = getServerFirestore();
  const repositories = createServerFirestoreFoundationRepositories(db);
  return new OrganizationInvitationService({
    invitations: new FirestoreOrganizationUserInvitationRepository(db),
    memberships: repositories.users.memberships,
    legalVersions: repositories.legal.documentVersions,
    acceptance: new FirestoreOrganizationInvitationAcceptanceUnitOfWork(db),
  });
}
