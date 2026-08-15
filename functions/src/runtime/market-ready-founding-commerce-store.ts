import {
  FieldValue,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";

import {
  FOUNDING_CAP,
  PROVIDER_SUBSCRIPTION_STATUSES,
  commercialProjectionStatus,
  hasActiveFoundingRecognition,
  normalizeFoundingCapacity,
  reconcileFoundingCapacity,
  releaseExpiredCheckoutReservation,
  shouldApplyProviderLifecycleObservation,
  subscriptionRetainsCapacity,
  type FoundingCapacitySnapshot,
  type ProviderSubscriptionSnapshot,
  type ProviderSubscriptionStatus,
} from "../application/market-ready-founding-commerce-reconcile.js";

export const COMMERCIAL_ACCOUNT_COLLECTION = "organizationCommercialAccounts" as const;
export const FOUNDING_CAPACITY_COLLECTION = "commercialFoundingCapacity" as const;
export const PROVIDER_EVENTS_COLLECTION = "commercialProviderEvents" as const;
export const SUBSCRIPTION_RECONCILIATION_COLLECTION = "commercialSubscriptionReconciliations" as const;
export const FOUNDING_CAPACITY_DOCUMENT_ID = "current" as const;
export const COMMERCIAL_SCHEMA_VERSION = 1 as const;

interface CapacityReservation {
  readonly reservationId: string;
  readonly organizationId: string;
  readonly checkoutSessionId: string | null;
  readonly checkoutUrl: string | null;
}
interface PersistedCapacity {
  readonly committedOrganizationIds: readonly string[];
  readonly reservations: readonly CapacityReservation[];
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.includes("/")) throw new Error(`${label} is invalid.`);
  return normalized;
}

function persistedCapacity(data: DocumentData | undefined): PersistedCapacity {
  if (!data) return Object.freeze({ committedOrganizationIds: [], reservations: [] });
  if (data.schemaVersion !== COMMERCIAL_SCHEMA_VERSION || data.limit !== FOUNDING_CAP) {
    throw new Error("Founding capacity persistence is malformed or unsupported.");
  }
  const committedOrganizationIds = Array.isArray(data.committedOrganizationIds)
    ? data.committedOrganizationIds.filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    : [];
  const reservations = Array.isArray(data.reservations)
    ? data.reservations.map((value): CapacityReservation => {
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Founding capacity reservation is malformed.");
        const record = value as Record<string, unknown>;
        if (
          typeof record.reservationId !== "string" ||
          typeof record.organizationId !== "string" ||
          (record.checkoutSessionId !== null && typeof record.checkoutSessionId !== "string") ||
          (record.checkoutUrl !== null && typeof record.checkoutUrl !== "string")
        ) throw new Error("Founding capacity reservation is malformed.");
        return Object.freeze({
          reservationId: record.reservationId,
          organizationId: record.organizationId,
          checkoutSessionId: record.checkoutSessionId as string | null,
          checkoutUrl: record.checkoutUrl as string | null,
        });
      })
    : [];
  if (new Set(reservations.map((value) => value.organizationId)).size !== reservations.length) {
    throw new Error("Founding capacity contains duplicate organization reservations.");
  }
  return Object.freeze({ committedOrganizationIds: Object.freeze([...new Set(committedOrganizationIds)]), reservations: Object.freeze(reservations) });
}

function capacitySnapshot(value: PersistedCapacity): FoundingCapacitySnapshot {
  return normalizeFoundingCapacity({
    cap: FOUNDING_CAP,
    committedOrganizationIds: value.committedOrganizationIds,
    reservedOrganizationIds: value.reservations.map((reservation) => reservation.organizationId),
  });
}

function capacityRecordFrom(current: PersistedCapacity, next: FoundingCapacitySnapshot): PersistedCapacity {
  const reserved = new Set(next.reservedOrganizationIds);
  return Object.freeze({
    committedOrganizationIds: next.committedOrganizationIds,
    reservations: Object.freeze(current.reservations.filter((reservation) => reserved.has(reservation.organizationId))),
  });
}

function writeCapacity(transaction: Transaction, ref: DocumentReference, state: PersistedCapacity, existing: DocumentData | undefined): void {
  transaction.set(ref, {
    id: FOUNDING_CAPACITY_DOCUMENT_ID,
    limit: FOUNDING_CAP,
    committedOrganizationIds: state.committedOrganizationIds,
    reservations: state.reservations,
    schemaVersion: COMMERCIAL_SCHEMA_VERSION,
    createdAt: existing?.createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: false });
}

