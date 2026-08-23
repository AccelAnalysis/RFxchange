export const GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS = Object.freeze({
  canonicalGeographies: "canonicalGeographies",
  geographyVersions: "geographyVersions",
  geographyDatasetSources: "geographyDatasetSources",
  locationGeographyProfiles: "locationGeographyProfiles",
  locationGeographyMemberships: "locationGeographyMemberships",
  geographicScopes: "geographicScopes",
  geographicScopeMembers: "geographicScopeMembers",
  geographyFabricCommands: "geographyFabricCommands",
  geographyFabricEvents: "geographyFabricEvents",
  geographyMetricSnapshots: "geographyMetricSnapshots",
} as const);

export type GeographyFabricFirestoreCollectionKey =
  keyof typeof GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS;
export type GeographyFabricFirestoreCollectionName =
  (typeof GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS)[GeographyFabricFirestoreCollectionKey];

export type GeographyFabricFirestoreRecordScope =
  | "organization-scoped"
  | "platform-scoped"
  | "mixed-scope";

export interface GeographyFabricFirestoreCollectionConvention {
  readonly collection: GeographyFabricFirestoreCollectionName;
  readonly documentIdSource: "id";
  readonly scope: GeographyFabricFirestoreRecordScope;
  readonly organizationIdRequired: boolean;
  readonly appendOnly: boolean;
  readonly mutable: boolean;
}

/**
 * Slice-scoped Firestore extension for the RFxchange Geography Fabric.
 *
 * Existing `geographies` remain controlled Operating Geographies. These collections
 * hold source/vintage-qualified analytical geography, materialized location profiles,
 * governed scopes and privacy-safe analytical facts. Paths never prove authority;
 * every write remains behind an authorized server command or unit of work.
 */
export const GEOGRAPHY_FABRIC_FIRESTORE_COLLECTION_CONVENTIONS: Readonly<
  Record<
    GeographyFabricFirestoreCollectionKey,
    GeographyFabricFirestoreCollectionConvention
  >
> = Object.freeze({
  canonicalGeographies: Object.freeze({
    collection: GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS.canonicalGeographies,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  geographyVersions: Object.freeze({
    collection: GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS.geographyVersions,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
  geographyDatasetSources: Object.freeze({
    collection: GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS.geographyDatasetSources,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
  locationGeographyProfiles: Object.freeze({
    collection: GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS.locationGeographyProfiles,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  locationGeographyMemberships: Object.freeze({
    collection: GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS.locationGeographyMemberships,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
  geographicScopes: Object.freeze({
    collection: GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS.geographicScopes,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: false,
    mutable: true,
  }),
  geographicScopeMembers: Object.freeze({
    collection: GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS.geographicScopeMembers,
    documentIdSource: "id",
    scope: "organization-scoped",
    organizationIdRequired: true,
    appendOnly: true,
    mutable: false,
  }),
  geographyFabricCommands: Object.freeze({
    collection: GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS.geographyFabricCommands,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
  geographyFabricEvents: Object.freeze({
    collection: GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS.geographyFabricEvents,
    documentIdSource: "id",
    scope: "mixed-scope",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
  geographyMetricSnapshots: Object.freeze({
    collection: GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS.geographyMetricSnapshots,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
});

function stableDocumentId(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("Geography Fabric Firestore document id is required.");
  if (normalized.includes("/")) {
    throw new Error("Geography Fabric Firestore document id cannot contain a slash.");
  }
  if (normalized === "." || normalized === "..") {
    throw new Error("Geography Fabric Firestore document id cannot be . or ...");
  }
  return normalized;
}

export function geographyFabricCollectionName(
  key: GeographyFabricFirestoreCollectionKey,
): GeographyFabricFirestoreCollectionName {
  return GEOGRAPHY_FABRIC_FIRESTORE_COLLECTIONS[key];
}

export function geographyFabricDocumentPath(
  key: GeographyFabricFirestoreCollectionKey,
  id: string,
): string {
  return `${geographyFabricCollectionName(key)}/${stableDocumentId(id)}`;
}

export function assertGeographyFabricOrganizationScope(
  key: GeographyFabricFirestoreCollectionKey,
  organizationId: string | null | undefined,
): void {
  const convention = GEOGRAPHY_FABRIC_FIRESTORE_COLLECTION_CONVENTIONS[key];
  if (!convention.organizationIdRequired) return;
  if (!organizationId?.trim()) {
    throw new Error(`${convention.collection} records require an explicit organizationId.`);
  }
}
