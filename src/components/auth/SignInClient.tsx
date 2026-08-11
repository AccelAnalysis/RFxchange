"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ActivationJourneyState } from "../../application/onboarding/activation-journey";
import { clearParticipantIntelligenceContext } from "../../application/participant/intelligence-context-storage";
import { BrandWordmark } from "../brand/BrandWordmark";
import { createClientAuthenticationProvider } from "../../infrastructure/auth/firebase-client";

import styles from "../onboarding/ActivationJourneyClient.module.css";

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await response.json()) as { error?: string } & T;
  if (!response.ok) throw new Error(body.error ?? `Request failed with HTTP ${response.status}.`);
  return body;
}

function isAdministrativeReturnTarget(returnTo: string | null | undefined): returnTo is string {
  return Boolean(returnTo && (returnTo === "/admin" || returnTo.startsWith("/admin/")));
}

function internalReturnTarget(returnTo: string | null | undefined): string | null {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) return null;
  return returnTo;
}

export function SignInClient({ returnTo }: Readonly<{ returnTo?: string | null }>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <BrandWordmark compact />
        <Link href="/join">Join</Link>
      </header>

      <section className={styles.shell}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Returning user</p>
          <h1>Sign in to RFxchange.</h1>
          <p>
            If your organization activation is incomplete, we will resume exactly where you left
            off. If activation is complete, you will enter the Exchange.
          </p>
        </div>

        {error ? <div className={styles.error} role="alert">{error}</div> : null}

        <section className={styles.card} aria-labelledby="signin-title">
          <h2 id="signin-title">Welcome back.</h2>
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              setBusy(true);
              setError(null);
              void (async () => {
                try {
                  const auth = createClientAuthenticationProvider();
                  await auth.signInWithEmailAndPassword(email, password);
                  const idToken = await auth.getIdToken(true);
                  if (!idToken) throw new Error("Firebase sign-in did not produce an ID token.");

                  const csrf = await jsonRequest<{ csrfToken: string }>("/api/auth/session");
                  const result = await jsonRequest<{ state: ActivationJourneyState | null }>(
                    "/api/auth/session",
                    {
                      method: "POST",
                      body: JSON.stringify({
                        idToken,
                        csrfToken: csrf.csrfToken,
                      }),
                    },
                  );
                  clearParticipantIntelligenceContext();

                  // Administration is an independent authority plane. Once authentication succeeds,
                  // an explicit admin return target is evaluated by the protected admin route itself.
                  if (isAdministrativeReturnTarget(returnTo)) {
                    router.replace(returnTo);
                    return;
                  }

                  if (!result.state) {
                    router.replace("/join?begin=1");
                    return;
                  }

                  const participantWorkspaceEligible =
                    result.state.lifecycleState === "controlled-platform" ||
                    result.state.lifecycleState === "open-platform";
                  if (participantWorkspaceEligible && result.state.organization) {
                    const workspaceUrl =
                      result.state.controlledPlatformUrl ??
                      `/geography/canvas?organizationId=${encodeURIComponent(result.state.organization.id)}`;
                    router.replace(internalReturnTarget(returnTo) ?? workspaceUrl);
                    return;
                  }
                  router.replace("/join");
                } catch (caught) {
                  setError(caught instanceof Error ? caught.message : "Sign-in failed.");
                  setBusy(false);
                }
              })();
            }}
          >
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button className={styles.primary} type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className={styles.hint}>
            New to RFxchange? <Link href="/join">Join and create your organization account.</Link>
          </p>
        </section>
      </section>
    </main>
  );
}
