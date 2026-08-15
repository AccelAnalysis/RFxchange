import type { Firestore } from "firebase-admin/firestore";

import { BoundedOpportunityDiscoveryService } from "../../application/rfx/bounded-opportunity-discovery-service.ts";
import {
  OpportunityDiscoveryError,
  type OpportunityParticipantScope,
} from "../../application/rfx/opportunity-discovery-service.ts";
import { createOpportunityDiscoveryQuery } from "../../domain/rfx/discovery.ts";
import { geographyId } from "../../domain/geography/model.ts";
import { loadImmutableAmacsCatalog } from "../amacs/runtime.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { Wave4GapOpportunityDiscoveryRepository } from "./wave4-gap-opportunity-discovery-repository.ts";

function publicOrigin(): string {
  const value = process.env.RFXCHANGE_PUBLIC_ORIGIN?.trim() || "http://localhost:3000";
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) throw new Error("RFXCHANGE_PUBLIC_ORIGIN must be an origin without a path.");
  return url.origin;
}

function stableIdentifier(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new OpportunityDiscoveryError("invalid", `${label} is invalid.`);
  }
  return normalized;
}

function normalizedQuery(input: Parameters<typeof createOpportunityDiscoveryQuery>[0]) {
  try {
    return createOpportunityDiscoveryQuery(input);
  } catch (error) {
    throw new OpportunityDiscoveryError(
      "invalid",
      error instanceof Error ? error.message : "Opportunity query is invalid.",
    );
  }
}

async function validateGovernedFilters(
  db: Firestore,
  input: Parameters<typeof createOpportunityDiscoveryQuery>[0],
): Promise<void> {
  // Normalize and bound every caller-controlled collection before authority fan-out.
  const query = normalizedQuery(input);

  if (query.capabilityIds.length || query.requestFamilyKeys.length) {
    const catalog = await loadImmutableAmacsCatalog();
    for (const rawId of query.capabilityIds) {
      const capabilityId = rawId.trim().toUpperCase();
      if (!capabilityId || !(await catalog.hasCanonicalCapability(capabilityId))) {
        throw new OpportunityDiscoveryError(
          "invalid",
          `Capability filter ${capabilityId || "(blank)"} is not in the pinned AMACS 0.5.0 catalog.`,
        );
      }
    }

    for (const rawId of query.requestFamilyKeys) {
      const requestFamilyId = rawId.trim().toUpperCase();
      const requestFamily = requestFamilyId
        ? await catalog.getRequestFamily(requestFamilyId)
        : null;
      if (!requestFamily || requestFamily.status !== "active") {
        throw new OpportunityDiscoveryError(
          "invalid",
          `Request-family filter ${requestFamilyId || "(blank)"} is not in the pinned AMACS 0.5.0 catalog.`,
        );
      }
    }
  }

  const localityIds = query.localityIds.map((rawId) => {
    try {
      return geographyId(rawId);
    } catch {
      throw new OpportunityDiscoveryError(
        "invalid",
        `Locality filter ${rawId || "(blank)"} is invalid.`,
      );
    }
  });
  if (localityIds.length) {
    const snapshots = await db.getAll(
      ...localityIds.map((id) => db.collection("geographies").doc(id)),
    );
    for (let index = 0; index < snapshots.length; index += 1) {
      const snapshot = snapshots[index];
      if (!snapshot.exists || snapshot.get("releaseState") !== "released") {
        throw new OpportunityDiscoveryError(
          "invalid",
          `Locality filter ${localityIds[index]} is not an available controlled geography.`,
        );
      }
    }
  }
}

class GovernedOpportunityDiscoveryService extends BoundedOpportunityDiscoveryService {
  private readonly governedDb: Firestore;
  private readonly governedRepository: Wave4GapOpportunityDiscoveryRepository;

  constructor(governedDb: Firestore, origin: string) {
    const repository = new Wave4GapOpportunityDiscoveryRepository(governedDb);
    super(repository, undefined, origin);
    this.governedDb = governedDb;
    this.governedRepository = repository;
  }

  override async discover(
    scope: OpportunityParticipantScope,
    input: Parameters<BoundedOpportunityDiscoveryService["discover"]>[1],
  ) {
    await validateGovernedFilters(this.governedDb, input);
    return super.discover(scope, input);
  }

  override async saveSearch(
    scope: OpportunityParticipantScope,
    input: Parameters<BoundedOpportunityDiscoveryService["saveSearch"]>[1],
  ) {
    const commandId = stableIdentifier(input.commandId, "Command identity");

    // Exact retries remain recoverable even if a previously valid filter later becomes stale.
    // The superclass rechecks the stored fingerprint before returning the committed record.
    if (await this.governedRepository.getCommand(commandId)) {
      return super.saveSearch(scope, input);
    }

    // Pause/delete are status-only corrections in the participant UI. Preserve the authoritative
    // stored query so cleanup remains reachable after an AMACS or geography authority change.
    if (input.savedSearchId && (input.status === "paused" || input.status === "deleted")) {
      const savedSearchId = stableIdentifier(input.savedSearchId, "Saved search identity");
      const existing = await this.governedRepository.getSavedSearch(savedSearchId);
      if (
        existing &&
        existing.organizationId === scope.organizationId &&
        existing.userId === scope.userId
      ) {
        return super.saveSearch(scope, Object.freeze({ ...input, query: existing.query }));
      }
      return super.saveSearch(scope, input);
    }

    await validateGovernedFilters(this.governedDb, input.query);
    return super.saveSearch(scope, input);
  }
}

export function createServerOpportunityDiscoveryService(
  db: Firestore = getServerFirestore(),
) {
  return new GovernedOpportunityDiscoveryService(db, publicOrigin());
}
