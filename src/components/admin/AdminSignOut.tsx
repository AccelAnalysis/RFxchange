"use client";

import { useState } from "react";
import { createClientAuthenticationProvider } from "../../infrastructure/auth/firebase-client";
import styles from "./AdminSignOut.module.css";

export function AdminSignOut() {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return <div className={styles.container}>
    <button type="button" disabled={busy} onClick={() => {
      setBusy(true);
      setFailed(false);
      void (async () => {
        try {
          const response = await fetch("/api/auth/session", { method: "DELETE" });
          if (!response.ok) throw new Error("Session could not be cleared.");
          await createClientAuthenticationProvider().signOut();
          window.location.assign("/signin");
        } catch {
          setFailed(true);
          setBusy(false);
        }
      })();
    }}>{busy ? "Signing out…" : "Sign out"}</button>
    {failed ? <p role="alert">Sign-out could not finish. Please try again.</p> : null}
  </div>;
}
