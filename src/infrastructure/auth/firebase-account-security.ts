import type { UserRecord } from "firebase-admin/auth";

import type { AuthenticationAccountSecuritySnapshot } from "../../application/auth/account-security.ts";
import { FIREBASE_AUTH_PROVIDER } from "./provider.ts";

export interface FirebaseAdminAccountSecurityAuth {
  getUser(uid: string): Promise<UserRecord>;
  updateUser(uid: string, properties: Readonly<{ disabled?: boolean }>): Promise<UserRecord>;
  revokeRefreshTokens(uid: string): Promise<void>;
}

function requiredSubject(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("Firebase subject is required.");
  return normalized;
}

function optionalIso(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

export function accountSecuritySnapshotFromFirebaseUser(
  user: UserRecord,
): AuthenticationAccountSecuritySnapshot {
  return Object.freeze({
    provider: FIREBASE_AUTH_PROVIDER,
    subject: user.uid,
    email: user.email ?? null,
    emailVerified: user.emailVerified,
    disabled: user.disabled,
    mfaEnrolled: (user.multiFactor?.enrolledFactors.length ?? 0) > 0,
    tokensValidAfter: optionalIso(user.tokensValidAfterTime),
    lastSignInAt: optionalIso(user.metadata.lastSignInTime),
  });
}

/**
 * Provider-side account security operations for AUTH-004.
 *
 * Disabling an identity also revokes refresh tokens so existing sessions cannot remain usable.
 * Restoring an identity does not recreate or restore old sessions; the user must authenticate again.
 */
export class FirebaseAccountSecurityService {
  private readonly auth: FirebaseAdminAccountSecurityAuth;

  constructor(auth: FirebaseAdminAccountSecurityAuth) {
    this.auth = auth;
  }

  async inspect(subject: string): Promise<AuthenticationAccountSecuritySnapshot> {
    return accountSecuritySnapshotFromFirebaseUser(await this.auth.getUser(requiredSubject(subject)));
  }

  async revokeSessions(subject: string): Promise<AuthenticationAccountSecuritySnapshot> {
    const uid = requiredSubject(subject);
    await this.auth.revokeRefreshTokens(uid);
    return accountSecuritySnapshotFromFirebaseUser(await this.auth.getUser(uid));
  }

  async disable(subject: string): Promise<AuthenticationAccountSecuritySnapshot> {
    const uid = requiredSubject(subject);
    await this.auth.updateUser(uid, { disabled: true });
    await this.auth.revokeRefreshTokens(uid);
    return accountSecuritySnapshotFromFirebaseUser(await this.auth.getUser(uid));
  }

  async restore(subject: string): Promise<AuthenticationAccountSecuritySnapshot> {
    const uid = requiredSubject(subject);
    const user = await this.auth.updateUser(uid, { disabled: false });
    return accountSecuritySnapshotFromFirebaseUser(user);
  }
}
