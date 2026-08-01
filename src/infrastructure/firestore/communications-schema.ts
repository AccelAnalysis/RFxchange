import type { FirestoreCollectionConvention } from "./schema.ts";

export const COMMUNICATIONS_FIRESTORE_COLLECTIONS = Object.freeze({
  transactionalEmailDeliveries: "transactionalEmailDeliveries",
  transactionalEmailDeliveryEvents: "transactionalEmailDeliveryEvents",
} as const);

export type CommunicationsFirestoreCollectionKey =
  keyof typeof COMMUNICATIONS_FIRESTORE_COLLECTIONS;
export type CommunicationsFirestoreCollectionName =
  (typeof COMMUNICATIONS_FIRESTORE_COLLECTIONS)[CommunicationsFirestoreCollectionKey];

/**
 * Slice-scoped extension of the canonical Firestore schema registry. These platform-operational
 * records are intentionally not organization-root records: organizationId is optional routing
 * context and every read remains behind an authorized server projection.
 */
export const COMMUNICATIONS_FIRESTORE_COLLECTION_CONVENTIONS: Readonly<
  Record<CommunicationsFirestoreCollectionKey, FirestoreCollectionConvention>
> = Object.freeze({
  transactionalEmailDeliveries: Object.freeze({
    collection: COMMUNICATIONS_FIRESTORE_COLLECTIONS.transactionalEmailDeliveries,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: false,
    mutable: true,
  }),
  transactionalEmailDeliveryEvents: Object.freeze({
    collection: COMMUNICATIONS_FIRESTORE_COLLECTIONS.transactionalEmailDeliveryEvents,
    documentIdSource: "id",
    scope: "platform-scoped",
    organizationIdRequired: false,
    appendOnly: true,
    mutable: false,
  }),
});
