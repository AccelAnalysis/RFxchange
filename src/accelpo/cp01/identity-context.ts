import type { AddOnSeatPricing } from "../../application/accelpo/entitlement-billing.ts";

export const CP01_IDENTITY_CONTEXT_PART_ID = "CP-01" as const;
export const ACCELPO_IDENTITY_STORAGE_PREFIX = "accelpo.identity.organization.v1" as const;

export type AccelPOCapability = string;

export type IdentityContextStatus =
  | "loading"
  | "unauthenticated"
  | "organization-selection"
  | "ready"
  | "forbidden"
  | "error";

export type IdentityForbiddenReason =
  | "no-active-membership"
  | "membership-not-found"
  | "organization-not-found"
  | "authorization-missing"
  | "account-disabled"
  | "credential-revoked"
  | "email-verification-required"
  | "membership-inactive"
  | "organization-access-restricted"
  | "account-unavailable";

export interface IdentityUserProjection {
  readonly userId: string;
  readonly email: string;
  readonly displayName: string | null;
}

export interface IdentityOrganizationOption {
  readonly organizationId: string;
  readonly membershipId: string;
  readonly displayName: string | null;
}

export interface IdentityMembershipProjection extends IdentityOrganizationOption {
  readonly status: "active";
  readonly roleKey: string;
  readonly capabilities: readonly AccelPOCapability[];
}

export interface IdentitySeatContext {
  readonly ownerCountsAsSeat: true;
  readonly includedSeats: number | null;
  readonly activeSeats: number;
  readonly reservedSeats: number | null;
  readonly availableSeats: number | null;
  readonly addOnSeatAllowance: number | null;
  readonly addOnSeatPricing: AddOnSeatPricing | null;
  readonly addSeatActionAllowed: boolean;
  readonly entitlementVersion: string | null;
  readonly source: "shared-membership-count" | "cp-10-entitlement";
}

export interface IdentityPlanEntitlementSummary {
  readonly status: "available" | "not-configured";
  readonly plan: string | null;
  readonly entitlementKeys: readonly string[];
  readonly billingPeriodEndsAt: string | null;
  readonly entitlementVersion: string | null;
}

export interface AccelPOIdentityProjection {
  readonly user: IdentityUserProjection;
  readonly activeOrganization: IdentityOrganizationOption;
  readonly membership: IdentityMembershipProjection;
  readonly activeMemberships: readonly IdentityOrganizationOption[];
  readonly permissions: readonly AccelPOCapability[];
  readonly seat: IdentitySeatContext;
  readonly plan: IdentityPlanEntitlementSummary;
}

export type IdentityProjectionResponse =
  | Readonly<{ readonly kind: "unauthenticated" }>
  | Readonly<{
      readonly kind: "organization-selection-required";
      readonly options: readonly IdentityOrganizationOption[];
    }>
  | Readonly<{
      readonly kind: "forbidden";
      readonly reason: IdentityForbiddenReason;
    }>
  | Readonly<{
      readonly kind: "ready";
      readonly projection: AccelPOIdentityProjection;
    }>;

export interface IdentityContextSnapshot {
  readonly status: IdentityContextStatus;
  readonly user: IdentityUserProjection | null;
  readonly activeOrgId: string | null;
  readonly membership: IdentityMembershipProjection | null;
  readonly permissions: readonly AccelPOCapability[];
  readonly seat: IdentitySeatContext | null;
  readonly plan: IdentityPlanEntitlementSummary | null;
  readonly organizationOptions: readonly IdentityOrganizationOption[];
  readonly forbiddenReason: IdentityForbiddenReason | null;
  readonly errorMessage: string | null;
}

export interface IdentityContextStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function identityOrganizationStorageKey(providerSubject: string): string {
  const subject = providerSubject.trim();
  if (!subject) throw new Error("A provider subject is required for identity context storage.");
  return `${ACCELPO_IDENTITY_STORAGE_PREFIX}.${encodeURIComponent(subject)}`;
}

