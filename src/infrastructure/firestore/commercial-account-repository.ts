import { FieldValue, Timestamp, type DocumentData, type DocumentSnapshot, type Firestore } from "firebase-admin/firestore";

import type { OrganizationId } from "../../domain/organizations/model";
import {
  createOrganizationCommercialAccount,
  evolveOrganizationCommercialAccount,
  type CommercialAccountId,
  type OrganizationCommercialAccount,
  type PaymentProviderReference,
} from "../../domain/commercial/model";
import type { OrganizationCommercialAccountRepository } from "../../domain/commercial/repository";
import { FIRESTORE_SCHEMA_VERSION, firestoreCollectionName } from "./schema";

const COLLECTION = firestoreCollectionName("organizationCommercialAccounts");

function timestampIso(value: unknown, label: string): string {
  if (!(value instanceof Timestamp)) throw new Error(`${label} must be a server Firestore timestamp.`);
  return value.toDate().toISOString();
}

function readAccount(snapshot: DocumentSnapshot<DocumentData>): OrganizationCommercialAccount | null {
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data || data.schemaVersion !== FIRESTORE_SCHEMA_VERSION) {
    throw new Error(`Commercial account ${snapshot.ref.path} has unsupported schemaVersion.`);
  }
  if (typeof data.organizationId !== "string" || data.organizationId !== snapshot.id) {
    throw new Error(`Commercial account ${snapshot.ref.path} has inconsistent organization identity.`);
  }
  const createdAt = timestampIso(data.createdAt, "Commercial account createdAt");
  const updatedAt = timestampIso(data.updatedAt, "Commercial account updatedAt");
  const providerReferences = Array.isArray(data.providerReferences)
    ? data.providerReferences as PaymentProviderReference[]
    : [];
  const subscription = data.subscription && typeof data.subscription === "object"
    ? data.subscription as Record<string, unknown>
    : {};
  const created = createOrganizationCommercialAccount({
    organizationId: data.organizationId,
    planKey: String(data.planKey ?? "free"),
    entitlementKeys: Array.isArray(data.entitlementKeys)
      ? data.entitlementKeys.filter((value: unknown): value is string => typeof value === "string")
      : [],
    providerReferences,
    subscription: {
      status: String(subscription.status ?? "not-subscribed") as OrganizationCommercialAccount["subscription"]["status"],
      providerSubscriptionReference:
        (subscription.providerSubscriptionReference as PaymentProviderReference | null | undefined) ?? null,
      currentPeriodEndsAt: typeof subscription.currentPeriodEndsAt === "string"
        ? subscription.currentPeriodEndsAt
        : null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd === true,
    },
    now: createdAt,
  });
  if (updatedAt === createdAt) return created;
  return evolveOrganizationCommercialAccount(created, {
    planKey: String(created.planKey),
    entitlementKeys: created.entitlementKeys.map(String),
    providerReferences: created.providerReferences,
    subscription: {
      status: created.subscription.status,
      providerSubscriptionReference: created.subscription.providerSubscriptionReference,
      currentPeriodEndsAt: created.subscription.currentPeriodEndsAt
        ? String(created.subscription.currentPeriodEndsAt)
        : null,
      cancelAtPeriodEnd: created.subscription.cancelAtPeriodEnd,
    },
    now: updatedAt,
  });
}

function persistenceFields(account: OrganizationCommercialAccount): Record<string, unknown> {
  return {
    id: String(account.id),
    organizationId: String(account.organizationId),
    planKey: String(account.planKey),
    subscription: account.subscription,
    entitlementKeys: account.entitlementKeys,
    providerReferences: account.providerReferences,
    schemaVersion: FIRESTORE_SCHEMA_VERSION,
  };
}

export class FirestoreOrganizationCommercialAccountRepository
  implements OrganizationCommercialAccountRepository
{
  constructor(private readonly db: Firestore) {}

  async getById(id: CommercialAccountId): Promise<OrganizationCommercialAccount | null> {
    return readAccount(await this.db.collection(COLLECTION).doc(String(id)).get());
  }

  async getByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrganizationCommercialAccount | null> {
    return readAccount(await this.db.collection(COLLECTION).doc(String(organizationId)).get());
  }

  async create(account: OrganizationCommercialAccount): Promise<void> {
    const ref = this.db.collection(COLLECTION).doc(String(account.organizationId));
    await this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (existing.exists) throw new Error("Organization commercial account already exists.");
      transaction.create(ref, {
        ...persistenceFields(account),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  async save(account: OrganizationCommercialAccount): Promise<void> {
    const ref = this.db.collection(COLLECTION).doc(String(account.organizationId));
    await this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(ref);
      if (!existing.exists) throw new Error("Organization commercial account does not exist.");
      const createdAt = existing.get("createdAt");
      if (!(createdAt instanceof Timestamp)) {
        throw new Error("Organization commercial account is missing canonical createdAt persistence metadata.");
      }
      transaction.set(ref, {
        ...persistenceFields(account),
        createdAt,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: false });
    });
  }
}
