import type { Firestore } from "firebase-admin/firestore";

import { NetworkEducationService } from "../../application/network-education/network-education.ts";
import { organizationId as canonicalOrganizationId } from "../../domain/organizations/model.ts";
import { FirestoreNetworkEducationRepository } from "../firestore/network-education.ts";
import { FirestoreResourceProviderRepository } from "../firestore/resource-providers.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

export function createServerNetworkEducationService(db: Firestore = getServerFirestore()) {
  return new NetworkEducationService(new FirestoreNetworkEducationRepository(db));
}

export async function isOfficialResourceProvider(organizationId: string, db: Firestore = getServerFirestore()): Promise<boolean> {
  return Boolean(await new FirestoreResourceProviderRepository(db).getStatusByOrganizationId(canonicalOrganizationId(organizationId)));
}
