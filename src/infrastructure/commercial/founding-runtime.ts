import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData, type DocumentSnapshot, type Firestore, type Transaction } from "firebase-admin/firestore";
import { OrganizationCommercialAccountService } from "../../application/commercial/organization-commercial-account.ts";
import { createOrganizationCommercialAccount, evolveOrganizationCommercialAccount, type OrganizationCommercialAccount, type PaymentProviderReference } from "../../domain/commercial/model.ts";
import { assertOrganizationPermission, organizationPermission, type OrganizationUserAuthorization } from "../../domain/authorization/model.ts";
import type { OrganizationAccount } from "../../domain/organizations/model.ts";
import type { OrganizationMembership } from "../../domain/users/model.ts";
import { resolveParticipantRoute } from "../auth/participant-route-runtime.ts";
import { getServerFirestore } from "../firestore/runtime.ts";
import { FIRESTORE_SCHEMA_VERSION, firestoreCollectionName } from "../firestore/schema.ts";
import { FirestoreOrganizationCommercialAccountRepository } from "../firestore/commercial-account-repository.ts";
import {
  resolveFoundingCheckoutReleaseDecision,
  type FoundingCheckoutReleaseDecision,
  type FoundingCheckoutReleaseMode,
  type FoundingCheckoutReleaseReason,
} from "./founding-release-policy.ts";
import { assertFoundingStripeConfiguration, RFXCHANGE_FOUNDING_CAP, RFXCHANGE_FOUNDING_CURRENCY, RFXCHANGE_FOUNDING_INTERVAL, RFXCHANGE_FOUNDING_PRICE_CENTS, StripePaymentProvider } from "./stripe-payment-provider.ts";

export {
  resolveFoundingCheckoutReleaseDecision,
  type FoundingCheckoutReleaseDecision,
  type FoundingCheckoutReleaseMode,
  type FoundingCheckoutReleaseReason,
} from "./founding-release-policy.ts";

const CAPACITY_COLLECTION = firestoreCollectionName("commercialFoundingCapacity");
const CAPACITY_DOCUMENT = "current";
export class FoundingCommerceError extends Error { readonly status: number; readonly code: string; constructor(status: number, code: string, message: string) { super(message); this.name = "FoundingCommerceError"; this.status = status; this.code = code; } }
interface CapacityReservation { readonly reservationId: string; readonly organizationId: string; readonly checkoutSessionId: string | null; readonly checkoutUrl: string | null; }
interface CapacityDocument { readonly limit: number; readonly committedOrganizationIds: readonly string[]; readonly reservations: readonly CapacityReservation[]; }
export interface FoundingCapacitySnapshot { readonly limit: number; readonly committed: number; readonly reserved: number; readonly remaining: number; readonly currentOrganizationReserved: boolean; }
export interface FoundingOrganizationContext { readonly db: Firestore; readonly organization: OrganizationAccount; readonly membership: OrganizationMembership; readonly authorization: OrganizationUserAuthorization | null; readonly billingEmail: string; readonly commercialAccount: OrganizationCommercialAccount; readonly canManageBilling: boolean; }

