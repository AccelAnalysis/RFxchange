"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./AdminOperatingCore.module.css";

function readable(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminCaseTransition({
  caseId,
  currentStatus,
  nextStatus,
}: Readonly<{
  caseId: string;
  currentStatus: string;
  nextStatus: string;
}>) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/admin/cases/${encodeURIComponent(caseId)}/transition`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          expectedStatus: currentStatus,
          nextStatus,
          reason,
        }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "The case could not be updated.");
      setReason("");
      setNotice(`${readable(nextStatus)} saved.`);
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The case could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  const actionLabel = nextStatus === "assigned" ? "Assign to me" : `Move to ${readable(nextStatus)}`;

  return (
    <section className={styles.transition} aria-busy={busy}>
      <p className={styles.sectionEyebrow}>Next action</p>
      <h2>{actionLabel}</h2>
      <label htmlFor="case-transition-reason">
        Reason
        <textarea
          id="case-transition-reason"
          maxLength={1000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Record why this case is ready to move forward."
        />
      </label>
      <button
        type="button"
        className={styles.primaryAction}
        disabled={busy || !reason.trim()}
        onClick={submit}
      >
        {busy ? "Saving…" : actionLabel}
      </button>
      {notice ? <p className={styles.transitionNotice} role="status">{notice}</p> : null}
    </section>
  );
}
