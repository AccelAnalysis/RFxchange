import {
  ORGANIZATION_PERMISSION_CATALOG,
  organizationPermission,
  organizationRoleKey,
  type OrganizationPermission,
  type OrganizationRoleKey,
} from "./model.ts";

export const STANDARD_ORGANIZATION_ROLE_PRESET_KEYS = [
  "primary-administrator",
  "administrator",
  "opportunity-manager",
  "responder",
  "evaluator",
  "referral-manager",
  "finance-billing",
  "viewer",
] as const;

export type StandardOrganizationRolePresetKey =
  (typeof STANDARD_ORGANIZATION_ROLE_PRESET_KEYS)[number];

export interface StandardOrganizationRolePreset {
  readonly key: OrganizationRoleKey;
  readonly displayName: string;
  readonly description: string;
  readonly permissions: readonly OrganizationPermission[];
}

function permissions(...values: readonly string[]): readonly OrganizationPermission[] {
  return Object.freeze([...new Set(values.map(organizationPermission))]);
}

const ALL_PERMISSIONS = Object.freeze(
  ORGANIZATION_PERMISSION_CATALOG.map((permission) => organizationPermission(permission)),
);

export const STANDARD_ORGANIZATION_ROLE_PRESETS: readonly StandardOrganizationRolePreset[] =
  Object.freeze([
    Object.freeze({
      key: organizationRoleKey("primary-administrator"),
      displayName: "Primary Administrator",
      description: "Full organization control through the complete organization permission catalog.",
      permissions: ALL_PERMISSIONS,
    }),
    Object.freeze({
      key: organizationRoleKey("administrator"),
      displayName: "Administrator",
      description: "User and organization profile administration subject to explicit permissions.",
      permissions: permissions(
        "organization.profile.manage",
        "organization.users.manage",
        "organization.permissions.manage",
      ),
    }),
    Object.freeze({
      key: organizationRoleKey("opportunity-manager"),
      displayName: "Opportunity Manager",
      description: "Create and publish organization opportunities and RFx records.",
      permissions: permissions("rfx.create", "rfx.publish"),
    }),
    Object.freeze({
      key: organizationRoleKey("responder"),
      displayName: "Responder",
      description: "Prepare and submit RFx responses for the organization.",
      permissions: permissions("response.create", "response.submit"),
    }),
    Object.freeze({
      key: organizationRoleKey("evaluator"),
      displayName: "Evaluator",
      description: "Evaluate responses assigned to the organization user.",
      permissions: permissions("evaluation.review"),
    }),
    Object.freeze({
      key: organizationRoleKey("referral-manager"),
      displayName: "Referral Manager",
      description: "Manage organization referral activity.",
      permissions: permissions("referral.manage"),
    }),
    Object.freeze({
      key: organizationRoleKey("finance-billing"),
      displayName: "Finance / Billing",
      description: "Manage organization membership and billing information.",
      permissions: permissions("billing.manage"),
    }),
    Object.freeze({
      key: organizationRoleKey("viewer"),
      displayName: "Viewer",
      description: "Read-only organization access with no management capabilities granted by default.",
      permissions: Object.freeze([]),
    }),
  ]);

export function standardOrganizationRolePreset(
  key: string,
): StandardOrganizationRolePreset {
  const normalized = organizationRoleKey(key);
  const preset = STANDARD_ORGANIZATION_ROLE_PRESETS.find(
    (candidate) => candidate.key === normalized,
  );
  if (!preset) throw new Error(`Unknown standard organization role preset: ${normalized}.`);
  return preset;
}
