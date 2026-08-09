"use client";

import Link from "next/link";

import styles from "./error.module.css";

interface ApplicationErrorBoundaryProps {
  readonly error: Error & Readonly<{ digest?: string }>;
  readonly reset: () => void;
}

/**
 * Recovery boundary for protected-route dependency failures and other unexpected render failures.
 * Server details remain in secured logs; the participant sees only stable recovery guidance and an
 * optional opaque Next.js digest that support can use to correlate the incident.
 */
export default function ApplicationErrorBoundary({
  error,
  reset,
}: ApplicationErrorBoundaryProps) {
  return (
    <main className={styles.page}>
      <section className={styles.card} role="alert" aria-labelledby="recovery-title">
        <p className={styles.eyebrow}>Temporary service interruption</p>
        <h1 id="recovery-title">Your RFxchange progress is still here.</h1>
        <p className={styles.lede}>
          We could not load the information needed for this screen. Your account, organization,
          profile, and activation progress are not reset by this error.
        </p>
        <p className={styles.supporting}>
          Retry the request. If the problem continues, return to the homepage and try again later.
        </p>
        <div className={styles.actions}>
          <button className={styles.primary} type="button" onClick={reset}>
            Retry
          </button>
          <Link className={styles.secondary} href="/">
            RFxchange home
          </Link>
        </div>
        {error.digest ? (
          <p className={styles.reference}>
            Support reference: <code>{error.digest}</code>
          </p>
        ) : null}
      </section>
    </main>
  );
}
