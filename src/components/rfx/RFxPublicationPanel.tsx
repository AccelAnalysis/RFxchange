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

interface KeyedState<T> {
  readonly key: string;
  readonly value: T;
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
  const [readinessState, setReadinessState] = useState<KeyedState<PublicationReadinessResult> | null>(null);
  const [previewState, setPreviewState] = useState<KeyedState<ResponderOpportunityProjection> | null>(null);
  const [publishedState, setPublishedState] = useState<KeyedState<ResponderOpportunityProjection> | null>(null);
  const [busy, setBusy] = useState<"readiness" | "publish" | null>(null);
  const [errorState, setErrorState] = useState<KeyedState<string> | null>(null);

  const aggregateStateKey = `${aggregate.id}:${aggregate.version}:${aggregate.lifecycleState}`;
  const draftStateKey = `${aggregate.id}:${aggregate.version}:${audience}`;
  const readiness = readinessState?.key === draftStateKey ? readinessState.value : null;
  const preview = previewState?.key === draftStateKey ? previewState.value : null;
  const published = publishedState?.key === aggregateStateKey ? publishedState.value : null;
  const activeErrorKey = aggregate.lifecycleState === "draft" ? draftStateKey : aggregateStateKey;
  const error = errorState?.key === activeErrorKey ? errorState.value : null;
  const publishUnavailable = readiness?.findings.some(
    (item) => item.code === "authority.publish-unavailable",
  ) ?? false;
  const publicationLoading = aggregate.lifecycleState === "published" && !published && !error;

  useEffect(() => {
    if (aggregate.lifecycleState !== "draft" || !aggregate.definition) return;
    const builder = document.querySelector<HTMLElement>("[data-rfx-definition-builder]");
    if (!builder) return;

    const moduleAnchors = [
      ["rfx-definition-requirements", "required-capabilities-title"],
      ["rfx-definition-responseStructure", "response-structure-title"],
      ["rfx-definition-evaluationDefinition", "evaluation-method-title"],
    ] as const;
    const moved: Array<Readonly<{ placeholder: HTMLElement; target: HTMLElement; originalTargetId: string }>> = [];
    for (const [recoveryId, actualId] of moduleAnchors) {
      const placeholder = document.getElementById(recoveryId);
      const target = document.getElementById(actualId);
      if (!placeholder || !target || placeholder === target) continue;
      const originalTargetId = target.id;
      placeholder.removeAttribute("id");
      target.id = recoveryId;
      moved.push(Object.freeze({ placeholder, target, originalTargetId }));
    }

    const requirementRows = Array.from(builder.querySelectorAll<HTMLElement>("[data-rfx-requirement]"));
    const assignedRows: Array<Readonly<{ row: HTMLElement; assignedId: string; originalId: string }>> = [];
    aggregate.definition.requirements.forEach((requirement, index) => {
      const row = requirementRows[index];
      if (!row) return;
      const assignedId = `rfx-requirement-${requirement.id}`;
      const originalId = row.id;
      row.id = assignedId;
      assignedRows.push(Object.freeze({ row, assignedId, originalId }));
    });

    return () => {
      for (const item of assignedRows) {
        if (item.row.id === item.assignedId) item.row.id = item.originalId;
      }
      for (const item of moved) {
        if (item.target.id === item.placeholder.dataset.rfxRecoveryTargetId || item.target.id.startsWith("rfx-definition-")) {
          item.target.id = item.originalTargetId;
        }
        if (!item.placeholder.id) item.placeholder.id = item.target.id.startsWith("rfx-definition-")
          ? item.target.id
          : moduleAnchors.find(([, actualId]) => actualId === item.originalTargetId)?.[0] ?? "";
      }
    };
  }, [aggregate.definition, aggregate.lifecycleState]);

  useEffect(() => {
    if (aggregate.lifecycleState !== "published") return;
    const controller = new AbortController();
    const requestKey = aggregateStateKey;
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
        setPublishedState({ key: requestKey, value: payload.projection });
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setErrorState({
            key: requestKey,
            value: cause instanceof Error ? cause.message : t("rfxWorkspace.publicationLoadError"),
          });
        }
      });
    return () => controller.abort();
  }, [aggregate.id, aggregate.lifecycleState, aggregateStateKey, t]);

  async function checkReadiness() {
    const requestKey = draftStateKey;
    setBusy("readiness");
    setErrorState(null);
    setReadinessState(null);
    setPreviewState(null);
    try {
      const response = await fetch(
        `/api/rfx?action=publication-readiness&rfxId=${encodeURIComponent(aggregate.id)}&audience=${encodeURIComponent(audience)}`,
        { credentials: "same-origin" },
      );
      const payload = await response.json() as ReadinessResponse & { detail?: string };
      if (!response.ok)
        throw new Error((payload as ReadinessResponse & { error?: string }).error ?? payload.detail ?? t("rfxWorkspace.readinessError"));
      if (payload.readiness.aggregateVersion !== aggregate.version) {
        throw new Error(t("rfxWorkspace.readinessError"));
      }
      setReadinessState({ key: requestKey, value: payload.readiness });
      if (payload.preview) setPreviewState({ key: requestKey, value: payload.preview });
    } catch (cause) {
      setErrorState({
        key: requestKey,
        value: cause instanceof Error ? cause.message : t("rfxWorkspace.readinessError"),
      });
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    if (!preview || !readiness || readiness.aggregateVersion !== aggregate.version) return;
    const requestKey = draftStateKey;
    setBusy("publish");
    setErrorState(null);
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
      const committedKey = `${payload.aggregate.id}:${payload.aggregate.version}:${payload.aggregate.lifecycleState}`;
      setPublishedState({ key: committedKey, value: payload.projection });
      onCommitted(payload.aggregate);
    } catch (cause) {
      setErrorState({
        key: requestKey,
        value: cause instanceof Error ? cause.message : t("rfxWorkspace.publishError"),
      });
    } finally {
      setBusy(null);
    }
  }

  if (aggregate.lifecycleState === "published") {
    return (
      <section id="rfx-readiness" className={styles.panel} data-rfx-publication="published">
        <p className={styles.eyebrow}>{t("rfxWorkspace.publishedEyebrow")}</p>
        <h3>{t("rfxWorkspace.publishedTitle")}</h3>
        {publicationLoading ? <p role="status">{t("rfxWorkspace.publicationLoading")}</p> : null}
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
        <select
          data-rfx-publication-audience
          value={audience}
          disabled={busy !== null}
          onChange={(event) => setAudience(event.target.value as RfxPublicationAudience)}
        >
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
