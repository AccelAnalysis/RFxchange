"use client";

import { useState } from "react";

import { createClientAuthenticationProvider } from "../../infrastructure/auth/firebase-client";

export function SignOutButton({ className }: Readonly<{ className?: string }>) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void (async () => {
          try {
            await createClientAuthenticationProvider().signOut().catch(() => undefined);
            await fetch("/api/auth/session", { method: "DELETE" });
          } finally {
            window.location.assign("/");
          }
        })();
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
