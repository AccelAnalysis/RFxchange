"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import type { FirstValueDestinationContract, FirstValueIntent } from "../../domain/first-value/model";
import { OperationalWorkspace, ParticipantShell } from "../participant/ParticipantWorkspace";
import styles from "./FirstValueChoiceClient.module.css";

interface FirstValueResponse {
  readonly error?: string;
  readonly nextUrl?: string;
}

export function FirstValueChoiceClient({
  destinations,
  recommendation,
  initialSelection,
  acquisitionContextLabel,
}: Readonly<{
  destinations: readonly FirstValueDestinationContract[];
  recommendation: FirstValueIntent | null;
  initialSelection: FirstValueIntent | null;
  acquisitionContextLabel: string | null;
}>) {
  const router = useRouter();
  const [selected, setSelected] = useState<FirstValueIntent | null>(initialSelection);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!selected) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/first-value", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedIntent: selected }),
      });
      const result = await response.json() as FirstValueResponse;
      if (!response.ok) throw new Error(result.error ?? "First value could not be saved.");
      if (result.nextUrl) {
        router.replace(result.nextUrl);
        return;
      }
      throw new Error("The saved choice did not include a safe next destination.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "First value could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ParticipantShell activeItem="Network">
      <OperationalWorkspace ariaLabel="Post-orientation first-value selection" className={styles.workspace}>
        <section className={styles.wrap}>
          <p className={styles.eyebrow}>Optional setup · personalize your next step</p>
          <h1>What would create value first?</h1>
          <p className={styles.lede}>Choose a path if it helps us personalize the workspace, or enter the Exchange now without making this choice. This is not a registration objective, permanent organization type, permission, qualification, or commercial commitment.</p>
          {recommendation ? (
            <div className={styles.recommendation} role="note">
              <strong>Suggested from your saved {acquisitionContextLabel?.replaceAll("-", " ")} context</strong>
              <span>We highlighted a compatible path. The saved context cannot select it or unlock actions for you.</span>
            </div>
          ) : null}
          <fieldset className={styles.choices}>
            <legend>Select one first-value path</legend>
            {destinations.map((destination) => (
              <label key={destination.intent} className={styles.choice} data-recommended={recommendation === destination.intent || undefined}>
                <input
                  type="radio"
                  name="first-value"
                  value={destination.intent}
                  checked={selected === destination.intent}
                  onChange={() => setSelected(destination.intent)}
                />
                <span><strong>{destination.label}</strong><small>{destination.summary}</small></span>
                <b>{destination.availability === "available" ? "Available now" : "Intent saved truthfully"}</b>
              </label>
            ))}
          </fieldset>
          <div className={styles.boundary}>Every activated organization can issue and respond to opportunities in the relevant future workflows. This choice personalizes your first step; it grants no domain authority and does not create live activity.</div>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <div className={styles.actions}>
            <button className={styles.primary} type="button" disabled={!selected || pending} onClick={submit}>
              {pending ? "Saving your choice…" : "Save choice and enter the Exchange"}
            </button>
            <Link className={styles.secondary} href="/exchange">Enter the Exchange without choosing</Link>
          </div>
        </section>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
