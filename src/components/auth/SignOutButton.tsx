"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "../i18n/I18nProvider";
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
            await createClientAuthenticationProvider().signOut().catch(() => undefined);
            await fetch("/api/auth/session", { method: "DELETE" });
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