export function readPersistedOrganizationId(
  storage: IdentityContextStorage | null | undefined,
  providerSubject: string,
): string | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(identityOrganizationStorageKey(providerSubject))?.trim();
    return value || null;
  } catch {
    return null;
  }
}

export function persistOrganizationId(
  storage: IdentityContextStorage | null | undefined,
  providerSubject: string,
  organizationId: string,
): void {
  if (!storage) return;
  const normalized = organizationId.trim();
  if (!normalized) return;
  try {
    storage.setItem(identityOrganizationStorageKey(providerSubject), normalized);
  } catch {
    // Persistence is a convenience only. Server authorization remains authoritative.
  }
}

export function clearPersistedOrganizationId(
  storage: IdentityContextStorage | null | undefined,
  providerSubject: string,
): void {
  if (!storage) return;
  try {
    storage.removeItem(identityOrganizationStorageKey(providerSubject));
  } catch {
    // Persistence is a convenience only. Server authorization remains authoritative.
  }
}

export function safeInternalReturnTo(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return null;
  if (candidate.startsWith("/\\") || candidate.includes("\\")) return null;
  if (candidate.startsWith("/signin") || candidate.startsWith("/register")) return null;

  try {
    const parsed = new URL(candidate, "https://accelpo.invalid");
    if (parsed.origin !== "https://accelpo.invalid") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

export function signInDestination(
  returnTo: string | null | undefined,
  signInPath = "/signin",
): string {
  const safeSignInPath = safeInternalReturnTo(signInPath) ?? "/signin";
  const safeReturnTo = safeInternalReturnTo(returnTo);
  if (!safeReturnTo) return safeSignInPath;
  const destination = new URL(safeSignInPath, "https://accelpo.invalid");
  destination.searchParams.set("returnTo", safeReturnTo);
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

export function rememberDeepLink(
  storage: IdentityContextStorage | null | undefined,
  key: string,
  path: string,
): void {
  const safePath = safeInternalReturnTo(path);
  if (!storage || !safePath) return;
  try {
    storage.setItem(key, safePath);
  } catch {
    // Deep-link restoration is best effort and never an authorization mechanism.
  }
}

export function consumeDeepLink(
  storage: IdentityContextStorage | null | undefined,
  key: string,
): string | null {
  if (!storage) return null;
  try {
    const path = safeInternalReturnTo(storage.getItem(key));
    storage.removeItem(key);
    return path;
  } catch {
    return null;
  }
}

export function createEmptyIdentityContextSnapshot(): IdentityContextSnapshot {
  return Object.freeze({
    status: "loading" as const,
    user: null,
    activeOrgId: null,
    membership: null,
    permissions: Object.freeze([]),
    seat: null,
    plan: null,
    organizationOptions: Object.freeze([]),
    forbiddenReason: null,
    errorMessage: null,
  });
}

export type OrganizationSelectionResolution =
  | Readonly<{ readonly kind: "selected"; readonly organizationId: string }>
  | Readonly<{
      readonly kind: "organization-selection-required";
      readonly options: readonly IdentityOrganizationOption[];
    }>
  | Readonly<{ readonly kind: "forbidden"; readonly reason: "no-active-membership" }>;

export function resolveOrganizationSelection(
  activeMemberships: readonly IdentityOrganizationOption[],
  requestedOrganizationId?: string | null,
): OrganizationSelectionResolution {
  const options = Object.freeze([...activeMemberships]);
  if (options.length === 0) {
    return Object.freeze({ kind: "forbidden" as const, reason: "no-active-membership" as const });
  }

  const requested = requestedOrganizationId?.trim() || null;
  if (requested) {
    const selected = options.find((option) => option.organizationId === requested);
    if (selected) return Object.freeze({ kind: "selected" as const, organizationId: selected.organizationId });
  }

  if (!requested && options.length === 1) {
    return Object.freeze({ kind: "selected" as const, organizationId: options[0].organizationId });
  }

  return Object.freeze({
    kind: "organization-selection-required" as const,
    options,
  });
}
