"use client";

import { useCallback, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { ExchangeHomeMarker } from "../map/ExchangeSpatialScene";
import { MapboxLocalityCanvas, type ControlledLocalityPointOverlay } from "../map/MapboxLocalityCanvas";
import type {
  OrganizationAdditionalLocation,
  OrganizationCredential,
  OrganizationProfileAsset,
  PublicOrganizationAdditionalLocation,
} from "../../domain/organization-enrichment/model";
import { useI18n } from "../i18n/I18nProvider";
import { WorkflowExplainer } from "../network-education/WorkflowExplainer";

import styles from "./OrganizationEnrichmentPanel.module.css";

type Snapshot = Readonly<{
  credentials: readonly OrganizationCredential[];
  profileAssets: readonly OrganizationProfileAsset[];
  additionalLocations: readonly OrganizationAdditionalLocation[];
  mapAdditionalLocations: readonly (PublicOrganizationAdditionalLocation & Readonly<{ coordinate: readonly [number, number] }>)[];
}>;

type Candidate = Readonly<{ id: string; matchedAddress: string; coordinate: readonly [number, number]; quality: string }>;
type Draft = Readonly<{ id: string; candidates: readonly Candidate[] }>;
const ENRICHMENT_TABS = ["credentials", "media", "locations"] as const;
type EnrichmentTab = (typeof ENRICHMENT_TABS)[number];

function commandId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function lines(value: string): readonly string[] {
  return value.split(/[\n,]/).map((entry) => entry.trim()).filter(Boolean);
}

async function postJson(body: Readonly<Record<string, unknown>>) {
  const response = await fetch("/api/organization-enrichment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "The update could not be saved.");
  return payload;
}

export function OrganizationEnrichmentPanel(props: Readonly<{
  organizationId: string;
  snapshot: Snapshot;
  mapModel: ControlledLocalityMapModel | null;
  homeMarker: ExchangeHomeMarker | null;
}>) {
  const { t } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<EnrichmentTab>("credentials");
  const [notice, setNotice] = useState<Readonly<{ tone: "success" | "error"; text: string }> | null>(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const valueLabel = useCallback((value: string) => t(`organizationEnrichment.values.${value}`), [t]);

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, current: EnrichmentTab) {
    const currentIndex = ENRICHMENT_TABS.indexOf(current);
    const nextIndex = event.key === "ArrowRight" ? (currentIndex + 1) % ENRICHMENT_TABS.length
      : event.key === "ArrowLeft" ? (currentIndex - 1 + ENRICHMENT_TABS.length) % ENRICHMENT_TABS.length
        : event.key === "Home" ? 0 : event.key === "End" ? ENRICHMENT_TABS.length - 1 : null;
    if (nextIndex === null) return;
    event.preventDefault();
    const next = ENRICHMENT_TABS[nextIndex];
    setTab(next);
    document.getElementById(`organization-enrichment-tab-${next}`)?.focus();
  }

  const overlays = useMemo<readonly ControlledLocalityPointOverlay[]>(() => {
    const primary = props.homeMarker ? [{
      id: props.homeMarker.id,
      position: props.homeMarker.coordinate,
      label: props.homeMarker.label,
      kind: "organization-marker" as const,
      privacyLabel: props.homeMarker.accessibleLocationLabel,
      activated: true,
    }] : [];
    const satellites = props.snapshot.mapAdditionalLocations.map((location) => ({
      id: location.id,
      position: location.coordinate,
      label: `${location.label} · ${t("organizationEnrichment.locations.satellite")}`,
      kind: "subordinate-location" as const,
      privacyLabel: `${valueLabel(location.visibility)} · ${location.localityName}`,
    }));
    return Object.freeze([...primary, ...satellites]);
  }, [props.homeMarker, props.snapshot.mapAdditionalLocations, t, valueLabel]);

  async function mutate(action: string, input: Record<string, unknown>, prefix: string) {
    setBusy(true);
    setNotice(null);
    try {
      const result = await postJson({ organizationId: props.organizationId, commandId: commandId(prefix), action, input });
      setNotice({ tone: "success", text: t("organizationEnrichment.common.saved") });
      router.refresh();
      return result;
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : t("organizationEnrichment.common.error") });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function saveCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await mutate("upsert-credential", {
      id: commandId("credential"), kind: String(data.get("kind") ?? "certification"),
      label: String(data.get("label") ?? ""), issuer: String(data.get("issuer") ?? ""),
      identifierValue: String(data.get("identifierValue") ?? "") || null,
      issuedOn: String(data.get("issuedOn") ?? "") || null,
      effectiveOn: String(data.get("effectiveOn") ?? "") || null,
      expiresOn: String(data.get("expiresOn") ?? "") || null,
      sourceLabel: String(data.get("sourceLabel") ?? "Organization record"),
      sourceUrl: String(data.get("sourceUrl") ?? "") || null,
      evidenceAssetIds: lines(String(data.get("evidenceAssetIds") ?? "")),
      visibility: String(data.get("visibility") ?? "private"),
    }, "credential_upsert");
    if (result) form.reset();
  }

  async function uploadAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("organizationId", props.organizationId);
    data.set("commandId", commandId("asset_upload"));
    setBusy(true);
    setNotice(null);
    try {
      const response = await fetch("/api/organization-enrichment", { method: "POST", body: data });
      const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
      if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : t("organizationEnrichment.common.error"));
      form.reset();
      setNotice({ tone: "success", text: t("organizationEnrichment.media.uploaded") });
      router.refresh();
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof Error ? error.message : t("organizationEnrichment.common.error") });
    } finally {
      setBusy(false);
    }
  }

  async function beginLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await mutate("begin-additional-location", {
      id: commandId("additional_location"), label: String(data.get("label") ?? ""),
      physicalAddress: {
        addressLine1: String(data.get("addressLine1") ?? ""), addressLine2: String(data.get("addressLine2") ?? "") || null,
        locality: String(data.get("locality") ?? ""), regionCode: String(data.get("regionCode") ?? ""),
        postalCode: String(data.get("postalCode") ?? ""), countryCode: "US",
      },
      isHomeOrPrivate: data.get("isHomeOrPrivate") === "on",
      visibility: String(data.get("visibility") ?? "locality-only"),
    }, "additional_location_begin");
    if (result && result.draft && typeof result.draft === "object") setDraft(result.draft as Draft);
  }

  return (
    <section className={styles.workspace} aria-labelledby="organization-enrichment-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t("organizationEnrichment.header.eyebrow")}</p>
          <h2 id="organization-enrichment-title">{t("organizationEnrichment.header.title")}</h2>
          <p>{t("organizationEnrichment.header.body")}</p>
        </div>
        <span className={styles.boundary}>{t("organizationEnrichment.header.boundary")}</span>
      </header>

      {notice ? <div className={styles.notice} data-tone={notice.tone} role={notice.tone === "error" ? "alert" : "status"}>{notice.text}</div> : null}

      <div className={styles.tabs} role="tablist" aria-label={t("organizationEnrichment.tabs.label")}>
        {ENRICHMENT_TABS.map((value) => (
          <button key={value} id={`organization-enrichment-tab-${value}`} type="button" role="tab"
            aria-controls={`organization-enrichment-panel-${value}`} aria-selected={tab === value}
            tabIndex={tab === value ? 0 : -1} onClick={() => setTab(value)} onKeyDown={(event) => moveTab(event, value)}>
            {t(`organizationEnrichment.tabs.${value}`)}
          </button>
        ))}
      </div>

      {tab === "credentials" ? (
        <div className={styles.sectionGrid} id="organization-enrichment-panel-credentials" role="tabpanel" aria-labelledby="organization-enrichment-tab-credentials">
          <form className={styles.form} onSubmit={saveCredential}>
            <h3>{t("organizationEnrichment.credentials.add")}</h3>
            <p>{t("organizationEnrichment.credentials.boundary")}</p>
            <WorkflowExplainer explainerKey="credential-evidence" />
            <label>{t("organizationEnrichment.credentials.kind")}<select name="kind" defaultValue="certification">
              <option value="certification">{valueLabel("certification")}</option><option value="license">{valueLabel("license")}</option>
              <option value="uei">{valueLabel("uei")}</option><option value="cage">{valueLabel("cage")}</option>
              <option value="sam_registration">{valueLabel("sam_registration")}</option><option value="other_identifier">{valueLabel("other_identifier")}</option>
            </select></label>
            <label>{t("organizationEnrichment.credentials.label")}<input name="label" required maxLength={240} /></label>
            <label>{t("organizationEnrichment.credentials.issuer")}<input name="issuer" required maxLength={240} /></label>
            <label>{t("organizationEnrichment.credentials.identifier")}<input name="identifierValue" maxLength={240} /></label>
            <div className={styles.threeColumns}>
              <label>{t("organizationEnrichment.credentials.issued")}<input name="issuedOn" type="date" /></label>
              <label>{t("organizationEnrichment.credentials.effective")}<input name="effectiveOn" type="date" /></label>
              <label>{t("organizationEnrichment.credentials.expires")}<input name="expiresOn" type="date" /></label>
            </div>
            <label>{t("organizationEnrichment.credentials.source")}<input name="sourceLabel" required defaultValue="Organization record" maxLength={240} /></label>
            <label>{t("organizationEnrichment.credentials.sourceUrl")}<input name="sourceUrl" type="url" maxLength={2048} /></label>
            <label>{t("organizationEnrichment.credentials.evidence")}<textarea name="evidenceAssetIds" rows={2} /></label>
            <label>{t("organizationEnrichment.common.visibility")}<select name="visibility" defaultValue="private"><option value="private">{valueLabel("private")}</option><option value="network">{valueLabel("network")}</option><option value="public">{valueLabel("public")}</option></select></label>
            <button type="submit" disabled={busy}>{busy ? t("organizationEnrichment.common.saving") : t("organizationEnrichment.credentials.save")}</button>
          </form>
          <div className={styles.records}>
            <h3>{t("organizationEnrichment.credentials.recorded")}</h3>
            {props.snapshot.credentials.filter((record) => record.status !== "retired").length ? props.snapshot.credentials.filter((record) => record.status !== "retired").map((record) => (
              <article key={record.id} className={styles.record}>
                <div><strong>{record.label}</strong><span>{record.issuer} · {valueLabel(record.status)} · {valueLabel(record.visibility)}</span></div>
                <p>{record.identifierValue || t("organizationEnrichment.credentials.noIdentifier")}</p>
                <button type="button" className={styles.quiet} disabled={busy} onClick={() => void mutate("retire-credential", { id: record.id }, "credential_retire")}>{t("organizationEnrichment.common.retire")}</button>
              </article>
            )) : <p className={styles.empty}>{t("organizationEnrichment.credentials.empty")}</p>}
          </div>
        </div>
      ) : null}

      {tab === "media" ? (
        <div className={styles.sectionGrid} id="organization-enrichment-panel-media" role="tabpanel" aria-labelledby="organization-enrichment-tab-media">
          <form className={styles.form} onSubmit={uploadAsset}>
            <h3>{t("organizationEnrichment.media.add")}</h3>
            <p>{t("organizationEnrichment.media.boundary")}</p>
            <WorkflowExplainer explainerKey="media-visibility" />
            <label>{t("organizationEnrichment.media.kind")}<select name="kind" defaultValue="image"><option value="logo">{valueLabel("logo")}</option><option value="image">{valueLabel("image")}</option><option value="portfolio">{valueLabel("portfolio")}</option><option value="document">{valueLabel("document")}</option></select></label>
            <label>{t("organizationEnrichment.media.title")}<input name="title" required maxLength={240} /></label>
            <label>{t("organizationEnrichment.media.description")}<textarea name="description" rows={3} maxLength={2000} /></label>
            <label>{t("organizationEnrichment.media.alt")}<input name="altText" maxLength={300} /></label>
            <label>{t("organizationEnrichment.media.file")}<input name="file" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" /></label>
            <button type="submit" disabled={busy}>{busy ? t("organizationEnrichment.common.saving") : t("organizationEnrichment.media.upload")}</button>
          </form>
          <div className={styles.records}>
            <h3>{t("organizationEnrichment.media.recorded")}</h3>
            {props.snapshot.profileAssets.filter((record) => record.publicationStatus !== "retired").length ? props.snapshot.profileAssets.filter((record) => record.publicationStatus !== "retired").map((record) => (
              <article key={record.id} className={styles.record}>
                <div><strong>{record.title}</strong><span>{valueLabel(record.kind)} · {valueLabel(record.publicationStatus)}</span></div>
                <p>{record.description || t("organizationEnrichment.media.noDescription")}</p>
                <div className={styles.actions}>
                  <button type="button" className={styles.quiet} disabled={busy} onClick={() => void mutate("set-asset-publication", { id: record.id, publish: record.publicationStatus !== "published" }, "asset_publish")}>{record.publicationStatus === "published" ? t("organizationEnrichment.common.unpublish") : t("organizationEnrichment.common.publish")}</button>
                  {record.publicationStatus === "published" ? <a href={`/api/organization-enrichment/assets/${encodeURIComponent(record.id)}`} target="_blank" rel="noreferrer">{t("organizationEnrichment.media.view")}</a> : null}
                  <button type="button" className={styles.quiet} disabled={busy} onClick={() => void mutate("retire-asset", { id: record.id }, "asset_retire")}>{t("organizationEnrichment.common.retire")}</button>
                </div>
              </article>
            )) : <p className={styles.empty}>{t("organizationEnrichment.media.empty")}</p>}
          </div>
        </div>
      ) : null}

      {tab === "locations" ? (
        <div className={styles.locations} id="organization-enrichment-panel-locations" role="tabpanel" aria-labelledby="organization-enrichment-tab-locations">
          <div className={styles.sectionGrid}>
            <form className={styles.form} onSubmit={beginLocation}>
              <h3>{t("organizationEnrichment.locations.add")}</h3>
              <WorkflowExplainer explainerKey="additional-location" />
              <p>{t("organizationEnrichment.locations.boundary")}</p>
              <label>{t("organizationEnrichment.locations.label")}<input name="label" required maxLength={160} /></label>
              <label>{t("organizationEnrichment.locations.address1")}<input name="addressLine1" required /></label>
              <label>{t("organizationEnrichment.locations.address2")}<input name="addressLine2" /></label>
              <div className={styles.threeColumns}><label>{t("organizationEnrichment.locations.locality")}<input name="locality" required /></label><label>{t("organizationEnrichment.locations.region")}<input name="regionCode" required maxLength={2} /></label><label>{t("organizationEnrichment.locations.postal")}<input name="postalCode" required /></label></div>
              <label>{t("organizationEnrichment.common.visibility")}<select name="visibility" defaultValue="locality-only"><option value="exact">{valueLabel("exact")}</option><option value="approximate">{valueLabel("approximate")}</option><option value="locality-only">{valueLabel("locality-only")}</option></select></label>
              <label className={styles.check}><input name="isHomeOrPrivate" type="checkbox" />{t("organizationEnrichment.locations.privateAddress")}</label>
              <button type="submit" disabled={busy}>{busy ? t("organizationEnrichment.common.saving") : t("organizationEnrichment.locations.check")}</button>
            </form>
            <div className={styles.records}>
              <h3>{t("organizationEnrichment.locations.recorded")}</h3>
              {props.snapshot.additionalLocations.filter((record) => record.lifecycleStatus === "active").length ? props.snapshot.additionalLocations.filter((record) => record.lifecycleStatus === "active").map((record) => (
                <article key={record.id} className={styles.record}>
                  <div><strong>{record.label}</strong><span>{valueLabel(record.visibility)} · {valueLabel(record.publicationStatus)}</span></div>
                  <p>{record.physicalAddress.locality}, {record.physicalAddress.regionCode} · {record.geocodeProvenance.provider}</p>
                  <div className={styles.actions}>
                    <button type="button" className={styles.quiet} disabled={busy} onClick={() => void mutate("set-location-publication", { id: record.id, publish: record.publicationStatus !== "published" }, "location_publish")}>{record.publicationStatus === "published" ? t("organizationEnrichment.common.unpublish") : t("organizationEnrichment.common.publish")}</button>
                    <button type="button" className={styles.quiet} disabled={busy} onClick={() => void mutate("retire-additional-location", { id: record.id }, "location_retire")}>{t("organizationEnrichment.common.retire")}</button>
                  </div>
                </article>
              )) : <p className={styles.empty}>{t("organizationEnrichment.locations.empty")}</p>}
            </div>
          </div>
          {draft ? <section className={styles.candidates} aria-labelledby="additional-location-candidates"><h3 id="additional-location-candidates">{t("organizationEnrichment.locations.confirm")}</h3>{draft.candidates.map((candidate) => <button type="button" key={candidate.id} disabled={busy} onClick={() => void mutate("confirm-additional-location", { draftId: draft.id, candidateId: candidate.id }, "location_confirm").then((result) => { if (result) setDraft(null); })}><strong>{candidate.matchedAddress}</strong><span>{valueLabel(candidate.quality)}</span></button>)}</section> : null}
          {props.mapModel ? <div className={styles.map}><MapboxLocalityCanvas model={props.mapModel} initialZoom="focus" pointOverlays={overlays} /><p>{t("organizationEnrichment.locations.mapHelp")}</p></div> : null}
        </div>
      ) : null}
    </section>
  );
}
