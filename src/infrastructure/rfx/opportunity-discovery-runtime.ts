import type { Firestore } from "firebase-admin/firestore";

import {
  OpportunityDiscoveryError,
  OpportunityDiscoveryService,
  type OpportunityParticipantScope,
} from "../../application/rfx/opportunity-discovery-service.ts";
import { loadImmutableAmacsCatalog } from "../amacs/runtime.ts";
import { FirestoreOpportunityDiscoveryRepository } from "../firestore/opportunity-discovery.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

function publicOrigin(): string {
  const value = process.env.RFXCHANGE_PUBLIC_ORIGIN?.trim() || "http://localhost:3000";
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("RFXCHANGE_PUBLIC_ORIGIN must be an origin without a path.");
  return url.origin;
}

async function validateCapabilityIds(ids: readonly string[] | null | undefined): Promise<void> {
  if (!ids?.length) return;
  const catalog = await loadImmutableAmacsCatalog();
  for (const rawId of ids) {
    const capabilityId = rawId.trim();
    if (!capabilityId || !(await catalog.hasCanonicalCapability(capabilityId))) {
      throw new OpportunityDiscoveryError("invalid", `Capability filter ${capabilityId || "(blank)"} is not in the pinned AMACS 0.5.0 catalog.`);
    }
  }
}

class GovernedOpportunityDiscoveryService extends OpportunityDiscoveryService {
  override async discover(
    scope: OpportunityParticipantScope,
    input: Parameters<OpportunityDiscoveryService["discover"]>[1],
  ) {
    await validateCapabilityIds(input.capabilityIds);
    return super.discover(scope, input);
  }

  override async saveSearch(
    scope: OpportunityParticipantScope,
    input: Parameters<OpportunityDiscoveryService["saveSearch"]>[1],
  ) {
    await validateCapabilityIds(input.query.capabilityIds);
    return super.saveSearch(scope, input);
  }
}

export function createServerOpportunityDiscoveryService(
  db: Firestore = getServerFirestore(),
) {
  return new GovernedOpportunityDiscoveryService(
    new FirestoreOpportunityDiscoveryRepository(db),
    undefined,
    publicOrigin(),
  );
}