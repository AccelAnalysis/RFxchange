export const FIREBASE_AUTH_PROVIDER = "firebase" as const;

export interface AuthenticationPrincipal {
  readonly provider: typeof FIREBASE_AUTH_PROVIDER;
  /** Provider-owned stable subject. This is not an RFxchange UserId. */
  readonly subject: string;
  readonly email: string | null;
  readonly displayName: string | null;
  readonly emailVerified: boolean;
  readonly isAnonymous: boolean;
}

export type AuthenticationState =
  | Readonly<{ readonly kind: "signed-out" }>
  | Readonly<{ readonly kind: "signed-in"; readonly principal: AuthenticationPrincipal }>;

export type AuthenticationStateListener = (state: AuthenticationState) => void;

/**
 * Provider-neutral browser authentication primitives.
 *
 * AUTH-001 owns only provider integration. Mapping a provider subject to RFxchange UserIdentity
 * belongs to AUTH-002, and authenticated server-session semantics belong to AUTH-003.
 */
export interface BrowserAuthenticationProvider {
  currentPrincipal(): AuthenticationPrincipal | null;
  observe(listener: AuthenticationStateListener): () => void;
  registerWithEmailAndPassword(email: string, password: string): Promise<AuthenticationPrincipal>;
  signInWithEmailAndPassword(email: string, password: string): Promise<AuthenticationPrincipal>;
  signOut(): Promise<void>;
  getIdToken(forceRefresh?: boolean): Promise<string | null>;
}
