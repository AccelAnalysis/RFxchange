import type { Firestore } from "firebase-admin/firestore";

import {
  assertRfxIss006AuthoritativeBoundary,
} from "../../application/rfx/iss006-authoritative-boundary.ts";
import type { RfxPackageInput } from "../../domain/rfx/model.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

export async function assertServerRfxIss006AuthoritativeBoundary(
  input: Readonly<{
    organizationId: string;
    package: RfxPackageInput;
  }>,
  db: Firestore = getServerFirestore(),
): Promise<void> {
  const geography = createFirestoreGeographyRepositories(db);
  const organizationLocation = createFirestoreOrganizationLocationRepositories(db);
  await assertRfxIss006AuthoritativeBoundary(input, {
    geographies: geography.definitions,
    locations: organizationLocation.locations,
  });
}
