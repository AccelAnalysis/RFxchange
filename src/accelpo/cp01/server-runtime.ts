import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import { createServerFirebaseAccountSecurityService } from "../../infrastructure/auth/firebase-account-security-runtime.ts";
import { createFirestoreFoundationRepositories } from "../../infrastructure/firestore/repositories.ts";
import { getServerFirestore } from "../../infrastructure/firestore/runtime.ts";
import { FirestoreOrganizationCommercialAccountRepository } from "../../infrastructure/firestore/commercial-account-repository.ts";
import { projectIdentityContext } from "./identity-projection.ts";

/**
 * Production composition for the CP-01 identity projection. The adapter is intentionally narrow
 * so CP-04 can become the shared projection runtime without changing the client context contract.
 */
export async function loadServerIdentityProjection(input: Readonly<{
  readonly context: AuthenticatedServerContext;
  readonly requestedOrganizationId?: string | null;
}> ) {
  const db = getServerFirestore();
  const repositories = createFirestoreFoundationRepositories(db);
  return projectIdentityContext(
    input.context,
    input.requestedOrganizationId,
    {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: repositories.organizations.accounts,
      profiles: repositories.organizations.profiles,
      memberships: repositories.users.memberships,
      authorizations: repositories.organizationAuthorization,
      restrictions: repositories.lifecycle.restrictions,
      commercialAccounts: new FirestoreOrganizationCommercialAccountRepository(db),
    },
  );
}
