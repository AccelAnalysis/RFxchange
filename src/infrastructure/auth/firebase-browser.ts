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

const freshlyAuthenticated = new WeakSet<Auth>();

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
    freshlyAuthenticated.add(this.auth);
    return toPrincipal(credential.user);
  }

  async signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<AuthenticationPrincipal> {
    const credential = await firebaseSignInWithEmailAndPassword(this.auth, email, password);
    freshlyAuthenticated.add(this.auth);
    return toPrincipal(credential.user);
  }

  signOut(): Promise<void> {
    freshlyAuthenticated.delete(this.auth);
    return firebaseSignOut(this.auth);
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (!this.auth.currentUser) return null;

    // Firebase has already minted/currently resolved a token as part of successful registration or
    // sign-in. Do not immediately make a second network refresh merely because an existing caller
    // asks for forceRefresh=true. Subsequent explicit force-refresh requests retain their semantics.
    const justAuthenticated = freshlyAuthenticated.delete(this.auth);
    return this.auth.currentUser.getIdToken(forceRefresh && !justAuthenticated);
  }
}
