import { FieldValue, type DocumentData, type Firestore, type Transaction } from "firebase-admin/firestore";

import {
  FOUNDING_CAP,
  commercialProjectionStatus,
  hasActiveFoundingRecognition,
  normalizeFoundingCapacity,
  reconcileFoundingCapacity,
  releaseExpiredCheckoutReservation,
  reserveFoundingCapacity,
  subscriptionRetainsCapacity,
  type FoundingCapacitySnapshot,
  type ProviderSubscriptionSnapshot,
} from "../application/market-ready-founding-commerce-reconcile.js";

export const COMMERCIAL_ACCOUNT_COLLECTION = "organizationCommercialAccounts" as const;
export const FOUNDING_CAPACITY_COLLECTION = "commercialFoundingCapacity" as const;
export const PROVIDER_EVENTS_COLLECTION = "commercialProviderEvents" as const;
export const SUBSCRIPTION_RECONCILIATION_COLLECTION = "commercialSubscriptionReconciliations" as const;
export const FOUNDING_CAPACITY_DOCUMENT_ID = "founding" as const;
export const COMMERCIAL_SCHEMA_VERSION = 1 as const;

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.includes("/")) throw new Error(`${label} is invalid.`);
  return normalized;
}

function capacityFrom(data: DocumentData | undefined): FoundingCapacitySnapshot {
  if (!data) {
    return Object.freeze({ cap: FOUNDING_CAP, committedOrganizationIds: [], reservedOrganizationIds: [] });
  }
  if (data.schemaVersion !== COMMERCIAL_SCHEMA_VERSION || data.cap !== FOUNDING_CAP) {
    throw new Error("Founding capacity persistence is malformed or unsupported.");
  }
  return normalizeFoundingCapacity({
    cap: data.cap,
    committedOrganizationIds: Array.isArray(data.committedOrganizationIds)
      ? data.committedOrganizationIds.filter((value): value is string => typeof value === "string")
      : [],
    reservedOrganizationIds: Array.isArray(data.reservedOrganizationIds)
      ? data.reservedOrganizationIds.filter((value): value is string => typeof value === "string")
      : [],
  });
}

function writeCapacity(
  transaction: Transaction,
  ref: FirebaseFirestore.DocumentReference,
  state: FoundingCapacitySnapshot,
  existing: DocumentData | undefined,
): void {
  transaction.set(ref, {
    id: FOUNDING_CAPACITY_DOCUMENT_ID,
    cap: state.cap,
    committedOrganizationIds: state.committedOrganizationIds,
    reservedOrganizationIds: state.reservedOrganizationIds,
    schemaVersion: COMMERCIAL_SCHEMA_VERSION,
    createdAt: existing?.createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: false });
}

function existingSubscriptionReference(account: DocumentData): string | null {
  const reference = account.subscription?.providerSubscriptionReference;
  return reference && typeof reference.externalReference === "string"
    ? reference.externalReference
    : null;
}

function accountSubscriptionStatus(account: DocumentData): string {
  return typeof account.subscription?.status === "string" ? account.subscription.status : "not-subscribed";
}

function accountCustomerReference(account: DocumentData): string {
  const values = Array.isArray(account.providerReferences) ? account.providerReferences : [];
  const customers = values.filter((value) => value?.kind === "customer" && value?.providerKey === "stripe");
  if (customers.length !== 1 || typeof customers[0]?.externalReference !== "string") {
    throw new Error("Commercial account must contain exactly one correlated Stripe Customer reference.");
  }
  return customers[0].externalReference;
}

function providerReference(kind: "customer" | "subscription", externalReference: string) {
  return Object.freeze({ providerKey: "stripe", kind, externalReference });
}

function canReplaceSubscription(account: DocumentData, incomingSubscriptionId: string): boolean {
  const existing = existingSubscriptionReference(account);
  if (!existing || existing === incomingSubscriptionId) return true;
  const status = accountSubscriptionStatus(account);
  return status === "canceled" || status === "not-subscribed";
}

export async function reserveFoundingSlot(db: Firestore, organizationIdValue: string): Promise<FoundingCapacitySnapshot> {
  const organizationId = required(organizationIdValue, "Organization id");
  const ref = db.collection(FOUNDING_CAPACITY_COLLECTION).doc(FOUNDING_CAPACITY_DOCUMENT_ID);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = capacityFrom(snapshot.data());
    const next = reserveFoundingCapacity(current, organizationId);
    writeCapacity(transaction, ref, next, snapshot.data());
    return next;
  });
}

