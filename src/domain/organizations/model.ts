type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type OrganizationId = Brand<string, "OrganizationId">;
export type OrganizationProfileId = Brand<string, "OrganizationProfileId">;
export type IsoTimestamp = Brand<string, "IsoTimestamp">;

export interface OrganizationAccount {
  /** Stable tenant identifier used as the organization operating context. */
  readonly id: OrganizationId;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface OrganizationProfile {
  /** Independent identifier for the network-facing profile record. */
  readonly id: OrganizationProfileId;
  /** Required link back to the administrative/security tenant. */
  readonly organizationId: OrganizationId;
  /** Network-facing organization name. Administrative account data does not own this field. */
  readonly displayName: string;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export interface OrganizationContext {
  readonly organizationId: OrganizationId;
  readonly account: OrganizationAccount;
  readonly profile: OrganizationProfile;
}

export interface CreateOrganizationAccountInput {
  readonly id: string;
  readonly now: string;
}

export interface CreateOrganizationProfileInput {
  readonly id: string;
  readonly displayName: string;
  readonly now: string;
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

export function organizationId(value: string): OrganizationId {
  return requiredValue(value, "Organization id") as OrganizationId;
}

export function organizationProfileId(value: string): OrganizationProfileId {
  return requiredValue(value, "Organization profile id") as OrganizationProfileId;
}

export function isoTimestamp(value: string): IsoTimestamp {
  const normalized = requiredValue(value, "Timestamp");
  const parsed = Date.parse(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error("Timestamp must be a valid ISO-compatible date-time value.");
  }

  return new Date(parsed).toISOString() as IsoTimestamp;
}

export function createOrganizationAccount(
  input: CreateOrganizationAccountInput,
): OrganizationAccount {
  const now = isoTimestamp(input.now);

  return Object.freeze({
    id: organizationId(input.id),
    createdAt: now,
    updatedAt: now,
  });
}

export function createOrganizationProfile(
  account: OrganizationAccount,
  input: CreateOrganizationProfileInput,
): OrganizationProfile {
  const now = isoTimestamp(input.now);

  return Object.freeze({
    id: organizationProfileId(input.id),
    organizationId: account.id,
    displayName: requiredValue(input.displayName, "Organization display name"),
    createdAt: now,
    updatedAt: now,
  });
}

export function linkOrganizationAccountAndProfile(
  account: OrganizationAccount,
  profile: OrganizationProfile,
): OrganizationContext {
  if (account.id !== profile.organizationId) {
    throw new Error("Organization profile belongs to a different organization tenant.");
  }

  return Object.freeze({
    organizationId: account.id,
    account,
    profile,
  });
}