function isoNow(): string { return new Date().toISOString(); }
function defaultCapacity(): CapacityDocument { return Object.freeze({ limit: RFXCHANGE_FOUNDING_CAP, committedOrganizationIds: Object.freeze([]), reservations: Object.freeze([]) }); }
function capacityFromData(data: DocumentData | undefined): CapacityDocument {
  if (!data) return defaultCapacity();
  if (data.schemaVersion !== FIRESTORE_SCHEMA_VERSION || data.limit !== RFXCHANGE_FOUNDING_CAP) throw new FoundingCommerceError(503, "capacity-state-invalid", "Founding capacity state is invalid.");
  const committed = Array.isArray(data.committedOrganizationIds) ? data.committedOrganizationIds.filter((v): v is string => typeof v === "string" && Boolean(v.trim())) : [];
  const reservations = Array.isArray(data.reservations) ? data.reservations.map((v): CapacityReservation => {
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new FoundingCommerceError(503, "capacity-state-invalid", "Founding capacity reservation state is invalid.");
    const r = v as Record<string, unknown>;
    if (typeof r.reservationId !== "string" || typeof r.organizationId !== "string" || (r.checkoutSessionId !== null && typeof r.checkoutSessionId !== "string") || (r.checkoutUrl !== null && typeof r.checkoutUrl !== "string")) throw new FoundingCommerceError(503, "capacity-state-invalid", "Founding capacity reservation state is invalid.");
    return Object.freeze({ reservationId: r.reservationId, organizationId: r.organizationId, checkoutSessionId: r.checkoutSessionId as string | null, checkoutUrl: r.checkoutUrl as string | null });
  }) : [];
  if (new Set(reservations.map((r) => r.organizationId)).size !== reservations.length) throw new FoundingCommerceError(503, "capacity-state-invalid", "Founding capacity contains duplicate organization reservations.");
  return Object.freeze({ limit: RFXCHANGE_FOUNDING_CAP, committedOrganizationIds: Object.freeze([...new Set(committed)]), reservations: Object.freeze(reservations) });
}
function capacitySnapshot(capacity: CapacityDocument, organizationId?: string): FoundingCapacitySnapshot {
  const committed = capacity.committedOrganizationIds.length;
  const reserved = capacity.reservations.filter((r) => !capacity.committedOrganizationIds.includes(r.organizationId)).length;
  if (committed + reserved > capacity.limit) throw new FoundingCommerceError(503, "capacity-invariant-violated", "Founding capacity exceeds the approved limit.");
  return Object.freeze({ limit: capacity.limit, committed, reserved, remaining: Math.max(0, capacity.limit - committed - reserved), currentOrganizationReserved: Boolean(organizationId && capacity.reservations.some((r) => r.organizationId === organizationId)) });
}
function writeCapacity(transaction: Transaction, snapshot: DocumentSnapshot<DocumentData>, state: CapacityDocument): void {
  let createdAt: Timestamp | FieldValue = FieldValue.serverTimestamp();
  if (snapshot.exists) { const existing = snapshot.get("createdAt"); if (!(existing instanceof Timestamp)) throw new FoundingCommerceError(503, "capacity-state-invalid", "Founding capacity is missing persistence metadata."); createdAt = existing; }
  const record = { limit: RFXCHANGE_FOUNDING_CAP, committedOrganizationIds: state.committedOrganizationIds, reservations: state.reservations, schemaVersion: FIRESTORE_SCHEMA_VERSION, createdAt, updatedAt: FieldValue.serverTimestamp() };
  if (snapshot.exists) transaction.set(snapshot.ref, record, { merge: false }); else transaction.create(snapshot.ref, record);
}
function replaceReference(values: readonly PaymentProviderReference[], reference: PaymentProviderReference): readonly PaymentProviderReference[] { return Object.freeze([...values.filter((r) => r.kind !== reference.kind), reference]); }
function withCheckout(current: OrganizationCommercialAccount, customer: PaymentProviderReference, checkout: PaymentProviderReference): OrganizationCommercialAccount {
  let references = replaceReference(current.providerReferences, customer); references = replaceReference(references, checkout);
  return evolveOrganizationCommercialAccount(current, { planKey: String(current.planKey), entitlementKeys: current.entitlementKeys.map(String), providerReferences: references, subscription: { status: current.subscription.status, providerSubscriptionReference: current.subscription.providerSubscriptionReference, currentPeriodEndsAt: current.subscription.currentPeriodEndsAt ? String(current.subscription.currentPeriodEndsAt) : null, cancelAtPeriodEnd: current.subscription.cancelAtPeriodEnd }, now: isoNow() });
}
async function loadAuthorization(db: Firestore, membership: OrganizationMembership): Promise<OrganizationUserAuthorization | null> { const s = await db.collection("organizationAuthorizations").doc(String(membership.id)).get(); return s.exists ? s.data() as OrganizationUserAuthorization : null; }
async function ensureAccount(db: Firestore, organization: OrganizationAccount): Promise<OrganizationCommercialAccount> {
  const repository = new FirestoreOrganizationCommercialAccountRepository(db); const existing = await repository.getByOrganizationId(organization.id); if (existing) return existing;
  const account = createOrganizationCommercialAccount({ organizationId: String(organization.id), now: isoNow() });
  try { await repository.create(account); return (await repository.getByOrganizationId(organization.id)) ?? account; } catch { const raced = await repository.getByOrganizationId(organization.id); if (raced) return raced; throw new FoundingCommerceError(503, "commercial-account-unavailable", "Commercial account state is unavailable."); }
}

