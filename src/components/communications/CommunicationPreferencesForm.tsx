"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/src/components/i18n/I18nProvider";
import { COMMUNICATION_CONSENT_VERSION, type CommunicationPreferences } from "@/src/domain/communications/lifecycle";
import styles from "./ServiceSettings.module.css";
import { SMS_PROGRAM } from "../../content/sms";
import { SmsConsentDisclosure } from "./SmsConsentDisclosure";

export function CommunicationPreferencesForm() {
  const { dictionary } = useI18n();
  const { common, preferences: copy } = dictionary.interface.services;
  const [preferences, setPreferences] = useState<CommunicationPreferences | null>(null);
  const [smsAvailable, setSmsAvailable] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/communications/preferences", { signal: controller.signal }).then(async (response) => {
      const body = await response.json();
      if (!response.ok) throw new Error(common.loadError);
      setSmsAvailable(body.smsAvailable);
      const saved = body.preferences as CommunicationPreferences | null;
      setPreferences(saved ? { ...saved, ...(saved.consentTextVersion !== COMMUNICATION_CONSENT_VERSION ? { marketingConsent: false, email: false, sms: false } : {}), consentTextVersion: COMMUNICATION_CONSENT_VERSION } : { userId: "", version: 0, email: false, sms: false, marketingConsent: false, phone: null,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, consentTextVersion: COMMUNICATION_CONSENT_VERSION, updatedAt: "" });
      if (saved && saved.consentTextVersion !== COMMUNICATION_CONSENT_VERSION) setStatus(copy.disclosuresChanged);
      setReady(true);
    }).catch(() => { if (!controller.signal.aborted) setStatus(common.loadError); });
    return () => controller.abort();
  }, [common.loadError, copy.disclosuresChanged]);
  return <section className={styles.panel}>
    <Link href="/organization-profile">{common.back}</Link>
    <h1>{copy.title}</h1>
    <p>{copy.intro}</p>
    {!ready && !status ? <p role="status">{common.loading}</p> : null}
    <form onSubmit={async (event) => {
      event.preventDefault(); if (!preferences) return;
      setBusy(true); setStatus("");
      try {
        const response = await fetch("/api/communications/preferences", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...preferences, expectedVersion: preferences.version }) });
        const body = await response.json();
        if (!response.ok) throw new Error(response.status === 409 ? common.conflict : response.status === 401 || response.status === 403 ? common.denied : common.saveError);
        setPreferences(body.preferences); setStatus(copy.saved);
      } catch (error) { setStatus(error instanceof Error && !(error instanceof TypeError) ? error.message : common.saveError); }
      finally { setBusy(false); }
    }}>
      <fieldset disabled={!ready || busy}>
        <legend>{copy.optional}</legend>
        <label><input type="checkbox" checked={preferences?.marketingConsent ?? false} onChange={(e) => setPreferences(p => p && ({ ...p, marketingConsent: e.target.checked }))}/> {copy.consent}</label>
        <label><input type="checkbox" checked={preferences?.email ?? false} onChange={(e) => setPreferences(p => p && ({ ...p, email: e.target.checked }))}/> {copy.email}</label>
        <label><input type="checkbox" aria-label={copy.sms} disabled={!smsAvailable} checked={preferences?.sms ?? false} onChange={(e) => setPreferences(p => p && ({ ...p, sms: e.target.checked }))}/> {SMS_PROGRAM.consent}</label>
        <SmsConsentDisclosure />
        {!smsAvailable ? <p>{copy.smsUnavailable} <a href={`mailto:${SMS_PROGRAM.supportEmail}`}>{SMS_PROGRAM.supportEmail}</a></p> : null}
        <label>{copy.timeZone}<input required value={preferences?.timeZone ?? ""} onChange={(e) => setPreferences(p => p && ({ ...p, timeZone: e.target.value }))}/></label>
        <p>{copy.timing}</p>
      </fieldset>
      <button disabled={!ready || busy} type="submit">{busy ? common.saving : copy.save}</button>
      <p role="status" aria-live="polite">{status}</p>
    </form>
  </section>;
}
