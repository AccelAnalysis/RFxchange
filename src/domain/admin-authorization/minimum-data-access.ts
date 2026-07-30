import {
  createAdministrativeActionRequirement,
  authorizeAdministrativeAction,
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
} from "./model.ts";

export const ADMINISTRATIVE_DATA_CLASSES = [
  "organization-profile",
  "private-organization-document",
  "verification-evidence",
  "payment-metadata",
  "private-rfx-evidence",
  "complaint-evidence",
] as const;

export type AdministrativeDataClass = (typeof ADMINISTRATIVE_DATA_CLASSES)[number];

export const ADMINISTRATIVE_DATA_CLASS_PERMISSIONS: Readonly<
  Record<AdministrativeDataClass, AdminPermissionKey>
> = Object.freeze({
  "organization-profile": requireCataloguedAdminPermission("organization.profile.read"),
  "private-organization-document": requireCataloguedAdminPermission("organization.document.private.read"),
  "verification-evidence": requireCataloguedAdminPermission("credibility.verification-evidence.read"),
  "payment-metadata": requireCataloguedAdminPermission("commerce.payment-metadata.read"),
  "private-rfx-evidence": requireCataloguedAdminPermission("rfx.private-evidence.read"),
  "complaint-evidence": requireCataloguedAdminPermission("trust.complaint-evidence.read"),
});

export type AdministrativeDataAccessDecision =
  | Readonly<{
      readonly kind: "allow";
      readonly dataClass: AdministrativeDataClass;
      readonly permission: AdminPermissionKey;
    }>
  | Readonly<{
      readonly kind: "deny";
      readonly dataClass: AdministrativeDataClass;
      readonly permission: AdminPermissionKey;
      readonly reason: "permission-not-granted" | "authorization-not-satisfied";
    }>;

export function authorizeAdministrativeDataAccess(
  context: PlatformAdministratorAuthorityContext,
  dataClass: AdministrativeDataClass,
): AdministrativeDataAccessDecision {
  const permission = ADMINISTRATIVE_DATA_CLASS_PERMISSIONS[dataClass];
  if (!context.effectivePermissions.includes(permission)) {
    return Object.freeze({
      kind: "deny" as const,
      dataClass,
      permission,
      reason: "permission-not-granted" as const,
    });
  }

  const decision = authorizeAdministrativeAction(
    context,
    createAdministrativeActionRequirement({ permission }),
  );
  if (decision.kind !== "allow") {
    return Object.freeze({
      kind: "deny" as const,
      dataClass,
      permission,
      reason: "authorization-not-satisfied" as const,
    });
  }
  return Object.freeze({ kind: "allow" as const, dataClass, permission });
}

export function assertAdministrativeDataAccessAuthorized(
  context: PlatformAdministratorAuthorityContext,
  dataClass: AdministrativeDataClass,
): AdministrativeDataAccessDecision & { readonly kind: "allow" } {
  const decision = authorizeAdministrativeDataAccess(context, dataClass);
  if (decision.kind !== "allow") {
    throw new Error(`Administrative data access denied for ${dataClass}: ${decision.reason}.`);
  }
  return decision;
}
