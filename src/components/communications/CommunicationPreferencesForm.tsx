"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { COMMUNICATION_CONSENT_VERSION, type CommunicationPreferences } from "@/src/domain/communications/lifecycle";
import styles from "./ServiceSettings.module.css";
import { SMS_PROGRAM } from "../../content/sms";
import { SmsConsentDisclosure } from "./SmsConsentDisclosure";

export function CommunicationPreferencesForm() {
  const [preferences, setPreferences] = useState<CommunicationPreferences | null>(null);
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/communications/preferences", { signal: controller.signal }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Communication preferences could not be loaded.");
      setSmsAvailable(body.smsAvailable);
      const saved = body.preferences as CommunicationPreferences | null;
      setPreferences(saved ? { ...saved, ...(saved.consentTextVersion !== COMMUNICATION_CONSENT_VERSION ? { marketingConsent: false, email: false, sms: false } : {}), consentTextVersion: COMMUNICATION_CONSENT_VERSION } : { userId: "", version: 0, email: false, sms: false, marketingConsent: false, phone: null,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, consentTextVersion: COMMUNICATION_CONSENT_VERSION, updatedAt: "" });
      if (saved && saved.consentTextVersion !== COMMUNICATION_CONSENT_VERSION) setStatus("Our communication disclosures have changed. Review and save your choices to receive optional updates.");
      setReady(true);
    }).catch((error) => { if (!controller.signal.aborted) setStatus(error.message); });
    return () => controller.abort();
  }, []);
  return <section className={styles.panel}>
    <Link href="/organization-profile">Back to your organization</Link>
    <h1>Communication preferences</h1>
    <p>Choose how RFxchange keeps in touch. You can turn these messages off at any time.</p>
    <form onSubmit={async (event) => {
      event.preventDefault(); if (!preferences) return;
      setBusy(true); setStatus("");
      try {
        const response = await fetch("/api/communications/preferences", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...preferences, expectedVersion: preferences.version }) });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setPreferences(body.preferences); setStatus("Your preferences are saved.");
      } catch (error) { setStatus(error instanceof Error ? error.message : "Preferences could not be saved."); }
      finally { setBusy(false); }
    }}>
      <fieldset disabled={!ready || busy}>
        <legend>Optional updates</legend>
        <label><input type="checkbox" checked={preferences?.marketingConsent ?? false} onChange={(e) => setPreferences(p => p && ({ ...p, marketingConsent: e.target.checked }))}/> I agree to receive organization setup reminders, community updates and invitations to return to RFxchange.</label>
        <label><input type="checkbox" checked={preferences?.email ?? false} onChange={(e) => setPreferences(p => p && ({ ...p, email: e.target.checked }))}/> Email</label>
        <label><input type="checkbox" aria-label="Text messages" disabled={!smsAvailable} checked={preferences?.sms ?? false} onChange={(e) => setPreferences(p => p && ({ ...p, sms: e.target.checked }))}/> {SMS_PROGRAM.consent}</label>
        <SmsConsentDisclosure />
        {!smsAvailable ? <p>Text messages require a verified phone number on your account. For help, email <a href={`mailto:${SMS_PROGRAM.supportEmail}`}>{SMS_PROGRAM.supportEmail}</a>.</p> : null}
        <label>Time zone<input required value={preferences?.timeZone ?? ""} onChange={(e) => setPreferences(p => p && ({ ...p, timeZone: e.target.value }))}/></label>
        <p>Optional updates are sent between 9 AM and 8 PM in your time zone, at most once a day. Security and essential service messages are managed separately.</p>
      </fieldset>
      <button disabled={!ready || busy} type="submit">{busy ? "Saving…" : "Save preferences"}</button>
      <p role="status" aria-live="polite">{status}</p>
    </form>
  </section>;
}
