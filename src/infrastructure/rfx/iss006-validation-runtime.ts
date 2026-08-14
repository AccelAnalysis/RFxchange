import type { Firestore } from "firebase-admin/firestore";

import {
  assertRfxIss006AuthoritativeBoundary,
} from "../../application/rfx/iss006-authoritative-boundary.ts";
import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import type { RfxPackageInput } from "../../domain/rfx/model.ts";
import { createServerFirebaseAccountSecurityService } from "../auth/firebase-account-security-runtime.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

export async function assertServerRfxIss006AuthoritativeBoundary(
  input: Readonly<{
    context: AuthenticatedServerContext | null;
    organizationId: string;
    membershipId: string;
    package: RfxPackageInput;
  }>,
  db: Firestore = getServerFirestore(),
): Promise<void> {
  const foundation = createFirestoreFoundationRepositories(db);
  const geography = createFirestoreGeographyRepositories(db);
  const organizationLocation = createFirestoreOrganizationLocationRepositories(db);
  await assertRfxIss006AuthoritativeBoundary(input, {
    authorization: {
      accountSecurity: createServerFirebaseAccountSecurityService(),
      organizations: foundation.organizations.accounts,
      memberships: foundation.users.memberships,
      authorizations: foundation.organizationAuthorization,
      restrictions: foundation.lifecycle.restrictions,
    },
    geographies: geography.definitions,
    locations: organizationLocation.locations,
  });
}
