import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from "firebase/auth";

import {
  FIREBASE_AUTH_PROVIDER,
  type AuthenticationPrincipal,
  type AuthenticationStateListener,
  type BrowserAuthenticationProvider,
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

export class FirebaseBrowserAuthenticationProvider implements BrowserAuthenticationProvider {
  private readonly auth: Auth;

  constructor(auth: Auth) {
    this.auth = auth;
  }

  currentPrincipal(): AuthenticationPrincipal | null {
    return this.auth.currentUser ? toPrincipal(this.auth.currentUser) : null;
  }

  observe(listener: AuthenticationStateListener): () => void {
    return onAuthStateChanged(this.auth, (user) => {
      listener(
        user
          ? Object.freeze({ kind: "signed-in" as const, principal: toPrincipal(user) })
          : Object.freeze({ kind: "signed-out" as const }),
      );
    });
  }

  async registerWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<AuthenticationPrincipal> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    return toPrincipal(credential.user);
  }

  async signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<AuthenticationPrincipal> {
    const credential = await firebaseSignInWithEmailAndPassword(this.auth, email, password);
    return toPrincipal(credential.user);
  }

  signOut(): Promise<void> {
    return firebaseSignOut(this.auth);
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    return this.auth.currentUser ? this.auth.currentUser.getIdToken(forceRefresh) : null;
  }
}
