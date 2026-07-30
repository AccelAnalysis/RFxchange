import {
  ORGANIZATION_PERMISSION_CATALOG,
  organizationPermission,
  organizationRoleKey,
  type OrganizationPermission,
  type OrganizationRoleKey,
} from "./model.ts";

export const ORGANIZATION_ROLE_BUNDLE_KEYS = [
  "primary-admin-owner",
  "organization-admin",
  "power-user-manager",
  "contributor",
  "viewer",
  "billing-manager",
  "rfx-issuer-manager",
  "rfx-evaluator",
  "response-manager",
  "resource-manager",
] as const;

export type OrganizationRoleBundleKey = OrganizationRoleKey &
  (typeof ORGANIZATION_ROLE_BUNDLE_KEYS)[number];
export type OrganizationRoleBundleTimestamp = string & {
  readonly __brand: "OrganizationRoleBundleTimestamp";
};

export interface OrganizationRoleBundle {
  readonly key: OrganizationRoleKey;
  readonly displayName: string;
  readonly description: string;
  readonly permissions: readonly OrganizationPermission[];
  readonly createdAt: OrganizationRoleBundleTimestamp;
  readonly updatedAt: OrganizationRoleBundleTimestamp;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function timestamp(value: string, label: string): OrganizationRoleBundleTimestamp {
  const parsed = Date.parse(required(value, label));
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid date-time.`);
  return new Date(parsed).toISOString() as OrganizationRoleBundleTimestamp;
}

function normalizedPermissions(values: readonly string[]): readonly OrganizationPermission[] {
  return Object.freeze([...new Set(values.map(organizationPermission))]);
}

export function organizationRoleBundleKey(value: string): OrganizationRoleBundleKey {
  const key = organizationRoleKey(value);
  if (!(ORGANIZATION_ROLE_BUNDLE_KEYS as readonly string[]).includes(key)) {
    throw new Error(`Unknown organization role bundle key: ${key}.`);
  }
  return key as OrganizationRoleBundleKey;
}

export function createOrganizationRoleBundle(input: Readonly<{
  key: string;
  displayName: string;
  description: string;
  permissions: readonly string[];
  createdAt: string;
  updatedAt?: string;
}>): OrganizationRoleBundle {
  const createdAt = timestamp(input.createdAt, "Organization role bundle creation timestamp");
  const updatedAt = timestamp(
    input.updatedAt ?? input.createdAt,
    "Organization role bundle update timestamp",
  );
  if (Date.parse(updatedAt) < Date.parse(createdAt)) {
    throw new Error("Organization role bundle update cannot precede creation.");
  }
  return Object.freeze({
    key: organizationRoleKey(organizationRoleBundleKey(input.key)),
    displayName: required(input.displayName, "Organization role bundle display name"),
    description: required(input.description, "Organization role bundle description"),
    permissions: normalizedPermissions(input.permissions),
    createdAt,
    updatedAt,
  });
}

const P = (...values: string[]) => values;
const ALL = [...ORGANIZATION_PERMISSION_CATALOG];
const DEFAULT_TIMESTAMP = "2026-07-30T00:00:00.000Z";

const DEFAULT_BUNDLE_INPUTS = [
  {
    key: "primary-admin-owner",
    displayName: "Primary Admin / Owner",
    description: "Complete organization authority across the current organization capability catalog.",
    permissions: ALL,
  },
  {
    key: "organization-admin",
    displayName: "Organization Admin",
    description: "Organization profile, user, permission, document and resource administration.",
    permissions: P(
      "organization.profile.manage",
      "organization.users.manage",
      "organization.permissions.manage",
      "document.manage",
      "resource.manage",
    ),
  },
  {
    key: "power-user-manager",
    displayName: "Power User / Manager",
    description: "Broad operational RFx, response, referral, teaming, document and resource capabilities.",
    permissions: P(
      "rfx.create",
      "rfx.publish",
      "response.create",
      "response.submit",
      "referral.manage",
      "teaming.manage",
      "document.manage",
      "resource.manage",
    ),
  },
  {
    key: "contributor",
    displayName: "Contributor",
    description: "Contribute response, teaming and document work without organization administration.",
    permissions: P("response.create", "teaming.manage", "document.manage"),
  },
  {
    key: "viewer",
    displayName: "Viewer",
    description: "Membership-based read-only access with no management capability granted by the bundle.",
    permissions: P(),
  },
  {
    key: "billing-manager",
    displayName: "Billing Manager",
    description: "Manage organization billing and membership commerce settings.",
    permissions: P("billing.manage"),
  },
  {
    key: "rfx-issuer-manager",
    displayName: "RFx Issuer Manager",
    description: "Create and publish organization RFx opportunities.",
    permissions: P("rfx.create", "rfx.publish"),
  },
  {
    key: "rfx-evaluator",
    displayName: "RFx Evaluator",
    description: "Evaluate RFx responses assigned to the organization user.",
    permissions: P("evaluation.review"),
  },
  {
    key: "response-manager",
    displayName: "Response Manager",
    description: "Prepare, coordinate teaming for, and submit organization responses.",
    permissions: P("response.create", "response.submit", "teaming.manage", "document.manage"),
  },
  {
    key: "resource-manager",
    displayName: "Resource Manager",
    description: "Manage organization resource content and supporting documents.",
    permissions: P("resource.manage", "document.manage"),
  },
] as const;

export const DEFAULT_ORGANIZATION_ROLE_BUNDLES: readonly OrganizationRoleBundle[] = Object.freeze(
  DEFAULT_BUNDLE_INPUTS.map((input) =>
    createOrganizationRoleBundle({ ...input, createdAt: DEFAULT_TIMESTAMP }),
  ),
);

export function defaultOrganizationRoleBundle(key: OrganizationRoleBundleKey): OrganizationRoleBundle {
  const bundle = DEFAULT_ORGANIZATION_ROLE_BUNDLES.find((candidate) => candidate.key === key);
  if (!bundle) throw new Error(`Default organization role bundle is missing: ${key}.`);
  return bundle;
}
