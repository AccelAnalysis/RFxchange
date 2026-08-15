"use client";

import { useMemo, useState } from "react";

import type {
  RfxAggregate,
  RfxRequirementQualifier,
} from "../../domain/rfx/model";
import { useI18n } from "../i18n/I18nProvider";
import {
  clearRetryStableCommand,
  resolveRetryStableCommand,
} from "../referrals/retry-stable-command";

import styles from "./RFxDraftWorkspace.module.css";

interface Props {
  readonly aggregate: RfxAggregate;
  readonly commandRecoveryScope: string;
  readonly onCommitted: (aggregate: RfxAggregate) => void;
}

type QualifierKind = RfxRequirementQualifier["kind"];

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function selectionInput(aggregate: RfxAggregate, requirements: readonly Readonly<{
  id: string;
  qualifiers: readonly RfxRequirementQualifier[];
}>[]) {
  if (!aggregate.definition) throw new Error("rfx-definition-unavailable");
  const qualifierByRequirement = new Map(
    requirements.map((requirement) => [requirement.id, requirement.qualifiers]),
  );
  return {
    requirements: aggregate.definition.requirements.map((item) => ({
      id: item.id,
      requirementTypeId: item.requirementType.id,
      capabilityId: item.capability?.id ?? null,
      title: item.title,
      description: item.description,
      level: item.level,
      decisionTreatment: item.decisionTreatment,
      satisfyingParty: item.satisfyingParty,
      qualifiers: qualifierByRequirement.get(item.id) ?? item.qualifiers,
      evidenceRequirementIds: item.evidenceRequirementIds,
      linkedFoundationRequirementIds: item.linkedFoundationRequirementIds,
    })),
    responseStructure: {
      responseTemplateId: aggregate.definition.responseStructure.sourceTemplate?.id ?? "",
      sections: aggregate.definition.responseStructure.sections.map((item) => ({
        id: item.id,
        sourceSectionId: item.sourceSection?.id ?? null,
        title: item.title,
        instructions: item.instructions,
        format: item.format,
        required: item.required,
        characterLimit: item.characterLimit,
        itemLimit: item.itemLimit,
        attachmentsAllowed: item.attachmentsAllowed,
        linkedRequirementIds: item.linkedRequirementIds,
      })),
    },
    evaluationDefinition: {
      decisionTemplateId: aggregate.definition.evaluationDefinition.sourceTemplate?.id ?? "",
      weightingRequired: aggregate.definition.evaluationDefinition.weightingRequired,
      factors: aggregate.definition.evaluationDefinition.factors.map((item) => ({
        id: item.id,
        sourceFactorId: item.sourceFactor?.id ?? null,
        title: item.title,
        description: item.description,
        treatment: item.treatment,
        weightBasisPoints: item.weightBasisPoints,
        linkedRequirementIds: item.linkedRequirementIds,
        linkedResponseSectionIds: item.linkedResponseSectionIds,
        linkedEvidenceRequirementIds: item.linkedEvidenceRequirementIds,
      })),
    },
    interpretationRecordIds: aggregate.definition.interpretationRecordIds,
  };
}

