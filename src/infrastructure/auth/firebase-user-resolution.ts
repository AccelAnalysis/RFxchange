import { createHash } from "node:crypto";

import {
  resolveUserIdentity,
  type ResolveUserIdentityInput,
  type TrustedAuthenticationIdentity,
  type UserIdentityIdStrategy,
  type UserIdentityResolution,
} from "../../application/auth/resolve-user-identity.ts";
import type { UserIdentityRepository } from "../../domain/users/repository.ts";
import {
  FIREBASE_AUTH_PROVIDER,
  type AuthenticationPrincipal,
} from "./provider.ts";

export class FirebaseUserIdentityIdStrategy implements UserIdentityIdStrategy {
  createId(identity: Pick<TrustedAuthenticationIdentity, "provider" | "subject">): string {
    const digest = createHash("sha256")
      .update(`rfxchange:user:${identity.provider}:${identity.subject}`, "utf8")
      .digest("hex")
      .slice(0, 32);

    return `usr_${digest}`;
  }
}

export function trustedIdentityFromFirebasePrincipal(
  principal: AuthenticationPrincipal,
): TrustedAuthenticationIdentity {
  return Object.freeze({
    provider: FIREBASE_AUTH_PROVIDER,
    subject: principal.subject,
    email: principal.email,
    displayName: principal.displayName,
    emailVerified: principal.emailVerified,
    isAnonymous: principal.isAnonymous,
  });
}

export interface FirebaseUserIdentityResolutionInput {
  readonly principal: AuthenticationPrincipal;
  readonly requestedName?: string | null;
  readonly now: string;
}

/**
 * Injectable Firebase-to-RFxchange identity resolver.
 *
 * The supplied principal must already be trusted. AUTH-003 will verify Firebase ID tokens and then
 * call this resolver; browser-provided subject strings must never be passed directly here.
 */
export class FirebaseUserIdentityResolver {
  private readonly users: UserIdentityRepository;
  private readonly ids: UserIdentityIdStrategy;

  constructor(
    users: UserIdentityRepository,
    ids: UserIdentityIdStrategy = new FirebaseUserIdentityIdStrategy(),
  ) {
    this.users = users;
    this.ids = ids;
  }

  resolve(input: FirebaseUserIdentityResolutionInput): Promise<UserIdentityResolution> {
    const applicationInput: ResolveUserIdentityInput = {
      identity: trustedIdentityFromFirebasePrincipal(input.principal),
      requestedName: input.requestedName,
      now: input.now,
    };

    return resolveUserIdentity(applicationInput, {
      users: this.users,
      ids: this.ids,
    });
  }
}
