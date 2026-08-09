"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { AiInterpretationCandidateEnvelope } from "../../domain/ai-interpretation/model";
import type { AmacsCapability, AmacsDomain, AmacsFamily, AmacsReleaseMetadata } from "../../domain/amacs/model";
import type {
  OrganizationCapabilityClaim,
  OrganizationIndustryProfile,
  OrganizationMarketPreferences,
  OrganizationPastPerformance,
  OrganizationProvisionalTerm,
} from "../../domain/market-profile/model";
import { useI18n } from "../i18n/I18nProvider";
import { AlertBanner, StatePanel, StatusPill } from "../ui";

import styles from "./MarketProfilePanel.module.css";

type Tab = "capabilities" | "industry" | "experience" | "preferences";
type Notice = Readonly<{ tone: "success" | "error" | "information"; title: string; body: string }> | null;

interface MarketProfilePanelProps {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly snapshot: Readonly<{
    claims: readonly OrganizationCapabilityClaim[];
    industry: OrganizationIndustryProfile | null;
    pastPerformance: readonly OrganizationPastPerformance[];
    preferences: OrganizationMarketPreferences | null;
    provisionalTerms: readonly OrganizationProvisionalTerm[];
  }>;
  readonly catalog: Readonly<{
    release: AmacsReleaseMetadata;
    domains: readonly AmacsDomain[];
    families: readonly AmacsFamily[];
    capabilities: readonly AmacsCapability[];
  }>;
  readonly marketRoles: readonly Readonly<{ id: string; label: string; definition: string }>[];
  readonly serviceGeographies: readonly Readonly<{ id: string; label: string }>[];
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "The update could not be saved.");
  return result;
}

function commandId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function splitLines(value: string): readonly string[] {
  return [...new Set(value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))];
}

