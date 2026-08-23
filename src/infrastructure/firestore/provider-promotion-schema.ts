export const PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS = Object.freeze({
  candidates: "providerSeedPromotionCandidates",
  sourceRecords: "providerPromotionSourceRecords",
  geographyPreparations: "providerPromotionGeographyPreparations",
  comparisons: "providerCanonicalComparisons",
  approvals: "providerPromotionApprovals",
  commands: "providerPromotionCommands",
  events: "providerPromotionEvents",
  receipts: "providerPromotionReceipts",
  identityReservations: "providerSeedPromotionIdentityReservations",
  seededLocations: "seededProviderLocations",
  classifications: "seededProviderClassifications",
  resourceDrafts: "seededProviderResourceDrafts",
} as const);

export type ProviderPromotionFirestoreCollectionKey =
  keyof typeof PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS;
export type ProviderPromotionFirestoreCollectionName =
  (typeof PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS)[ProviderPromotionFirestoreCollectionKey];

export interface ProviderPromotionFirestoreConvention {
  readonly collection: ProviderPromotionFirestoreCollectionName;
  readonly appendOnly: boolean;
  readonly serverOnly: true;
  readonly publicProjection: false;
}

export const PROVIDER_PROMOTION_FIRESTORE_CONVENTIONS: Readonly<
  Record<ProviderPromotionFirestoreCollectionKey, ProviderPromotionFirestoreConvention>
> = Object.freeze({
  candidates: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.candidates, appendOnly: true, serverOnly: true, publicProjection: false }),
  sourceRecords: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.sourceRecords, appendOnly: true, serverOnly: true, publicProjection: false }),
  geographyPreparations: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.geographyPreparations, appendOnly: true, serverOnly: true, publicProjection: false }),
  comparisons: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.comparisons, appendOnly: true, serverOnly: true, publicProjection: false }),
  approvals: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.approvals, appendOnly: true, serverOnly: true, publicProjection: false }),
  commands: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.commands, appendOnly: true, serverOnly: true, publicProjection: false }),
  events: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.events, appendOnly: true, serverOnly: true, publicProjection: false }),
  receipts: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.receipts, appendOnly: true, serverOnly: true, publicProjection: false }),
  identityReservations: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.identityReservations, appendOnly: true, serverOnly: true, publicProjection: false }),
  seededLocations: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.seededLocations, appendOnly: true, serverOnly: true, publicProjection: false }),
  classifications: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.classifications, appendOnly: true, serverOnly: true, publicProjection: false }),
  resourceDrafts: Object.freeze({ collection: PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS.resourceDrafts, appendOnly: true, serverOnly: true, publicProjection: false }),
});

export function providerPromotionCollectionName(
  key: ProviderPromotionFirestoreCollectionKey,
): ProviderPromotionFirestoreCollectionName {
  return PROVIDER_PROMOTION_FIRESTORE_COLLECTIONS[key];
}

export function providerPromotionDocumentPath(
  key: ProviderPromotionFirestoreCollectionKey,
  id: string,
): string {
  const normalized = id.trim();
  if (!normalized || normalized === "." || normalized === ".." || normalized.includes("/")) {
    throw new Error("Provider promotion Firestore document id is invalid.");
  }
  return `${providerPromotionCollectionName(key)}/${normalized}`;
}
