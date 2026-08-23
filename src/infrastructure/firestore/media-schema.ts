export const GOVERNED_MEDIA_FIRESTORE_COLLECTIONS = Object.freeze({
  publicMediaProjections: "publicMediaProjections",
  organizationIntroductionMedia: "organizationIntroductionMedia",
  rfxAttachmentReferences: "rfxAttachmentReferences",
} as const);

export type GovernedMediaCollectionKey =
  keyof typeof GOVERNED_MEDIA_FIRESTORE_COLLECTIONS;
export type GovernedMediaCollectionName =
  (typeof GOVERNED_MEDIA_FIRESTORE_COLLECTIONS)[GovernedMediaCollectionKey];

export interface GovernedMediaCollectionConvention {
  readonly collection: GovernedMediaCollectionName;
  readonly serverOnly: true;
  readonly organizationScoped: true;
  readonly documentIdSource: "id";
}

export const GOVERNED_MEDIA_FIRESTORE_CONVENTIONS: Readonly<
  Record<GovernedMediaCollectionKey, GovernedMediaCollectionConvention>
> = Object.freeze({
  publicMediaProjections: Object.freeze({
    collection: GOVERNED_MEDIA_FIRESTORE_COLLECTIONS.publicMediaProjections,
    serverOnly: true,
    organizationScoped: true,
    documentIdSource: "id",
  }),
  organizationIntroductionMedia: Object.freeze({
    collection: GOVERNED_MEDIA_FIRESTORE_COLLECTIONS.organizationIntroductionMedia,
    serverOnly: true,
    organizationScoped: true,
    documentIdSource: "id",
  }),
  rfxAttachmentReferences: Object.freeze({
    collection: GOVERNED_MEDIA_FIRESTORE_COLLECTIONS.rfxAttachmentReferences,
    serverOnly: true,
    organizationScoped: true,
    documentIdSource: "id",
  }),
});

function safeDocumentId(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized === "." || normalized === ".." || normalized.includes("/")) {
    throw new Error("Governed media document id must be Firestore-safe.");
  }
  return normalized;
}

export function governedMediaCollectionName(
  key: GovernedMediaCollectionKey,
): GovernedMediaCollectionName {
  return GOVERNED_MEDIA_FIRESTORE_COLLECTIONS[key];
}

export function governedMediaDocumentPath(
  key: GovernedMediaCollectionKey,
  id: string,
): string {
  return `${governedMediaCollectionName(key)}/${safeDocumentId(id)}`;
}
