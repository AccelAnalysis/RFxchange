"use client";

import { useState } from "react";

import type { RfxRequestFamilyOption } from "../../application/rfx/rfx-draft-service";
import type { RfxAggregate } from "../../domain/rfx/model";
import { useI18n } from "../i18n/I18nProvider";
import { OperationalWorkspace, ParticipantShell } from "../participant/ParticipantWorkspace";
import { clearRetryStableCommand, resolveRetryStableCommand } from "../referrals/retry-stable-command";

import styles from "./RFxDraftWorkspace.module.css";

interface Props {
  readonly canCreate: boolean;
  readonly initialDrafts: readonly RfxAggregate[];
  readonly requestFamilies: readonly RfxRequestFamilyOption[];
  readonly selectedDraftId: string | null;
  readonly commandRecoveryScope: string;
}

function storage(): Storage | null {
  try { return window.sessionStorage; } catch { return null; }
}

function readableLifecycle(value: string): string {
  return value.replaceAll("_", " ");
}

export function RFxDraftWorkspace({
  canCreate,
  initialDrafts,
  requestFamilies,
  selectedDraftId: initialSelectedDraftId,
  commandRecoveryScope,
}: Props) {
  const { t } = useI18n();
  const [drafts, setDrafts] = useState(initialDrafts);
  const [selectedDraftId, setSelectedDraftId] = useState(initialSelectedDraftId);
  const [requestFamilyId, setRequestFamilyId] = useState(requestFamilies[0]?.id ?? "");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selectedDraft = drafts.find((draft) => draft.id === selectedDraftId) ?? null;
  const selectedFamily = requestFamilies.find((family) => family.id === requestFamilyId) ?? null;

  async function post(body: Record<string, unknown>) {
    const response = await fetch("/api/rfx", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(String(payload.detail ?? payload.error ?? t("rfxWorkspace.error")));
    return payload as unknown as { aggregate: RfxAggregate; replayed: boolean };
  }

  async function createDraft() {
    if (!requestFamilyId) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const commandStorage = storage();
    const storageKey = `rfxchange:rfx-create:${commandRecoveryScope}`;
    const fingerprint = `create:${requestFamilyId}`;
    const commandId = resolveRetryStableCommand({
      storage: commandStorage,
      storageKey,
      fingerprint,
      prefix: "rfx-create",
    });
    try {
      const result = await post({ action: "create-draft", commandId, requestFamilyId });
      setDrafts((current) => [result.aggregate, ...current.filter((draft) => draft.id !== result.aggregate.id)]);
      setSelectedDraftId(result.aggregate.id);
      clearRetryStableCommand({ storage: commandStorage, storageKey, commandId });
      setNotice(result.replayed ? t("rfxWorkspace.recovered") : t("rfxWorkspace.created"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("rfxWorkspace.error"));
    } finally {
      setBusy(false);
    }
  }

  async function changeFamily(nextFamilyId: string) {
    if (!selectedDraft || nextFamilyId === selectedDraft.requestFamily.requestFamilyId) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const commandStorage = storage();
    const storageKey = `rfxchange:rfx-family:${commandRecoveryScope}:${selectedDraft.id}`;
    const fingerprint = `family:${selectedDraft.id}:${selectedDraft.version}:${nextFamilyId}`;
    const commandId = resolveRetryStableCommand({ storage: commandStorage, storageKey, fingerprint, prefix: "rfx-family" });
    try {
      const result = await post({
        action: "change-request-family",
        commandId,
        rfxId: selectedDraft.id,
        expectedVersion: selectedDraft.version,
        requestFamilyId: nextFamilyId,
      });
      setDrafts((current) => current.map((draft) => draft.id === result.aggregate.id ? result.aggregate : draft));
      clearRetryStableCommand({ storage: commandStorage, storageKey, commandId });
      setNotice(result.replayed ? t("rfxWorkspace.recovered") : t("rfxWorkspace.changed"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("rfxWorkspace.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ParticipantShell activeItem="opportunities-rfx">
      <OperationalWorkspace ariaLabel={t("rfxWorkspace.ariaLabel")} className={styles.workspace}>
        <div data-rfx-workspace="private-drafts">
        <header className={styles.header}>
          <div>
            <span>{t("rfxWorkspace.eyebrow")}</span>
            <h1>{t("rfxWorkspace.title")}</h1>
            <p>{t("rfxWorkspace.intro")}</p>
          </div>
          <div className={styles.truthBoundary} role="note">
            <strong>{t("rfxWorkspace.privateDraft")}</strong>
            <span>{t("rfxWorkspace.privateDraftDetail")}</span>
          </div>
        </header>

        {!canCreate ? (
          <section className={styles.permissionState} role="status">
            <h2>{t("rfxWorkspace.permissionTitle")}</h2>
            <p>{t("rfxWorkspace.permissionBody")}</p>
          </section>
        ) : (
          <div className={styles.layout}>
            <aside className={styles.draftRail} aria-label={t("rfxWorkspace.draftsLabel")}>
              <h2>{t("rfxWorkspace.draftsTitle")}</h2>
              {drafts.length ? (
                <ul>
                  {drafts.map((draft) => (
                    <li key={draft.id}>
                      <button
                        type="button"
                        aria-current={selectedDraft?.id === draft.id ? "true" : undefined}
                        onClick={() => setSelectedDraftId(draft.id)}
                      >
                        <strong>{draft.requestFamily.labelSnapshot}</strong>
                        <span>{t("rfxWorkspace.version", { version: draft.version })}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : <p>{t("rfxWorkspace.empty")}</p>}
            </aside>

            <section
              className={styles.task}
              aria-labelledby="rfx-task-title"
              data-rfx-draft-id={selectedDraft?.id}
              data-rfx-version={selectedDraft?.version}
            >
              {notice ? <p className={styles.notice} role="status" aria-live="polite">{notice}</p> : null}
              {error ? <p className={styles.error} role="alert">{error}</p> : null}
              {selectedDraft ? (
                <>
                  <span className={styles.state}>{t("rfxWorkspace.draftState")}</span>
                  <h2 id="rfx-task-title">{selectedDraft.requestFamily.labelSnapshot}</h2>
                  <p>{selectedDraft.requestFamily.purposeSnapshot}</p>
                  <dl className={styles.facts}>
                    <div><dt>{t("rfxWorkspace.lifecycle")}</dt><dd>{selectedDraft.requestFamily.lifecycleSnapshot.map(readableLifecycle).join(" → ")}</dd></div>
                    <div><dt>{t("rfxWorkspace.release")}</dt><dd>AMACS {selectedDraft.requestFamily.amacsReleaseVersion}</dd></div>
                    <div><dt>{t("rfxWorkspace.versionLabel")}</dt><dd>{selectedDraft.version}</dd></div>
                  </dl>
                  <label className={styles.field}>
                    <span>{t("rfxWorkspace.changeType")}</span>
                    <select
                      data-rfx-family-select
                      value={selectedDraft.requestFamily.requestFamilyId}
                      disabled={busy}
                      onChange={(event) => void changeFamily(event.target.value)}
                    >
                      {requestFamilies.map((family) => <option key={family.id} value={family.id}>{family.label}</option>)}
                    </select>
                  </label>
                  <p className={styles.nextBoundary}>{t("rfxWorkspace.nextBoundary")}</p>
                </>
              ) : (
                <>
                  <h2 id="rfx-task-title">{t("rfxWorkspace.createTitle")}</h2>
                  <p>{t("rfxWorkspace.createBody")}</p>
                  <fieldset className={styles.familyChoices} disabled={busy || requestFamilies.length === 0}>
                    <legend>{t("rfxWorkspace.chooseType")}</legend>
                    {requestFamilies.map((family) => (
                      <label key={family.id}>
                        <input type="radio" name="request-family" value={family.id} checked={requestFamilyId === family.id} onChange={() => setRequestFamilyId(family.id)} />
                        <span><strong>{family.label}</strong><small>{family.purpose}</small></span>
                      </label>
                    ))}
                  </fieldset>
                  {selectedFamily ? <p className={styles.lifecyclePreview}>{selectedFamily.lifecycle.map(readableLifecycle).join(" → ")}</p> : null}
                  <button data-rfx-create className={styles.primary} type="button" disabled={busy || !requestFamilyId} onClick={() => void createDraft()}>
                    {busy ? t("rfxWorkspace.creating") : t("rfxWorkspace.createAction")}
                  </button>
                </>
              )}
            </section>
          </div>
        )}
        </div>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
