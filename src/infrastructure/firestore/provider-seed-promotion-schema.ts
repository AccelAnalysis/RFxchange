export const PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS = Object.freeze({
  sourceRecords: "providerSeedSourceRecords",
  candidates: "providerSeedPromotionCandidates",
  geographyPackets: "providerSeedGeographyPackets",
  canonicalSearchSnapshots: "providerSeedCanonicalSearchSnapshots",
  comparisons: "providerSeedCanonicalComparisons",
  approvals: "providerSeedPromotionApprovals",
  sourceBackedLocations: "sourceBackedOrganizationLocations",
  seedDrafts: "providerSeedDrafts",
  commands: "providerSeedPromotionCommands",
  events: "providerSeedPromotionEvents",
  receipts: "providerSeedPromotionReceipts",
} as const);

export type ProviderSeedPromotionFirestoreCollectionKey =
  keyof typeof PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS;
export type ProviderSeedPromotionFirestoreCollectionName =
  (typeof PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS)[ProviderSeedPromotionFirestoreCollectionKey];

export interface ProviderSeedPromotionFirestoreCollectionConvention {
  readonly collection: ProviderSeedPromotionFirestoreCollectionName;
  readonly documentIdSource: "id";
  readonly scope: "platform-scoped" | "organization-scoped" | "mixed-scope";
  readonly organizationIdRequired: boolean;
  readonly appendOnly: true;
  readonly mutable: false;
  readonly serverOnly: true;
}

/**
 * Server-only Firestore extension for source-backed provider comparison, approval,
 * canonical staging and committed promotion receipts. None of these collections
 * authorizes participant or public projection.
 */
export const PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTION_CONVENTIONS: Readonly<
  Record<
    ProviderSeedPromotionFirestoreCollectionKey,
    ProviderSeedPromotionFirestoreCollectionConvention
  >
> = Object.freeze({
  sourceRecords: Object.freeze({
    collection: PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS.sourceRecords,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
    serverOnly: true,
  }),
  candidates: Object.freeze({
    collection: PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS.candidates,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
    serverOnly: true,
  }),
  geographyPackets: Object.freeze({
    collection: PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS.geographyPackets,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
    serverOnly: true,
  }),
  canonicalSearchSnapshots: Object.freeze({
    collection: PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS.canonicalSearchSnapshots,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
    serverOnly: true,
  }),
  comparisons: Object.freeze({
    collection: PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS.comparisons,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
    serverOnly: true,
  }),
  approvals: Object.freeze({
    collection: PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS.approvals,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
    serverOnly: true,
  }),
  sourceBackedLocations: Object.freeze({
    collection: PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS.sourceBackedLocations,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
    serverOnly: true,
  }),
  seedDrafts: Object.freeze({
    collection: PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS.seedDrafts,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
    serverOnly: true,
  }),
  commands: Object.freeze({
    collection: PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS.commands,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
    serverOnly: true,
  }),
  events: Object.freeze({
    collection: PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS.events,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
    serverOnly: true,
  }),
  receipts: Object.freeze({
    collection: PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS.receipts,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
    serverOnly: true,
  }),
});

function stableDocumentId(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("Provider seed promotion document id is required.");
  if (normalized.includes("/") || normalized === "." || normalized === "..") {
    throw new Error("Provider seed promotion document id is not Firestore-safe.");
  }
  return normalized;
}

export function providerSeedPromotionCollectionName(
  key: ProviderSeedPromotionFirestoreCollectionKey,
): ProviderSeedPromotionFirestoreCollectionName {
  return PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTIONS[key];
}

export function providerSeedPromotionDocumentPath(
  key: ProviderSeedPromotionFirestoreCollectionKey,
  id: string,
): string {
  return `${providerSeedPromotionCollectionName(key)}/${stableDocumentId(id)}`;
}

export function assertProviderSeedPromotionOrganizationScope(
  key: ProviderSeedPromotionFirestoreCollectionKey,
  organizationId: string | null | undefined,
): void {
  const convention = PROVIDER_SEED_PROMOTION_FIRESTORE_COLLECTION_CONVENTIONS[key];
  if (!convention.organizationIdRequired) return;
  if (!organizationId?.trim()) {
    throw new Error(`${convention.collection} records require an explicit organizationId.`);
  }
}
