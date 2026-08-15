"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  RfxCapabilityOption,
  RfxDefinitionCatalog,
} from "../../application/rfx/rfx-draft-service";
import type {
  RfxAggregate,
  RfxDecisionTreatment,
  RfxEvaluationFactorTreatment,
  RfxRequirementLevel,
  RfxResponseSectionFormat,
  RfxSatisfyingParty,
} from "../../domain/rfx/model";
import { useI18n } from "../i18n/I18nProvider";
import { ResponsiveSheet } from "../ui/Primitives";
import {
  clearRetryStableCommand,
  resolveRetryStableCommand,
} from "../referrals/retry-stable-command";

import styles from "./RFxDraftWorkspace.module.css";

interface Props {
  readonly aggregate: RfxAggregate;
  readonly catalog: RfxDefinitionCatalog;
  readonly organizationId: string;
  readonly commandRecoveryScope: string;
  readonly onCommitted: (aggregate: RfxAggregate) => void;
}

interface RequirementRow {
  id: string;
  requirementTypeId: string;
  capabilityId: string;
  capabilityLabel: string;
  capabilityBreadcrumb: string;
  title: string;
  description: string;
  level: RfxRequirementLevel;
  decisionTreatment: RfxDecisionTreatment;
  satisfyingParty: RfxSatisfyingParty;
  qualifier: string;
  evidenceRequirementIds: string[];
  linkedFoundationRequirementIds: string[];
}

interface SectionRow {
  id: string;
  sourceSectionId: string;
  title: string;
  instructions: string;
  format: RfxResponseSectionFormat;
  required: boolean;
  characterLimit: string;
  itemLimit: string;
  attachmentsAllowed: boolean;
  linkedRequirementIds: string[];
}

interface FactorRow {
  id: string;
  sourceFactorId: string;
  sourceMethod: "gate" | "scored" | "narrative" | "formula" | null;
  title: string;
  description: string;
  treatment: RfxEvaluationFactorTreatment;
  weight: string;
  linkedRequirementIds: string[];
  linkedResponseSectionIds: string[];
  linkedEvidenceRequirementIds: string[];
}