function assertRelease(organizationId: string): void { const d: FoundingCheckoutReleaseDecision = resolveFoundingCheckoutReleaseDecision(organizationId); if (d.allowed) return; if (d.reason === "proof-organization-only") throw new FoundingCommerceError(403, d.reason, "Founding checkout is not open for this organization."); throw new FoundingCommerceError(503, d.reason, "Founding checkout remains closed."); }

export async function resolveFoundingOrganizationContext(input: Readonly<{ sessionCookie?: string | null }>): Promise<FoundingOrganizationContext> {
  const access = await resolveParticipantRoute({ sessionCookie: input.sessionCookie });
  if (access.kind === "unauthenticated") throw new FoundingCommerceError(401, "unauthenticated", "Sign in to manage Founding Membership.");
  if (access.kind !== "authorized") throw new FoundingCommerceError(403, "organization-unavailable", "Founding Membership is unavailable for this organization.");
  const db = getServerFirestore(); const snap = await db.collection("organizations").doc(String(access.membership.organizationId)).get(); if (!snap.exists) throw new FoundingCommerceError(503, "organization-unavailable", "Organization state is unavailable.");
  const organization = snap.data() as OrganizationAccount; const authorization = await loadAuthorization(db, access.membership); let canManageBilling = false;
  if (authorization) { try { assertOrganizationPermission(access.membership, authorization, organization, organizationPermission("billing.manage")); canManageBilling = true; } catch { canManageBilling = false; } }
  return Object.freeze({ db, organization, membership: access.membership, authorization, billingEmail: access.context.user.primaryEmail, commercialAccount: await ensureAccount(db, organization), canManageBilling });
}
export async function getFoundingCapacitySnapshot(db: Firestore, organizationId?: string): Promise<FoundingCapacitySnapshot> { const s = await db.collection(CAPACITY_COLLECTION).doc(CAPACITY_DOCUMENT).get(); return capacitySnapshot(capacityFromData(s.data()), organizationId); }

export async function reserveFoundingCheckout(db: Firestore, organizationId: string): Promise<Readonly<{ kind: "reserved"; reservationId: string }> | Readonly<{ kind: "reused"; reservationId: string; checkoutSessionId: string; checkoutUrl: string }>> {
  const ref = db.collection(CAPACITY_COLLECTION).doc(CAPACITY_DOCUMENT);
  return db.runTransaction(async (transaction) => { const snap = await transaction.get(ref); const state = capacityFromData(snap.data()); if (state.committedOrganizationIds.includes(organizationId)) throw new FoundingCommerceError(409, "already-founding", "This organization already occupies a Founding position."); const existing = state.reservations.find((r) => r.organizationId === organizationId); if (existing?.checkoutSessionId && existing.checkoutUrl) return Object.freeze({ kind: "reused" as const, ...existing }); if (existing) return Object.freeze({ kind: "reserved" as const, reservationId: existing.reservationId }); if (capacitySnapshot(state).remaining <= 0) throw new FoundingCommerceError(409, "founding-capacity-full", "Founding Membership has reached capacity."); const reservation = Object.freeze({ reservationId: randomUUID(), organizationId, checkoutSessionId: null, checkoutUrl: null }); writeCapacity(transaction, snap, Object.freeze({ ...state, reservations: Object.freeze([...state.reservations, reservation]) })); return Object.freeze({ kind: "reserved" as const, reservationId: reservation.reservationId }); });
}
export async function attachFoundingCheckout(db: Firestore, input: Readonly<{ organizationId: string; reservationId: string; checkoutSessionId: string; checkoutUrl: string }>): Promise<void> {
  const ref = db.collection(CAPACITY_COLLECTION).doc(CAPACITY_DOCUMENT); await db.runTransaction(async (transaction) => { const snap = await transaction.get(ref); const state = capacityFromData(snap.data()); const index = state.reservations.findIndex((r) => r.organizationId === input.organizationId && r.reservationId === input.reservationId); if (index < 0) throw new FoundingCommerceError(409, "capacity-reservation-lost", "Founding reservation is unavailable."); const reservations = [...state.reservations]; const current = reservations[index]!; if (current.checkoutSessionId && current.checkoutSessionId !== input.checkoutSessionId) throw new FoundingCommerceError(409, "checkout-correlation-conflict", "Checkout correlation conflicts with the reservation."); reservations[index] = Object.freeze({ ...current, checkoutSessionId: input.checkoutSessionId, checkoutUrl: input.checkoutUrl }); writeCapacity(transaction, snap, Object.freeze({ ...state, reservations: Object.freeze(reservations) })); });
}
function hasNonTerminalSubscription(account: OrganizationCommercialAccount): boolean { return Boolean(account.subscription.providerSubscriptionReference && !["not-subscribed", "canceled"].includes(account.subscription.status)); }

