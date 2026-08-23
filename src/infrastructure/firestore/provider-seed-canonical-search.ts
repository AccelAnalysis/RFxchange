import type {
  DocumentData,
  Firestore,
} from "firebase-admin/firestore";

import {
  normalizeOrganizationDomain,
  normalizeOrganizationName,
  type OrganizationDiscoveryRecord,
} from "../../domain/organization-resolution/model.ts";
import type {
  ProviderCanonicalMatchBasis,
  ProviderCanonicalMatchEvidence,
} from "../../domain/provider-seeding/promotion.ts";
import type {
  ProviderCanonicalOrganizationSearchInput,
  ProviderCanonicalOrganizationSearchPort,
} from "../../domain/provider-seeding/promotion-repository.ts";
import {
  createProviderCanonicalSearchSnapshot,
  type ProviderCanonicalSearchSnapshot,
  type ProviderSeedSourceRecord,
} from "../../domain/provider-seeding/promotion-runtime.ts";
import { FIRESTORE_COLLECTIONS } from "./schema.ts";

function sourceDomain(source: ProviderSeedSourceRecord): string | null {
  if (!source.website) return null;
  return normalizeOrganizationDomain(source.website);
}

function sameAddress(
  record: OrganizationDiscoveryRecord,
  source: ProviderSeedSourceRecord,
): boolean {
  const address = record.address?.value;
  if (!address) return false;
  const sourceAddress = source.location.address;
  return normalizeOrganizationName(address.line1)
      === normalizeOrganizationName(sourceAddress.addressLine1)
    && normalizeOrganizationName(address.locality)
      === normalizeOrganizationName(sourceAddress.locality)
    && address.region.toUpperCase() === sourceAddress.regionCode.toUpperCase()
    && (address.postalCode ?? null) === sourceAddress.postalCode;
}

function matchBasis(
  record: OrganizationDiscoveryRecord,
  source: ProviderSeedSourceRecord,
): readonly ProviderCanonicalMatchBasis[] {
  const basis: ProviderCanonicalMatchBasis[] = [];
  const provenanceValues = [
    record.displayName.provenance,
    ...record.aliases.map((value) => value.provenance),
    ...record.categories.map((value) => value.provenance),
    ...(record.address ? [record.address.provenance] : []),
    ...(record.domain ? [record.domain.provenance] : []),
  ];
  if (
    provenanceValues.some((value) =>
      value.sourceRecordId === source.primarySourceId
      || value.sourceRecordId === source.id
    )
  ) {
    basis.push("authoritative-source-id");
  }

  const domain = sourceDomain(source);
  if (domain && record.domain?.value === domain) basis.push("website-domain");
  if (sameAddress(record, source)) basis.push("accepted-address");

  const sourceName = normalizeOrganizationName(source.displayName);
  const recordName = normalizeOrganizationName(record.displayName.value);
  if (sourceName === recordName) basis.push("display-name");

  const sourceAliases = new Set(source.aliases.map(normalizeOrganizationName));
  const recordAliases = new Set(
    record.aliases.map((value) => normalizeOrganizationName(value.value)),
  );
  if (
    sourceAliases.has(recordName)
    || recordAliases.has(sourceName)
    || [...sourceAliases].some((alias) => recordAliases.has(alias))
  ) {
    basis.push("alias");
  }
  return Object.freeze([...new Set(basis)]);
}

function confidence(basis: readonly ProviderCanonicalMatchBasis[]): number {
  if (basis.includes("authoritative-source-id")) return 1;
  if (basis.includes("website-domain")) return 0.98;
  if (basis.includes("accepted-address")) return 0.94;
  if (basis.includes("display-name")) return 0.86;
  return 0.8;
}

function evidenceSummary(
  basis: readonly ProviderCanonicalMatchBasis[],
): string {
  return `Current canonical search matched: ${basis.join(", ")}.`;
}

function recordFromData(
  id: string,
  data: DocumentData,
): OrganizationDiscoveryRecord {
  if (data.id !== id) {
    throw new Error("Canonical Organization discovery document identity is inconsistent.");
  }
  return data as unknown as OrganizationDiscoveryRecord;
}

export class FirestoreProviderCanonicalOrganizationSearch
  implements ProviderCanonicalOrganizationSearchPort
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async searchCurrent(
    input: ProviderCanonicalOrganizationSearchInput,
  ): Promise<ProviderCanonicalSearchSnapshot> {
    const excluded = new Set(input.excludeOrganizationIds);
    const snapshot = await this.db
      .collection(FIRESTORE_COLLECTIONS.organizationDiscoveryRecords)
      .get();
    const matches: ProviderCanonicalMatchEvidence[] = [];
    for (const document of snapshot.docs) {
      const record = recordFromData(document.id, document.data());
      if (excluded.has(record.organizationId)) continue;
      const basis = matchBasis(record, input.sourceRecord);
      if (basis.length === 0) continue;
      matches.push(
        Object.freeze({
          organizationId: record.organizationId,
          displayName: record.displayName.value,
          basis,
          confidence: confidence(basis),
          evidenceSummary: evidenceSummary(basis),
        }),
      );
    }
    matches.sort((left, right) =>
      left.organizationId.localeCompare(right.organizationId)
    );
    return createProviderCanonicalSearchSnapshot({
      id: `${input.candidateId}:fresh-canonical-search`,
      candidateId: input.candidateId,
      matches,
      generatedAt: input.generatedAt,
    });
  }
}