interface FormState {
  requirements: RequirementRow[];
  responseTemplateId: string;
  sections: SectionRow[];
  decisionTemplateId: string;
  weightingRequired: boolean;
  factors: FactorRow[];
  interpretationRecordIds: string[];
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

function responseFormat(value: string): RfxResponseSectionFormat {
  if (value.includes("pricing")) return "pricing";
  if (value.includes("acknowledgment")) return "acknowledgment";
  if (value.includes("attachment")) return "attachment";
  if (value === "narrative") return "narrative";
  return "structured-answer";
}

function factorTreatment(
  method: string,
): RfxEvaluationFactorTreatment {
  if (method === "gate") return "required-condition";
  if (method === "narrative") return "informational-only";
  return "scored-factor";
}

function initialForm(aggregate: RfxAggregate): FormState {
  const definition = aggregate.definition;
  return {
    requirements:
      definition?.requirements.map((item) => ({
        id: item.id,
        requirementTypeId: item.requirementType.id,
        capabilityId: item.capability?.id ?? "",
        capabilityLabel: item.capability?.labelSnapshot ?? "",
        capabilityBreadcrumb: item.capabilityBreadcrumb ?? "",
        title: item.title,
        description: item.description,
        level: item.level,
        decisionTreatment: item.decisionTreatment,
        satisfyingParty: item.satisfyingParty,
        qualifier:
          item.qualifiers.find((qualifier) => qualifier.kind === "text")?.value ??
          "",
        evidenceRequirementIds: [...item.evidenceRequirementIds],
        linkedFoundationRequirementIds: [
          ...item.linkedFoundationRequirementIds,
        ],
      })) ?? [],
    responseTemplateId:
      definition?.responseStructure.sourceTemplate?.id ?? "",
    sections:
      definition?.responseStructure.sections.map((item) => ({
        id: item.id,
        sourceSectionId: item.sourceSection?.id ?? "",
        title: item.title,
        instructions: item.instructions,
        format: item.format,
        required: item.required,
        characterLimit:
          item.characterLimit === null ? "" : String(item.characterLimit),
        itemLimit: item.itemLimit === null ? "" : String(item.itemLimit),
        attachmentsAllowed: item.attachmentsAllowed,
        linkedRequirementIds: [...item.linkedRequirementIds],
      })) ?? [],
    decisionTemplateId:
      definition?.evaluationDefinition.sourceTemplate?.id ?? "",
    weightingRequired:
      definition?.evaluationDefinition.weightingRequired ?? false,
    factors:
      definition?.evaluationDefinition.factors.map((item) => ({
        id: item.id,
        sourceFactorId: item.sourceFactor?.id ?? "",
        sourceMethod: item.sourceMethod,
        title: item.title,
        description: item.description,
        treatment: item.treatment,
        weight:
          item.weightBasisPoints === null
            ? ""
            : String(item.weightBasisPoints / 100),
        linkedRequirementIds: [...item.linkedRequirementIds],
        linkedResponseSectionIds: [...item.linkedResponseSectionIds],
        linkedEvidenceRequirementIds: [
          ...item.linkedEvidenceRequirementIds,
        ],
      })) ?? [],
    interpretationRecordIds: [
      ...(definition?.interpretationRecordIds ?? []),
    ],
  };
}

function definitionPayload(form: FormState) {
  return {
    requirements: form.requirements.map((item) => ({
      id: item.id,
      requirementTypeId: item.requirementTypeId,
      capabilityId: item.capabilityId || null,
      title: item.title,
      description: item.description,
      level: item.level,
      decisionTreatment: item.decisionTreatment,
      satisfyingParty: item.satisfyingParty,
      qualifiers: item.qualifier
        ? [{ kind: "text", label: "Condition", value: item.qualifier }]
        : [],
      evidenceRequirementIds: item.evidenceRequirementIds,
      linkedFoundationRequirementIds: item.linkedFoundationRequirementIds,
    })),
    responseStructure: {
      responseTemplateId: form.responseTemplateId,
      sections: form.sections.map((item) => ({
        id: item.id,
        sourceSectionId: item.sourceSectionId || null,
        title: item.title,
        instructions: item.instructions,
        format: item.format,
        required: item.required,
        characterLimit: item.characterLimit
          ? Number(item.characterLimit)
          : null,
        itemLimit: item.itemLimit ? Number(item.itemLimit) : null,
        attachmentsAllowed: item.attachmentsAllowed,
        linkedRequirementIds: item.linkedRequirementIds,
      })),
    },
    evaluationDefinition: {
      decisionTemplateId: form.decisionTemplateId,
      factors: form.factors.map((item) => ({
        id: item.id,
        sourceFactorId: item.sourceFactorId || null,
        title: item.title,
        description: item.description,
        treatment: item.treatment,
        weightBasisPoints: item.weight
          ? Math.round(Number(item.weight) * 100)
          : null,
        linkedRequirementIds: item.linkedRequirementIds,
        linkedResponseSectionIds: item.linkedResponseSectionIds,
        linkedEvidenceRequirementIds: item.linkedEvidenceRequirementIds,
      })),
    },
    interpretationRecordIds: form.interpretationRecordIds,
  };
}

export function RFxDefinitionBuilder({
  aggregate,
  catalog,
  organizationId,
  commandRecoveryScope,
  onCommitted,
}: Props) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => initialForm(aggregate));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capabilityQuery, setCapabilityQuery] = useState("");
  const [capabilityDomainId, setCapabilityDomainId] = useState("");
  const [capabilityFamilyId, setCapabilityFamilyId] = useState("");
  const [capabilityResults, setCapabilityResults] = useState<
    readonly RfxCapabilityOption[]
  >([]);
  const [activeRequirementId, setActiveRequirementId] = useState<string | null>(
    null,
  );
  const [sheet, setSheet] = useState<"section" | "factor" | null>(null);
  const saveInFlight = useRef(false);
  const revision = useRef(0);
  const synchronizedAggregate = useRef({
    id: aggregate.id,
    version: aggregate.version,
  });
  const sheetInvoker = useRef<HTMLButtonElement | null>(null);
  const sheetDialog = useRef<HTMLDivElement | null>(null);
  const payload = useMemo(() => definitionPayload(form), [form]);
  const weightedTotal = form.factors.reduce(
    (total, factor) => total + Number(factor.weight || 0),
    0,
  );
  const capabilityFamilies =
    catalog.domains.find((domain) => domain.id === capabilityDomainId)
      ?.families ?? [];

  function revise(updater: (current: FormState) => FormState) {
    revision.current += 1;
    setDirty(true);
    setNotice(null);
    setError(null);
    setForm(updater);
  }

  function updateRequirement(
    id: string,
    values: Partial<RequirementRow>,
  ) {
    revise((current) => ({
      ...current,
      requirements: current.requirements.map((item) =>
        item.id === id ? { ...item, ...values } : item,
      ),
    }));
  }

  function addRequirement() {
    const type = catalog.requirementTypes[0];
    if (!type) return;
    revise((current) => ({
      ...current,
      requirements: [
        ...current.requirements,
        {
          id: identifier("requirement"),
          requirementTypeId: type.id,
          capabilityId: "",
          capabilityLabel: "",
          capabilityBreadcrumb: "",
          title: "",
          description: "",
          level: "required",
          decisionTreatment: (type.allowedDecisionTreatments[0] ??
            "gate_only") as RfxDecisionTreatment,
          satisfyingParty: "lead-organization",
          qualifier: "",
          evidenceRequirementIds: [],
          linkedFoundationRequirementIds: [],
        },
      ],
    }));
  }

  function applyResponseTemplate(templateId: string) {
    const template = catalog.responseTemplates.find(
      (item) => item.id === templateId,
    );
    if (!template) return;
    const requiredIds = form.requirements
      .filter((item) => item.level === "required")
      .map((item) => item.id);
    revise((current) => ({
      ...current,
      responseTemplateId: templateId,
      sections: template.sections.map((section, index) => ({
        id: identifier("section"),
        sourceSectionId: section.id,
        title: section.label,
        instructions: section.definition,
        format: responseFormat(section.responseType),
        required: true,
        characterLimit: "",
        itemLimit: "",
        attachmentsAllowed: section.attachmentsAllowed,
        linkedRequirementIds: index === 0 ? requiredIds : [],
      })),
    }));
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    revise((current) => {
      const index = current.sections.findIndex((section) => section.id === sectionId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.sections.length) return current;
      const sections = [...current.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...current, sections };
    });
  }

  function applyDecisionTemplate(templateId: string) {
    const template = catalog.decisionTemplates.find(
      (item) => item.id === templateId,
    );
    if (!template) return;
    const scored = template.factors.filter((factor) =>
      ["scored", "formula"].includes(factor.method),
    );
    const base = scored.length ? Math.floor(10_000 / scored.length) : 0;
    let scoredIndex = 0;
    const requirementIds = form.requirements
      .filter((item) => item.level === "required")
      .map((item) => item.id);
    revise((current) => ({
      ...current,
      decisionTemplateId: templateId,
      weightingRequired: template.weightingRequired,
      factors: template.factors.map((factor, index) => {
        const isScored = ["scored", "formula"].includes(factor.method);
        const currentScoredIndex = isScored ? scoredIndex++ : -1;
        const basisPoints =
          isScored && template.weightingRequired
            ? currentScoredIndex === scored.length - 1
              ? 10_000 - base * (scored.length - 1)
              : base
            : 0;
        return {
          id: identifier("factor"),
          sourceFactorId: factor.id,
          sourceMethod: factor.method as FactorRow["sourceMethod"],
          title: factor.label,
          description: factor.definition,
          treatment: factorTreatment(factor.method),
          weight:
            isScored && template.weightingRequired
              ? String(basisPoints / 100)
              : "",
          linkedRequirementIds: index === 0 ? requirementIds : [],
          linkedResponseSectionIds:
            index === 0 && current.sections[0]
              ? [current.sections[0].id]
              : [],
          linkedEvidenceRequirementIds: [],
        };
      }),
    }));
  }

  const save = useCallback(async () => {
    if (saveInFlight.current || !dirty) return;
    saveInFlight.current = true;
    setSaving(true);
    setError(null);
    const savingRevision = revision.current;
    const storage = browserStorage();
    const storageKey = `rfxchange:rfx-definition:${commandRecoveryScope}:${aggregate.id}`;
    const fingerprint = JSON.stringify({ version: aggregate.version, payload });
    const commandId = resolveRetryStableCommand({
      storage,
      storageKey,
      fingerprint,
      prefix: "rfx-definition",
    });
    try {
      const response = await fetch("/api/rfx", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save-definition",
          commandId,
          rfxId: aggregate.id,
          expectedVersion: aggregate.version,
          definition: payload,
          organizationId,
        }),
      });
      const result = (await response.json()) as {
        aggregate?: RfxAggregate;
        detail?: string;
        error?: string;
        replayed?: boolean;
      };
      if (!response.ok || !result.aggregate)
        throw new Error(
          result.detail ??
            result.error ??
            t("rfxWorkspace.definitionSaveError"),
        );
      onCommitted(result.aggregate);
      clearRetryStableCommand({ storage, storageKey, commandId });
      if (revision.current === savingRevision) setDirty(false);
      setNotice(
        result.replayed
          ? t("rfxWorkspace.recovered")
          : t("rfxWorkspace.definitionSaved"),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : t("rfxWorkspace.definitionSaveError"),
      );
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  }, [
    aggregate.id,
    aggregate.version,
    commandRecoveryScope,
    dirty,
    onCommitted,
    organizationId,
    payload,
    t,
  ]);

  useEffect(() => {
    if (
      synchronizedAggregate.current.id === aggregate.id &&
      synchronizedAggregate.current.version === aggregate.version
    ) {
      return;
    }
    if (dirty || saving || saveInFlight.current) return;
    synchronizedAggregate.current = {
      id: aggregate.id,
      version: aggregate.version,
    };
    setForm(initialForm(aggregate));
  }, [aggregate, dirty, saving]);

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => void save(), 1_200);
    return () => window.clearTimeout(timer);
  }, [dirty, payload, save]);

  useEffect(() => {
    if (!activeRequirementId) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/rfx?q=${encodeURIComponent(capabilityQuery)}&domain=${encodeURIComponent(capabilityDomainId)}&family=${encodeURIComponent(capabilityFamilyId)}`,
          { credentials: "same-origin", signal: controller.signal },
        );
        const body = (await response.json()) as {
          capabilities?: readonly RfxCapabilityOption[];
        };
        if (response.ok) setCapabilityResults(body.capabilities ?? []);
      } catch {
        if (!controller.signal.aborted) setCapabilityResults([]);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [activeRequirementId, capabilityQuery, capabilityDomainId, capabilityFamilyId]);

  useEffect(() => {
    if (!sheet) return;
    const dialog = sheetDialog.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]',
    );
    focusable?.[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSheet(null);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      sheetInvoker.current?.focus();
    };
  }, [sheet]);

  return (
    <section
      className={styles.definitionBuilder}
      data-rfx-definition-builder
      aria-labelledby="rfx-definition-title"
    >
      <header className={styles.definitionHeader}>
        <div>
          <span className={styles.state}>{t("rfxWorkspace.definitionEyebrow")}</span>
          <h2 id="rfx-definition-title">{t("rfxWorkspace.definitionTitle")}</h2>
          <p>{t("rfxWorkspace.definitionIntro")}</p>
        </div>
        <div className={styles.definitionStatus} aria-live="polite">
          <span>{saving ? t("rfxWorkspace.saving") : notice}</span>
          <button
            type="button"
            data-rfx-definition-save
            disabled={saving || !dirty}
            onClick={() => void save()}
          >
            {t("rfxWorkspace.saveDefinition")}
          </button>
        </div>
      </header>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <section className={styles.definitionModule} aria-labelledby="required-capabilities-title">
        <div className={styles.rowHeading}>
          <div>
            <p className={styles.moduleNumber}>01</p>
            <h3 id="required-capabilities-title">{t("rfxWorkspace.requiredCapabilities")}</h3>
          </div>
          <button type="button" className={styles.secondary} data-rfx-add-defined-requirement onClick={addRequirement}>
            {t("rfxWorkspace.addRequirement")}
          </button>
        </div>
        <p>{t("rfxWorkspace.requiredCapabilitiesHelp")}</p>
        <div className={styles.definitionRows}>
          {form.requirements.map((item) => {
            const type = catalog.requirementTypes.find(
              (option) => option.id === item.requirementTypeId,
            );
            const evidenceOptions = form.requirements.filter(
              (option) =>
                option.id !== item.id &&
                catalog.requirementTypes.find(
                  (typeOption) =>
                    typeOption.id === option.requirementTypeId,
                )?.code === "EVIDENCE",
            );
            return (
              <article className={styles.definitionRow} key={item.id} data-rfx-requirement>
                <div className={styles.rowMeta}>
                  <strong>{item.capabilityLabel || item.title || type?.label || t("rfxWorkspace.newRequirement")}</strong>
                  <span>{type?.label}</span>
                </div>
                <div className={styles.definitionGrid}>
                  <label>
                    <span>{t("rfxWorkspace.requirementType")}</span>
                    <select
                      value={item.requirementTypeId}
                      onChange={(event) => {
                        const next = catalog.requirementTypes.find(
                          (option) => option.id === event.target.value,
                        );
                        updateRequirement(item.id, {
                          requirementTypeId: event.target.value,
                          capabilityId: next?.code === "CAPABILITY" ? item.capabilityId : "",
                          capabilityLabel: next?.code === "CAPABILITY" ? item.capabilityLabel : "",
                          decisionTreatment: (next?.allowedDecisionTreatments[0] ?? "gate_only") as RfxDecisionTreatment,
                          satisfyingParty: "lead-organization",
                        });
                      }}
                    >
                      {catalog.requirementTypes.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>{t("rfxWorkspace.requirementTitle")}</span>
                    <input value={item.title} onChange={(event) => updateRequirement(item.id, { title: event.target.value })} />
                  </label>
                  <label>
                    <span>{t("rfxWorkspace.requirementLevel")}</span>
                    <select value={item.level} onChange={(event) => updateRequirement(item.id, { level: event.target.value as RfxRequirementLevel })}>
                      <option value="required">{t("rfxWorkspace.required")}</option>
                      <option value="preferred">{t("rfxWorkspace.preferred")}</option>
                      <option value="informational">{t("rfxWorkspace.informational")}</option>
                    </select>
                  </label>
                  <label>
                    <span>{t("rfxWorkspace.decisionUse")}</span>
                    <select value={item.decisionTreatment} onChange={(event) => updateRequirement(item.id, { decisionTreatment: event.target.value as RfxDecisionTreatment })}>
                      {(type?.allowedDecisionTreatments ?? []).map((value) => (
                        <option key={value} value={value}>{t(`rfxWorkspace.treatment.${value}`)}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>{t("rfxWorkspace.satisfyingParty")}</span>
                    <select value={item.satisfyingParty} onChange={(event) => updateRequirement(item.id, { satisfyingParty: event.target.value as RfxSatisfyingParty })}>
                      <option value="lead-organization">{t("rfxWorkspace.leadOrganization")}</option>
                      {type?.teamCoverageAllowed ? <>
                        <option value="any-accepted-team-member">{t("rfxWorkspace.anyTeamMember")}</option>
                        <option value="combined-response-team">{t("rfxWorkspace.combinedTeam")}</option>
                      </> : null}
                    </select>
                  </label>
                  <label>
                    <span>{t("rfxWorkspace.condition")}</span>
                    <input value={item.qualifier} onChange={(event) => updateRequirement(item.id, { qualifier: event.target.value })} />
                  </label>
                </div>
                {type?.code === "CAPABILITY" ? (
                  <div className={styles.capabilityPicker}>
                    <div className={styles.capabilityBrowse}>
                      <label>
                        <span>{t("rfxWorkspace.capabilityDomain")}</span>
                        <select
                          value={capabilityDomainId}
                          onChange={(event) => {
                            setCapabilityDomainId(event.target.value);
                            setCapabilityFamilyId("");
                          }}
                        >
                          <option value="">{t("rfxWorkspace.allDomains")}</option>
                          {catalog.domains.map((domain) => (
                            <option key={domain.id} value={domain.id}>{domain.label}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span>{t("rfxWorkspace.capabilityFamily")}</span>
                        <select
                          value={capabilityFamilyId}
                          disabled={!capabilityDomainId}
                          onChange={(event) => setCapabilityFamilyId(event.target.value)}
                        >
                          <option value="">{t("rfxWorkspace.allFamilies")}</option>
                          {capabilityFamilies.map((family) => (
                            <option key={family.id} value={family.id}>{family.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      <span>{t("rfxWorkspace.capabilitySearch")}</span>
                      <input
                        data-rfx-capability-search
                        value={activeRequirementId === item.id ? capabilityQuery : item.capabilityLabel}
                        onFocus={() => {
                          setActiveRequirementId(item.id);
                          setCapabilityQuery("");
                        }}
                        onChange={(event) => {
                          setActiveRequirementId(item.id);
                          setCapabilityQuery(event.target.value);
                        }}
                      />
                    </label>
                    {activeRequirementId === item.id ? (
                      <ul role="listbox" aria-label={t("rfxWorkspace.capabilityResults")}>
                        {capabilityResults.map((capability) => (
                          <li key={capability.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected="false"
                              data-rfx-capability-result
                              onClick={() => {
                                updateRequirement(item.id, {
                                  capabilityId: capability.id,
                                  capabilityLabel: capability.label,
                                  capabilityBreadcrumb: `${capability.domainLabel} / ${capability.familyLabel} / ${capability.label}`,
                                  title: item.title || capability.label,
                                });
                                setActiveRequirementId(null);
                              }}
                            >
                              <strong>{capability.label}</strong>
                              <small>{capability.domainLabel} / {capability.familyLabel}</small>
                              <span>{capability.definition}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {item.capabilityBreadcrumb ? <p>{item.capabilityBreadcrumb}</p> : null}
                  </div>
                ) : null}
                <label className={styles.wideField}>
                  <span>{t("rfxWorkspace.requirementDescription")}</span>
                  <textarea rows={2} value={item.description} onChange={(event) => updateRequirement(item.id, { description: event.target.value })} />
                </label>
                {evidenceOptions.length ? (
                  <label className={styles.wideField}>
                    <span>{t("rfxWorkspace.evidenceLink")}</span>
                    <select value={item.evidenceRequirementIds[0] ?? ""} onChange={(event) => updateRequirement(item.id, { evidenceRequirementIds: event.target.value ? [event.target.value] : [] })}>
                      <option value="">{t("rfxWorkspace.noEvidenceLink")}</option>
                      {evidenceOptions.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
                    </select>
                  </label>
                ) : null}
                <button type="button" className={styles.removeText} onClick={() => revise((current) => ({ ...current, requirements: current.requirements.filter((row) => row.id !== item.id) }))}>
                  {t("rfxWorkspace.remove")}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.definitionModule} aria-labelledby="response-structure-title">
        <div className={styles.rowHeading}>
          <div><p className={styles.moduleNumber}>02</p><h3 id="response-structure-title">{t("rfxWorkspace.responseStructure")}</h3></div>
          <button type="button" className={styles.secondary} data-rfx-add-section onClick={(event) => { sheetInvoker.current = event.currentTarget; setSheet("section"); }}>{t("rfxWorkspace.addSection")}</button>
        </div>
        <label className={styles.templateChoice}>
          <span>{t("rfxWorkspace.startingStructure")}</span>
          <select data-rfx-response-template value={form.responseTemplateId} onChange={(event) => applyResponseTemplate(event.target.value)}>
            <option value="">{t("rfxWorkspace.chooseTemplate")}</option>
            {catalog.responseTemplates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
          </select>
        </label>
        <div className={styles.definitionRows}>
          {form.sections.map((section, index) => (
            <article className={styles.compactDefinitionRow} key={section.id} data-rfx-response-section>
              <span>{index + 1}</span>
              <label><span>{t("rfxWorkspace.sectionTitle")}</span><input value={section.title} onChange={(event) => revise((current) => ({ ...current, sections: current.sections.map((row) => row.id === section.id ? { ...row, title: event.target.value } : row) }))} /></label>
              <label><span>{t("rfxWorkspace.linkRequirement")}</span><select value={section.linkedRequirementIds[0] ?? ""} onChange={(event) => revise((current) => ({ ...current, sections: current.sections.map((row) => row.id === section.id ? { ...row, linkedRequirementIds: event.target.value ? [event.target.value] : [] } : row) }))}><option value="">{t("rfxWorkspace.noLink")}</option>{form.requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.title || requirement.capabilityLabel}</option>)}</select></label>
              <label className={styles.checkbox}><input type="checkbox" checked={section.required} onChange={(event) => revise((current) => ({ ...current, sections: current.sections.map((row) => row.id === section.id ? { ...row, required: event.target.checked } : row) }))} />{t("rfxWorkspace.required")}</label>
              <button type="button" className={styles.removeText} data-rfx-section-up disabled={index === 0} onClick={() => moveSection(section.id, -1)}>{t("rfxWorkspace.moveUp")}</button>
              <button type="button" className={styles.removeText} data-rfx-section-down disabled={index === form.sections.length - 1} onClick={() => moveSection(section.id, 1)}>{t("rfxWorkspace.moveDown")}</button>
              <button type="button" className={styles.removeText} onClick={() => revise((current) => ({ ...current, sections: current.sections.filter((row) => row.id !== section.id) }))}>{t("rfxWorkspace.remove")}</button>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.definitionModule} aria-labelledby="evaluation-method-title">
        <div className={styles.rowHeading}>
          <div><p className={styles.moduleNumber}>03</p><h3 id="evaluation-method-title">{t("rfxWorkspace.evaluationMethod")}</h3></div>
          <button type="button" className={styles.secondary} onClick={(event) => { sheetInvoker.current = event.currentTarget; setSheet("factor"); }}>{t("rfxWorkspace.addFactor")}</button>
        </div>
        <label className={styles.templateChoice}>
          <span>{t("rfxWorkspace.evaluationTemplate")}</span>
          <select data-rfx-decision-template value={form.decisionTemplateId} onChange={(event) => applyDecisionTemplate(event.target.value)}>
            <option value="">{t("rfxWorkspace.chooseTemplate")}</option>
            {catalog.decisionTemplates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
          </select>
        </label>
        <div className={styles.weightSummary} data-valid={!form.weightingRequired || weightedTotal === 100}>
          <strong>{t("rfxWorkspace.comparativeWeight")}</strong>
          <span>{weightedTotal.toFixed(2)}%</span>
          {form.weightingRequired && weightedTotal !== 100 ? <small>{t("rfxWorkspace.weightHelp")}</small> : null}
        </div>
        <div className={styles.definitionRows}>
          {form.factors.map((factor) => (
            <article className={styles.compactDefinitionRow} key={factor.id} data-rfx-evaluation-factor>
              <label><span>{t("rfxWorkspace.factorTitle")}</span><input value={factor.title} onChange={(event) => revise((current) => ({ ...current, factors: current.factors.map((row) => row.id === factor.id ? { ...row, title: event.target.value } : row) }))} /></label>
              <label><span>{t("rfxWorkspace.factorTreatment")}</span><select value={factor.treatment} disabled={factor.sourceMethod !== null} onChange={(event) => revise((current) => ({ ...current, factors: current.factors.map((row) => row.id === factor.id ? { ...row, treatment: event.target.value as RfxEvaluationFactorTreatment } : row) }))}><option value="required-condition">{t("rfxWorkspace.requiredCondition")}</option><option value="scored-factor">{t("rfxWorkspace.scoredFactor")}</option><option value="required-and-scored">{t("rfxWorkspace.requiredAndScored")}</option><option value="informational-only">{t("rfxWorkspace.informationalOnly")}</option></select></label>
              {factor.treatment === "scored-factor" || factor.treatment === "required-and-scored" ? <label><span>{t("rfxWorkspace.weight")}</span><input data-rfx-factor-weight type="number" min="0" max="100" step="0.01" value={factor.weight} onChange={(event) => revise((current) => ({ ...current, factors: current.factors.map((row) => row.id === factor.id ? { ...row, weight: event.target.value } : row) }))} /></label> : null}
              <label><span>{t("rfxWorkspace.linkRequirement")}</span><select value={factor.linkedRequirementIds[0] ?? ""} onChange={(event) => revise((current) => ({ ...current, factors: current.factors.map((row) => row.id === factor.id ? { ...row, linkedRequirementIds: event.target.value ? [event.target.value] : [] } : row) }))}><option value="">{t("rfxWorkspace.noLink")}</option>{form.requirements.map((requirement) => <option key={requirement.id} value={requirement.id}>{requirement.title || requirement.capabilityLabel}</option>)}</select></label>
              <button type="button" className={styles.removeText} onClick={() => revise((current) => ({ ...current, factors: current.factors.filter((row) => row.id !== factor.id) }))}>{t("rfxWorkspace.remove")}</button>
            </article>
          ))}
        </div>
      </section>

      {sheet ? (
        <div className={styles.sheetBackdrop} role="presentation" onMouseDown={() => setSheet(null)}>
          <div ref={sheetDialog} role="dialog" aria-modal="true" aria-labelledby="definition-sheet-title" onMouseDown={(event) => event.stopPropagation()}>
            <ResponsiveSheet labelledBy="definition-sheet-title" width="wide">
              <h3 id="definition-sheet-title">{sheet === "section" ? t("rfxWorkspace.addSection") : t("rfxWorkspace.addFactor")}</h3>
              <p>{sheet === "section" ? t("rfxWorkspace.customSectionHelp") : t("rfxWorkspace.customFactorHelp")}</p>
              <div className={styles.sheetActions}>
                <button type="button" className={styles.primary} onClick={() => {
                  if (sheet === "section") revise((current) => ({ ...current, sections: [...current.sections, { id: identifier("section"), sourceSectionId: "", title: t("rfxWorkspace.customSection"), instructions: "", format: "narrative", required: true, characterLimit: "", itemLimit: "", attachmentsAllowed: false, linkedRequirementIds: current.requirements[0] ? [current.requirements[0].id] : [] }] }));
                  else revise((current) => ({ ...current, factors: [...current.factors, { id: identifier("factor"), sourceFactorId: "", sourceMethod: null, title: t("rfxWorkspace.customFactor"), description: "", treatment: "informational-only", weight: "", linkedRequirementIds: current.requirements[0] ? [current.requirements[0].id] : [], linkedResponseSectionIds: current.sections[0] ? [current.sections[0].id] : [], linkedEvidenceRequirementIds: [] }] }));
                  setSheet(null);
                }}>{t("rfxWorkspace.add")}</button>
                <button type="button" className={styles.secondary} onClick={() => setSheet(null)}>{t("rfxWorkspace.cancel")}</button>
              </div>
            </ResponsiveSheet>
          </div>
        </div>
      ) : null}
    </section>
  );
}
