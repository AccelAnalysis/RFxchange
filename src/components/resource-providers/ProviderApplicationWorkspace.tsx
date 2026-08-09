"use client";

import { useState, type FormEvent } from "react";

import { PROVIDER_CATEGORIES, PROVIDER_MODALITIES, type OfficialResourceProviderApplication, type OfficialResourceProviderStatus, type ProviderApplicationEvent, type ProviderServiceProfile } from "../../domain/resource-providers/model";
import { useI18n } from "../i18n/I18nProvider";
import { WorkflowExplainer } from "../network-education/WorkflowExplainer";
import { OperationalWorkspace, ParticipantShell } from "../participant/ParticipantWorkspace";

import styles from "./ProviderApplicationWorkspace.module.css";

interface ProviderSnapshot {
  readonly organization: Readonly<{ id: string; displayName: string; profileId: string; website: { readonly disposition: string; readonly url: string | null } | null; primaryContact: { readonly displayName: string; readonly email: string } | null; locationId: string; serviceGeographyId: string }>;
  readonly application: OfficialResourceProviderApplication | null;
  readonly providerStatus: OfficialResourceProviderStatus | null;
  readonly serviceProfile: ProviderServiceProfile | null;
  readonly history: readonly ProviderApplicationEvent[];
}

function readable(value: string): string { return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function commandId(): string { return crypto.randomUUID(); }

export function ProviderApplicationWorkspace({ initialSnapshot }: Readonly<{ initialSnapshot: ProviderSnapshot }>) {
  const { t } = useI18n();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function request(body: Record<string, unknown>) {
    setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/provider-applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, commandId: commandId() }) });
      const result = await response.json() as Record<string, unknown>;
      if (!response.ok) throw new Error(String(result.error ?? t("resourceProviderWorkspace.states.error")));
      const refreshed = await fetch("/api/provider-applications", { cache: "no-store" });
      if (!refreshed.ok) throw new Error(t("resourceProviderWorkspace.states.error"));
      setSnapshot(await refreshed.json() as ProviderSnapshot);
      setNotice(body.action === "save-draft" ? t("resourceProviderWorkspace.states.saved") : body.action === "submitted" ? t("resourceProviderWorkspace.states.submitted") : body.action === "resubmitted" ? t("resourceProviderWorkspace.states.resubmitted") : t("resourceProviderWorkspace.states.updated"));
    } catch (error) { setNotice(error instanceof Error ? error.message : t("resourceProviderWorkspace.states.error")); }
    finally { setBusy(false); }
  }

  function applicationPayload(form: HTMLFormElement) {
    const data = new FormData(form);
    return {
      categories: data.getAll("categories").map(String), otherCategoryDescription: String(data.get("otherCategoryDescription") ?? ""),
      services: [{ id: snapshot.application?.content.services[0]?.id ?? "service-1", name: String(data.get("serviceName") ?? ""), description: String(data.get("serviceDescription") ?? ""), availability: String(data.get("serviceAvailability") ?? "unknown"), capacityNote: String(data.get("capacityNote") ?? "") }],
      populationsServed: String(data.get("populationsServed") ?? ""), eligibility: String(data.get("eligibility") ?? ""), intakeMethod: String(data.get("intakeMethod") ?? ""), modalities: data.getAll("modalities").map(String), languages: String(data.get("languages") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
      officialContact: { displayName: String(data.get("contactName") ?? ""), roleTitle: String(data.get("contactRole") ?? ""), email: String(data.get("contactEmail") ?? ""), phone: String(data.get("contactPhone") ?? "") },
      evidenceAssetIds: String(data.get("evidenceAssetIds") ?? "").split(",").map((value) => value.trim()).filter(Boolean), authorityAttested: data.get("authorityAttested") === "on", response: String(data.get("response") ?? ""),
      availability: String(data.get("providerAvailability") ?? "unknown"),
    };
  }

  function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void request({ action: snapshot.providerStatus ? "update-profile" : "save-draft", expectedVersion: snapshot.providerStatus ? snapshot.serviceProfile?.version : snapshot.application?.version ?? null, ...applicationPayload(event.currentTarget) }); }
  const source = snapshot.serviceProfile ?? snapshot.application?.content;
  const firstService = source?.services[0];

  return (
    <ParticipantShell activeItem="Account">
      <OperationalWorkspace ariaLabel={t("resourceProviderWorkspace.title")} className={styles.workspace}>
        <header className={styles.hero}>
          <div><p>{t("resourceProviderWorkspace.eyebrow")}</p><h1>{t("resourceProviderWorkspace.title")}</h1><span>{t("resourceProviderWorkspace.intro")}</span></div>
          <div className={styles.status} role="status"><small>Current stage</small><strong>{snapshot.application ? readable(snapshot.application.status) : "Not started"}</strong>{snapshot.providerStatus ? <em>Official Resource Provider</em> : null}</div>
        </header>
        <p className={styles.boundary}>{t("resourceProviderWorkspace.boundary")}</p>

        <div className={styles.grid}>
          <section className={styles.card} aria-labelledby="authoritative-heading">
            <h2 id="authoritative-heading">{t("resourceProviderWorkspace.authoritative")}</h2>
            <dl><div><dt>Organization</dt><dd>{snapshot.organization.displayName}</dd></div><div><dt>Profile</dt><dd>{snapshot.organization.profileId}</dd></div><div><dt>Authoritative website</dt><dd>{snapshot.organization.website?.url ?? snapshot.organization.website?.disposition ?? "Unavailable"}</dd></div><div><dt>Primary contact</dt><dd>{snapshot.organization.primaryContact ? `${snapshot.organization.primaryContact.displayName} · ${snapshot.organization.primaryContact.email}` : "Unavailable"}</dd></div><div><dt>Confirmed location</dt><dd>{snapshot.organization.locationId}</dd></div><div><dt>Service geography</dt><dd>{snapshot.organization.serviceGeographyId}</dd></div></dl>
            <p>These records remain managed in the organization profile. This application references them; it does not create a second identity.</p>
          </section>

          <section className={`${styles.card} ${styles.formCard}`} aria-labelledby="application-heading">
            <h2 id="application-heading">{snapshot.providerStatus ? t("resourceProviderWorkspace.profile") : t("resourceProviderWorkspace.application")}</h2>
            {snapshot.application && !["draft", "information-requested", "approved", "denied"].includes(snapshot.application.status) ? (
              <div className={styles.readOnly}><strong>{readable(snapshot.application.status)}</strong><p>Your submitted values are preserved while an authorized administrator reviews them.</p></div>
            ) : (
              <form onSubmit={save}>
                <WorkflowExplainer explainerKey="provider-application" />
                <fieldset><legend>{t("resourceProviderWorkspace.fields.categories")} <span>Required · choose all that apply</span></legend><div className={styles.checkGrid}>{PROVIDER_CATEGORIES.map((category) => <label key={category}><input type="checkbox" name="categories" value={category} defaultChecked={source?.categories.includes(category)} />{t(`resourceProviderWorkspace.categories.${category}`)}</label>)}</div></fieldset>
                <label>{t("resourceProviderWorkspace.fields.other")}<textarea name="otherCategoryDescription" defaultValue={snapshot.application?.content.otherCategoryDescription ?? ""} /></label>
                <div className={styles.two}><label>{t("resourceProviderWorkspace.fields.serviceName")}<input name="serviceName" required defaultValue={firstService?.name ?? ""} /></label><label>Service availability<select name="serviceAvailability" defaultValue={firstService?.availability ?? "unknown"}><option value="unknown">Unknown</option><option value="available">Available</option><option value="limited">Limited</option><option value="unavailable">Unavailable</option></select></label></div>
                <label>{t("resourceProviderWorkspace.fields.serviceDescription")}<textarea name="serviceDescription" required defaultValue={firstService?.description ?? ""} /></label>
                <label>{t("resourceProviderWorkspace.fields.capacityNote")}<textarea name="capacityNote" defaultValue={firstService?.capacityNote ?? ""} /></label>
                <label>{t("resourceProviderWorkspace.fields.served")}<textarea name="populationsServed" required defaultValue={source?.populationsServed ?? ""} /></label>
                <div className={styles.two}><label>{t("resourceProviderWorkspace.fields.eligibility")}<textarea name="eligibility" required defaultValue={source?.eligibility ?? ""} /></label><label>{t("resourceProviderWorkspace.fields.intake")}<textarea name="intakeMethod" required defaultValue={source?.intakeMethod ?? ""} /></label></div>
                <fieldset><legend>{t("resourceProviderWorkspace.fields.modality")}</legend><div className={styles.inlineChecks}>{PROVIDER_MODALITIES.map((modality) => <label key={modality}><input type="checkbox" name="modalities" value={modality} defaultChecked={source?.modalities.includes(modality)} />{readable(modality)}</label>)}</div></fieldset>
                <label>{t("resourceProviderWorkspace.fields.languages")} <span>Comma separated</span><input name="languages" required defaultValue={source?.languages.join(", ") ?? ""} /></label>
                {snapshot.providerStatus ? <label>{t("resourceProviderWorkspace.fields.availability")}<select name="providerAvailability" defaultValue={snapshot.serviceProfile?.availability ?? "unknown"}><option value="unknown">Unknown</option><option value="available">Available</option><option value="limited">Limited</option><option value="unavailable">Unavailable</option></select></label> : null}
                <div className={styles.two}><label>{t("resourceProviderWorkspace.fields.contactName")}<input name="contactName" required defaultValue={source?.officialContact.displayName ?? ""} /></label><label>{t("resourceProviderWorkspace.fields.contactRole")}<input name="contactRole" required defaultValue={source?.officialContact.roleTitle ?? ""} /></label><label>{t("resourceProviderWorkspace.fields.contactEmail")}<input name="contactEmail" type="email" required defaultValue={source?.officialContact.email ?? ""} /></label><label>{t("resourceProviderWorkspace.fields.contactPhone")}<input name="contactPhone" defaultValue={source?.officialContact.phone ?? ""} /></label></div>
                {!snapshot.providerStatus ? <label>{t("resourceProviderWorkspace.fields.evidence")} <span>{t("resourceProviderWorkspace.fields.evidenceHint")}</span><input name="evidenceAssetIds" defaultValue={snapshot.application?.content.evidenceAssetIds.join(", ") ?? ""} /></label> : null}
                {snapshot.application?.status === "information-requested" ? <div className={styles.request}><strong>Information requested</strong><p>{snapshot.application.informationRequest}</p><label>{t("resourceProviderWorkspace.fields.response")}<textarea name="response" required defaultValue={snapshot.application.applicantResponse ?? ""} /></label></div> : null}
                <label className={styles.attestation}><input type="checkbox" name="authorityAttested" required defaultChecked={snapshot.application?.content.authorityAttested ?? false} />{t("resourceProviderWorkspace.fields.attestation")}</label>
                <div className={styles.actions}><button type="submit" disabled={busy}>{busy ? t("resourceProviderWorkspace.states.saving") : snapshot.providerStatus ? t("resourceProviderWorkspace.actions.update") : t("resourceProviderWorkspace.actions.save")}</button>{snapshot.application?.status === "draft" ? <button type="button" disabled={busy} onClick={() => void request({ action: "submitted", expectedVersion: snapshot.application?.version })}>{t("resourceProviderWorkspace.actions.submit")}</button> : null}{snapshot.application?.status === "information-requested" && snapshot.application.applicantResponse ? <button type="button" disabled={busy} onClick={() => void request({ action: "resubmitted", expectedVersion: snapshot.application?.version })}>{t("resourceProviderWorkspace.actions.resubmit")}</button> : null}</div>
              </form>
            )}
            {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
          </section>

          <section className={styles.card} aria-labelledby="history-heading"><h2 id="history-heading">{t("resourceProviderWorkspace.history")}</h2>{snapshot.history.length ? <ol className={styles.history}>{[...snapshot.history].reverse().map((event) => <li key={String(event.id)}><strong>{readable(event.kind)}</strong><span>{new Date(event.occurredAt).toLocaleString()} · {event.actorKind}</span>{event.note ? <p>{event.note}</p> : null}</li>)}</ol> : <p>{t("resourceProviderWorkspace.emptyHistory")}</p>}</section>
        </div>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
