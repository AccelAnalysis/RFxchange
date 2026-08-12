"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { RfxPerformanceLocationOption } from "../../application/rfx/rfx-draft-service";
import type {
  RfxAggregate,
  RfxFoundationRequirementKind,
  SolutionPosture,
} from "../../domain/rfx/model";
import { useI18n } from "../i18n/I18nProvider";
import {
  clearRetryStableCommand,
  resolveRetryStableCommand,
} from "../referrals/retry-stable-command";

import styles from "./RFxDraftWorkspace.module.css";

interface Props {
  readonly aggregate: RfxAggregate;
  readonly organizationId: string;
  readonly commandRecoveryScope: string;
  readonly performanceLocationOption: RfxPerformanceLocationOption | null;
  readonly onCommitted: (aggregate: RfxAggregate) => void;
}

interface OutputRow {
  id: string;
  title: string;
  description: string;
  amount: string;
  unit: string;
  dueDate: string;
}
interface RequirementRow {
  id: string;
  kind: RfxFoundationRequirementKind;
  title: string;
  description: string;
  mandatory: boolean;
  amount: string;
  unit: string;
  dueDate: string;
  evidenceDescription: string;
}

interface PackageForm {
  title: string;
  sourceStatement: string;
  observedCondition: string;
  desiredOutcome: string;
  affectedContext: string;
  successMeasures: string;
  knownFacts: string;
  assumptions: string;
  constraints: string;
  solutionPosture: SolutionPosture;
  proposedApproaches: string;
  prohibitedApproaches: string;
  unresolvedQuestions: string;
  interpretationRecordIds: string[];
  scope: string;
  outputs: OutputRow[];
  anticipatedStartDate: string;
  anticipatedCompletionDate: string;
  responseDeadline: string;
  locationMode:
    | "none"
    | "issuer-primary-location"
    | "locality"
    | "exact-address"
    | "primary-and-locality";
  valueMode: "not-disclosed" | "exact" | "range";
  currency: string;
  exactValue: string;
  minimumValue: string;
  maximumValue: string;
  termMode: "fixed" | "fixed-with-options" | "ongoing" | "milestone-based";
  durationValue: string;
  durationUnit: "days" | "weeks" | "months" | "years";
  optionCount: string;
  optionDurationValue: string;
  optionDurationUnit: "days" | "weeks" | "months" | "years";
  termStart: string;
  termCompletion: string;
  termNote: string;
  requirements: RequirementRow[];
}