function existingSubscriptionReference(account: DocumentData): string | null {
  const reference = account.subscription?.providerSubscriptionReference;
  return reference && typeof reference.externalReference === "string" ? reference.externalReference : null;
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
function assertCheckoutCustomer(account: DocumentData, customerId: string): void {
  if (accountCustomerReference(account) !== customerId) throw new Error("Stripe Checkout Customer does not match the commercial account.");
}

function previousLifecycleState(data: DocumentData | undefined): Readonly<{
  createdAt: string | null;
  status: ProviderSubscriptionStatus | null;
  recognized: boolean;
  retainsCapacity: boolean;
}> {
  if (!data) return Object.freeze({ createdAt: null, status: null, recognized: false, retainsCapacity: false });
  const createdAt = data.lastProviderEventCreatedAt;
  if (createdAt != null && typeof createdAt !== "string") throw new Error("Subscription reconciliation event ordering metadata is malformed.");
  const status = data.observedStatus;
  if (status != null && (typeof status !== "string" || !(PROVIDER_SUBSCRIPTION_STATUSES as readonly string[]).includes(status))) {
    throw new Error("Subscription reconciliation provider status is malformed.");
  }
  if (typeof data.activeRecognition !== "boolean" || typeof data.retainsCapacity !== "boolean") {
    throw new Error("Subscription reconciliation authority state is malformed.");
  }
  return Object.freeze({
    createdAt: createdAt ?? null,
    status: (status ?? null) as ProviderSubscriptionStatus | null,
    recognized: data.activeRecognition,
    retainsCapacity: data.retainsCapacity,
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
  const eventType = required(input.eventType, "Provider event type");
  const organizationId = required(input.snapshot.organizationId, "Organization id");
  const eventRef = input.db.collection(PROVIDER_EVENTS_COLLECTION).doc(eventId);
  const accountRef = input.db.collection(COMMERCIAL_ACCOUNT_COLLECTION).doc(organizationId);
  const capacityRef = input.db.collection(FOUNDING_CAPACITY_COLLECTION).doc(FOUNDING_CAPACITY_DOCUMENT_ID);
  const reconciliationRef = input.db.collection(SUBSCRIPTION_RECONCILIATION_COLLECTION).doc(organizationId);

  return input.db.runTransaction(async (transaction) => {
    const [event, account, capacity, reconciliation] = await Promise.all([
      transaction.get(eventRef), transaction.get(accountRef), transaction.get(capacityRef), transaction.get(reconciliationRef),
    ]);
    if (event.exists) return Object.freeze({ duplicate: true, recognized: hasActiveFoundingRecognition(input.snapshot.status), retainsCapacity: subscriptionRetainsCapacity(input.snapshot.status) });
    if (!account.exists || account.data()?.schemaVersion !== COMMERCIAL_SCHEMA_VERSION) throw new Error("Authoritative organization commercial account is unavailable.");
    const accountData = account.data()!;
    assertCheckoutCustomer(accountData, input.snapshot.customerId);

    const previous = previousLifecycleState(reconciliation.data());
    const shouldApply = shouldApplyProviderLifecycleObservation({
      incomingCreatedAt: input.eventCreatedAt,
      incomingStatus: input.snapshot.status,
      previousCreatedAt: previous.createdAt,
      previousStatus: previous.status,
    });
    if (!shouldApply) {
      transaction.create(eventRef, {
        id: eventId,
        organizationId,
        providerKey: "stripe",
        eventType,
        providerSubscriptionId: input.snapshot.id,
        observedStatus: input.snapshot.status,
        eventCreatedAt: input.eventCreatedAt,
        ignoredAsStale: true,
        schemaVersion: COMMERCIAL_SCHEMA_VERSION,
        createdAt: FieldValue.serverTimestamp(),
      });
      return Object.freeze({ duplicate: false, recognized: previous.recognized, retainsCapacity: previous.retainsCapacity });
    }

    if (!canReplaceSubscription(accountData, input.snapshot.id)) throw new Error("Provider subscription does not match the authoritative organization subscription.");

    const currentCapacity = persistedCapacity(capacity.data());
    const nextSnapshot = reconcileFoundingCapacity(capacitySnapshot(currentCapacity), organizationId, input.snapshot.status);
    const nextCapacity = capacityRecordFrom(currentCapacity, nextSnapshot);
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
      entitlementKeys: recognized ? ["founding.recognition"] : [],
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
      eventType,
      providerSubscriptionId: input.snapshot.id,
      observedStatus: input.snapshot.status,
      eventCreatedAt: input.eventCreatedAt,
      ignoredAsStale: false,
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
    return Object.freeze({ duplicate: false, recognized, retainsCapacity: subscriptionRetainsCapacity(input.snapshot.status) });
  });
}

export async function reconcileExpiredFoundingCheckout(input: Readonly<{
  db: Firestore;
  eventId: string;
  organizationId: string;
  customerId: string;
  eventCreatedAt: string;
  providerHasNonTerminalFoundingSubscription: boolean;
}>): Promise<Readonly<{ duplicate: boolean }>> {
  const eventId = required(input.eventId, "Provider event id");
  const organizationId = required(input.organizationId, "Organization id");
  const eventRef = input.db.collection(PROVIDER_EVENTS_COLLECTION).doc(eventId);
  const accountRef = input.db.collection(COMMERCIAL_ACCOUNT_COLLECTION).doc(organizationId);
  const capacityRef = input.db.collection(FOUNDING_CAPACITY_COLLECTION).doc(FOUNDING_CAPACITY_DOCUMENT_ID);
  return input.db.runTransaction(async (transaction) => {
    const [event, account, capacity] = await Promise.all([transaction.get(eventRef), transaction.get(accountRef), transaction.get(capacityRef)]);
    if (event.exists) return Object.freeze({ duplicate: true });
    if (!account.exists || account.data()?.schemaVersion !== COMMERCIAL_SCHEMA_VERSION) throw new Error("Authoritative organization commercial account is unavailable.");
    assertCheckoutCustomer(account.data()!, input.customerId);
    const currentCapacity = persistedCapacity(capacity.data());
    const nextSnapshot = releaseExpiredCheckoutReservation({
      current: capacitySnapshot(currentCapacity), organizationId,
      providerHasNonTerminalFoundingSubscription: input.providerHasNonTerminalFoundingSubscription,
    });
    writeCapacity(transaction, capacityRef, capacityRecordFrom(currentCapacity, nextSnapshot), capacity.data());
    transaction.create(eventRef, {
      id: eventId, organizationId, providerKey: "stripe", eventType: "checkout.session.expired",
      eventCreatedAt: input.eventCreatedAt, schemaVersion: COMMERCIAL_SCHEMA_VERSION, createdAt: FieldValue.serverTimestamp(),
    });
    return Object.freeze({ duplicate: false });
  });
}

export async function recordFoundingCheckoutCompletionWithoutRecognition(input: Readonly<{
  db: Firestore;
  eventId: string;
  organizationId: string;
  customerId: string;
  eventCreatedAt: string;
}>): Promise<Readonly<{ duplicate: boolean }>> {
  const eventId = required(input.eventId, "Provider event id");
  const organizationId = required(input.organizationId, "Organization id");
  const eventRef = input.db.collection(PROVIDER_EVENTS_COLLECTION).doc(eventId);
  const accountRef = input.db.collection(COMMERCIAL_ACCOUNT_COLLECTION).doc(organizationId);
  return input.db.runTransaction(async (transaction) => {
    const [event, account] = await Promise.all([transaction.get(eventRef), transaction.get(accountRef)]);
    if (event.exists) return Object.freeze({ duplicate: true });
    if (!account.exists || account.data()?.schemaVersion !== COMMERCIAL_SCHEMA_VERSION) throw new Error("Authoritative organization commercial account is unavailable.");
    assertCheckoutCustomer(account.data()!, input.customerId);
    transaction.create(eventRef, {
      id: eventId, organizationId, providerKey: "stripe", eventType: "checkout.session.completed",
      authoritativeRecognitionGranted: false, eventCreatedAt: input.eventCreatedAt,
      schemaVersion: COMMERCIAL_SCHEMA_VERSION, createdAt: FieldValue.serverTimestamp(),
    });
    return Object.freeze({ duplicate: false });
  });
}