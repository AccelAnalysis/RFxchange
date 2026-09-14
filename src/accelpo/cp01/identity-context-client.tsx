"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createClientAuthenticationLifecycle,
  createClientAuthenticationProvider,
} from "../../infrastructure/auth/firebase-client.ts";
import type { AuthenticationState } from "../../infrastructure/auth/provider.ts";
import {
  createEmptyIdentityContextSnapshot,
  persistOrganizationId,
  readPersistedOrganizationId,
  type IdentityContextSnapshot,
  type IdentityOrganizationOption,
  type IdentityProjectionResponse,
} from "./identity-context.ts";

export interface IdentityContextActions {
  readonly signIn: (email: string, password: string) => Promise<void>;
  readonly register: (email: string, password: string, displayName?: string) => Promise<void>;
  readonly signOut: () => Promise<void>;
  readonly requestPasswordReset: (email: string) => Promise<void>;
  readonly sendVerificationEmail: () => Promise<void>;
  readonly reload: () => Promise<void>;
  readonly selectOrganization: (organizationId: string) => Promise<void>;
}

export interface IdentityContextValue extends IdentityContextSnapshot {
  readonly actions: IdentityContextActions;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

async function jsonResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null) as (T & { readonly error?: string }) | null;
  if (!response.ok) throw new Error(body && typeof body.error === "string" ? body.error : "The request could not be completed.");
  return body as T;
}

async function establishServerSession(idToken: string, displayName?: string): Promise<void> {
  const csrfResponse = await fetch("/api/auth/session", {
    credentials: "include",
    cache: "no-store",
  });
  const csrf = await jsonResponse<{ readonly csrfToken: string }>(csrfResponse);
  const response = await fetch("/api/auth/session", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken, csrfToken: csrf.csrfToken, requestedName: displayName }),
  });
  await jsonResponse(response);
}

async function readProjection(
  requestedOrganizationId: string | null,
  signal: AbortSignal,
): Promise<IdentityProjectionResponse> {
  const query = requestedOrganizationId
    ? `?organizationId=${encodeURIComponent(requestedOrganizationId)}`
    : "";
  const response = await fetch(`/api/accelpo/identity${query}`, {
    credentials: "include",
    cache: "no-store",
    headers: { accept: "application/json" },
    signal,
  });
  if (response.status === 401) return { kind: "unauthenticated" };
  return jsonResponse<IdentityProjectionResponse>(response);
}

function stateFromProjection(
  projection: IdentityProjectionResponse,
): IdentityContextSnapshot {
  if (projection.kind === "unauthenticated") {
    return Object.freeze({
      ...createEmptyIdentityContextSnapshot(),
      status: "unauthenticated" as const,
    });
  }
  if (projection.kind === "organization-selection-required") {
    return Object.freeze({
      ...createEmptyIdentityContextSnapshot(),
      status: "organization-selection" as const,
      organizationOptions: Object.freeze([...projection.options]),
    });
  }
  if (projection.kind === "forbidden") {
    return Object.freeze({
      ...createEmptyIdentityContextSnapshot(),
      status: "forbidden" as const,
      forbiddenReason: projection.reason,
    });
  }
  return Object.freeze({
    status: "ready" as const,
    user: projection.projection.user,
    activeOrgId: projection.projection.activeOrganization.organizationId,
    membership: projection.projection.membership,
    permissions: projection.projection.permissions,
    seat: projection.projection.seat,
    plan: projection.projection.plan,
    organizationOptions: projection.projection.activeMemberships,
    forbiddenReason: null,
    errorMessage: null,
  });
}

