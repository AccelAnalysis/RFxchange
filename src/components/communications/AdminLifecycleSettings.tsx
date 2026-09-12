"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/src/components/i18n/I18nProvider";
import { DEFAULT_LIFECYCLE_POLICY } from "@/src/domain/communications/lifecycle";
import styles from "./ServiceSettings.module.css";
export function AdminLifecycleSettings() {
  const { dictionary } = useI18n();
  const { common, admin: copy } = dictionary.interface.services;
  const [policy, setPolicy] = useState(DEFAULT_LIFECYCLE_POLICY);
  const [version, setVersion] = useState(0);
  const [reason, setReason] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/lifecycle", { signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(response.status === 409 ? common.conflict : response.status === 401 || response.status === 403 ? common.denied : common.saveError);
      setPolicy(data.policy); setVersion(data.version); setLoaded(true);
    }).catch(() => { if (!controller.signal.aborted) setMessage(common.loadError); });
    return () => controller.abort();
  }, [common]);
  return <section className={styles.panel}><Link href="/admin/communications">{copy.communications}</Link><h1>{copy.lifecycle}</h1>
    <p>{copy.lifecycleIntro}</p><p><Link href="/admin/communications/help">{copy.manageHelp}</Link></p>
    {!loaded && !message ? <p role="status">{common.loading}</p> : null}
    <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/admin/lifecycle", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ policy, expectedVersion: version, reason }) });
        const data = await response.json(); if (!response.ok) throw new Error(response.status === 409 ? common.conflict : response.status === 401 || response.status === 403 ? common.denied : common.saveError);
        setPolicy(data.policy); setVersion(data.version); setReason(""); setMessage(copy.saved);
      } catch (error) { setMessage(error instanceof Error && !(error instanceof TypeError) ? error.message : common.saveError); } finally { setBusy(false); }
    }}><fieldset disabled={!loaded || busy}><legend>{copy.timing}</legend>
      <label><input type="checkbox" checked={policy.enabled} onChange={e => setPolicy({ ...policy, enabled: e.target.checked })}/> {copy.enable}</label>
      {([ ["setupDelayHours", copy.setupDelayHours], ["retentionDays", copy.retentionDays], ["winBackDays", copy.winBackDays], ["minimumIntervalHours", copy.minimumIntervalHours] ] as const).map(([key, label]) => <label key={key}>{label}<input required type="number" min={key === "minimumIntervalHours" ? 24 : 1} max={8760} value={policy[key]} onChange={e => setPolicy({ ...policy, [key]: Number(e.target.value) })}/></label>)}
      <label>{copy.reason}<textarea required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)}/></label>
    </fieldset><button disabled={!loaded || busy}>{busy ? common.saving : copy.save}</button><p role="status">{message}</p></form></section>;
}
