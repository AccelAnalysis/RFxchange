import { createHash, randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";

import { OrganizationResolutionService } from "../../application/organization-resolution/organization-resolution.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationResolutionRepositories } from "../firestore/organization-resolution-repositories.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

function opaqueEntityKeyId(canonicalValue: string): string {
  return createHash("sha256").update(canonicalValue).digest("hex");
}

export function createServerOrganizationResolutionService(
  db: Firestore = getServerFirestore(),
  now: () => string = () => new Date().toISOString(),
): OrganizationResolutionService {
  const foundation = createFirestoreFoundationRepositories(db);
  const geography = createFirestoreGeographyRepositories(db);
  const resolution = createFirestoreOrganizationResolutionRepositories(db);
  return new OrganizationResolutionService({
    lifecycle: foundation.lifecycle.lifecycle,
    geographySelections: geography.selections,
    accounts: foundation.organizations.accounts,
    profiles: foundation.organizations.profiles,
    discovery: resolution.discovery,
    resolutions: resolution.resolutions,
    unitOfWork: resolution.unitOfWork,
    ids: {
      resolution: () => `org-resolution-${randomUUID()}`,
      organization: () => `org-${randomUUID()}`,
      profile: () => `org-profile-${randomUUID()}`,
      discovery: () => `org-discovery-${randomUUID()}`,
      entityKey: opaqueEntityKeyId,
    },
    now,
  });
}
