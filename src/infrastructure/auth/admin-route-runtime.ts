import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import {
  authorizeScopedAdministrativeAction,
  createScopedAdministrativeActionRequirement,
  type AdminGrantScope,
  type AdminPermissionGrant,
  type ScopedAdministrativeAuthorizationDecision,
} from "../../domain/admin-authorization/grants.ts";
import type {
  AdminPermissionKey,
  PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
import {
  visibleImplementedAdminRuntimeDestinations,
  type ImplementedAdminRuntimeDestination,
} from "../../application/admin/portal-navigation.ts";
import {
  evaluatePrivilegedAdministratorAccess,
  type PlatformAdministratorAccount,
  type PrivilegedAdministratorAccessDecision,
} from "../../domain/admin-authorization/administrator-lifecycle.ts";
import { FirestorePlatformAdministratorLifecycleRepository } from "../firestore/admin-lifecycle-repository.ts";
import { createServerFirestoreFoundationRepositories, getServerFirestore } from "../firestore/runtime.ts";
import { FirebaseAccountSecurityService } from "./firebase-account-security.ts";
import { getServerFirebaseAuth } from "./firebase-server.ts";
import { createServerAuthenticationBoundary } from "./firebase-session-runtime.ts";

export type AdminRouteResolution =
  | Readonly<{ readonly kind: "unauthenticated" }>
  | Readonly<{
      readonly kind: "not-administrator";
      readonly context: AuthenticatedServerContext;
    }>
  | Readonly<{
      readonly kind: "privileged-access-denied";
      readonly context: AuthenticatedServerContext;
      readonly account: PlatformAdministratorAccount;
      readonly reason: Exclude<PrivilegedAdministratorAccessDecision, { readonly allowed: true }>["reason"];
    }>
  | Readonly<{
      readonly kind: "permission-denied";
      readonly context: AuthenticatedServerContext;
      readonly account: PlatformAdministratorAccount;
      readonly authority: PlatformAdministratorAuthorityContext;
      readonly grants: readonly AdminPermissionGrant[];
      readonly permission: AdminPermissionKey;
      readonly scope: AdminGrantScope;
      readonly reason: Extract<ScopedAdministrativeAuthorizationDecision, { readonly kind: "deny" }>["reason"];
    }>
  | Readonly<{
      readonly kind: "authorized";
      readonly context: AuthenticatedServerContext;
      readonly account: PlatformAdministratorAccount;
      readonly authority: PlatformAdministratorAuthorityContext;
      readonly grants: readonly AdminPermissionGrant[];
      readonly permission: AdminPermissionKey;
      readonly scope: AdminGrantScope;
      readonly grantId: string;
    }>;

export type AdminPortalAccessResolution =
  | Readonly<{ readonly kind: "unauthenticated" }>
  | Readonly<{
      readonly kind: "not-administrator";
      readonly context: AuthenticatedServerContext;
    }>
  | Readonly<{
      readonly kind: "privileged-access-denied";
      readonly context: AuthenticatedServerContext;
      readonly account: PlatformAdministratorAccount;
      readonly reason: Exclude<PrivilegedAdministratorAccessDecision, { readonly allowed: true }>["reason"];
    }>
  | Readonly<{
      readonly kind: "no-implemented-destination";
      readonly context: AuthenticatedServerContext;
      readonly account: PlatformAdministratorAccount;
      readonly authority: PlatformAdministratorAuthorityContext;
      readonly grants: readonly AdminPermissionGrant[];
    }>
  | Readonly<{
      readonly kind: "authorized";
      readonly context: AuthenticatedServerContext;
      readonly account: PlatformAdministratorAccount;
      readonly authority: PlatformAdministratorAuthorityContext;
      readonly grants: readonly AdminPermissionGrant[];
      readonly destinations: readonly ImplementedAdminRuntimeDestination[];
    }>;

type AdminIdentityResolution =
  | Extract<AdminPortalAccessResolution, { readonly kind: "unauthenticated" }>
  | Extract<AdminPortalAccessResolution, { readonly kind: "not-administrator" }>
  | Extract<AdminPortalAccessResolution, { readonly kind: "privileged-access-denied" }>
  | Readonly<{
      readonly kind: "resolved";
      readonly context: AuthenticatedServerContext;
      readonly account: PlatformAdministratorAccount;
      readonly authority: PlatformAdministratorAuthorityContext;
      readonly grants: readonly AdminPermissionGrant[];
    }>;

async function resolveAdminIdentity(
  sessionCookieInput?: string | null,
): Promise<AdminIdentityResolution> {
  const sessionCookie = sessionCookieInput?.trim();
  if (!sessionCookie) return Object.freeze({ kind: "unauthenticated" as const });

  let context: AuthenticatedServerContext;
  try {
    context = await createServerAuthenticationBoundary().authenticateSessionCookie({
      sessionCookie,
      now: new Date().toISOString(),
    });
  } catch {
    return Object.freeze({ kind: "unauthenticated" as const });
  }

  const db = getServerFirestore();
  const lifecycleRepository = new FirestorePlatformAdministratorLifecycleRepository(db);
  const account = await lifecycleRepository.getBySubject(context.authentication.subject);
  if (!account) {
    return Object.freeze({ kind: "not-administrator" as const, context });
  }

  const providerSecurity = await new FirebaseAccountSecurityService(
    getServerFirebaseAuth(),
  ).inspect(context.authentication.subject);
  const privileged = evaluatePrivilegedAdministratorAccess({
    account,
    provider: providerSecurity,
    authenticatedAt: context.authentication.authenticatedAt,
  });
  if (!privileged.allowed) {
    return Object.freeze({
      kind: "privileged-access-denied" as const,
      context,
      account,
      reason: privileged.reason,
    });
  }

  const foundation = createServerFirestoreFoundationRepositories(db);
  const [authority, grants] = await Promise.all([
    foundation.adminAuthorization.authorityContexts.getByAdministratorId(account.administratorId),
    foundation.adminAuthorization.grants.listByAdministratorId(account.administratorId),
  ]);
  if (!authority) {
    return Object.freeze({ kind: "not-administrator" as const, context });
  }

  return Object.freeze({
    kind: "resolved" as const,
    context,
    account,
    authority,
    grants,
  });
}

/** Resolves legitimate portal entry without treating a role name or permission alone as access. */
export async function resolveAdminPortalAccess(input: Readonly<{
  sessionCookie?: string | null;
}>): Promise<AdminPortalAccessResolution> {
  const identity = await resolveAdminIdentity(input.sessionCookie);
  if (identity.kind !== "resolved") return identity;

  const destinations = visibleImplementedAdminRuntimeDestinations(
    identity.authority,
    identity.grants,
    new Date().toISOString(),
  );
  if (destinations.length === 0) {
    return Object.freeze({
      kind: "no-implemented-destination" as const,
      context: identity.context,
      account: identity.account,
      authority: identity.authority,
      grants: identity.grants,
    });
  }

  return Object.freeze({
    kind: "authorized" as const,
    context: identity.context,
    account: identity.account,
    authority: identity.authority,
    grants: identity.grants,
    destinations,
  });
}

/**
 * Server-only administrative route resolver.
 *
 * Administrative access requires a valid RFxchange session, a persisted platform-administrator
 * account bound to the authenticated provider subject, a passing privileged-security evaluation,
 * a persisted authority context, the explicit named permission, and an active matching scoped
 * grant. No binary admin flag or role name grants route access.
 */
export async function resolveAdminRoute(input: Readonly<{
  sessionCookie?: string | null;
  permission: string;
  scope?: string;
  access?: "read" | "write";
  satisfiedConditionKeys?: readonly string[];
}>): Promise<AdminRouteResolution> {
  const identity = await resolveAdminIdentity(input.sessionCookie);
  if (identity.kind !== "resolved") return identity;

  const requirement = createScopedAdministrativeActionRequirement({
    permission: input.permission,
    access: input.access ?? "read",
    scope: input.scope ?? "GLOBAL",
  });
  const decision = authorizeScopedAdministrativeAction(identity.authority, identity.grants, requirement, {
    now: new Date().toISOString(),
    satisfiedConditionKeys: input.satisfiedConditionKeys,
  });
  if (decision.kind !== "allow") {
    return Object.freeze({
      kind: "permission-denied" as const,
      context: identity.context,
      account: identity.account,
      authority: identity.authority,
      grants: identity.grants,
      permission: requirement.permission,
      scope: requirement.scope,
      reason: decision.reason,
    });
  }

  return Object.freeze({
    kind: "authorized" as const,
    context: identity.context,
    account: identity.account,
    authority: identity.authority,
    grants: identity.grants,
    permission: requirement.permission,
    scope: requirement.scope,
    grantId: String(decision.grantId),
  });
}