export function MarketProfilePanel(props: MarketProfilePanelProps) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [tab, setTab] = useState<Tab>("capabilities");
  const [notice, setNotice] = useState<Notice>(null);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [domainId, setDomainId] = useState(props.catalog.domains[0]?.domainId ?? "");
  const availableFamilies = useMemo(
    () => props.catalog.families.filter((family) => family.domainId === domainId),
    [domainId, props.catalog.families],
  );
  const [familyId, setFamilyId] = useState("");
  const effectiveFamilyId = availableFamilies.some((family) => family.familyId === familyId)
    ? familyId
    : availableFamilies[0]?.familyId ?? "";
  const visibleCapabilities = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("en-US");
    return props.catalog.capabilities.filter((capability) => {
      if (normalized) {
        const corpus = [capability.preferredLabel, capability.definition, ...capability.aliases, capability.familyLabel, capability.domainLabel].join(" ").toLocaleLowerCase("en-US");
        return normalized.split(/\s+/).every((term) => corpus.includes(term));
      }
      return capability.familyId === effectiveFamilyId;
    }).slice(0, 30);
  }, [effectiveFamilyId, props.catalog.capabilities, query]);
  const [selectedCapabilityId, setSelectedCapabilityId] = useState("");
  const selectedCapability = props.catalog.capabilities.find((capability) => capability.conceptId === selectedCapabilityId) ?? null;
  const [claimSource, setClaimSource] = useState<
    | Readonly<{ kind: "manual" }>
    | Readonly<{ kind: "interpretation"; interpretationRecordId: string; interpretationCandidateId: string; candidateUpdatedAt: string }>
  >({ kind: "manual" });
  const [plainLanguage, setPlainLanguage] = useState("");
  const [candidates, setCandidates] = useState<readonly AiInterpretationCandidateEnvelope[]>([]);
  const [interpretationRecordId, setInterpretationRecordId] = useState("");
  const [assistanceBusy, setAssistanceBusy] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState("");
  const [editedCandidateValue, setEditedCandidateValue] = useState("");

  const refreshAfter = (message: Notice) => {
    setNotice(message);
    startTransition(() => router.refresh());
  };

  async function requestAssistance() {
    setAssistanceBusy(true);
    setNotice(null);
    try {
      const result = await postJson("/api/ai/amacs/interpret", {
        organizationId: props.organizationId,
        purpose: "seller_capability_declaration",
        subjectRef: `organization-profile:${props.organizationId}`,
        sources: [{ sourceRef: `participant-text:${crypto.randomUUID()}`, sourceType: "participant_text", text: plainLanguage, locator: "Market profile capability description", inclusionAuthorized: true }],
      }) as unknown as Readonly<{ record: Readonly<{ id: string }>; candidates: readonly AiInterpretationCandidateEnvelope[] }>;
      setInterpretationRecordId(result.record.id);
      setCandidates(result.candidates);
      setNotice({ tone: "information", title: t("marketProfile.notices.suggestionsReadyTitle"), body: t("marketProfile.notices.suggestionsReadyBody") });
    } catch {
      setNotice({ tone: "error", title: t("marketProfile.notices.assistanceUnavailableTitle"), body: t("marketProfile.notices.assistanceUnavailableBody") });
    } finally {
      setAssistanceBusy(false);
    }
  }

  async function disposition(candidate: AiInterpretationCandidateEnvelope, decision: "accepted" | "edited" | "rejected" | "unresolved", editedTextValue?: string) {
    setAssistanceBusy(true);
    setNotice(null);
    try {
      const result = await postJson("/api/ai/amacs/disposition", {
        organizationId: props.organizationId,
        recordId: interpretationRecordId,
        candidateId: candidate.id,
        expectedUpdatedAt: candidate.updatedAt,
        decision: decision === "edited" ? { disposition: decision, editedTextValue } : { disposition: decision },
      }) as unknown as Readonly<{ candidate: AiInterpretationCandidateEnvelope | null }>;
      setCandidates((current) => current.map((item) => item.id === candidate.id && result.candidate ? result.candidate : item));
      const acceptedAmacsId = result.candidate && "amacs_id" in result.candidate.candidate.candidate_value
        ? result.candidate.candidate.candidate_value.amacs_id
        : null;
      if (decision === "accepted" && result.candidate && typeof acceptedAmacsId === "string") {
        setSelectedCapabilityId(acceptedAmacsId);
        setClaimSource({
          kind: "interpretation",
          interpretationRecordId,
          interpretationCandidateId: candidate.id,
          candidateUpdatedAt: result.candidate.updatedAt,
        });
        setNotice({ tone: "information", title: t("marketProfile.notices.confirmedTitle"), body: t("marketProfile.notices.confirmedBody") });
      } else if (decision === "edited") {
        setEditingCandidateId("");
        setQuery(editedTextValue ?? "");
        setSelectedCapabilityId("");
        setClaimSource({ kind: "manual" });
        setNotice({ tone: "information", title: t("marketProfile.notices.editedTitle"), body: t("marketProfile.notices.editedBody") });
      } else {
        setNotice({ tone: "information", title: decision === "rejected" ? t("marketProfile.notices.rejectedTitle") : t("marketProfile.notices.unresolvedTitle"), body: t("marketProfile.notices.nonAuthoritativeBody") });
      }
    } catch {
      setNotice({ tone: "error", title: t("marketProfile.notices.dispositionErrorTitle"), body: t("marketProfile.notices.dispositionErrorBody") });
    } finally {
      setAssistanceBusy(false);
    }
  }

  async function noneOfThese() {
    setAssistanceBusy(true);
    try {
      await postJson("/api/ai/amacs/disposition", { organizationId: props.organizationId, recordId: interpretationRecordId, decision: { disposition: "none-of-these" } });
      setCandidates([]);
      setNotice({ tone: "information", title: t("marketProfile.notices.closedTitle"), body: t("marketProfile.notices.closedBody") });
    } catch {
      setNotice({ tone: "error", title: t("marketProfile.notices.closeErrorTitle"), body: t("marketProfile.notices.tryAgain") });
    } finally {
      setAssistanceBusy(false);
    }
  }

  async function saveClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCapability) return;
    const data = new FormData(event.currentTarget);
    try {
      await postJson("/api/organization-market-profile", {
        organizationId: props.organizationId,
        commandId: commandId("claim"),
        action: "claim-capability",
        input: {
          capabilityId: selectedCapability.conceptId,
          entityScope: String(data.get("entityScope") ?? "reporting_entity"),
          marketRoleIds: data.getAll("marketRoleIds").map(String),
          deliveryRoles: data.getAll("deliveryRoles").map(String),
          serviceGeographyIds: data.getAll("serviceGeographyIds").map(String),
          specialties: splitLines(String(data.get("specialties") ?? "")),
          visibility: String(data.get("visibility") ?? "network"),
          source: claimSource,
        },
      });
      setSelectedCapabilityId("");
      setClaimSource({ kind: "manual" });
      refreshAfter({ tone: "success", title: t("marketProfile.notices.claimSavedTitle"), body: t("marketProfile.notices.claimSavedBody") });
    } catch {
      setNotice({ tone: "error", title: t("marketProfile.notices.claimErrorTitle"), body: t("marketProfile.notices.genericSaveError") });
    }
  }

  async function saveIndustry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const industries = splitLines(String(data.get("industries") ?? "")).map((label, index) => ({ id: `industry-${index + 1}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}`, label, visibility: String(data.get("visibility") ?? "network") }));
    const naicsCode = String(data.get("naicsCode") ?? "").trim();
    const naicsTitle = String(data.get("naicsTitle") ?? "").trim();
    const naics = naicsCode || naicsTitle ? [{ id: `naics-${naicsCode}`, code: naicsCode, title: naicsTitle, version: String(data.get("naicsVersion") ?? "2022"), source: "participant_selected", provenance: "Selected by an authorized organization participant", visibility: String(data.get("visibility") ?? "network") }] : [];
    try {
      await postJson("/api/organization-market-profile", { organizationId: props.organizationId, commandId: commandId("industry"), action: "update-industry", input: { industries, naics } });
      refreshAfter({ tone: "success", title: t("marketProfile.notices.industrySavedTitle"), body: t("marketProfile.notices.industrySavedBody") });
    } catch {
      setNotice({ tone: "error", title: t("marketProfile.notices.industryErrorTitle"), body: t("marketProfile.notices.genericSaveError") });
    }
  }

  async function saveExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const exactDollars = Number(String(data.get("exactDollars") ?? "").replace(/[^0-9.]/g, ""));
    try {
      await postJson("/api/organization-market-profile", {
        organizationId: props.organizationId, commandId: commandId("performance"), action: "add-past-performance",
        input: {
          id: commandId("project"), title: String(data.get("title") ?? ""), summary: String(data.get("summary") ?? ""),
          customerOrSector: String(data.get("customerOrSector") ?? ""), role: String(data.get("role") ?? ""),
          startedOn: String(data.get("startedOn") ?? ""), endedOn: String(data.get("endedOn") ?? ""), contractType: String(data.get("contractType") ?? ""),
          value: { currency: "USD", exactMinorUnits: Number.isFinite(exactDollars) && exactDollars > 0 ? Math.round(exactDollars * 100) : null, minimumMinorUnits: null, maximumMinorUnits: null, disclosed: data.get("discloseValue") === "on" },
          location: String(data.get("location") ?? ""), outputs: splitLines(String(data.get("outputs") ?? "")), outcomesClaimed: splitLines(String(data.get("outcomes") ?? "")),
          supportingCapabilityClaimIds: data.getAll("supportingCapabilityClaimIds").map(String), evidenceIds: [], visibility: String(data.get("visibility") ?? "private"),
        },
      });
      form.reset();
      refreshAfter({ tone: "success", title: t("marketProfile.notices.experienceSavedTitle"), body: t("marketProfile.notices.experienceSavedBody") });
    } catch {
      setNotice({ tone: "error", title: t("marketProfile.notices.experienceErrorTitle"), body: t("marketProfile.notices.genericSaveError") });
    }
  }

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await postJson("/api/organization-market-profile", {
        organizationId: props.organizationId, commandId: commandId("preferences"), action: "update-preferences",
        input: {
          deliveryRoleInterests: data.getAll("deliveryRoleInterests").map(String), teamPreferences: splitLines(String(data.get("teamPreferences") ?? "")),
          referralPreferences: splitLines(String(data.get("referralPreferences") ?? "")), resourceNeeds: splitLines(String(data.get("resourceNeeds") ?? "")),
          contactPreference: String(data.get("contactPreference") ?? "organization_contact"), intakeNotes: String(data.get("intakeNotes") ?? ""), visibility: String(data.get("visibility") ?? "network"),
        },
      });
      refreshAfter({ tone: "success", title: t("marketProfile.notices.preferencesSavedTitle"), body: t("marketProfile.notices.preferencesSavedBody") });
    } catch {
      setNotice({ tone: "error", title: t("marketProfile.notices.preferencesErrorTitle"), body: t("marketProfile.notices.genericSaveError") });
    }
  }

  async function saveProvisional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await postJson("/api/organization-market-profile", {
        organizationId: props.organizationId, commandId: commandId("provisional"), action: "submit-provisional-term",
        input: { id: commandId("term"), proposedLabel: String(data.get("proposedLabel") ?? ""), proposedDefinition: String(data.get("proposedDefinition") ?? ""), exampleWork: String(data.get("exampleWork") ?? ""), suggestedDomainId: String(data.get("suggestedDomainId") ?? "") || null },
      });
      form.reset();
      refreshAfter({ tone: "success", title: t("marketProfile.notices.provisionalSavedTitle"), body: t("marketProfile.notices.provisionalSavedBody") });
    } catch {
      setNotice({ tone: "error", title: t("marketProfile.notices.provisionalErrorTitle"), body: t("marketProfile.notices.genericSaveError") });
    }
  }

  return (
    <section className={styles.workspace} aria-labelledby="market-profile-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t("marketProfile.header.eyebrow", { version: props.catalog.release.version })}</p>
          <h2 id="market-profile-title">{t("marketProfile.header.title", { organizationName: props.organizationName })}</h2>
          <p>{t("marketProfile.header.body")}</p>
        </div>
        <StatusPill tone="information">{t(props.snapshot.claims.length === 1 ? "marketProfile.header.countOne" : "marketProfile.header.countMany", { count: new Intl.NumberFormat(locale).format(props.snapshot.claims.length) })}</StatusPill>
      </header>

      <nav className={styles.tabs} aria-label={t("marketProfile.tabs.label")}>
        {(["capabilities", "industry", "experience", "preferences"] as const).map((value) => (
          <button key={value} type="button" aria-current={tab === value ? "page" : undefined} onClick={() => { setTab(value); setNotice(null); }}>{t(`marketProfile.tabs.${value}`)}</button>
        ))}
      </nav>

      {notice ? <AlertBanner title={notice.title} tone={notice.tone === "success" ? "positive" : notice.tone === "error" ? "restricted" : "information"}>{notice.body}</AlertBanner> : null}
      {isPending ? <p className={styles.saving} role="status">{t("marketProfile.common.refreshing")}</p> : null}

      {tab === "capabilities" ? (
        <div className={styles.sectionGrid}>
          <section className={styles.primarySection} aria-labelledby="describe-capability-title">
            <p className={styles.eyebrow}>{t("marketProfile.assistance.eyebrow")}</p>
            <h3 id="describe-capability-title">{t("marketProfile.assistance.title")}</h3>
            <label>{t("marketProfile.assistance.input")}
              <textarea value={plainLanguage} onChange={(event) => setPlainLanguage(event.target.value)} minLength={10} maxLength={12000} placeholder={t("marketProfile.assistance.placeholder")} />
            </label>
            <button className={styles.primaryButton} type="button" disabled={assistanceBusy || plainLanguage.trim().length < 10} onClick={requestAssistance}>{assistanceBusy ? t("marketProfile.assistance.busy") : t("marketProfile.assistance.button")}</button>
            <p className={styles.help}>{t("marketProfile.assistance.help")}</p>
            {candidates.length ? (
              <div className={styles.candidates} aria-label={t("marketProfile.assistance.suggestionsLabel")}>
                {candidates.map((envelope) => {
                  const value = envelope.candidate.candidate_value;
                  const capability = "amacs_id" in value ? props.catalog.capabilities.find((item) => item.conceptId === value.amacs_id) : null;
                  return <article key={envelope.id}>
                    <div><StatusPill tone="information">{t("marketProfile.assistance.suggestion", { status: t(`marketProfile.dispositions.${envelope.candidate.disposition}`) })}</StatusPill><h4>{capability?.preferredLabel ?? ("text_value" in value ? value.text_value ?? t("marketProfile.assistance.provisionalTerm") : t("marketProfile.assistance.provisionalTerm"))}</h4><p>{envelope.candidate.rationale}</p>{envelope.candidate.clarification_question ? <p><strong>{t("marketProfile.assistance.clarify")}</strong> {envelope.candidate.clarification_question}</p> : null}</div>
                    {envelope.candidate.disposition === "suggested" ? <div className={styles.inlineActions}><button type="button" onClick={() => disposition(envelope, "accepted")}>{t("marketProfile.assistance.confirm")}</button><button type="button" onClick={() => { setEditingCandidateId(envelope.id); setEditedCandidateValue(capability?.preferredLabel ?? ("text_value" in value ? value.text_value ?? "" : "")); }}>{t("marketProfile.assistance.edit")}</button><button type="button" onClick={() => disposition(envelope, "unresolved")}>{t("marketProfile.assistance.keepUnresolved")}</button><button type="button" onClick={() => disposition(envelope, "rejected")}>{t("marketProfile.assistance.reject")}</button></div> : null}
                    {editingCandidateId === envelope.id ? <div className={styles.editCandidate}><label>{t("marketProfile.assistance.editLabel")}<textarea value={editedCandidateValue} minLength={1} maxLength={4000} onChange={(event) => setEditedCandidateValue(event.target.value)} /></label><p className={styles.help}>{t("marketProfile.assistance.editHelp")}</p><div className={styles.inlineActions}><button type="button" disabled={editedCandidateValue.trim().length === 0 || assistanceBusy} onClick={() => disposition(envelope, "edited", editedCandidateValue)}>{t("marketProfile.assistance.saveEdit")}</button><button type="button" onClick={() => setEditingCandidateId("")}>{t("marketProfile.common.cancel")}</button></div></div> : null}
                  </article>;
                })}
                <button className={styles.quietButton} type="button" onClick={noneOfThese}>{t("marketProfile.assistance.none")}</button>
              </div>
            ) : null}
          </section>

          <section className={styles.primarySection} aria-labelledby="manual-catalog-title">
            <p className={styles.eyebrow}>{t("marketProfile.catalog.eyebrow")}</p>
            <h3 id="manual-catalog-title">{t("marketProfile.catalog.title")}</h3>
            <label>{t("marketProfile.catalog.search")}
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("marketProfile.catalog.placeholder")} />
            </label>
            <div className={styles.twoColumns}>
              <label>{t("marketProfile.catalog.domain")}<select value={domainId} onChange={(event) => { setDomainId(event.target.value); setFamilyId(""); setQuery(""); }} disabled={Boolean(query)}>{props.catalog.domains.map((domain) => <option key={domain.domainId} value={domain.domainId}>{domain.preferredLabel}</option>)}</select></label>
              <label>{t("marketProfile.catalog.family")}<select value={effectiveFamilyId} onChange={(event) => { setFamilyId(event.target.value); setQuery(""); }} disabled={Boolean(query)}>{availableFamilies.map((family) => <option key={family.familyId} value={family.familyId}>{family.preferredLabel}</option>)}</select></label>
            </div>
            <div className={styles.catalogResults} role="group" aria-label={t("marketProfile.catalog.resultsLabel")}>
              {visibleCapabilities.map((capability) => <button key={capability.conceptId} type="button" aria-pressed={selectedCapabilityId === capability.conceptId} onClick={() => { setSelectedCapabilityId(capability.conceptId); setClaimSource({ kind: "manual" }); }}><strong>{capability.preferredLabel}</strong><span>{capability.domainLabel} · {capability.familyLabel}</span><small>{capability.definition}</small></button>)}
            </div>
          </section>

          {selectedCapability ? (
            <form className={styles.fullWidthSection} onSubmit={saveClaim}>
              <p className={styles.eyebrow}>{t("marketProfile.claim.eyebrow")}</p>
              <h3>{t("marketProfile.claim.title")}</h3>
              <div className={styles.selectionSummary}><strong>{selectedCapability.preferredLabel}</strong><span>{selectedCapability.domainLabel} → {selectedCapability.familyLabel}</span><p>{selectedCapability.definition}</p><StatusPill tone="neutral">{claimSource.kind === "interpretation" ? t("marketProfile.claim.confirmedSuggestion") : t("marketProfile.claim.manualSelection")}</StatusPill></div>
              <div className={styles.twoColumns}>
                <label>{t("marketProfile.claim.entityScope")}<select name="entityScope" defaultValue="reporting_entity"><option value="reporting_entity">{t("marketProfile.claim.reportingEntity")}</option><option value="legal_entity">{t("marketProfile.claim.legalEntity")}</option><option value="operating_segment">{t("marketProfile.claim.operatingSegment")}</option><option value="subsidiary">{t("marketProfile.claim.subsidiary")}</option><option value="brand">{t("marketProfile.claim.brand")}</option><option value="unknown">{t("marketProfile.common.notSpecified")}</option></select></label>
                <label>{t("marketProfile.common.visibility")}<select name="visibility" defaultValue="network"><option value="network">{t("marketProfile.common.network")}</option><option value="public">{t("marketProfile.common.public")}</option><option value="private">{t("marketProfile.common.private")}</option></select></label>
              </div>
              <fieldset><legend>{t("marketProfile.claim.marketRole")}</legend><div className={styles.checkGrid}>{props.marketRoles.map((role, index) => <label key={role.id}><input type="checkbox" name="marketRoleIds" value={role.id} defaultChecked={index === 2 || (props.marketRoles.length < 3 && index === 0)} /><span><strong>{role.label}</strong><small>{role.definition}</small></span></label>)}</div></fieldset>
              <fieldset><legend>{t("marketProfile.claim.deliveryRoles")}</legend><div className={styles.checkGrid}>{(["prime", "subcontractor", "supplier", "referral_partner"] as const).map((role) => <label key={role}><input type="checkbox" name="deliveryRoles" value={role} /><span>{t(`marketProfile.common.${role === "referral_partner" ? "referralPartner" : role}`)}</span></label>)}</div></fieldset>
              <fieldset><legend>{t("marketProfile.claim.serviceGeography")}</legend><div className={styles.checkGrid}>{props.serviceGeographies.map((geography) => <label key={geography.id}><input type="checkbox" name="serviceGeographyIds" value={geography.id} defaultChecked /><span>{geography.label}</span></label>)}</div></fieldset>
              <label>{t("marketProfile.claim.specialties")}<textarea name="specialties" placeholder={t("marketProfile.claim.specialtiesPlaceholder")} /></label>
              <AlertBanner title={t("marketProfile.claim.boundaryTitle")} tone="information">{t("marketProfile.claim.boundaryBody")}</AlertBanner>
              <div className={styles.formActions}><button className={styles.primaryButton} type="submit">{t("marketProfile.claim.save")}</button><button className={styles.quietButton} type="button" onClick={() => setSelectedCapabilityId("")}>{t("marketProfile.common.cancel")}</button></div>
            </form>
          ) : null}

          <section className={styles.fullWidthSection} aria-labelledby="confirmed-claims-title">
            <h3 id="confirmed-claims-title">{t("marketProfile.confirmed.title")}</h3>
            {props.snapshot.claims.length ? <ul className={styles.recordList}>{props.snapshot.claims.map((claim) => <li key={claim.id}><div><strong>{claim.labelSnapshot}</strong><span>{claim.domainLabelSnapshot} → {claim.familyLabelSnapshot}</span></div><div><StatusPill tone="connection">{t("marketProfile.common.organizationClaimed")}</StatusPill><StatusPill tone="neutral">{t(`marketProfile.common.${claim.visibility}`)}</StatusPill></div></li>)}</ul> : <StatePanel state="empty" title={t("marketProfile.confirmed.emptyTitle")}>{t("marketProfile.confirmed.emptyBody")}</StatePanel>}
          </section>

          <form className={styles.fullWidthSection} onSubmit={saveProvisional}>
            <details><summary>{t("marketProfile.provisional.summary")}</summary><div className={styles.detailsBody}><p>{t("marketProfile.provisional.body")}</p><label>{t("marketProfile.provisional.term")}<input name="proposedLabel" required /></label><label>{t("marketProfile.provisional.definition")}<textarea name="proposedDefinition" minLength={20} required /></label><label>{t("marketProfile.provisional.example")}<textarea name="exampleWork" minLength={10} required /></label><label>{t("marketProfile.provisional.domain")}<select name="suggestedDomainId" defaultValue=""><option value="">{t("marketProfile.provisional.notSure")}</option>{props.catalog.domains.map((domain) => <option key={domain.domainId} value={domain.domainId}>{domain.preferredLabel}</option>)}</select></label><button className={styles.primaryButton} type="submit">{t("marketProfile.provisional.submit")}</button></div></details>
            {props.snapshot.provisionalTerms.length ? <p className={styles.help}>{t(props.snapshot.provisionalTerms.length === 1 ? "marketProfile.provisional.countOne" : "marketProfile.provisional.countMany", { count: new Intl.NumberFormat(locale).format(props.snapshot.provisionalTerms.length) })}</p> : null}
          </form>
        </div>
      ) : null}

      {tab === "industry" ? (
        <form className={styles.singleForm} onSubmit={saveIndustry}>
          <h3>{t("marketProfile.industry.title")}</h3><p>{t("marketProfile.industry.body")}</p>
          <label>{t("marketProfile.industry.industries")}<textarea name="industries" defaultValue={props.snapshot.industry?.industries.map((item) => item.label).join("\n") ?? ""} /></label>
          <div className={styles.threeColumns}><label>{t("marketProfile.industry.code")}<input name="naicsCode" inputMode="numeric" pattern="[0-9]{2,6}" defaultValue={props.snapshot.industry?.naics[0]?.code ?? ""} /></label><label>{t("marketProfile.industry.naicsTitle")}<input name="naicsTitle" defaultValue={props.snapshot.industry?.naics[0]?.title ?? ""} /></label><label>{t("marketProfile.industry.version")}<input name="naicsVersion" defaultValue={props.snapshot.industry?.naics[0]?.version ?? "2022"} /></label></div>
          <label>{t("marketProfile.common.visibility")}<select name="visibility" defaultValue={props.snapshot.industry?.industries[0]?.visibility ?? "network"}><option value="network">{t("marketProfile.common.network")}</option><option value="public">{t("marketProfile.common.public")}</option><option value="private">{t("marketProfile.common.private")}</option></select></label>
          <AlertBanner title={t("marketProfile.industry.boundaryTitle")} tone="information">{t("marketProfile.industry.boundaryBody")}</AlertBanner>
          <button className={styles.primaryButton} type="submit">{t("marketProfile.industry.save")}</button>
        </form>
      ) : null}

      {tab === "experience" ? (
        <div className={styles.sectionGrid}>
          <form className={styles.fullWidthSection} onSubmit={saveExperience}>
            <h3>{t("marketProfile.experience.title")}</h3><p>{t("marketProfile.experience.body")}</p>
            <div className={styles.twoColumns}><label>{t("marketProfile.experience.projectTitle")}<input name="title" required /></label><label>{t("marketProfile.experience.role")}<input name="role" required placeholder={t("marketProfile.experience.rolePlaceholder")} /></label></div>
            <label>{t("marketProfile.experience.summary")}<textarea name="summary" minLength={20} required /></label>
            <div className={styles.threeColumns}><label>{t("marketProfile.experience.customer")}<input name="customerOrSector" /></label><label>{t("marketProfile.experience.contractType")}<input name="contractType" /></label><label>{t("marketProfile.experience.location")}<input name="location" /></label></div>
            <div className={styles.threeColumns}><label>{t("marketProfile.experience.started")}<input name="startedOn" type="date" /></label><label>{t("marketProfile.experience.ended")}<input name="endedOn" type="date" /></label><label>{t("marketProfile.experience.value")}<input name="exactDollars" inputMode="decimal" /></label></div>
            <label className={styles.inlineCheck}><input type="checkbox" name="discloseValue" /> {t("marketProfile.experience.disclose")}</label>
            <div className={styles.twoColumns}><label>{t("marketProfile.experience.outputs")}<textarea name="outputs" /></label><label>{t("marketProfile.experience.outcomes")}<textarea name="outcomes" /></label></div>
            {props.snapshot.claims.length ? <fieldset><legend>{t("marketProfile.experience.related")}</legend><div className={styles.checkGrid}>{props.snapshot.claims.map((claim) => <label key={claim.id}><input type="checkbox" name="supportingCapabilityClaimIds" value={claim.id} /><span>{claim.labelSnapshot}</span></label>)}</div></fieldset> : null}
            <label>{t("marketProfile.common.visibility")}<select name="visibility" defaultValue="private"><option value="private">{t("marketProfile.common.private")}</option><option value="network">{t("marketProfile.common.network")}</option><option value="public">{t("marketProfile.common.public")}</option></select></label>
            <AlertBanner title={t("marketProfile.experience.boundaryTitle")} tone="information">{t("marketProfile.experience.boundaryBody")}</AlertBanner>
            <button className={styles.primaryButton} type="submit">{t("marketProfile.experience.save")}</button>
          </form>
          <section className={styles.fullWidthSection}><h3>{t("marketProfile.experience.recorded")}</h3>{props.snapshot.pastPerformance.length ? <ul className={styles.recordList}>{props.snapshot.pastPerformance.map((item) => <li key={item.id}><div><strong>{item.title}</strong><span>{item.role} · {item.customerOrSector ?? t("marketProfile.experience.customerUndisclosed")}</span></div><div><StatusPill tone="neutral">{t("marketProfile.common.selfReported")}</StatusPill><StatusPill tone="neutral">{t(`marketProfile.common.${item.visibility}`)}</StatusPill></div></li>)}</ul> : <StatePanel state="empty" title={t("marketProfile.experience.emptyTitle")}>{t("marketProfile.experience.emptyBody")}</StatePanel>}</section>
        </div>
      ) : null}

      {tab === "preferences" ? (
        <form className={styles.singleForm} onSubmit={savePreferences}>
          <h3>{t("marketProfile.preferences.title")}</h3><p>{t("marketProfile.preferences.body")}</p>
          <fieldset><legend>{t("marketProfile.preferences.deliveryRoles")}</legend><div className={styles.checkGrid}>{(["prime", "subcontractor", "supplier", "referral_partner"] as const).map((role) => <label key={role}><input type="checkbox" name="deliveryRoleInterests" value={role} defaultChecked={props.snapshot.preferences?.deliveryRoleInterests.includes(role)} /><span>{t(`marketProfile.common.${role === "referral_partner" ? "referralPartner" : role}`)}</span></label>)}</div></fieldset>
          <div className={styles.twoColumns}><label>{t("marketProfile.preferences.team")}<textarea name="teamPreferences" defaultValue={props.snapshot.preferences?.teamPreferences.join("\n") ?? ""} /></label><label>{t("marketProfile.preferences.referral")}<textarea name="referralPreferences" defaultValue={props.snapshot.preferences?.referralPreferences.join("\n") ?? ""} /></label></div>
          <label>{t("marketProfile.preferences.resources")}<textarea name="resourceNeeds" defaultValue={props.snapshot.preferences?.resourceNeeds.join("\n") ?? ""} /></label>
          <div className={styles.twoColumns}><label>{t("marketProfile.preferences.contact")}<select name="contactPreference" defaultValue={props.snapshot.preferences?.contactPreference ?? "organization_contact"}><option value="organization_contact">{t("marketProfile.preferences.organizationContact")}</option><option value="member_contact">{t("marketProfile.preferences.memberContact")}</option><option value="structured_intake">{t("marketProfile.preferences.structuredIntake")}</option></select></label><label>{t("marketProfile.common.visibility")}<select name="visibility" defaultValue={props.snapshot.preferences?.visibility ?? "network"}><option value="network">{t("marketProfile.common.network")}</option><option value="public">{t("marketProfile.common.public")}</option><option value="private">{t("marketProfile.common.private")}</option></select></label></div>
          <label>{t("marketProfile.preferences.notes")}<textarea name="intakeNotes" defaultValue={props.snapshot.preferences?.intakeNotes ?? ""} /></label>
          <button className={styles.primaryButton} type="submit">{t("marketProfile.preferences.save")}</button>
        </form>
      ) : null}
    </section>
  );
}
