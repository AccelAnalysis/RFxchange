"use client";

import { useEffect, useMemo, useState } from "react";

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
type AuthoringQualifier = RfxRequirementQualifier & Readonly<{ propertyId?: string }>;

interface UnitOption {
  readonly id: string;
  readonly label: string;
  readonly code: string;
  readonly symbol: string | null;
  readonly unitFamily: string;
}

interface QuantityDimensionOption {
  readonly id: string;
  readonly label: string;
  readonly dataType: "number" | "duration" | "currency";
  readonly unitFamily: string;
  readonly allowedUnitIds: readonly string[];
}

interface LocalityOption {
  readonly id: string;
  readonly label: string;
}

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function selectionInput(aggregate: RfxAggregate, requirements: readonly Readonly<{
  id: string;
  qualifiers: readonly AuthoringQualifier[];
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
  const [quantityDimensionId, setQuantityDimensionId] = useState("");
  const [unit, setUnit] = useState("");
  const [requiredValue, setRequiredValue] = useState(true);
  const [localityIds, setLocalityIds] = useState<readonly string[]>([]);
  const [units, setUnits] = useState<readonly UnitOption[]>([]);
  const [dimensions, setDimensions] = useState<readonly QuantityDimensionOption[]>([]);
  const [localities, setLocalities] = useState<readonly LocalityOption[]>([]);
  const [authorityReady, setAuthorityReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const effectiveRequirementId = definition?.requirements.some(
    (requirement) => requirement.id === requirementId,
  )
    ? requirementId
    : definition?.requirements[0]?.id ?? "";
  const selected = useMemo(
    () => definition?.requirements.find((item) => item.id === effectiveRequirementId) ?? null,
    [definition, effectiveRequirementId],
  );
  const selectedDimension = useMemo(
    () => dimensions.find((dimension) => dimension.id === quantityDimensionId) ?? null,
    [dimensions, quantityDimensionId],
  );
  const allowedUnits = useMemo(() => {
    if (!selectedDimension) return [];
    const allowed = new Set(selectedDimension.allowedUnitIds);
    return units.filter((option) => allowed.has(option.id));
  }, [selectedDimension, units]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/rfx/qualifier-authority", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("qualifier-authority-unavailable");
        return response.json() as Promise<{
          units?: readonly UnitOption[];
          dimensions?: readonly QuantityDimensionOption[];
          localities?: readonly LocalityOption[];
        }>;
      })
      .then((payload) => {
        setUnits(payload.units ?? []);
        setDimensions(payload.dimensions ?? []);
        setLocalities(payload.localities ?? []);
        setAuthorityReady(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAuthorityReady(false);
          setMessage(t("rfxQualifier.error.save"));
        }
      });
    return () => controller.abort();
  }, [t]);

  if (!definition || !definition.requirements.length) return null;

  function qualifier(): AuthoringQualifier {
    if (qualifierKind === "quantity") {
      const parsed = Number(amount);
      if (
        !Number.isFinite(parsed) ||
        parsed <= 0 ||
        !selectedDimension ||
        !unit ||
        !selectedDimension.allowedUnitIds.includes(unit) ||
        !allowedUnits.some((option) => option.id === unit)
      ) {
        throw new Error(t("rfxQualifier.error.quantityRequired"));
      }
      return Object.freeze({
        kind: "quantity",
        label: selectedDimension.label,
        amount: parsed,
        unit,
        propertyId: selectedDimension.id,
      });
    }
    if (!label.trim()) throw new Error(t("rfxQualifier.error.labelRequired"));
    if (qualifierKind === "text") {
      if (!textValue.trim()) throw new Error(t("rfxQualifier.error.valueRequired"));
      return Object.freeze({ kind: "text", label: label.trim(), value: textValue.trim() });
    }
    if (qualifierKind === "boolean") {
      return Object.freeze({ kind: "boolean", label: label.trim(), requiredValue });
    }
    if (!localityIds.length || localityIds.some((id) => !localities.some((option) => option.id === id))) {
      throw new Error(t("rfxQualifier.error.localityRequired"));
    }
    return Object.freeze({ kind: "geography", label: label.trim(), localityIds: Object.freeze([...localityIds]) });
  }

  async function saveQualifiers(
    nextQualifiers: readonly AuthoringQualifier[],
    successMessage: string,
  ): Promise<boolean> {
    if (!selected || !authorityReady) return false;
    setBusy(true);
    setMessage(null);
    try {
      const commandStorage = storage();
      const definitionInput = selectionInput(aggregate, [{
        id: selected.id,
        qualifiers: Object.freeze([...nextQualifiers]),
      }]);
      const fingerprint = JSON.stringify({
        rfxId: aggregate.id,
        version: aggregate.version,
        requirementId: selected.id,
        qualifiers: nextQualifiers,
      });
      const storageKey = `rfxchange:rfx-qualifier:${commandRecoveryScope}:${aggregate.id}:${selected.id}`;
      const commandId = resolveRetryStableCommand({
        storage: commandStorage,
        storageKey,
        fingerprint,
        prefix: "rfx-qualifier",
      });
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
      setMessage(successMessage);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("rfxQualifier.error.save"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addQualifier() {
    if (!selected) return;
    setMessage(null);
    let nextQualifier: AuthoringQualifier;
    try {
      nextQualifier = qualifier();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("rfxQualifier.error.save"));
      return;
    }
    const saved = await saveQualifiers(
      Object.freeze([...selected.qualifiers, nextQualifier]),
      t("rfxQualifier.saved"),
    );
    if (!saved) return;
    setTextValue("");
    setAmount("");
    setQuantityDimensionId("");
    setUnit("");
    setLocalityIds([]);
  }

  async function removeQualifier(index: number) {
    if (!selected || index < 0 || index >= selected.qualifiers.length) return;
    await saveQualifiers(
      Object.freeze(selected.qualifiers.filter((_, qualifierIndex) => qualifierIndex !== index)),
      t("rfxQualifier.removed"),
    );
  }

  return (
    <section className={styles.definitionModule} data-rfx-structured-qualifiers>
      <h3>{t("rfxQualifier.title")}</h3>
      <p>{t("rfxQualifier.intro")}</p>
      <label className={styles.field}>
        <span>{t("rfxQualifier.requirement")}</span>
        <select value={effectiveRequirementId} onChange={(event) => setRequirementId(event.target.value)} disabled={busy}>
          {definition.requirements.map((requirement) => (
            <option key={requirement.id} value={requirement.id}>{requirement.title}</option>
          ))}
        </select>
      </label>

      {selected?.qualifiers.length ? (
        <ul data-rfx-existing-qualifiers>
          {selected.qualifiers.map((item, index) => (
            <li key={`${item.kind}:${item.label}:${index}`}>
              <span>{item.label} · {item.kind}</span>
              <button
                className={styles.secondary}
                data-rfx-remove-qualifier
                type="button"
                disabled={busy || !authorityReady}
                onClick={() => void removeQualifier(index)}
              >
                {t("rfxQualifier.removeQualifier")}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <label className={styles.field}>
        <span>{t("rfxQualifier.qualifierType")}</span>
        <select data-rfx-qualifier-kind value={qualifierKind} onChange={(event) => setQualifierKind(event.target.value as QualifierKind)} disabled={busy}>
          <option value="text">{t("rfxQualifier.type.text")}</option>
          <option value="quantity">{t("rfxQualifier.type.quantity")}</option>
          <option value="boolean">{t("rfxQualifier.type.boolean")}</option>
          <option value="geography">{t("rfxQualifier.type.geography")}</option>
        </select>
      </label>
      {qualifierKind !== "quantity" ? (
        <label className={styles.field}><span>{t("rfxQualifier.label")}</span><input value={label} onChange={(event) => setLabel(event.target.value)} disabled={busy} /></label>
      ) : null}
      {qualifierKind === "text" ? (
        <label className={styles.field}><span>{t("rfxQualifier.requiredText")}</span><input value={textValue} onChange={(event) => setTextValue(event.target.value)} disabled={busy} /></label>
      ) : null}
      {qualifierKind === "quantity" ? (
        <div>
          <label className={styles.field}>
            <span>{t("rfxQualifier.label")}</span>
            <select
              data-rfx-qualifier-dimension
              value={quantityDimensionId}
              onChange={(event) => {
                setQuantityDimensionId(event.target.value);
                setUnit("");
              }}
              disabled={busy || !authorityReady}
            >
              <option value="">—</option>
              {dimensions.map((dimension) => (
                <option key={dimension.id} value={dimension.id}>{dimension.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}><span>{t("rfxQualifier.amount")}</span><input type="number" min="0" step="any" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={busy} /></label>
          <label className={styles.field}>
            <span>{t("rfxQualifier.unit")}</span>
            <select data-rfx-qualifier-unit value={unit} onChange={(event) => setUnit(event.target.value)} disabled={busy || !authorityReady || !selectedDimension}>
              <option value="">—</option>
              {allowedUnits.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}{option.symbol ? ` (${option.symbol})` : ` (${option.code})`}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      {qualifierKind === "boolean" ? (
        <label className={styles.field}><span>{t("rfxQualifier.requiredValue")}</span><select value={requiredValue ? "true" : "false"} onChange={(event) => setRequiredValue(event.target.value === "true")} disabled={busy}><option value="true">{t("rfxQualifier.yesTrue")}</option><option value="false">{t("rfxQualifier.noFalse")}</option></select></label>
      ) : null}
      {qualifierKind === "geography" ? (
        <label className={styles.field}>
          <span>{t("rfxQualifier.localityIds")}</span>
          <select
            data-rfx-qualifier-localities
            multiple
            value={[...localityIds]}
            onChange={(event) => setLocalityIds(
              Object.freeze(Array.from(event.currentTarget.selectedOptions, (option) => option.value)),
            )}
            disabled={busy || !authorityReady}
          >
            {localities.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
      ) : null}
      <button className={styles.secondary} type="button" onClick={() => void addQualifier()} disabled={busy || !selected || !authorityReady}>
        {busy ? t("rfxQualifier.saving") : t("rfxQualifier.addQualifier")}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}
