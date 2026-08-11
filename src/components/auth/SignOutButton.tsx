"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "../i18n/I18nProvider";
import { clearParticipantIntelligenceContext } from "../../application/participant/intelligence-context-storage";
import { createClientAuthenticationProvider } from "../../infrastructure/auth/firebase-client";

export function SignOutButton({
  className,
  role,
}: Readonly<{ className?: string; role?: "menuitem" }>) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className={className}
      role={role}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void (async () => {
          try {
            clearParticipantIntelligenceContext();
            try {
              await createClientAuthenticationProvider().signOut();
            } catch {
              // Server-session invalidation must still run if client-provider teardown is unavailable.
            }
            await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
          } finally {
            router.replace("/");
          }
        })();
      }}
    >
      {busy
        ? t("participantNavigation.signingOut")
        : t("participantNavigation.signOut")}
    </button>
  );
}