export async function reconcileCurrentFoundingSubscription(input: Readonly<{
  db: Firestore;
  eventId: string;
  eventType: string;
  eventCreatedAt: string;
  snapshot: ProviderSubscriptionSnapshot;
}>): Promise<Readonly<{ duplicate: boolean; recognized: boolean; retainsCapacity: boolean }>> {
  const eventId = required(input.eventId, "Provider event id");
  const organizationId = required(input.snapshot.organizationId, "Organization id");
  const eventRef = input.db.collection(PROVIDER_EVENTS_COLLECTION).doc(eventId);
  const accountRef = input.db.collection(COMMERCIAL_ACCOUNT_COLLECTION).doc(organizationId);
  const capacityRef = input.db.collection(FOUNDING_CAPACITY_COLLECTION).doc(FOUNDING_CAPACITY_DOCUMENT_ID);
  const reconciliationRef = input.db.collection(SUBSCRIPTION_RECONCILIATION_COLLECTION).doc(organizationId);

  return input.db.runTransaction(async (transaction) => {
    const [event, account, capacity, reconciliation] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(accountRef),
      transaction.get(capacityRef),
      transaction.get(reconciliationRef),
    ]);
    if (event.exists) {
      return Object.freeze({
        duplicate: true,
        recognized: hasActiveFoundingRecognition(input.snapshot.status),
        retainsCapacity: subscriptionRetainsCapacity(input.snapshot.status),
      });
    }
    if (!account.exists || account.data()?.schemaVersion !== COMMERCIAL_SCHEMA_VERSION) {
      throw new Error("Authoritative organization commercial account is unavailable.");
    }
    const accountData = account.data()!;
    const customerId = accountCustomerReference(accountData);
    if (customerId !== input.snapshot.customerId) {
      throw new Error("Provider subscription Customer does not match the commercial account.");
    }
    if (!canReplaceSubscription(accountData, input.snapshot.id)) {
      throw new Error("Provider subscription does not match the authoritative organization subscription.");
    }

    const nextCapacity = reconcileFoundingCapacity(capacityFrom(capacity.data()), organizationId, input.snapshot.status);
    const recognized = hasActiveFoundingRecognition(input.snapshot.status);
    const projectedStatus = commercialProjectionStatus(input.snapshot.status);
    const customerReference = providerReference("customer", input.snapshot.customerId);
    const subscriptionReference = providerReference("subscription", input.snapshot.id);

    writeCapacity(transaction, capacityRef, nextCapacity, capacity.data());
    transaction.set(accountRef, {
      ...accountData,
      id: organizationId,
      organizationId,
      planKey: "founding",
      entitlementKeys: [],
      providerReferences: [customerReference, subscriptionReference],
      subscription: {
        status: projectedStatus,
        providerSubscriptionReference: subscriptionReference,
        currentPeriodEndsAt: input.snapshot.currentPeriodEndsAt,
        cancelAtPeriodEnd: input.snapshot.cancelAtPeriodEnd,
      },
      schemaVersion: COMMERCIAL_SCHEMA_VERSION,
      createdAt: accountData.createdAt,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: false });
    transaction.create(eventRef, {
      id: eventId,
      organizationId,
      providerKey: "stripe",
      eventType: required(input.eventType, "Provider event type"),
      providerSubscriptionId: input.snapshot.id,
      observedStatus: input.snapshot.status,
      eventCreatedAt: input.eventCreatedAt,
      schemaVersion: COMMERCIAL_SCHEMA_VERSION,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.set(reconciliationRef, {
      id: organizationId,
      organizationId,
      providerKey: "stripe",
      providerCustomerId: input.snapshot.customerId,
      providerSubscriptionId: input.snapshot.id,
      observedStatus: input.snapshot.status,
      activeRecognition: recognized,
      retainsCapacity: subscriptionRetainsCapacity(input.snapshot.status),
      lastProviderEventId: eventId,
      lastProviderEventCreatedAt: input.eventCreatedAt,
      schemaVersion: COMMERCIAL_SCHEMA_VERSION,
      createdAt: reconciliation.data()?.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: false });

    return Object.freeze({
      duplicate: false,
      recognized,
      retainsCapacity: subscriptionRetainsCapacity(input.snapshot.status),
    });
  });
}

export async function reconcileExpiredFoundingCheckout(input: Readonly<{
  db: Firestore;
  eventId: string;
  organizationId: string;
  eventCreatedAt: string;
  providerHasNonTerminalFoundingSubscription: boolean;
}>): Promise<Readonly<{ duplicate: boolean }>> {
  const eventId = required(input.eventId, "Provider event id");
  const organizationId = required(input.organizationId, "Organization id");
  const eventRef = input.db.collection(PROVIDER_EVENTS_COLLECTION).doc(eventId);
  const capacityRef = input.db.collection(FOUNDING_CAPACITY_COLLECTION).doc(FOUNDING_CAPACITY_DOCUMENT_ID);
  return input.db.runTransaction(async (transaction) => {
    const [event, capacity] = await Promise.all([transaction.get(eventRef), transaction.get(capacityRef)]);
    if (event.exists) return Object.freeze({ duplicate: true });
    const next = releaseExpiredCheckoutReservation({
      current: capacityFrom(capacity.data()),
      organizationId,
      providerHasNonTerminalFoundingSubscription: input.providerHasNonTerminalFoundingSubscription,
    });
    writeCapacity(transaction, capacityRef, next, capacity.data());
    transaction.create(eventRef, {
      id: eventId,
      organizationId,
      providerKey: "stripe",
      eventType: "checkout.session.expired",
      eventCreatedAt: input.eventCreatedAt,
      schemaVersion: COMMERCIAL_SCHEMA_VERSION,
      createdAt: FieldValue.serverTimestamp(),
    });
    return Object.freeze({ duplicate: false });
  });
}

export async function recordFoundingCheckoutCompletionWithoutRecognition(input: Readonly<{
  db: Firestore;
  eventId: string;
  organizationId: string;
  eventCreatedAt: string;
}>): Promise<Readonly<{ duplicate: boolean }>> {
  const eventId = required(input.eventId, "Provider event id");
  const organizationId = required(input.organizationId, "Organization id");
  const eventRef = input.db.collection(PROVIDER_EVENTS_COLLECTION).doc(eventId);
  return input.db.runTransaction(async (transaction) => {
    const event = await transaction.get(eventRef);
    if (event.exists) return Object.freeze({ duplicate: true });
    transaction.create(eventRef, {
      id: eventId,
      organizationId,
      providerKey: "stripe",
      eventType: "checkout.session.completed",
      authoritativeRecognitionGranted: false,
      eventCreatedAt: input.eventCreatedAt,
      schemaVersion: COMMERCIAL_SCHEMA_VERSION,
      createdAt: FieldValue.serverTimestamp(),
    });
    return Object.freeze({ duplicate: false });
  });
}
