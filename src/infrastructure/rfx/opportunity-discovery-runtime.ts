import type { Firestore } from "firebase-admin/firestore";

import { BoundedOpportunityDiscoveryService } from "../../application/rfx/bounded-opportunity-discovery-service.ts";
import {
  OpportunityDiscoveryError,
  type OpportunityParticipantScope,
} from "../../application/rfx/opportunity-discovery-service.ts";
import { loadImmutableAmacsCatalog } from "../amacs/runtime.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { Wave4GapOpportunityDiscoveryRepository } from "./wave4-gap-opportunity-discovery-repository.ts";

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

class GovernedOpportunityDiscoveryService extends BoundedOpportunityDiscoveryService {
  override async discover(
    scope: OpportunityParticipantScope,
    input: Parameters<BoundedOpportunityDiscoveryService["discover"]>[1],
  ) {
    await validateCapabilityIds(input.capabilityIds);
    return super.discover(scope, input);
  }

  override async saveSearch(
    scope: OpportunityParticipantScope,
    input: Parameters<BoundedOpportunityDiscoveryService["saveSearch"]>[1],
  ) {
    await validateCapabilityIds(input.query.capabilityIds);
    return super.saveSearch(scope, input);
  }
}

export function createServerOpportunityDiscoveryService(
  db: Firestore = getServerFirestore(),
) {
  return new GovernedOpportunityDiscoveryService(
    new Wave4GapOpportunityDiscoveryRepository(db),
    undefined,
    publicOrigin(),
  );
}
