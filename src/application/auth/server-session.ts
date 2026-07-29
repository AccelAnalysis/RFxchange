import type { UserIdentity } from "../../domain/users/model.ts";

export interface TrustedAuthenticationClaims {
  readonly provider: string;
  readonly subject: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly emailVerified: boolean;
  readonly isAnonymous: boolean;
  readonly authenticatedAt: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}

export interface AuthenticatedServerContext {
  readonly user: UserIdentity;
  readonly authentication: Readonly<{
    readonly provider: string;
    readonly subject: string;
    readonly authenticatedAt: string;
    readonly issuedAt: string;
    readonly expiresAt: string;
    readonly source: "id-token" | "session-cookie";
  }>;
}

export type ServerSessionErrorCode =
  | "credential-required"
  | "credential-invalid"
  | "credential-revoked"
  | "account-disabled"
  | "csrf-verification-required"
  | "recent-authentication-required";

export class ServerSessionError extends Error {
  readonly code: ServerSessionErrorCode;

  constructor(code: ServerSessionErrorCode, message: string) {
    super(message);
    this.name = "ServerSessionError";
    this.code = code;
  }
}

export function requireCredential(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new ServerSessionError("credential-required", `${label} is required.`);
  }
  return normalized;
}

export function authenticatedServerContext(input: Readonly<{
  user: UserIdentity;
  claims: TrustedAuthenticationClaims;
  source: "id-token" | "session-cookie";
}>): AuthenticatedServerContext {
  return Object.freeze({
    user: input.user,
    authentication: Object.freeze({
      provider: input.claims.provider,
      subject: input.claims.subject,
      authenticatedAt: input.claims.authenticatedAt,
      issuedAt: input.claims.issuedAt,
      expiresAt: input.claims.expiresAt,
      source: input.source,
    }),
  });
}