interface InterpretationCandidate {
  readonly id: string;
  readonly updatedAt: string;
  readonly candidate: Readonly<{
    rationale: string;
    clarification_question?: string;
    candidate_value: Readonly<{ label_snapshot?: string; text_value?: string }>;
  }>;
}

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}
function joinLines(value: readonly string[] | undefined): string {
  return value?.join("\n") ?? "";
}
function dollarsToMinor(value: string): number {
  return Math.round(Number(value || 0) * 100);
}
function identifier(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
function browserStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function initialForm(aggregate: RfxAggregate): PackageForm {
  const record = aggregate.package;
  const value = record?.estimatedValue;
  const term = record?.engagementTerm;
  const location = record?.performanceLocation;
  const locationMode =
    location?.mode === "multiple"
      ? "primary-and-locality"
      : location?.mode === "organization-location"
        ? "issuer-primary-location"
        : (location?.mode ?? "none");
  return {
    title: record?.title ?? "",
    sourceStatement: record?.marketNeed.sourceStatement ?? "",
    observedCondition: record?.marketNeed.observedCondition ?? "",
    desiredOutcome: record?.marketNeed.desiredOutcome ?? "",
    affectedContext: record?.marketNeed.affectedContext ?? "",
    successMeasures: joinLines(record?.marketNeed.successMeasures),
    knownFacts: joinLines(record?.marketNeed.knownFacts),
    assumptions: joinLines(record?.marketNeed.assumptions),
    constraints: joinLines(record?.marketNeed.constraints),
    solutionPosture: record?.marketNeed.solutionPosture ?? "solution-open",
    proposedApproaches: joinLines(record?.marketNeed.proposedApproaches),
    prohibitedApproaches: joinLines(record?.marketNeed.prohibitedApproaches),
    unresolvedQuestions: joinLines(record?.marketNeed.unresolvedQuestions),
    interpretationRecordIds: [
      ...(record?.marketNeed.interpretationRecordIds ?? []),
    ],
    scope: record?.scope ?? "",
    outputs:
      record?.requestedOutputs.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        amount: item.quantity ? String(item.quantity.amount) : "",
        unit: item.quantity?.unit ?? "",
        dueDate: item.dueDate ?? "",
      })) ?? [],
    anticipatedStartDate: record?.timing.anticipatedStartDate ?? "",
    anticipatedCompletionDate: record?.timing.anticipatedCompletionDate ?? "",
    responseDeadline: record?.timing.responseDeadline ?? "",
    locationMode,
    valueMode: value?.mode ?? "not-disclosed",
    currency: value && value.mode !== "not-disclosed" ? value.currency : "USD",
    exactValue: value?.mode === "exact" ? String(value.amountMinor / 100) : "",
    minimumValue:
      value?.mode === "range" ? String(value.minimumMinor / 100) : "",
    maximumValue:
      value?.mode === "range" ? String(value.maximumMinor / 100) : "",
    termMode: term?.mode ?? "ongoing",
    durationValue:
      term?.mode === "fixed"
        ? String(term.duration.value)
        : term?.mode === "fixed-with-options"
          ? String(term.baseDuration.value)
          : term?.mode === "ongoing" && term.reviewPeriod
            ? String(term.reviewPeriod.value)
            : "",
    durationUnit:
      term?.mode === "fixed"
        ? term.duration.unit
        : term?.mode === "fixed-with-options"
          ? term.baseDuration.unit
          : term?.mode === "ongoing" && term.reviewPeriod
            ? term.reviewPeriod.unit
            : "months",
    optionCount:
      term?.mode === "fixed-with-options" ? String(term.optionCount) : "",
    optionDurationValue:
      term?.mode === "fixed-with-options"
        ? String(term.optionDuration.value)
        : "",
    optionDurationUnit:
      term?.mode === "fixed-with-options" ? term.optionDuration.unit : "months",
    termStart:
      term?.mode === "milestone-based" ? (term.expectedStart ?? "") : "",
    termCompletion:
      term?.mode === "milestone-based" ? (term.expectedCompletion ?? "") : "",
    termNote: term?.note ?? "",
    requirements:
      record?.requirements.map((item) => ({
        id: item.id,
        kind: item.kind,
        title: item.title,
        description: item.description,
        mandatory: item.mandatory,
        amount: item.quantity ? String(item.quantity.amount) : "",
        unit: item.quantity?.unit ?? "",
        dueDate: item.dueDate ?? "",
        evidenceDescription: item.evidenceDescription ?? "",
      })) ?? [],
  };
}

function payload(
  form: PackageForm,
  option: RfxPerformanceLocationOption | null,
) {
  const singleLocation =
    form.locationMode === "none" || !option
      ? null
      : form.locationMode === "locality"
        ? { mode: "locality", localityId: option.localityId }
        : {
            mode:
              form.locationMode === "exact-address"
                ? "exact-address"
                : "issuer-primary-location",
            organizationLocationId: option.organizationLocationId,
          };
  const performanceLocation =
    form.locationMode === "primary-and-locality" && option
      ? {
          mode: "multiple",
          locations: [
            {
              mode: "issuer-primary-location",
              organizationLocationId: option.organizationLocationId,
            },
            { mode: "locality", localityId: option.localityId },
          ],
        }
      : singleLocation;
  const estimatedValue =
    form.valueMode === "not-disclosed"
      ? { mode: "not-disclosed" }
      : form.valueMode === "exact"
        ? {
            mode: "exact",
            currency: form.currency,
            amountMinor: dollarsToMinor(form.exactValue),
          }
        : {
            mode: "range",
            currency: form.currency,
            minimumMinor: dollarsToMinor(form.minimumValue),
            maximumMinor: dollarsToMinor(form.maximumValue),
          };
  const duration = {
    value: Number(form.durationValue || 1),
    unit: form.durationUnit,
  };
  const engagementTerm =
    form.termMode === "fixed"
      ? { mode: "fixed", duration, note: form.termNote || null }
      : form.termMode === "fixed-with-options"
        ? {
            mode: "fixed-with-options",
            baseDuration: duration,
            optionCount: Number(form.optionCount || 1),
            optionDuration: {
              value: Number(form.optionDurationValue || 1),
              unit: form.optionDurationUnit,
            },
            note: form.termNote || null,
          }
        : form.termMode === "ongoing"
          ? {
              mode: "ongoing",
              reviewPeriod: form.durationValue ? duration : null,
              note: form.termNote || null,
            }
          : {
              mode: "milestone-based",
              expectedStart: form.termStart || null,
              expectedCompletion: form.termCompletion || null,
              note: form.termNote || null,
            };
  return {
    title: form.title,
    marketNeed: {
      sourceStatement: form.sourceStatement,
      observedCondition: form.observedCondition,
      desiredOutcome: form.desiredOutcome,
      affectedContext: form.affectedContext,
      successMeasures: splitLines(form.successMeasures),
      knownFacts: splitLines(form.knownFacts),
      assumptions: splitLines(form.assumptions),
      constraints: splitLines(form.constraints),
      solutionPosture: form.solutionPosture,
      proposedApproaches: splitLines(form.proposedApproaches),
      prohibitedApproaches: splitLines(form.prohibitedApproaches),
      unresolvedQuestions: splitLines(form.unresolvedQuestions),
      interpretationRecordIds: form.interpretationRecordIds,
    },
    scope: form.scope,
    requestedOutputs: form.outputs.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      quantity:
        item.amount && item.unit
          ? { amount: Number(item.amount), unit: item.unit }
          : null,
      dueDate: item.dueDate || null,
    })),
    timing: {
      anticipatedStartDate: form.anticipatedStartDate || null,
      anticipatedCompletionDate: form.anticipatedCompletionDate || null,
      responseDeadline: form.responseDeadline || null,
    },
    performanceLocation,
    estimatedValue,
    engagementTerm,
    requirements: form.requirements.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      description: item.description,
      mandatory: item.mandatory,
      quantity:
        item.amount && item.unit
          ? { amount: Number(item.amount), unit: item.unit }
          : null,
      dueDate: item.dueDate || null,
      evidenceDescription: item.evidenceDescription || null,
    })),
  };
}