export async function beginFoundingCheckout(input: Readonly<{ context: FoundingOrganizationContext; commandId?: string | null; publicOrigin: string }>): Promise<Readonly<{ checkoutUrl: string; checkoutSessionId: string; reused: boolean }>> {
  if (!input.context.canManageBilling) throw new FoundingCommerceError(403, "billing-authority-required", "Billing authority is required.");
  const organizationId = String(input.context.organization.id); assertRelease(organizationId); if (hasNonTerminalSubscription(input.context.commercialAccount)) throw new FoundingCommerceError(409, "subscription-exists", "A non-terminal Founding subscription already exists.");
  const commandId = input.commandId?.trim() ?? ""; if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,190}$/.test(commandId)) throw new FoundingCommerceError(400, "invalid-command-id", "Checkout command identity is invalid.");
  let origin: URL; try { origin = new URL(input.publicOrigin); } catch { throw new FoundingCommerceError(503, "public-origin-invalid", "RFxchange public origin is invalid."); } if (!["http:", "https:"].includes(origin.protocol) || origin.pathname !== "/" || origin.search || origin.hash) throw new FoundingCommerceError(503, "public-origin-invalid", "RFxchange public origin is invalid.");
  assertFoundingStripeConfiguration(); const reservation = await reserveFoundingCheckout(input.context.db, organizationId); if (reservation.kind === "reused") return Object.freeze({ checkoutUrl: reservation.checkoutUrl, checkoutSessionId: reservation.checkoutSessionId, reused: true });
  const repository = new FirestoreOrganizationCommercialAccountRepository(input.context.db); const service = new OrganizationCommercialAccountService({ repository, paymentProvider: new StripePaymentProvider() });
  const result = await service.beginSubscriptionCheckout({ organization: input.context.organization, planKey: "founding", billingEmail: input.context.billingEmail, successUrl: new URL("/commercial/founding?checkout=return", origin).toString(), cancelUrl: new URL("/commercial/founding?checkout=cancel", origin).toString(), idempotencyKey: `founding:${organizationId}:${reservation.reservationId}`, now: isoNow() });
  const latest = await repository.getByOrganizationId(input.context.organization.id); if (!latest) throw new Error("Commercial account disappeared during checkout."); await repository.save(withCheckout(latest, result.customerReference, result.checkoutReference)); await attachFoundingCheckout(input.context.db, { organizationId, reservationId: reservation.reservationId, checkoutSessionId: String(result.checkoutReference.externalReference), checkoutUrl: result.redirectUrl }); return Object.freeze({ checkoutUrl: result.redirectUrl, checkoutSessionId: String(result.checkoutReference.externalReference), reused: false });
}
export function publicFoundingOffer() { return Object.freeze({ planKey: "founding", amount: RFXCHANGE_FOUNDING_PRICE_CENTS, currency: RFXCHANGE_FOUNDING_CURRENCY, interval: RFXCHANGE_FOUNDING_INTERVAL, cap: RFXCHANGE_FOUNDING_CAP }); }
export function safeCommercialStatus(account: OrganizationCommercialAccount) { return Object.freeze({ planKey: String(account.planKey), subscriptionStatus: account.subscription.status, cancelAtPeriodEnd: account.subscription.cancelAtPeriodEnd, currentPeriodEndsAt: account.subscription.currentPeriodEndsAt ? String(account.subscription.currentPeriodEndsAt) : null, foundingRecognition: account.entitlementKeys.map(String).includes("founding.recognition") && ["active", "trialing"].includes(account.subscription.status) }); }
