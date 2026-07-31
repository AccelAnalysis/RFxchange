"use client";

import Link from "next/link";
import { useState } from "react";

import type { ActivationJourneyState } from "../../application/onboarding/activation-journey";
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

export function SignInClient() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryOrganizationName, setRecoveryOrganizationName] = useState("");

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
            off. If activation is complete, you will enter the controlled Exchange.
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
                  const result = await jsonRequest<{ state: ActivationJourneyState }>(
                    "/api/auth/session",
                    {
                      method: "POST",
                      body: JSON.stringify({
                        idToken,
                        csrfToken: csrf.csrfToken,
                        provisionalOrganizationName: recoveryOrganizationName.trim() || undefined,
                      }),
                    },
                  );

                  if (result.state.nextStep === "complete" && result.state.controlledPlatformUrl) {
                    window.location.assign(result.state.controlledPlatformUrl);
                    return;
                  }
                  window.location.assign("/join");
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
            <label>
              Organization name
              <small>
                Optional. Use this only if your Firebase account was created but organization
                activation never started.
              </small>
              <input
                value={recoveryOrganizationName}
                onChange={(event) => setRecoveryOrganizationName(event.target.value)}
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
