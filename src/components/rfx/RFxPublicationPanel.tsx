"use client";

import { useEffect, useState } from "react";

import type { RfxAggregate } from "../../domain/rfx/model";
import type {
  PublicationReadinessResult,
  ResponderOpportunityProjection,
  RfxPublicationAudience,
} from "../../domain/rfx/publication";
import { useI18n } from "../i18n/I18nProvider";
import {
  clearRetryStableCommand,
  resolveRetryStableCommand,
} from "../referrals/retry-stable-command";

import styles from "./RFxPublicationPanel.module.css";

interface Props {
  readonly aggregate: RfxAggregate;
  readonly commandRecoveryScope: string;
  readonly onCommitted: (aggregate: RfxAggregate) => void;
}

interface ReadinessResponse {
  readonly readiness: PublicationReadinessResult;
  readonly preview: ResponderOpportunityProjection | null;
}

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function findingMessageKey(code: string): string {
  return `rfxWorkspace.finding.${code.replaceAll(".", "_").replaceAll("-", "_")}`;
}

export function RFxPublicationPanel({
  aggregate,
  commandRecoveryScope,
  onCommitted,
}: Props) {
  const { t } = useI18n();
  const [audience, setAudience] = useState<RfxPublicationAudience>("public");
  const [readiness, setReadiness] = useState<PublicationReadinessResult | null>(null);
  const [preview, setPreview] = useState<ResponderOpportunityProjection | null>(null);
  const [published, setPublished] = useState<ResponderOpportunityProjection | null>(null);
  const [busy, setBusy] = useState<"readiness" | "publish" | "reload" | null>(
    aggregate.lifecycleState === "published" ? "reload" : null,
  );
  const [error, setError] = useState<string | null>(null);
  const publishUnavailable = readiness?.findings.some(
    (item) => item.code === "authority.publish-unavailable",
  ) ?? false;

  useEffect(() => {
    if (aggregate.lifecycleState !== "published") return;
    const controller = new AbortController();
    void fetch(`/api/rfx?action=publication&rfxId=${encodeURIComponent(aggregate.id)}`, {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json() as {
          projection?: ResponderOpportunityProjection;
          detail?: string;
          error?: string;
        };
        if (!response.ok || !payload.projection)
          throw new Error(payload.error ?? payload.detail ?? t("rfxWorkspace.publicationLoadError"));
        setPublished(payload.projection);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : t("rfxWorkspace.publicationLoadError"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(null);
      });
    return () => controller.abort();
  }, [aggregate.id, aggregate.lifecycleState, t]);

  async function checkReadiness() {
    setBusy("readiness");
    setError(null);
    setReadiness(null);
    setPreview(null);
    try {
      const response = await fetch(
        `/api/rfx?action=publication-readiness&rfxId=${encodeURIComponent(aggregate.id)}&audience=${encodeURIComponent(audience)}`,
        { credentials: "same-origin" },
      );
      const payload = await response.json() as ReadinessResponse & { detail?: string };
      if (!response.ok)
        throw new Error((payload as ReadinessResponse & { error?: string }).error ?? payload.detail ?? t("rfxWorkspace.readinessError"));
      setReadiness(payload.readiness);
      setPreview(payload.preview);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("rfxWorkspace.readinessError"));
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (!preview || !readiness || readiness.aggregateVersion !== aggregate.version) return;
    setBusy("publish");
    setError(null);
    const commandStorage = storage();
    const storageKey = `rfxchange:rfx-publish:${commandRecoveryScope}:${aggregate.id}`;
    const fingerprint = `publish:${aggregate.id}:${aggregate.version}:${preview.digest}:${audience}`;
    const commandId = resolveRetryStableCommand({
      storage: commandStorage,
      storageKey,
      fingerprint,
      prefix: "rfx-publish",
    });
    try {
      const response = await fetch("/api/rfx", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          commandId,
          rfxId: aggregate.id,
          expectedVersion: aggregate.version,
          previewDigest: preview.digest,
          audience,
        }),
      });
      const payload = await response.json() as {
        aggregate?: RfxAggregate;
        projection?: ResponderOpportunityProjection;
        detail?: string;
        error?: string;
      };
      if (!response.ok || !payload.aggregate || !payload.projection)
        throw new Error(payload.error ?? payload.detail ?? t("rfxWorkspace.publishError"));
      clearRetryStableCommand({ storage: commandStorage, storageKey, commandId });
      setPublished(payload.projection);
      onCommitted(payload.aggregate);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("rfxWorkspace.publishError"));
    } finally {
      setBusy(null);
    }
  }

  if (aggregate.lifecycleState === "published") {
    return (
      <section id="rfx-readiness" className={styles.panel} data-rfx-publication="published">
        <p className={styles.eyebrow}>{t("rfxWorkspace.publishedEyebrow")}</p>
        <h3>{t("rfxWorkspace.publishedTitle")}</h3>
        {busy === "reload" ? <p role="status">{t("rfxWorkspace.publicationLoading")}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {published ? (
          <>
            <dl className={styles.summary}>
              <div><dt>{t("rfxWorkspace.publishedVersion")}</dt><dd>{published.aggregateVersion}</dd></div>
              <div><dt>{t("rfxWorkspace.publicationAudience")}</dt><dd>{t(`rfxWorkspace.audience.${published.audience}`)}</dd></div>
            </dl>
            <a className={styles.primary} href={`/opportunities/${published.reference}`}>
              {t("rfxWorkspace.openShareLink")}
            </a>
          </>
        ) : null}
      </section>
    );
  }

  return (
    <section id="rfx-readiness" className={styles.panel} data-rfx-publication="draft">
      <p className={styles.eyebrow}>{t("rfxWorkspace.readinessEyebrow")}</p>
      <h3>{t("rfxWorkspace.readinessTitle")}</h3>
      <p>{t("rfxWorkspace.readinessIntro")}</p>
      <label className={styles.field}>
        <span>{t("rfxWorkspace.publicationAudience")}</span>
        <select data-rfx-publication-audience value={audience} disabled={busy !== null} onChange={(event) => {
          setAudience(event.target.value as RfxPublicationAudience);
          setReadiness(null);
          setPreview(null);
        }}>
          <option value="public">{t("rfxWorkspace.audience.public")}</option>
          <option value="authenticated-participants">{t("rfxWorkspace.audience.authenticated-participants")}</option>
        </select>
      </label>
      <button data-rfx-readiness-check className={styles.secondary} type="button" disabled={busy !== null} onClick={() => void checkReadiness()}>
        {busy === "readiness" ? t("rfxWorkspace.checkingReadiness") : t("rfxWorkspace.checkReadiness")}
      </button>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {readiness ? (
        <div className={styles.readiness} data-readiness-status={readiness.status}>
          <h4>{readiness.status === "ready" ? t("rfxWorkspace.ready") : t("rfxWorkspace.blocked")}</h4>
          <p>{t("rfxWorkspace.readinessCounts", {
            blocking: readiness.findings.filter((item) => item.severity === "blocking").length,
            advisory: readiness.findings.filter((item) => item.severity === "advisory").length,
          })}</p>
          {readiness.findings.length ? (
            <ul>
              {readiness.findings.map((item) => (
                <li key={`${item.code}:${item.relatedRecordId ?? "none"}`}>
                  <a href={item.workspaceTarget}>{t(findingMessageKey(item.code))}</a>
                  <span>{item.severity === "blocking" ? t("rfxWorkspace.blocking") : t("rfxWorkspace.advisory")}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {readiness.requirementStatus.length ? (
            <div className={styles.requirements} aria-label={t("rfxWorkspace.requirementReadiness")}>
              {readiness.requirementStatus.map((item) => (
                <span key={item.requirementId} data-requirement-readiness={item.status}>
                  {item.status === "ready" ? t("rfxWorkspace.requirementReady") : t("rfxWorkspace.requirementBlocked")}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {preview ? (
        <article className={styles.preview} data-rfx-preview-digest={preview.digest} data-rfx-preview-reference={preview.reference}>
          <p className={styles.eyebrow}>{t("rfxWorkspace.previewStatus")}</p>
          <h4>{preview.payload.title}</h4>
          <p>{preview.payload.summary}</p>
          <dl className={styles.summary}>
            <div><dt>{t("rfxWorkspace.issuedBy")}</dt><dd>{preview.payload.issuerDisplayName}</dd></div>
            <div><dt>{t("rfxWorkspace.geography")}</dt><dd>{preview.payload.localities.map((item) => item.label).join(", ")}</dd></div>
            <div><dt>{t("rfxWorkspace.previewVersion")}</dt><dd>{preview.aggregateVersion}</dd></div>
          </dl>
          <h5>{t("rfxWorkspace.responderRequirements")}</h5>
          <ul>{preview.payload.requirements.map((item, index) => <li key={`${item.title}:${index}`}>{item.title}</li>)}</ul>
          <p className={styles.digest}>{t("rfxWorkspace.previewDigest")} <code>{preview.digest.slice(0, 12)}</code></p>
        </article>
      ) : null}
      <button
        className={styles.primary}
        data-rfx-publish
        type="button"
        disabled={!preview || readiness?.status !== "ready" || publishUnavailable || busy !== null}
        onClick={() => void publish()}
      >
        {busy === "publish" ? t("rfxWorkspace.publishing") : t("rfxWorkspace.publish")}
      </button>
      <p className={styles.boundary}>{t("rfxWorkspace.publicationBoundary")}</p>
    </section>
  );
}