export function RFxStructuredQualifierEditor({
  aggregate,
  commandRecoveryScope,
  onCommitted,
}: Props) {
  const { t } = useI18n();
  const definition = aggregate.definition;
  const [requirementId, setRequirementId] = useState(definition?.requirements[0]?.id ?? "");
  const [qualifierKind, setQualifierKind] = useState<QualifierKind>("text");
  const [label, setLabel] = useState(() => t("rfxQualifier.defaultLabel"));
  const [textValue, setTextValue] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("");
  const [requiredValue, setRequiredValue] = useState(true);
  const [localityIds, setLocalityIds] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selected = useMemo(
    () => definition?.requirements.find((item) => item.id === requirementId) ?? null,
    [definition, requirementId],
  );

  if (!definition || !definition.requirements.length) return null;

  function qualifier(): RfxRequirementQualifier {
    if (!label.trim()) throw new Error(t("rfxQualifier.error.labelRequired"));
    if (qualifierKind === "text") {
      if (!textValue.trim()) throw new Error(t("rfxQualifier.error.valueRequired"));
      return Object.freeze({ kind: "text", label: label.trim(), value: textValue.trim() });
    }
    if (qualifierKind === "quantity") {
      const parsed = Number(amount);
      if (!Number.isFinite(parsed) || parsed <= 0 || !unit.trim()) {
        throw new Error(t("rfxQualifier.error.quantityRequired"));
      }
      return Object.freeze({ kind: "quantity", label: label.trim(), amount: parsed, unit: unit.trim() });
    }
    if (qualifierKind === "boolean") {
      return Object.freeze({ kind: "boolean", label: label.trim(), requiredValue });
    }
    const ids = localityIds
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    if (!ids.length) throw new Error(t("rfxQualifier.error.localityRequired"));
    return Object.freeze({ kind: "geography", label: label.trim(), localityIds: Object.freeze(ids) });
  }

  async function addQualifier() {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    const commandStorage = storage();
    const nextQualifier = qualifier();
    const definitionInput = selectionInput(aggregate, [{
      id: selected.id,
      qualifiers: Object.freeze([...selected.qualifiers, nextQualifier]),
    }]);
    const fingerprint = JSON.stringify({
      rfxId: aggregate.id,
      version: aggregate.version,
      requirementId: selected.id,
      qualifier: nextQualifier,
    });
    const storageKey = `rfxchange:rfx-qualifier:${commandRecoveryScope}:${aggregate.id}:${selected.id}`;
    const commandId = resolveRetryStableCommand({
      storage: commandStorage,
      storageKey,
      fingerprint,
      prefix: "rfx-qualifier",
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
          definition: definitionInput,
        }),
      });
      const payload = await response.json() as { aggregate?: RfxAggregate };
      if (!response.ok || !payload.aggregate) {
        throw new Error(t("rfxQualifier.error.save"));
      }
      clearRetryStableCommand({ storage: commandStorage, storageKey, commandId });
      onCommitted(payload.aggregate);
      setTextValue("");
      setAmount("");
      setUnit("");
      setLocalityIds("");
      setMessage(t("rfxQualifier.saved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("rfxQualifier.error.save"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.definitionModule} data-rfx-structured-qualifiers>
      <h3>{t("rfxQualifier.title")}</h3>
      <p>{t("rfxQualifier.intro")}</p>
      <label className={styles.field}>
        <span>{t("rfxQualifier.requirement")}</span>
        <select value={requirementId} onChange={(event) => setRequirementId(event.target.value)} disabled={busy}>
          {definition.requirements.map((requirement) => (
            <option key={requirement.id} value={requirement.id}>{requirement.title}</option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span>{t("rfxQualifier.qualifierType")}</span>
        <select data-rfx-qualifier-kind value={qualifierKind} onChange={(event) => setQualifierKind(event.target.value as QualifierKind)} disabled={busy}>
          <option value="text">{t("rfxQualifier.type.text")}</option>
          <option value="quantity">{t("rfxQualifier.type.quantity")}</option>
          <option value="boolean">{t("rfxQualifier.type.boolean")}</option>
          <option value="geography">{t("rfxQualifier.type.geography")}</option>
        </select>
      </label>
      <label className={styles.field}><span>{t("rfxQualifier.label")}</span><input value={label} onChange={(event) => setLabel(event.target.value)} disabled={busy} /></label>
      {qualifierKind === "text" ? (
        <label className={styles.field}><span>{t("rfxQualifier.requiredText")}</span><input value={textValue} onChange={(event) => setTextValue(event.target.value)} disabled={busy} /></label>
      ) : null}
      {qualifierKind === "quantity" ? (
        <div>
          <label className={styles.field}><span>{t("rfxQualifier.amount")}</span><input type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={busy} /></label>
          <label className={styles.field}><span>{t("rfxQualifier.unit")}</span><input value={unit} onChange={(event) => setUnit(event.target.value)} disabled={busy} /></label>
        </div>
      ) : null}
      {qualifierKind === "boolean" ? (
        <label className={styles.field}><span>{t("rfxQualifier.requiredValue")}</span><select value={requiredValue ? "true" : "false"} onChange={(event) => setRequiredValue(event.target.value === "true")} disabled={busy}><option value="true">{t("rfxQualifier.yesTrue")}</option><option value="false">{t("rfxQualifier.noFalse")}</option></select></label>
      ) : null}
      {qualifierKind === "geography" ? (
        <label className={styles.field}><span>{t("rfxQualifier.localityIds")}</span><input value={localityIds} onChange={(event) => setLocalityIds(event.target.value)} placeholder={t("rfxQualifier.localityPlaceholder")} disabled={busy} /></label>
      ) : null}
      <button className={styles.secondary} type="button" onClick={() => void addQualifier()} disabled={busy || !selected}>
        {busy ? t("rfxQualifier.saving") : t("rfxQualifier.addQualifier")}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
