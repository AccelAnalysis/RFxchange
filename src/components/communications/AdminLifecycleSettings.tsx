"use client";
import { useEffect, useState } from "react";
import { DEFAULT_LIFECYCLE_POLICY } from "@/src/domain/communications/lifecycle";
import styles from "./ServiceSettings.module.css";
export function AdminLifecycleSettings() {
  const [policy, setPolicy] = useState(DEFAULT_LIFECYCLE_POLICY);
  const [version, setVersion] = useState(0);
  const [reason, setReason] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/lifecycle", { signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setPolicy(data.policy); setVersion(data.version); setLoaded(true);
    }).catch(error => { if (!controller.signal.aborted) setMessage(error.message); });
    return () => controller.abort();
  }, []);
  return <section className={styles.panel}><a href="/admin/communications">Communications</a><h1>Lifecycle journeys</h1>
    <p>Configure setup, retention and win-back messages. Every send requires current consent and channel availability. Delivery history is available in Communications.</p><p><a href="/admin/communications/help">Manage public help answers</a></p>
    <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/admin/lifecycle", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ policy, expectedVersion: version, reason }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error);
        setPolicy(data.policy); setVersion(data.version); setReason(""); setMessage("Journey configuration saved.");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Configuration could not be saved."); } finally { setBusy(false); }
    }}><fieldset disabled={!loaded || busy}><legend>Journey timing</legend>
      <label><input type="checkbox" checked={policy.enabled} onChange={e => setPolicy({ ...policy, enabled: e.target.checked })}/> Enable journeys when sending is configured</label>
      {([ ["setupDelayHours", "Setup reminder after (hours)"], ["retentionDays", "Retention after inactivity (days)"], ["winBackDays", "Win-back after inactivity (days)"], ["minimumIntervalHours", "Minimum interval between messages (hours)"] ] as const).map(([key, label]) => <label key={key}>{label}<input required type="number" min={key === "minimumIntervalHours" ? 24 : 1} max={8760} value={policy[key]} onChange={e => setPolicy({ ...policy, [key]: Number(e.target.value) })}/></label>)}
      <label>Reason for change<textarea required maxLength={1000} value={reason} onChange={e => setReason(e.target.value)}/></label>
    </fieldset><button disabled={!loaded || busy}>Save configuration</button><p role="status">{message}</p></form></section>;
}