export function RFxPackageBuilder({
  aggregate,
  organizationId,
  commandRecoveryScope,
  performanceLocationOption,
  onCommitted,
}: Props) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => initialForm(aggregate));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interpreting, setInterpreting] = useState(false);
  const [interpretationRecord, setInterpretationRecord] = useState<{
    id: string;
    candidates: InterpretationCandidate[];
  } | null>(null);
  const saveInFlight = useRef(false);
  const attemptedAutomaticPayload = useRef("");
  const formRevision = useRef(0);
  const serialized = useMemo(() => JSON.stringify(form), [form]);

  function change<K extends keyof PackageForm>(key: K, value: PackageForm[K]) {
    formRevision.current += 1;
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setNotice(null);
  }
  function changeOutput(index: number, patch: Partial<OutputRow>) {
    change(
      "outputs",
      form.outputs.map((item, rowIndex) =>
        rowIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }
  function changeRequirement(index: number, patch: Partial<RequirementRow>) {
    change(
      "requirements",
      form.requirements.map((item, rowIndex) =>
        rowIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  const save = useCallback(
    async (automatic = false) => {
      if (saveInFlight.current) return;
      saveInFlight.current = true;
      const savingRevision = formRevision.current;
      setSaving(true);
      setError(null);
      if (!automatic) setNotice(null);
      const packagePayload = payload(form, performanceLocationOption);
      const storage = browserStorage();
      const storageKey = `rfxchange:rfx-package:${commandRecoveryScope}:${aggregate.id}`;
      const fingerprint = `package:${aggregate.id}:${aggregate.version}:${JSON.stringify(packagePayload)}`;
      const commandId = resolveRetryStableCommand({
        storage,
        storageKey,
        fingerprint,
        prefix: "rfx-package",
      });
      try {
        const response = await fetch("/api/rfx", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "save-package",
            commandId,
            rfxId: aggregate.id,
            expectedVersion: aggregate.version,
            package: packagePayload,
          }),
        });
        const result = (await response.json()) as {
          aggregate?: RfxAggregate;
          replayed?: boolean;
          detail?: string;
          error?: string;
        };
        if (!response.ok || !result.aggregate)
          throw new Error(
            result.detail ?? result.error ?? t("rfxWorkspace.error"),
          );
        clearRetryStableCommand({ storage, storageKey, commandId });
        if (formRevision.current === savingRevision) setDirty(false);
        onCommitted(result.aggregate);
        setNotice(
          result.replayed
            ? t("rfxWorkspace.recovered")
            : automatic
              ? t("rfxWorkspace.autoSaved")
              : t("rfxWorkspace.packageSaved"),
        );
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : t("rfxWorkspace.error"),
        );
      } finally {
        saveInFlight.current = false;
        setSaving(false);
      }
    },
    [
      aggregate.id,
      aggregate.version,
      commandRecoveryScope,
      form,
      onCommitted,
      performanceLocationOption,
      t,
    ],
  );

  useEffect(() => {
    if (!dirty || saving) return;
    if (attemptedAutomaticPayload.current === serialized) return;
    const timer = window.setTimeout(() => void save(true), 1_200);
    attemptedAutomaticPayload.current = serialized;
    return () => window.clearTimeout(timer);
  }, [dirty, save, saving, serialized]);

  async function interpretNeed() {
    if (!form.sourceStatement.trim()) {
      setError(t("rfxWorkspace.interpretNeedsSource"));
      return;
    }
    setInterpreting(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/amacs/interpret", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          organizationId,
          purpose: "buyer_need_definition",
          subjectRef: String(aggregate.id),
          sources: [
            {
              sourceRef: `rfx-need-${aggregate.id}`,
              sourceType: "participant_text",
              text: form.sourceStatement,
              inclusionAuthorized: true,
            },
          ],
        }),
      });
      const result = (await response.json()) as {
        record?: { id: string };
        candidates?: InterpretationCandidate[];
        detail?: string;
        error?: string;
      };
      if (!response.ok || !result.record)
        throw new Error(
          result.detail ??
            result.error ??
            t("rfxWorkspace.interpretUnavailable"),
        );
      setInterpretationRecord({
        id: result.record.id,
        candidates: result.candidates ?? [],
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t("rfxWorkspace.interpretUnavailable"),
      );
    } finally {
      setInterpreting(false);
    }
  }

  async function disposition(
    candidate: InterpretationCandidate | null,
    decision: "accepted" | "rejected" | "unresolved" | "none-of-these",
  ) {
    if (!interpretationRecord) return;
    try {
      const body =
        decision === "none-of-these"
          ? {
              organizationId,
              recordId: interpretationRecord.id,
              decision: { disposition: decision },
            }
          : {
              organizationId,
              recordId: interpretationRecord.id,
              candidateId: candidate?.id,
              expectedUpdatedAt: candidate?.updatedAt,
              decision: { disposition: decision },
            };
      const response = await fetch("/api/ai/amacs/disposition", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as {
        detail?: string;
        error?: string;
      };
      if (!response.ok)
        throw new Error(
          result.detail ??
            result.error ??
            t("rfxWorkspace.interpretUnavailable"),
        );
      if (
        decision === "accepted" &&
        !form.interpretationRecordIds.includes(interpretationRecord.id)
      )
        change("interpretationRecordIds", [
          ...form.interpretationRecordIds,
          interpretationRecord.id,
        ]);
      setNotice(t("rfxWorkspace.interpretRecorded"));
      setInterpretationRecord(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t("rfxWorkspace.interpretUnavailable"),
      );
    }
  }

  const status = aggregate.package?.moduleStatus;
  return (
    <div
      className={styles.builder}
      data-rfx-package-builder
      data-rfx-package-dirty={dirty || undefined}
    >
      <nav
        className={styles.moduleNav}
        aria-label={t("rfxWorkspace.modulesLabel")}
      >
        {(
          [
            "need",
            "scope-outputs",
            "timing",
            "performance-location",
            "value-term",
            "requirements",
          ] as const
        ).map((key) => (
          <a key={key} href={`#rfx-${key}`}>
            <span>{t(`rfxWorkspace.module.${key}`)}</span>
            <small>
              {t(`rfxWorkspace.moduleStatus.${status?.[key] ?? "not-started"}`)}
            </small>
          </a>
        ))}
      </nav>
      <div className={styles.saveBar} aria-live="polite">
        <span>
          {saving
            ? t("rfxWorkspace.saving")
            : dirty
              ? t("rfxWorkspace.unsaved")
              : t("rfxWorkspace.saved")}
        </span>
        <button
          type="button"
          onClick={() => void save(false)}
          disabled={saving || !dirty}
        >
          {error ? t("rfxWorkspace.retrySave") : t("rfxWorkspace.save")}
        </button>
      </div>
      {notice ? (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <section
        id="rfx-need"
        className={styles.moduleSection}
        aria-labelledby="rfx-need-title"
      >
        <p className={styles.moduleNumber}>01</p>
        <h3 id="rfx-need-title">{t("rfxWorkspace.module.need")}</h3>
        <p>{t("rfxWorkspace.needHelp")}</p>
        <label className={styles.wideField}>
          <span>{t("rfxWorkspace.packageTitle")}</span>
          <input
            data-rfx-package-title
            value={form.title}
            maxLength={300}
            onChange={(event) => change("title", event.target.value)}
          />
        </label>
        <label className={styles.wideField}>
          <span>{t("rfxWorkspace.sourceStatement")}</span>
          <textarea
            data-rfx-source-statement
            value={form.sourceStatement}
            maxLength={4000}
            rows={4}
            onChange={(event) => change("sourceStatement", event.target.value)}
          />
        </label>
        <div className={styles.assistRow}>
          <button
            type="button"
            className={styles.secondary}
            disabled={interpreting || !form.sourceStatement.trim()}
            onClick={() => void interpretNeed()}
          >
            {interpreting
              ? t("rfxWorkspace.interpreting")
              : t("rfxWorkspace.interpret")}
          </button>
          <span>{t("rfxWorkspace.interpretBoundary")}</span>
        </div>
        {interpretationRecord ? (
          <div
            className={styles.suggestions}
            aria-label={t("rfxWorkspace.suggestionsLabel")}
          >
            <strong>{t("rfxWorkspace.suggestionsTitle")}</strong>
            {interpretationRecord.candidates.map((candidate) => (
              <article key={candidate.id}>
                <h4>
                  {candidate.candidate.candidate_value.label_snapshot ??
                    candidate.candidate.candidate_value.text_value ??
                    t("rfxWorkspace.suggestion")}
                </h4>
                <p>{candidate.candidate.rationale}</p>
                {candidate.candidate.clarification_question ? (
                  <p>{candidate.candidate.clarification_question}</p>
                ) : null}
                <div>
                  <button
                    type="button"
                    onClick={() => void disposition(candidate, "accepted")}
                  >
                    {t("rfxWorkspace.acceptReference")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void disposition(candidate, "rejected")}
                  >
                    {t("rfxWorkspace.reject")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void disposition(candidate, "unresolved")}
                  >
                    {t("rfxWorkspace.unresolved")}
                  </button>
                </div>
              </article>
            ))}
            <button
              type="button"
              onClick={() => void disposition(null, "none-of-these")}
            >
              {t("rfxWorkspace.noneOfThese")}
            </button>
          </div>
        ) : null}
        <div className={styles.fieldGrid}>
          <label>
            <span>{t("rfxWorkspace.observedCondition")}</span>
            <textarea
              data-rfx-observed-condition
              value={form.observedCondition}
              rows={3}
              onChange={(event) =>
                change("observedCondition", event.target.value)
              }
            />
          </label>
          <label>
            <span>{t("rfxWorkspace.desiredOutcome")}</span>
            <textarea
              data-rfx-desired-outcome
              value={form.desiredOutcome}
              rows={3}
              onChange={(event) => change("desiredOutcome", event.target.value)}
            />
          </label>
          <label>
            <span>{t("rfxWorkspace.affectedContext")}</span>
            <textarea
              data-rfx-affected-context
              value={form.affectedContext}
              rows={3}
              onChange={(event) =>
                change("affectedContext", event.target.value)
              }
            />
          </label>
          <label>
            <span>{t("rfxWorkspace.solutionPosture")}</span>
            <select
              value={form.solutionPosture}
              onChange={(event) =>
                change("solutionPosture", event.target.value as SolutionPosture)
              }
            >
              <option value="solution-open">
                {t("rfxWorkspace.postureOpen")}
              </option>
              <option value="outcome-constrained">
                {t("rfxWorkspace.postureOutcome")}
              </option>
              <option value="approach-constrained">
                {t("rfxWorkspace.postureApproach")}
              </option>
              <option value="specified-solution">
                {t("rfxWorkspace.postureSpecified")}
              </option>
            </select>
          </label>
        </div>
        <div className={styles.fieldGrid}>
          {(
            [
              "successMeasures",
              "knownFacts",
              "assumptions",
              "constraints",
              "proposedApproaches",
              "prohibitedApproaches",
              "unresolvedQuestions",
            ] as const
          ).map((key) => (
            <label key={key}>
              <span>{t(`rfxWorkspace.${key}`)}</span>
              <textarea
                value={form[key]}
                rows={3}
                placeholder={t("rfxWorkspace.onePerLine")}
                onChange={(event) => change(key, event.target.value)}
              />
            </label>
          ))}
        </div>
      </section>

      <section
        id="rfx-scope-outputs"
        className={styles.moduleSection}
        aria-labelledby="rfx-scope-title"
      >
        <p className={styles.moduleNumber}>02</p>
        <h3 id="rfx-scope-title">{t("rfxWorkspace.module.scope-outputs")}</h3>
        <label className={styles.wideField}>
          <span>{t("rfxWorkspace.scope")}</span>
          <textarea
            data-rfx-scope
            value={form.scope}
            rows={5}
            onChange={(event) => change("scope", event.target.value)}
          />
        </label>
        <div className={styles.rowHeading}>
          <h4>{t("rfxWorkspace.outputs")}</h4>
          <button
            data-rfx-add-output
            type="button"
            className={styles.secondary}
            onClick={() =>
              change("outputs", [
                ...form.outputs,
                {
                  id: identifier("output"),
                  title: "",
                  description: "",
                  amount: "",
                  unit: "",
                  dueDate: "",
                },
              ])
            }
          >
            {t("rfxWorkspace.addOutput")}
          </button>
        </div>
        {form.outputs.map((item, index) => (
          <div className={styles.structuredRow} key={item.id}>
            <label>
              <span>{t("rfxWorkspace.rowTitle")}</span>
              <input
                data-rfx-output-title
                value={item.title}
                onChange={(event) =>
                  changeOutput(index, { title: event.target.value })
                }
              />
            </label>
            <label>
              <span>{t("rfxWorkspace.description")}</span>
              <input
                value={item.description}
                onChange={(event) =>
                  changeOutput(index, { description: event.target.value })
                }
              />
            </label>
            <label>
              <span>{t("rfxWorkspace.quantity")}</span>
              <input
                type="number"
                min="0"
                step="any"
                value={item.amount}
                onChange={(event) =>
                  changeOutput(index, { amount: event.target.value })
                }
              />
            </label>
            <label>
              <span>{t("rfxWorkspace.unit")}</span>
              <input
                value={item.unit}
                onChange={(event) =>
                  changeOutput(index, { unit: event.target.value })
                }
              />
            </label>
            <label>
              <span>{t("rfxWorkspace.dueDate")}</span>
              <input
                type="date"
                value={item.dueDate}
                onChange={(event) =>
                  changeOutput(index, { dueDate: event.target.value })
                }
              />
            </label>
            <button
              type="button"
              className={styles.remove}
              aria-label={t("rfxWorkspace.removeOutput")}
              onClick={() =>
                change(
                  "outputs",
                  form.outputs.filter((_, rowIndex) => rowIndex !== index),
                )
              }
            >
              ×
            </button>
          </div>
        ))}
      </section>

      <section
        id="rfx-timing"
        className={styles.moduleSection}
        aria-labelledby="rfx-timing-title"
      >
        <p className={styles.moduleNumber}>03</p>
        <h3 id="rfx-timing-title">{t("rfxWorkspace.module.timing")}</h3>
        <div className={styles.fieldGrid}>
          <label>
            <span>{t("rfxWorkspace.startDate")}</span>
            <input
              data-rfx-start-date
              type="date"
              value={form.anticipatedStartDate}
              onChange={(event) =>
                change("anticipatedStartDate", event.target.value)
              }
            />
          </label>
          <label>
            <span>{t("rfxWorkspace.completionDate")}</span>
            <input
              data-rfx-completion-date
              type="date"
              value={form.anticipatedCompletionDate}
              onChange={(event) =>
                change("anticipatedCompletionDate", event.target.value)
              }
            />
          </label>
          <label>
            <span>{t("rfxWorkspace.responseDeadline")}</span>
            <input
              data-rfx-response-deadline
              type="date"
              value={form.responseDeadline}
              onChange={(event) =>
                change("responseDeadline", event.target.value)
              }
            />
          </label>
        </div>
      </section>

      <section
        id="rfx-performance-location"
        className={styles.moduleSection}
        aria-labelledby="rfx-location-title"
      >
        <p className={styles.moduleNumber}>04</p>
        <h3 id="rfx-location-title">
          {t("rfxWorkspace.module.performance-location")}
        </h3>
        {performanceLocationOption ? (
          <label className={styles.wideField}>
            <span>{t("rfxWorkspace.locationMode")}</span>
            <select
              data-rfx-location-mode
              value={form.locationMode}
              onChange={(event) =>
                change(
                  "locationMode",
                  event.target.value as PackageForm["locationMode"],
                )
              }
            >
              <option value="none">{t("rfxWorkspace.locationNone")}</option>
              <option value="issuer-primary-location">
                {t("rfxWorkspace.locationPrimary")}
              </option>
              <option value="locality">
                {t("rfxWorkspace.locationLocality", {
                  locality: performanceLocationOption.localityLabel,
                })}
              </option>
              <option value="exact-address">
                {t("rfxWorkspace.locationExact")}
              </option>
              <option value="primary-and-locality">
                {t("rfxWorkspace.locationMultiple")}
              </option>
            </select>
          </label>
        ) : (
          <p className={styles.inlineState}>
            {t("rfxWorkspace.locationUnavailable")}
          </p>
        )}
        <p className={styles.boundaryText}>
          {t("rfxWorkspace.locationBoundary")}
        </p>
      </section>

      <section
        id="rfx-value-term"
        className={styles.moduleSection}
        aria-labelledby="rfx-value-title"
      >
        <p className={styles.moduleNumber}>05</p>
        <h3 id="rfx-value-title">{t("rfxWorkspace.module.value-term")}</h3>
        <div className={styles.fieldGrid}>
          <label>
            <span>{t("rfxWorkspace.valueMode")}</span>
            <select
              data-rfx-value-mode
              value={form.valueMode}
              onChange={(event) =>
                change(
                  "valueMode",
                  event.target.value as PackageForm["valueMode"],
                )
              }
            >
              <option value="not-disclosed">
                {t("rfxWorkspace.notDisclosed")}
              </option>
              <option value="exact">{t("rfxWorkspace.exactValue")}</option>
              <option value="range">{t("rfxWorkspace.valueRange")}</option>
            </select>
          </label>
          {form.valueMode !== "not-disclosed" ? (
            <label>
              <span>{t("rfxWorkspace.currency")}</span>
              <input
                data-rfx-currency
                value={form.currency}
                maxLength={3}
                onChange={(event) =>
                  change("currency", event.target.value.toUpperCase())
                }
              />
            </label>
          ) : null}
          {form.valueMode === "exact" ? (
            <label>
              <span>{t("rfxWorkspace.amount")}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.exactValue}
                onChange={(event) => change("exactValue", event.target.value)}
              />
            </label>
          ) : null}
          {form.valueMode === "range" ? (
            <>
              <label>
                <span>{t("rfxWorkspace.minimum")}</span>
                <input
                  data-rfx-value-minimum
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minimumValue}
                  onChange={(event) =>
                    change("minimumValue", event.target.value)
                  }
                />
              </label>
              <label>
                <span>{t("rfxWorkspace.maximum")}</span>
                <input
                  data-rfx-value-maximum
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maximumValue}
                  onChange={(event) =>
                    change("maximumValue", event.target.value)
                  }
                />
              </label>
            </>
          ) : null}
          <label>
            <span>{t("rfxWorkspace.termMode")}</span>
            <select
              data-rfx-term-mode
              value={form.termMode}
              onChange={(event) =>
                change(
                  "termMode",
                  event.target.value as PackageForm["termMode"],
                )
              }
            >
              <option value="fixed">{t("rfxWorkspace.termFixed")}</option>
              <option value="fixed-with-options">
                {t("rfxWorkspace.termOptions")}
              </option>
              <option value="ongoing">{t("rfxWorkspace.termOngoing")}</option>
              <option value="milestone-based">
                {t("rfxWorkspace.termMilestone")}
              </option>
            </select>
          </label>
          {form.termMode !== "milestone-based" ? (
            <>
              <label>
                <span>{t("rfxWorkspace.durationValue")}</span>
                <input
                  data-rfx-duration-value
                  type="number"
                  min="1"
                  value={form.durationValue}
                  onChange={(event) =>
                    change("durationValue", event.target.value)
                  }
                />
              </label>
              <label>
                <span>{t("rfxWorkspace.durationUnit")}</span>
                <select
                  value={form.durationUnit}
                  onChange={(event) =>
                    change(
                      "durationUnit",
                      event.target.value as PackageForm["durationUnit"],
                    )
                  }
                >
                  {["days", "weeks", "months", "years"].map((unit) => (
                    <option value={unit} key={unit}>
                      {t(`rfxWorkspace.duration.${unit}`)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <label>
                <span>{t("rfxWorkspace.startDate")}</span>
                <input
                  type="date"
                  value={form.termStart}
                  onChange={(event) => change("termStart", event.target.value)}
                />
              </label>
              <label>
                <span>{t("rfxWorkspace.completionDate")}</span>
                <input
                  type="date"
                  value={form.termCompletion}
                  onChange={(event) =>
                    change("termCompletion", event.target.value)
                  }
                />
              </label>
            </>
          )}
          {form.termMode === "fixed-with-options" ? (
            <>
              <label>
                <span>{t("rfxWorkspace.optionCount")}</span>
                <input
                  type="number"
                  min="1"
                  value={form.optionCount}
                  onChange={(event) =>
                    change("optionCount", event.target.value)
                  }
                />
              </label>
              <label>
                <span>{t("rfxWorkspace.optionDuration")}</span>
                <input
                  type="number"
                  min="1"
                  value={form.optionDurationValue}
                  onChange={(event) =>
                    change("optionDurationValue", event.target.value)
                  }
                />
              </label>
            </>
          ) : null}
          <label>
            <span>{t("rfxWorkspace.termNote")}</span>
            <input
              value={form.termNote}
              onChange={(event) => change("termNote", event.target.value)}
            />
          </label>
        </div>
      </section>

      <section
        id="rfx-requirements"
        className={styles.moduleSection}
        aria-labelledby="rfx-requirements-title"
      >
        <p className={styles.moduleNumber}>06</p>
        <h3 id="rfx-requirements-title">
          {t("rfxWorkspace.module.requirements")}
        </h3>
        <p>{t("rfxWorkspace.requirementsBoundary")}</p>
        <div className={styles.rowHeading}>
          <h4>{t("rfxWorkspace.requirements")}</h4>
          <button
            data-rfx-add-requirement
            type="button"
            className={styles.secondary}
            onClick={() =>
              change("requirements", [
                ...form.requirements,
                {
                  id: identifier("requirement"),
                  kind: "deliverable",
                  title: "",
                  description: "",
                  mandatory: true,
                  amount: "",
                  unit: "",
                  dueDate: "",
                  evidenceDescription: "",
                },
              ])
            }
          >
            {t("rfxWorkspace.addRequirement")}
          </button>
        </div>
        {form.requirements.map((item, index) => (
          <div className={styles.structuredRow} key={item.id}>
            <label>
              <span>{t("rfxWorkspace.kind")}</span>
              <select
                value={item.kind}
                onChange={(event) =>
                  changeRequirement(index, {
                    kind: event.target.value as RfxFoundationRequirementKind,
                  })
                }
              >
                {[
                  "deliverable",
                  "quantity",
                  "schedule",
                  "credential",
                  "insurance",
                  "evidence",
                  "other",
                ].map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`rfxWorkspace.requirementKind.${kind}`)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("rfxWorkspace.rowTitle")}</span>
              <input
                data-rfx-requirement-title
                value={item.title}
                onChange={(event) =>
                  changeRequirement(index, { title: event.target.value })
                }
              />
            </label>
            <label>
              <span>{t("rfxWorkspace.description")}</span>
              <input
                value={item.description}
                onChange={(event) =>
                  changeRequirement(index, { description: event.target.value })
                }
              />
            </label>
            <label>
              <span>{t("rfxWorkspace.dueDate")}</span>
              <input
                type="date"
                value={item.dueDate}
                onChange={(event) =>
                  changeRequirement(index, { dueDate: event.target.value })
                }
              />
            </label>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={item.mandatory}
                onChange={(event) =>
                  changeRequirement(index, { mandatory: event.target.checked })
                }
              />
              <span>{t("rfxWorkspace.mandatory")}</span>
            </label>
            <button
              type="button"
              className={styles.remove}
              aria-label={t("rfxWorkspace.removeRequirement")}
              onClick={() =>
                change(
                  "requirements",
                  form.requirements.filter((_, rowIndex) => rowIndex !== index),
                )
              }
            >
              ×
            </button>
          </div>
        ))}
      </section>
      <div className={styles.finalSave}>
        <button
          data-rfx-package-save
          type="button"
          className={styles.primary}
          disabled={saving || !dirty}
          onClick={() => void save(false)}
        >
          {saving
            ? t("rfxWorkspace.saving")
            : error
              ? t("rfxWorkspace.retrySave")
              : t("rfxWorkspace.savePackage")}
        </button>
        <p>{t("rfxWorkspace.packageBoundary")}</p>
      </div>
    </div>
  );
}
