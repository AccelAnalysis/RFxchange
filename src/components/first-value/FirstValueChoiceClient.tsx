"use client";

import { useState } from "react";
import Link from "next/link";

import type { FirstValueDestinationContract, FirstValueIntent } from "../../domain/first-value/model";
import { OperationalWorkspace, ParticipantShell } from "../participant/ParticipantWorkspace";
import styles from "./FirstValueChoiceClient.module.css";

interface FirstValueResponse {
  readonly error?: string;
  readonly lifecycleState?: string;
  readonly nextUrl?: string;
  readonly gate?: Readonly<{ kind: "ready" | "blocked"; failed?: readonly string[]; remediation?: string }>;
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
  const [selected, setSelected] = useState<FirstValueIntent | null>(initialSelection);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<FirstValueResponse["gate"] | null>(null);

  async function submit() {
    if (!selected) return;
    setPending(true);
    setError(null);
    setBlocked(null);
    try {
      const response = await fetch("/api/first-value", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ selectedIntent: selected }),
      });
      const result = await response.json() as FirstValueResponse;
      if (!response.ok) throw new Error(result.error ?? "First value could not be saved.");
      if (result.lifecycleState === "open-platform" && result.nextUrl) {
        window.location.assign(result.nextUrl);
        return;
      }
      setBlocked(result.gate ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "First value could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <ParticipantShell activeItem="Intelligence">
      <OperationalWorkspace ariaLabel="Post-orientation first-value selection" className={styles.workspace}>
        <section className={styles.wrap}>
          <p className={styles.eyebrow}>Orientation complete · one final activation step</p>
          <h1>What would create value first?</h1>
          <p className={styles.lede}>Choose the path that matters now. This is not a registration objective, permanent organization type, permission, qualification, or commercial commitment.</p>
          {recommendation ? (
            <div className={styles.recommendation} role="note">
              <strong>Suggested from your saved {acquisitionContextLabel?.replaceAll("-", " ")} context</strong>
              <span>We highlighted a compatible path. The saved context cannot select it for you or release OPEN.</span>
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
          {blocked?.kind === "blocked" ? (
            <div className={styles.error} role="alert">
              OPEN remains safely closed. Required remediation: {(blocked.failed ?? []).join(", ")}.
              {blocked.remediation ? <Link href={blocked.remediation}>Continue to remediation</Link> : null}
            </div>
          ) : null}
          <button className={styles.primary} type="button" disabled={!selected || pending} onClick={submit}>
            {pending ? "Checking every OPEN requirement…" : "Save choice and enter the Exchange"}
          </button>
        </section>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
