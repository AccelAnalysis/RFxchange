import type { OrganizationAccount, OrganizationId } from "../organizations/model";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type OrganizationAssetId = Brand<string, "OrganizationAssetId">;

export const ORGANIZATION_ASSET_KINDS = [
  "capability",
  "location",
  "service-area",
  "rfx",
  "response",
  "referral",
  "team",
  "document",
  "resource",
  "membership",
  "credibility",
] as const;

export type OrganizationAssetKind = (typeof ORGANIZATION_ASSET_KINDS)[number];

/**
 * Base ownership contract for records whose lifecycle belongs to an organization tenant.
 * Individual users may act on these records later, but they never own the tenant-scoped asset.
 */
export interface OrganizationScoped {
  readonly organizationId: OrganizationId;
}

/**
 * Minimal cross-domain ownership reference. Feature domains may add their own fields while
 * retaining this organizationId contract.
 */
export interface OrganizationScopedAsset extends OrganizationScoped {
  readonly id: OrganizationAssetId;
  readonly kind: OrganizationAssetKind;
}

export interface CreateOrganizationAssetRefInput {
  readonly id: string;
  readonly kind: OrganizationAssetKind;
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

export function organizationAssetId(value: string): OrganizationAssetId {
  return requiredValue(value, "Organization asset id") as OrganizationAssetId;
}

export function organizationAssetKind(value: string): OrganizationAssetKind {
  if (!ORGANIZATION_ASSET_KINDS.includes(value as OrganizationAssetKind)) {
    throw new Error(`Unsupported organization asset kind: ${value}.`);
  }

  return value as OrganizationAssetKind;
}

export function createOrganizationAssetRef(
  organization: OrganizationAccount,
  input: CreateOrganizationAssetRefInput,
): OrganizationScopedAsset {
  return Object.freeze({
    id: organizationAssetId(input.id),
    kind: organizationAssetKind(input.kind),
    organizationId: organization.id,
  });
}

export function assertOrganizationOwnsAsset(
  organization: OrganizationAccount,
  asset: OrganizationScoped,
): void {
  if (asset.organizationId !== organization.id) {
    throw new Error("Asset belongs to a different organization tenant.");
  }
}

export function belongsToOrganization(
  organization: OrganizationAccount,
  asset: OrganizationScoped,
): boolean {
  return asset.organizationId === organization.id;
}
