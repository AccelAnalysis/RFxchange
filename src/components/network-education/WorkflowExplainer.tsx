"use client";

import { useRef, useState, type SyntheticEvent } from "react";

import type { NetworkExplainerKey } from "../../application/network-education/catalog";
import { useI18n } from "../i18n/I18nProvider";

import styles from "./WorkflowExplainer.module.css";

export function WorkflowExplainer({ explainerKey }: Readonly<{ explainerKey: NetworkExplainerKey }>) {
  const { t } = useI18n();
  const [notice, setNotice] = useState<string | null>(null);
  const recorded = useRef(false);
  const prefix = `networkEducation.explainers.${explainerKey}`;

  async function record(action: "explainer-viewed" | "explainer-dismissed") {
    try {
      const snapshotResponse = await fetch("/api/network-education", { cache: "no-store" });
      const snapshot = await snapshotResponse.json() as { progress?: { version: number }; persisted?: boolean; error?: string };
      if (!snapshotResponse.ok || !snapshot.progress) throw new Error(snapshot.error ?? t("networkEducation.states.error"));
      const response = await fetch("/api/network-education", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, explainerKey, expectedVersion: snapshot.persisted ? snapshot.progress.version : null, commandId: `workflow-explainer-${crypto.randomUUID()}` }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? t("networkEducation.states.error"));
      setNotice(action === "explainer-dismissed" ? t("networkEducation.explainerDismissed") : null);
    } catch (error) {
      if (action === "explainer-viewed") recorded.current = false;
      setNotice(error instanceof Error ? error.message : t("networkEducation.states.error"));
    }
  }

  function toggled(event: SyntheticEvent<HTMLDetailsElement>) {
    if (event.currentTarget.open && !recorded.current) {
      recorded.current = true;
      void record("explainer-viewed");
    }
  }

  return <details className={styles.explainer} onToggle={toggled}>
    <summary><span>{t("networkEducation.explainerLabel")}</span><strong>{t(`${prefix}.title`)}</strong></summary>
    <div className={styles.body}>
      <dl>
        <div><dt>{t("networkEducation.questions.what")}</dt><dd>{t(`${prefix}.what`)}</dd></div>
        <div><dt>{t("networkEducation.questions.why")}</dt><dd>{t(`${prefix}.why`)}</dd></div>
        <div><dt>{t("networkEducation.questions.happens")}</dt><dd>{t(`${prefix}.happens`)}</dd></div>
        <div><dt>{t("networkEducation.questions.next")}</dt><dd>{t(`${prefix}.next`)}</dd></div>
      </dl>
      <button type="button" onClick={(event) => { event.currentTarget.closest("details")?.removeAttribute("open"); void record("explainer-dismissed"); }}>{t("networkEducation.closeExplainer")}</button>
      {notice ? <p role="status">{notice}</p> : null}
    </div>
  </details>;
}
