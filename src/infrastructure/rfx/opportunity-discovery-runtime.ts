import type { Firestore } from "firebase-admin/firestore";

import { OpportunityDiscoveryService } from "../../application/rfx/opportunity-discovery-service.ts";
import { FirestoreOpportunityDiscoveryRepository } from "../firestore/opportunity-discovery.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

function publicOrigin(): string {
  const value = process.env.RFXCHANGE_PUBLIC_ORIGIN?.trim() || "http://localhost:3000";
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("RFXCHANGE_PUBLIC_ORIGIN must be an origin without a path.");
  return url.origin;
}

export function createServerOpportunityDiscoveryService(
  db: Firestore = getServerFirestore(),
) {
  return new OpportunityDiscoveryService(
    new FirestoreOpportunityDiscoveryRepository(db),
    undefined,
    publicOrigin(),
  );
}
