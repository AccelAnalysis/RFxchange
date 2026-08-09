"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { NetworkEducationPath } from "../../application/network-education/catalog";
import type { NetworkEducationProgress } from "../../domain/network-education/model";
import { useI18n } from "../i18n/I18nProvider";
import { OperationalWorkspace, ParticipantShell } from "../participant/ParticipantWorkspace";

import styles from "./QuickStartWorkspace.module.css";

interface Snapshot {
  readonly progress: NetworkEducationProgress;
  readonly persisted: boolean;
  readonly catalogVersion: number;
  readonly catalogUpdateAvailable: boolean;
  readonly paths: readonly NetworkEducationPath[];
}

export function QuickStartWorkspace({ initialSnapshot }: Readonly<{ initialSnapshot: Snapshot }>) {
  const { t } = useI18n();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const selected = snapshot.paths.find((path) => path.key === snapshot.progress.activePath) ?? snapshot.paths[0];
  const completeCount = selected.items.filter((item) => snapshot.progress.completedItemKeys.includes(item.key)).length;
  const percent = Math.round((completeCount / selected.items.length) * 100);
  const recommendation = snapshot.paths.find((path) => path.key === snapshot.progress.recommendedPath);

  async function mutate(action: string, input: Readonly<Record<string, unknown>> = {}) {
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/network-education", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          expectedVersion: snapshot.persisted ? snapshot.progress.version : null,
          commandId: `network-education-${crypto.randomUUID()}`,
          ...input,
        }),
      });
      const result = await response.json() as { progress?: NetworkEducationProgress; error?: string };
      if (!response.ok || !result.progress) throw new Error(result.error ?? t("networkEducation.states.error"));
      setSnapshot((current) => ({ ...current, persisted: true, progress: result.progress as NetworkEducationProgress, catalogUpdateAvailable: false }));
      setNotice(t("networkEducation.states.saved"));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : t("networkEducation.states.error"));
    } finally {
      setBusy(false);
    }
  }

  const pathProgress = useMemo(() => Object.fromEntries(snapshot.paths.map((path) => [path.key, path.items.filter((item) => snapshot.progress.completedItemKeys.includes(item.key)).length])), [snapshot.paths, snapshot.progress.completedItemKeys]);

  return (
    <ParticipantShell activeItem="Quick Start">
      <OperationalWorkspace ariaLabel={t("networkEducation.ariaLabel")} className={styles.workspace}>
        <header className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>{t("networkEducation.eyebrow")}</p>
            <h1>{t("networkEducation.title")}</h1>
            <p>{t("networkEducation.intro")}</p>
          </div>
          <div className={styles.status} role="status">
            <small>{t("networkEducation.progress")}</small>
            <strong>{percent}%</strong>
            <span>{t(`networkEducation.status.${snapshot.progress.status}`)}</span>
          </div>
        </header>

        <ol className={styles.spine} aria-label={t("networkEducation.valueSpineLabel")}>
          {["understandable", "discoverable", "connectable", "actionable"].map((step, index) => <li key={step}><span>{index + 1}</span>{t(`networkEducation.valueSpine.${step}`)}</li>)}
        </ol>

        <section className={styles.recommendation} aria-label={t("networkEducation.recommended")}>
          <div><p>{t("networkEducation.recommended")}</p><h2>{recommendation ? t(`networkEducation.${recommendation.messageKey}.title`) : ""}</h2></div>
          <p>{t("networkEducation.recommendationBoundary")}</p>
        </section>

        {snapshot.catalogUpdateAvailable ? <p className={styles.update} role="status">{t("networkEducation.catalogUpdate")}</p> : null}
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}

        <nav className={styles.pathTabs} aria-label={t("networkEducation.pathNavigation")}>{snapshot.paths.map((path) => (
          <button key={path.key} type="button" aria-current={path.key === selected.key ? "page" : undefined} disabled={busy} onClick={() => void mutate("path-selected", { pathKey: path.key })}>
            <strong>{t(`networkEducation.${path.messageKey}.title`)}</strong>
            <span>{pathProgress[path.key]}/{path.items.length}</span>
          </button>
        ))}</nav>

        <section className={styles.path} aria-labelledby={`path-${selected.key}`}>
          <header><div><p>{t("networkEducation.path")}</p><h2 id={`path-${selected.key}`}>{t(`networkEducation.${selected.messageKey}.title`)}</h2></div><p>{t(`networkEducation.${selected.messageKey}.summary`)}</p></header>
          <progress max={selected.items.length} value={completeCount} aria-label={t("networkEducation.pathProgress", { complete: completeCount, total: selected.items.length })} />
          <ol className={styles.itemList}>{selected.items.map((item, index) => {
            const completed = snapshot.progress.completedItemKeys.includes(item.key);
            return <li key={item.key} data-completed={completed}>
              <span className={styles.itemNumber}>{index + 1}</span>
              <div><h3>{t(`networkEducation.${item.messageKey}.title`)}</h3><p>{t(`networkEducation.${item.messageKey}.body`)}</p><small>{item.availability === "available" ? t("networkEducation.available") : t("networkEducation.planned")}</small></div>
              <div className={styles.itemActions}>
                {item.route ? <Link href={item.route}>{t("networkEducation.openWorkflow")}</Link> : <span aria-disabled="true">{t("networkEducation.unavailable")}</span>}
                <button type="button" disabled={busy || completed} onClick={() => void mutate("item-completed", { pathKey: selected.key, itemKey: item.key })}>{completed ? t("networkEducation.completed") : t("networkEducation.markComplete")}</button>
              </div>
            </li>;
          })}</ol>
        </section>

        <footer className={styles.footerActions}>
          {snapshot.progress.status === "dismissed" || snapshot.progress.status === "completed"
            ? <button type="button" disabled={busy} onClick={() => void mutate("guide-reopened")}>{t("networkEducation.reopen")}</button>
            : <button type="button" disabled={busy} onClick={() => void mutate("guide-dismissed")}>{t("networkEducation.dismiss")}</button>}
          <button className={styles.primary} type="button" disabled={busy} onClick={() => void mutate("guide-completed")}>{t("networkEducation.completeGuide")}</button>
        </footer>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
