import {
  createUserIdentity,
  loginSubject,
  type UserIdentity,
} from "../../domain/users/model";
import type { UserIdentityRepository } from "../../domain/users/repository";

export interface TrustedAuthenticationIdentity {
  readonly provider: string;
  readonly subject: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly emailVerified: boolean;
  readonly isAnonymous: boolean;
}

export interface UserIdentityIdStrategy {
  createId(identity: Pick<TrustedAuthenticationIdentity, "provider" | "subject">): string;
}

export interface ResolveUserIdentityInput {
  readonly identity: TrustedAuthenticationIdentity;
  /** Name collected during RFxchange onboarding. Preferred over provider display-name metadata. */
  readonly requestedName?: string | null;
  readonly now: string;
}

export type UserIdentityResolution = Readonly<{
  readonly kind: "existing" | "created";
  readonly user: UserIdentity;
  readonly emailVerified: boolean;
}>;

export type UserIdentityResolutionErrorCode =
  | "anonymous-identity-not-supported"
  | "provider-required"
  | "subject-required"
  | "email-required-for-new-user"
  | "name-required-for-new-user"
  | "user-id-collision";

export class UserIdentityResolutionError extends Error {
  constructor(
    readonly code: UserIdentityResolutionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "UserIdentityResolutionError";
  }
}

function required(value: string, code: UserIdentityResolutionErrorCode, message: string): string {
  const normalized = value.trim();
  if (!normalized) throw new UserIdentityResolutionError(code, message);
  return normalized;
}

function preferredName(input: ResolveUserIdentityInput): string | null {
  const requested = input.requestedName?.trim();
  if (requested) return requested;

  const providerName = input.identity.displayName?.trim();
  return providerName || null;
}

function sameLogin(
  user: UserIdentity,
  provider: string,
  subject: ReturnType<typeof loginSubject>,
): boolean {
  return user.login.provider === provider && user.login.subject === subject;
}

/**
 * Resolve one trusted authentication-provider identity to one stable RFxchange UserIdentity.
 *
 * This service deliberately does not verify Firebase tokens. AUTH-003 owns the server credential/session
 * boundary and must supply trusted identity claims before invoking AUTH-002 resolution.
 */
export async function resolveUserIdentity(
  input: ResolveUserIdentityInput,
  dependencies: Readonly<{
    users: UserIdentityRepository;
    ids: UserIdentityIdStrategy;
  }>,
): Promise<UserIdentityResolution> {
  if (input.identity.isAnonymous) {
    throw new UserIdentityResolutionError(
      "anonymous-identity-not-supported",
      "Anonymous authentication identities cannot become RFxchange user identities.",
    );
  }

  const provider = required(
    input.identity.provider,
    "provider-required",
    "Authentication provider is required.",
  );
  const subject = loginSubject(
    required(
      input.identity.subject,
      "subject-required",
      "Authentication provider subject is required.",
    ),
  );

  const existing = await dependencies.users.getByLogin(provider, subject);
  if (existing) {
    return Object.freeze({
      kind: "existing" as const,
      user: existing,
      emailVerified: input.identity.emailVerified,
    });
  }

  const email = input.identity.email?.trim().toLowerCase();
  if (!email) {
    throw new UserIdentityResolutionError(
      "email-required-for-new-user",
      "A provider email is required before creating a new RFxchange user identity.",
    );
  }

  const name = preferredName(input);
  if (!name) {
    throw new UserIdentityResolutionError(
      "name-required-for-new-user",
      "A user name is required before creating a new RFxchange user identity.",
    );
  }

  const id = dependencies.ids.createId({ provider, subject });
  const occupant = await dependencies.users.getById(id as UserIdentity["id"]);
  if (occupant) {
    if (sameLogin(occupant, provider, subject)) {
      return Object.freeze({
        kind: "existing" as const,
        user: occupant,
        emailVerified: input.identity.emailVerified,
      });
    }

    throw new UserIdentityResolutionError(
      "user-id-collision",
      "The resolved RFxchange user identifier is already owned by another authentication identity.",
    );
  }

  const candidate = createUserIdentity({
    id,
    name,
    primaryEmail: email,
    loginProvider: provider,
    loginSubject: subject,
    now: input.now,
  });

  try {
    await dependencies.users.create(candidate);
    return Object.freeze({
      kind: "created" as const,
      user: candidate,
      emailVerified: input.identity.emailVerified,
    });
  } catch (error) {
    // A concurrent resolver may have created the deterministic identity first. Re-read before failing.
    const concurrent =
      (await dependencies.users.getByLogin(provider, subject)) ??
      (await dependencies.users.getById(candidate.id));

    if (concurrent && sameLogin(concurrent, provider, subject)) {
      return Object.freeze({
        kind: "existing" as const,
        user: concurrent,
        emailVerified: input.identity.emailVerified,
      });
    }

    throw error;
  }
}
