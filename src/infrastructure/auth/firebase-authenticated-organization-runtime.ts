import type { Firestore } from "firebase-admin/firestore";

import { AuthenticatedOrganizationWorkspaceService } from "../../application/auth/authenticated-organization-workspace.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { createServerFirebaseAccountSecurityService } from "./firebase-account-security-runtime.ts";

/**
 * Server-only composition for INF-009. Credential verification remains in the session boundary;
 * this factory composes persisted RFxchange organization state and Firebase account-security checks.
 */
export function createServerAuthenticatedOrganizationWorkspaceService(
  db: Firestore = getServerFirestore(),
): AuthenticatedOrganizationWorkspaceService {
  const repositories = createFirestoreFoundationRepositories(db);
  return new AuthenticatedOrganizationWorkspaceService({
    accountSecurity: createServerFirebaseAccountSecurityService(),
    organizations: repositories.organizations.accounts,
    profiles: repositories.organizations.profiles,
    memberships: repositories.users.memberships,
    authorizations: repositories.organizationAuthorization,
    restrictions: repositories.lifecycle.restrictions,
  });
}
