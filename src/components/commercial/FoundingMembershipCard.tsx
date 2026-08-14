"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Copy = Readonly<Record<string, string>>;
type StatusPayload = Readonly<{
  offer: Readonly<{ amount: number; currency: string; interval: string; cap: number }>;
  capacity: Readonly<{ remaining: number; currentOrganizationReserved: boolean }>;
  status: Readonly<{
    subscriptionStatus: string;
    cancelAtPeriodEnd: boolean;
    foundingRecognition: boolean;
  }>;
  canManageBilling: boolean;
  checkoutRelease: Readonly<{ allowed: boolean; reason: string }>;
}>;

const ERROR_COPY: Readonly<Record<string, string>> = Object.freeze({
  "billing-authority-required": "billingAuthorityRequired",
  "founding-capacity-full": "capacityFull",
  "checkout-closed": "checkoutClosed",
  "proof-organization-only": "proofOrganizationOnly",
  "release-configuration-invalid": "releaseConfigurationInvalid",
  "subscription-exists": "subscriptionExists",
  "already-founding": "alreadyFounding",
  "invalid-command-id": "invalidCommand",
  "organization-unavailable": "organizationUnavailable",
  unauthenticated: "unauthenticated",
});

function participantError(copy: Copy, code: string | undefined): string {
  const key = code ? ERROR_COPY[code] : undefined;
  return key ? copy[key] ?? copy.checkoutUnavailable : copy.checkoutUnavailable;
}

function releaseMessage(copy: Copy, reason: string): string | null {
  if (reason === "checkout-closed") return copy.checkoutClosed;
  if (reason === "proof-organization-only") return copy.proofOrganizationOnly;
  if (reason === "release-configuration-invalid") return copy.releaseConfigurationInvalid;
  return null;
}

function lifecycleMessage(copy: Copy, payload: StatusPayload): string | null {
  if (payload.status.foundingRecognition) return copy.activeBody;
  if (payload.status.subscriptionStatus === "past-due") return copy.delinquent;
  if (payload.status.subscriptionStatus === "suspended") return copy.suspended;
  if (payload.status.subscriptionStatus === "canceled") return copy.canceled;
  return null;
}

export function FoundingMembershipCard({ copy }: Readonly<{ copy: Copy }>) {
  const [payload, setPayload] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const commandId = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/commercial/founding/status", { cache: "no-store" });
      const body = await response.json() as StatusPayload & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "commercial-status-unavailable");
      setPayload(body);
    } catch {
      setPayload(null);
      setError(copy.statusUnavailable);
    } finally {
      setLoading(false);
    }
  }, [copy.statusUnavailable]);

  useEffect(() => { void load(); }, [load]);

  async function beginCheckout() {
    setSubmitting(true);
    setError(null);
    commandId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/commercial/founding/checkout", {
        method: "POST",
        headers: { "idempotency-key": commandId.current },
      });
      const body = await response.json() as { checkoutUrl?: string; error?: string };
      if (!response.ok || !body.checkoutUrl) {
        setError(participantError(copy, body.error));
        return;
      }
      window.location.assign(body.checkoutUrl);
    } catch {
      setError(copy.checkoutUnavailable);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <section className="commerce-card" aria-live="polite"><p>{copy.loadingStatus}</p></section>;
  }
  if (!payload) {
    return (
      <section className="commerce-card" aria-live="polite">
        <p>{error ?? copy.statusUnavailable}</p>
        <button type="button" onClick={() => void load()}>{copy.retry}</button>
      </section>
    );
  }

  const lifecycle = lifecycleMessage(copy, payload);
  const release = releaseMessage(copy, payload.checkoutRelease.reason);
  const nonTerminal = !["not-subscribed", "canceled"].includes(payload.status.subscriptionStatus);
  const full = payload.capacity.remaining <= 0 && !payload.capacity.currentOrganizationReserved;
  const disabled = submitting || !payload.canManageBilling || !payload.checkoutRelease.allowed || full || nonTerminal;

  return (
    <section className="commerce-card" aria-labelledby="founding-commerce-title">
      <p className="commerce-eyebrow">{copy.eyebrow}</p>
      <h1 id="founding-commerce-title">{copy.heading}</h1>
      <p>{copy.intro}</p>
      <div className="commerce-plan">
        <strong>{copy.planLabel}</strong>
        <span>{copy.priceFallback}</span>
      </div>
      <p>{copy.capacitySummary.replace("{remaining}", String(payload.capacity.remaining))}</p>

      {payload.status.foundingRecognition ? <h2>{copy.activeTitle}</h2> : null}
      {lifecycle ? <p aria-live="polite">{lifecycle}</p> : null}
      {payload.status.cancelAtPeriodEnd ? <p>{copy.cancellationScheduled}</p> : null}
      {!payload.canManageBilling ? <p>{copy.billingAuthorityRequired}</p> : null}
      {full ? <p>{copy.capacityFull}</p> : null}
      {release ? <p>{release}</p> : null}
      {error ? <p role="alert">{error}</p> : null}

      <div className="commerce-actions">
        <button type="button" disabled={disabled} onClick={() => void beginCheckout()}>
          {submitting ? copy.preparingCheckout : copy.becomeFounding}
        </button>
        <a href="/geography/canvas">{copy.returnExchange}</a>
      </div>
    </section>
  );
}
