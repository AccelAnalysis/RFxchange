import {
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  type ActionCodeSettings,
  type Auth,
  type User,
} from "firebase/auth";

import {
  FIREBASE_AUTH_PROVIDER,
  type AuthenticationPrincipal,
} from "./provider.ts";

function toPrincipal(user: User): AuthenticationPrincipal {
  return Object.freeze({
    provider: FIREBASE_AUTH_PROVIDER,
    subject: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
  });
}

function actionCodeSettings(continueUrl?: string): ActionCodeSettings | undefined {
  const normalized = continueUrl?.trim();
  return normalized ? { url: normalized } : undefined;
}

function firebaseErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  return typeof (error as { code?: unknown }).code === "string"
    ? (error as { code: string }).code
    : null;
}

export class FirebaseBrowserAuthenticationLifecycle {
  private readonly auth: Auth;

  constructor(auth: Auth) {
    this.auth = auth;
  }

  async sendVerificationEmail(continueUrl?: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error("A signed-in Firebase user is required to send email verification.");
    if (user.emailVerified) return;
    await sendEmailVerification(user, actionCodeSettings(continueUrl));
  }

  /**
   * Initiates provider recovery without exposing whether an account exists for the supplied email.
   * UI callers should always return the same acknowledgement message.
   */
  async requestPasswordRecovery(email: string, continueUrl?: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) throw new Error("Email is required for password recovery.");
    try {
      await sendPasswordResetEmail(this.auth, normalized, actionCodeSettings(continueUrl));
    } catch (error) {
      if (firebaseErrorCode(error) === "auth/user-not-found") return;
      throw error;
    }
  }

  async reloadCurrentPrincipal(): Promise<AuthenticationPrincipal | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    await reload(user);
    return toPrincipal(user);
  }
}
