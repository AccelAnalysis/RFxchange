import type { DecodedIdToken } from "firebase-admin/auth";

import {
  authenticatedServerContext,
  requireCredential,
  ServerSessionError,
  type AuthenticatedServerContext,
  type TrustedAuthenticationClaims,
} from "../../application/auth/server-session.ts";
import type { UserIdentityResolution } from "../../application/auth/resolve-user-identity.ts";
import { FIREBASE_AUTH_PROVIDER, type AuthenticationPrincipal } from "./provider.ts";
import type { FirebaseUserIdentityResolutionInput } from "./firebase-user-resolution.ts";

export const RFXCHANGE_SESSION_COOKIE_NAME = "rfx_session" as const;
export const RFXCHANGE_SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;
export const RFXCHANGE_RECENT_AUTH_WINDOW_SECONDS = 5 * 60;

export interface FirebaseAdminSessionAuth {
  verifyIdToken(idToken: string, checkRevoked?: boolean): Promise<DecodedIdToken>;
  createSessionCookie(idToken: string, options: Readonly<{ expiresIn: number }>): Promise<string>;
  verifySessionCookie(sessionCookie: string, checkRevoked?: boolean): Promise<DecodedIdToken>;
}

export interface TrustedUserIdentityResolver {
  resolve(input: FirebaseUserIdentityResolutionInput): Promise<UserIdentityResolution>;
}

export interface IssuedServerSession {
  readonly context: AuthenticatedServerContext;
  readonly cookie: Readonly<{
    readonly name: typeof RFXCHANGE_SESSION_COOKIE_NAME;
    readonly value: string;
    readonly httpOnly: true;
    readonly secure: boolean;
    readonly sameSite: "lax";
    readonly path: "/";
    readonly maxAgeSeconds: number;
  }>;
}

function isoFromSeconds(value: number, label: string): string {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ServerSessionError("credential-invalid", `${label} claim is invalid.`);
  }
  return new Date(value * 1000).toISOString();
}

export function trustedClaimsFromFirebaseToken(decoded: DecodedIdToken): TrustedAuthenticationClaims {
  const subject = decoded.uid?.trim();
  if (!subject) {
    throw new ServerSessionError("credential-invalid", "Verified Firebase credential is missing a UID.");
  }

  return Object.freeze({
    provider: FIREBASE_AUTH_PROVIDER,
    subject,
    email: typeof decoded.email === "string" ? decoded.email : null,
    displayName: typeof decoded.name === "string" ? decoded.name : null,
    emailVerified: decoded.email_verified === true,
    isAnonymous: decoded.firebase?.sign_in_provider === "anonymous",
    authenticatedAt: isoFromSeconds(decoded.auth_time, "auth_time"),
    issuedAt: isoFromSeconds(decoded.iat, "iat"),
    expiresAt: isoFromSeconds(decoded.exp, "exp"),
  });
}

function principalFromClaims(claims: TrustedAuthenticationClaims): AuthenticationPrincipal {
  return Object.freeze({
    provider: FIREBASE_AUTH_PROVIDER,
    subject: claims.subject,
    email: claims.email,
    displayName: claims.displayName,
    emailVerified: claims.emailVerified,
    isAnonymous: claims.isAnonymous,
  });
}

function unixSeconds(iso: string): number {
  return Math.floor(Date.parse(iso) / 1000);
}

export class FirebaseServerSessionBoundary {
  private readonly auth: FirebaseAdminSessionAuth;
  private readonly resolver: TrustedUserIdentityResolver;
  private readonly secureCookies: boolean;

  constructor(
    auth: FirebaseAdminSessionAuth,
    resolver: TrustedUserIdentityResolver,
    options: Readonly<{ secureCookies?: boolean }> = {},
  ) {
    this.auth = auth;
    this.resolver = resolver;
    this.secureCookies = options.secureCookies ?? process.env.NODE_ENV === "production";
  }

  private async resolve(
    claims: TrustedAuthenticationClaims,
    source: "id-token" | "session-cookie",
    now: string,
    requestedName?: string | null,
  ): Promise<AuthenticatedServerContext> {
    const resolution = await this.resolver.resolve({
      principal: principalFromClaims(claims),
      requestedName,
      now,
    });
    return authenticatedServerContext({ user: resolution.user, claims, source });
  }

  async authenticateIdToken(input: Readonly<{
    idToken: string;
    now: string;
    requestedName?: string | null;
  }>): Promise<AuthenticatedServerContext> {
    const idToken = requireCredential(input.idToken, "Firebase ID token");
    let decoded: DecodedIdToken;
    try {
      decoded = await this.auth.verifyIdToken(idToken, true);
    } catch {
      throw new ServerSessionError("credential-invalid", "Firebase ID token is invalid or revoked.");
    }
    return this.resolve(trustedClaimsFromFirebaseToken(decoded), "id-token", input.now, input.requestedName);
  }

  async issueSessionCookie(input: Readonly<{
    idToken: string;
    csrfVerified: boolean;
    now: string;
    requestedName?: string | null;
  }>): Promise<IssuedServerSession> {
    if (!input.csrfVerified) {
      throw new ServerSessionError(
        "csrf-verification-required",
        "CSRF verification is required before exchanging an ID token for a session cookie.",
      );
    }

    const idToken = requireCredential(input.idToken, "Firebase ID token");
    let decoded: DecodedIdToken;
    try {
      decoded = await this.auth.verifyIdToken(idToken, true);
    } catch {
      throw new ServerSessionError("credential-invalid", "Firebase ID token is invalid or revoked.");
    }

    const claims = trustedClaimsFromFirebaseToken(decoded);
    const nowSeconds = unixSeconds(input.now);
    const authSeconds = unixSeconds(claims.authenticatedAt);
    if (
      !Number.isFinite(nowSeconds) ||
      nowSeconds < authSeconds ||
      nowSeconds - authSeconds > RFXCHANGE_RECENT_AUTH_WINDOW_SECONDS
    ) {
      throw new ServerSessionError(
        "recent-authentication-required",
        "A recent sign-in is required before creating an RFxchange server session.",
      );
    }

    const context = await this.resolve(claims, "id-token", input.now, input.requestedName);
    let value: string;
    try {
      value = await this.auth.createSessionCookie(idToken, { expiresIn: RFXCHANGE_SESSION_DURATION_MS });
    } catch {
      throw new ServerSessionError("credential-invalid", "Firebase session cookie could not be created.");
    }

    return Object.freeze({
      context,
      cookie: Object.freeze({
        name: RFXCHANGE_SESSION_COOKIE_NAME,
        value,
        httpOnly: true as const,
        secure: this.secureCookies,
        sameSite: "lax" as const,
        path: "/" as const,
        maxAgeSeconds: Math.floor(RFXCHANGE_SESSION_DURATION_MS / 1000),
      }),
    });
  }

  async authenticateSessionCookie(input: Readonly<{
    sessionCookie: string;
    now: string;
  }>): Promise<AuthenticatedServerContext> {
    const sessionCookie = requireCredential(input.sessionCookie, "RFxchange session cookie");
    let decoded: DecodedIdToken;
    try {
      decoded = await this.auth.verifySessionCookie(sessionCookie, true);
    } catch {
      throw new ServerSessionError("credential-invalid", "RFxchange session is invalid or revoked.");
    }
    return this.resolve(trustedClaimsFromFirebaseToken(decoded), "session-cookie", input.now);
  }
}