export function IdentityContextProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [snapshot, setSnapshot] = useState<IdentityContextSnapshot>(createEmptyIdentityContextSnapshot);
  const [authState, setAuthState] = useState<AuthenticationState | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadedSubject, setLoadedSubject] = useState<string | null>(null);
  const [loadedRefreshKey, setLoadedRefreshKey] = useState<number | null>(null);

  useEffect(() => {
    const authentication = createClientAuthenticationProvider();
    return authentication.observe((state) => setAuthState(state));
  }, []);

  useEffect(() => {
    if (!authState) return;
    if (authState.kind === "signed-out") {
      return;
    }

    const controller = new AbortController();
    const subject = authState.principal.subject;
    const requestedOrganizationId = typeof window === "undefined"
      ? null
      : readPersistedOrganizationId(window.localStorage, subject);
    void readProjection(requestedOrganizationId, controller.signal)
      .then((projection) => {
        if (controller.signal.aborted) return;
        setSnapshot(stateFromProjection(projection));
        setLoadedSubject(subject);
        setLoadedRefreshKey(refreshKey);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSnapshot(Object.freeze({
          ...createEmptyIdentityContextSnapshot(),
          status: "error" as const,
          errorMessage: error instanceof Error ? error.message : "Your access could not be loaded. Try again.",
        }));
        setLoadedSubject(subject);
        setLoadedRefreshKey(refreshKey);
      });

    return () => controller.abort();
  }, [authState, refreshKey]);

  const reload = useCallback(async () => {
    const authentication = createClientAuthenticationProvider();
    await authentication.getIdToken(true);
    setRefreshKey((value) => value + 1);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const authentication = createClientAuthenticationProvider();
    await authentication.signInWithEmailAndPassword(email, password);
    const idToken = await authentication.getIdToken(true);
    if (!idToken) throw new Error("Sign-in could not be completed.");
    await establishServerSession(idToken);
    setRefreshKey((value) => value + 1);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const authentication = createClientAuthenticationProvider();
    await authentication.registerWithEmailAndPassword(email, password);
    const idToken = await authentication.getIdToken(true);
    if (!idToken) throw new Error("Registration could not be completed.");
    await establishServerSession(idToken, displayName);
    setRefreshKey((value) => value + 1);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await createClientAuthenticationProvider().signOut();
    } finally {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include" }).catch(() => undefined);
      setSnapshot(Object.freeze({
        ...createEmptyIdentityContextSnapshot(),
        status: "unauthenticated" as const,
      }));
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    await createClientAuthenticationLifecycle().requestPasswordRecovery(email);
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    await createClientAuthenticationLifecycle().sendVerificationEmail(window.location.origin);
  }, []);

  const selectOrganization = useCallback(async (organizationId: string) => {
    const subject = createClientAuthenticationProvider().currentPrincipal()?.subject;
    if (!subject) throw new Error("Sign-in is required to select an organization.");
    persistOrganizationId(window.localStorage, subject, organizationId);
    await reload();
  }, [reload]);

  const visibleSnapshot = !authState
    ? snapshot
    : authState.kind === "signed-out"
      ? Object.freeze({ ...createEmptyIdentityContextSnapshot(), status: "unauthenticated" as const })
      : loadedSubject === authState.principal.subject && loadedRefreshKey === refreshKey
        ? snapshot
        : Object.freeze({ ...createEmptyIdentityContextSnapshot(), status: "loading" as const });

  const value = useMemo<IdentityContextValue>(() => Object.freeze({
    ...visibleSnapshot,
    actions: Object.freeze({
      signIn,
      register,
      signOut,
      requestPasswordReset,
      sendVerificationEmail,
      reload,
      selectOrganization,
    }),
  }), [visibleSnapshot, signIn, register, signOut, requestPasswordReset, sendVerificationEmail, reload, selectOrganization]);

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentityContext(): IdentityContextValue {
  const value = useContext(IdentityContext);
  if (!value) throw new Error("IdentityContextProvider is required.");
  return value;
}

export function IdentityGate({
  children,
  loading,
  unauthenticated,
  organizationSelection,
  forbidden,
  error,
}: Readonly<{
  readonly children: ReactNode;
  readonly loading: ReactNode;
  readonly unauthenticated: ReactNode;
  readonly organizationSelection: (options: readonly IdentityOrganizationOption[]) => ReactNode;
  readonly forbidden: (reason: IdentityContextSnapshot["forbiddenReason"]) => ReactNode;
  readonly error: ReactNode;
}>): ReactNode {
  const identity = useIdentityContext();
  if (identity.status === "loading") return loading;
  if (identity.status === "unauthenticated") return unauthenticated;
  if (identity.status === "organization-selection") return organizationSelection(identity.organizationOptions);
  if (identity.status === "forbidden") return forbidden(identity.forbiddenReason);
  if (identity.status === "error") return error;
  return children;
}
