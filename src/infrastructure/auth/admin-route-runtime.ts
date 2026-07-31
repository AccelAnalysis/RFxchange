import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
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
      readonly permission: AdminPermissionKey;
    }>
  | Readonly<{
      readonly kind: "authorized";
      readonly context: AuthenticatedServerContext;
      readonly account: PlatformAdministratorAccount;
      readonly authority: PlatformAdministratorAuthorityContext;
      readonly permission: AdminPermissionKey;
    }>;

/**
 * Server-only administrative route resolver.
 *
 * Administrative access requires a valid RFxchange session, a persisted platform-administrator
 * account bound to the authenticated provider subject, a passing privileged-security evaluation,
 * a persisted authority context, and the explicit named permission. No binary admin flag or role
 * name grants route access.
 */
export async function resolveAdminRoute(input: Readonly<{
  sessionCookie?: string | null;
  permission: string;
}>): Promise<AdminRouteResolution> {
  const sessionCookie = input.sessionCookie?.trim();
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
  const authority = await foundation.adminAuthorization.authorityContexts.getByAdministratorId(
    account.administratorId,
  );
  if (!authority) {
    return Object.freeze({ kind: "not-administrator" as const, context });
  }

  const requirement = createAdministrativeActionRequirement({ permission: input.permission });
  const decision = authorizeAdministrativeAction(authority, requirement);
  if (decision.kind !== "allow") {
    return Object.freeze({
      kind: "permission-denied" as const,
      context,
      account,
      authority,
      permission: requirement.permission,
    });
  }

  return Object.freeze({
    kind: "authorized" as const,
    context,
    account,
    authority,
    permission: requirement.permission,
  });
}
