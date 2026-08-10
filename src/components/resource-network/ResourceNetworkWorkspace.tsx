"use client";

import { useMemo, useRef, useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { ProviderDiscoveryProjection, ProviderRequestMessageProjection, ProviderResourceProjection } from "../../domain/resource-network/model";
import type { ProviderServiceProfile } from "../../domain/resource-providers/model";
import type { RecipientReferralProjection, SenderReferralProjection } from "../../domain/referrals/model";
import type { ExchangeHomeMarker } from "../map/ExchangeSpatialScene";
import { useI18n } from "../i18n/I18nProvider";
import { WorkflowExplainer } from "../network-education/WorkflowExplainer";
import { MapboxLocalityCanvas, type ControlledLocalityPointOverlay, type ControlledLocalityServiceField } from "../map/MapboxLocalityCanvas";
import { ParticipantShell, SpatialWorkspace } from "../participant/ParticipantWorkspace";
import {
  clearRetryStableCommand,
  resolveRetryStableCommand,
} from "../referrals/retry-stable-command";

import styles from "./ResourceNetworkWorkspace.module.css";

type Referral = SenderReferralProjection | RecipientReferralProjection;
type Owner = Readonly<{ serviceProfile: ProviderServiceProfile | null; serviceGeography: Readonly<{ serviceGeographyIds: readonly string[] }> | null; publication: Readonly<{ version: number; status: string; visibleServiceIds: readonly string[] }> | null; resources: readonly Readonly<{ id: string; version: number; title: string; status: string }>[]; invitations: readonly Readonly<{ id: string; recipientLabel: string; deliveryStatus: string; createdAt: string }>[] }> | null;

interface Props {
  readonly model: ControlledLocalityMapModel;
  readonly homeMarker: ExchangeHomeMarker;
  readonly providers: readonly ProviderDiscoveryProjection[];
  readonly resources: readonly ProviderResourceProjection[];
  readonly referrals: readonly Referral[];
  readonly owner: Owner;
  readonly commandRecoveryScope: string;
  readonly initialQuery?: string;
  readonly messageThreads: Readonly<Record<string, readonly ProviderRequestMessageProjection[]>>;
}

const PROVIDER_REQUEST_STORAGE_KEY = "rfxchange:provider-request-create-and-send";

function readable(value: string) { return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function requestPartyLabel(referral: Referral, organizationId: string): string {
  if (organizationId === String(referral.providerContext?.providerOrganizationId)) return referral.recipientLabel;
  return referral.role === "recipient" ? referral.senderOrganizationName : "Your organization";
}

function browserSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function ResourceNetworkWorkspace({ model, homeMarker, providers, resources, referrals, owner, commandRecoveryScope, initialQuery = "", messageThreads }: Props) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState(providers[0] ? String(providers[0].organizationId) : "");
  const [query, setQuery] = useState(initialQuery);
  const [availability, setAvailability] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const providerRequestCommandRef = useRef<Readonly<{ fingerprint: string; commandId: string }> | null>(null);
  const providerRequestStorageKey = `${PROVIDER_REQUEST_STORAGE_KEY}:${encodeURIComponent(commandRecoveryScope)}`;
  const selected = providers.find((provider) => String(provider.organizationId) === selectedId) ?? null;
  const visible = providers.filter((provider) => {
    const corpus = `${provider.displayName} ${provider.categories.join(" ")} ${provider.services.map((service) => `${service.name} ${service.description}`).join(" ")}`.toLowerCase();
    return (!query.trim() || corpus.includes(query.trim().toLowerCase())) && (availability === "all" || provider.availability === availability);
  });
  const providerReferrals = referrals.filter((referral) => referral.purpose === "provider-connection");
  const pointOverlays: readonly ControlledLocalityPointOverlay[] = useMemo(() => Object.freeze([
    Object.freeze({ id: homeMarker.id, position: homeMarker.coordinate, label: homeMarker.label, kind: "organization-marker" as const, privacyLabel: homeMarker.accessibleLocationLabel, activated: true }),
    ...providers.flatMap((provider) => provider.marker ? [Object.freeze({ id: provider.marker.id, position: provider.marker.coordinate, label: provider.displayName, kind: "organization-marker" as const, privacyLabel: provider.marker.accessibleLocationLabel, activated: true })] : []),
  ]), [homeMarker, providers]);
  const serviceFields: readonly ControlledLocalityServiceField[] = useMemo(() => providers.map((provider) => Object.freeze({ id: `service-field-${String(provider.organizationId)}`, label: `${provider.displayName} service territory`, geometry: provider.territory.geometry as ControlledLocalityServiceField["geometry"], selected: String(provider.organizationId) === selectedId })), [providers, selectedId]);

  async function post(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) throw new Error(String(payload.error ?? "The action could not be completed."));
    return payload;
  }

  async function connect(form: FormData) {
    if (!selected) return;
    const serviceId = String(form.get("serviceId") ?? "");
    const summary = String(form.get("summary") ?? "");
    if (form.get("consent") !== "yes") { setNotice("Review and acknowledge the exact recipient and shared information before sending."); return; }
    const operationFingerprint = JSON.stringify({
      providerOrganizationId: String(selected.organizationId),
      serviceId,
      publicationVersion: selected.publicationVersion,
      summary,
    });
    const priorOperation = providerRequestCommandRef.current;
    const commandId = priorOperation?.fingerprint === operationFingerprint
      ? priorOperation.commandId
      : resolveRetryStableCommand({
          storage: browserSessionStorage(),
          storageKey: providerRequestStorageKey,
          fingerprint: operationFingerprint,
          prefix: "provider-create-send",
        });
    providerRequestCommandRef.current = Object.freeze({
      fingerprint: operationFingerprint,
      commandId,
    });
    setBusy(true); setNotice(null);
    try {
      const sharedFields = ["sender-organization", "summary"];
      await post("/api/referrals", { action: "create-and-send", commandId, recipientKind: "organization", recipientOrganizationId: String(selected.organizationId), recipientLabel: selected.displayName, need: "introduction", summary, urgency: "standard", preferredContactMethod: "platform", purpose: "provider-connection", providerOrganizationId: String(selected.organizationId), serviceId, publicationVersion: selected.publicationVersion, sharedFields, consentAcknowledged: true });
      clearRetryStableCommand({
        storage: browserSessionStorage(),
        storageKey: providerRequestStorageKey,
        commandId,
      });
      providerRequestCommandRef.current = null;
      setNotice(`Request sent to ${selected.displayName}.`);
      window.location.reload();
    } catch (error) {
      // An uncertain response keeps the same command in memory and actor-scoped session storage.
      // Re-entering the same provider, service, publication and summary after reload replays it.
      setNotice(error instanceof Error ? error.message : "Request failed.");
    }
    finally { setBusy(false); }
  }

  async function resourceAction(body: Record<string, unknown>) {
    setBusy(true); setNotice(null);
    try { await post("/api/resources", { ...body, commandId: `resource-${crypto.randomUUID()}` }); window.location.reload(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Resource action failed."); }
    finally { setBusy(false); }
  }

  async function referralAction(body: Record<string, unknown>) {
    setBusy(true); setNotice(null);
    try { await post("/api/referrals", { ...body, commandId: `provider-request-${crypto.randomUUID()}` }); window.location.reload(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Provider request action failed."); }
    finally { setBusy(false); }
  }

  return <ParticipantShell activeItem="Resources">
    <SpatialWorkspace ariaLabel={t("resourceNetworkWorkspace.ariaLabel")} className={styles.workspace}>
      <MapboxLocalityCanvas model={model} pointOverlays={pointOverlays} serviceFields={serviceFields} overlaySide="split" />
      <aside className={styles.panel}>
        <header><p className={styles.eyebrow}>{t("resourceNetworkWorkspace.eyebrow")}</p><h1>{t("resourceNetworkWorkspace.title")}</h1><p>{t("resourceNetworkWorkspace.supporting")}</p></header>
        <div className={styles.filters}><label>{t("resourceNetworkWorkspace.search")}<input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Capital, workshops, assistance…" /></label><label>{t("resourceNetworkWorkspace.availability")}<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="all">All maintained states</option><option value="available">Available</option><option value="limited">Limited</option><option value="unknown">Unknown</option></select></label></div>
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
        <div className={styles.columns}>
          <section aria-label="Provider results"><h2>{visible.length} {t("resourceNetworkWorkspace.providers")}</h2>{visible.length ? <ul className={styles.list}>{visible.map((provider) => <li key={String(provider.organizationId)}><button type="button" aria-current={String(provider.organizationId) === selectedId} onClick={() => setSelectedId(String(provider.organizationId))}><strong>{provider.displayName}</strong><span>{provider.services.map((service) => service.name).join(" · ")}</span><small>{provider.match.reasons.join(" · ")}</small></button></li>)}</ul> : <div className={styles.empty}><strong>{t("resourceNetworkWorkspace.empty")}</strong><p>Try broader terms or another maintained availability state.</p></div>}</section>
          <section className={styles.detail} aria-live="polite">{selected ? <><p className={styles.status}>{readable(selected.availability)} · {selected.territory.name}</p><h2>{selected.displayName}</h2><p>{selected.populationsServed}</p><dl><div><dt>Eligibility</dt><dd>{selected.eligibility}</dd></div><div><dt>Intake</dt><dd>{selected.intakeMethod}</dd></div><div><dt>Languages</dt><dd>{selected.languages.join(", ")}</dd></div><div><dt>Modalities</dt><dd>{selected.modalities.map(readable).join(", ")}</dd></div></dl><form action={connect} className={styles.form}><label>Service<select name="serviceId" required>{selected.services.map((service) => <option key={service.id} value={service.id}>{service.name} · {readable(service.availability)}</option>)}</select></label><label>What do you need?<textarea name="summary" required maxLength={1200} /></label><WorkflowExplainer explainerKey="provider-connection" /><label className={styles.check}><input name="consent" value="yes" type="checkbox" required />Share my organization name and this summary only with {selected.displayName}.</label><button disabled={busy} type="submit">Send provider request</button></form></> : <p>Select a provider to see its published services and territory.</p>}</section>
        </div>
        <section className={styles.fieldAlternative} aria-label="Accessible service territory descriptions"><h2>Service territories</h2><ul>{providers.map((provider) => <li key={String(provider.organizationId)}><strong>{provider.displayName}</strong><span>Serves {provider.territory.name}; this field is separate from the provider&apos;s office marker.</span></li>)}</ul></section>
        {resources.length ? <section className={styles.resources}><h2>Published resources</h2><ul>{resources.map((resource) => <li key={resource.id}><strong>{resource.title}</strong><span>{resource.providerDisplayName} · {readable(resource.kind)}</span><p>{resource.summary}</p>{resource.intakeUrl ? <a href={resource.intakeUrl}>Open intake information</a> : null}</li>)}</ul></section> : null}
        <section className={styles.requests}><h2>Provider requests</h2>{providerReferrals.length ? <ul>{providerReferrals.map((referral) => <li key={referral.id}><strong>{referral.role === "sender" ? referral.recipientLabel : referral.senderOrganizationName}</strong><span>{readable(referral.status)}</span>{referral.notificationStatus === "delivery-outcome-unknown" ? <p className={styles.notice} role="status">{t("referralWorkspace.notificationStates.deliveryOutcomeUnknown")}</p> : null}<p>{referral.summary}</p>{referral.role === "recipient" && referral.status === "sent" ? <div><WorkflowExplainer explainerKey="provider-response" /><button disabled={busy} onClick={() => referralAction({ action: "accepted", referralId: referral.id, expectedVersion: referral.version })}>Accept</button><button disabled={busy} onClick={() => referralAction({ action: "declined", referralId: referral.id, expectedVersion: referral.version })}>Decline</button><form className={styles.inlineForm} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); referralAction({ action: "redirected", referralId: referral.id, expectedVersion: referral.version, suggestedProviderOrganizationId: data.get("provider"), redirectReason: data.get("reason") }); }}><label>Suggest another published provider<select name="provider" required><option value="">Choose provider</option>{providers.filter((provider) => String(provider.organizationId) !== String(referral.providerContext?.providerOrganizationId)).map((provider) => <option key={String(provider.organizationId)} value={String(provider.organizationId)}>{provider.displayName}</option>)}</select></label><label>Reason<input name="reason" required maxLength={600} /></label><button disabled={busy}>Redirect</button></form></div> : null}{["sent", "accepted", "contacted"].includes(referral.status) ? <form className={styles.inlineForm} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); resourceAction({ action: "message-add", referralId: referral.id, message: data.get("message") }); }}><label>Private request message<textarea name="message" required maxLength={2000} /></label><button disabled={busy}>Add message</button></form> : null}{referral.providerRedirect ? <p>Suggested provider: {referral.providerRedirect.suggestedProviderDisplayName}. {referral.providerRedirect.reason}</p> : null}</li>)}</ul> : <p>No provider requests yet.</p>}</section>
        {owner?.serviceProfile ? <OwnerManagement owner={Object.freeze({ ...owner, serviceProfile: owner.serviceProfile })} busy={busy} onSubmit={resourceAction} /> : null}
        {Object.values(messageThreads).some((messages) => messages.length) ? <section className={styles.requests}><h2>Request communication history</h2>{Object.entries(messageThreads).map(([referralId, messages]) => { const referral = providerReferrals.find((candidate) => candidate.id === referralId); return messages.length && referral ? <article key={referralId}><strong>{referral.role === "recipient" ? referral.senderOrganizationName : referral.recipientLabel}</strong><ol>{messages.map((message) => <li key={message.id}><small>{requestPartyLabel(referral, String(message.authorOrganizationId))} · {new Date(message.createdAt).toLocaleString()}</small><p>{message.body}</p></li>)}</ol></article> : null; })}</section> : null}
      </aside>
    </SpatialWorkspace>
  </ParticipantShell>;
}

function ResourceComposer({ busy, profile, geographyIds, onSubmit }: Readonly<{ busy: boolean; profile: ProviderServiceProfile; geographyIds: readonly string[]; onSubmit(body: Record<string, unknown>): void }>) {
  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ action: "resource-create", kind: data.get("kind"), title: data.get("title"), summary: data.get("summary"), description: data.get("description"), eligibility: data.get("eligibility"), intakeUrl: data.get("intakeUrl"), visibility: data.get("visibility"), serviceIds: [data.get("serviceId")], geographyIds, modalities: profile.modalities }); }}><h2>Create resource draft</h2><label>Type<select name="kind"><option value="resource">Resource</option><option value="program">Program</option><option value="workshop">Workshop</option><option value="funding-program">Funding program</option><option value="announcement">Announcement</option></select></label><label>Service<select name="serviceId">{profile.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label><label>Title<input name="title" required maxLength={180} /></label><label>Summary<textarea name="summary" required maxLength={600} /></label><label>Description<textarea name="description" required maxLength={4000} /></label><label>Eligibility<textarea name="eligibility" required maxLength={1200} /></label><label>Intake URL<input name="intakeUrl" type="url" /></label><label>Visibility<select name="visibility"><option value="network">RFxchange network</option><option value="public">Permitted public projection</option></select></label><button disabled={busy}>Save draft</button></form>;
}

function OwnerManagement({ owner, busy, onSubmit }: Readonly<{ owner: NonNullable<Owner> & { serviceProfile: ProviderServiceProfile }; busy: boolean; onSubmit(body: Record<string, unknown>): void }>) {
  const [visibleServiceIds, setVisibleServiceIds] = useState<readonly string[]>(owner.publication?.visibleServiceIds ?? owner.serviceProfile.services.map((service) => service.id));
  function toggle(id: string, selected: boolean) { setVisibleServiceIds((current) => selected ? Object.freeze([...new Set([...current, id])]) : Object.freeze(current.filter((value) => value !== id))); }
  return <details className={styles.manage}><summary>Manage provider discovery and resources</summary><section><h2>Discovery publication</h2><p>Private profile changes do not publish automatically. Choose exactly which current services are discoverable.</p><WorkflowExplainer explainerKey="provider-resource-publication" /><div className={styles.serviceChecks}>{owner.serviceProfile.services.map((service) => <label key={service.id}><input type="checkbox" checked={visibleServiceIds.includes(service.id)} onChange={(event) => toggle(service.id, event.target.checked)} disabled={owner.publication?.status === "published"} />{service.name}</label>)}</div><button disabled={busy || !visibleServiceIds.length} onClick={() => onSubmit({ action: owner.publication?.status === "published" ? "publication-withdraw" : "publication-publish", expectedVersion: owner.publication?.version ?? null, visibleServiceIds })}>{owner.publication?.status === "published" ? "Withdraw discovery before editing" : "Publish selected services"}</button></section><ResourceComposer busy={busy} profile={owner.serviceProfile} geographyIds={owner.serviceGeography?.serviceGeographyIds.map(String) ?? []} onSubmit={onSubmit} /><InvitationComposer busy={busy} onSubmit={onSubmit} />{owner.resources.length ? <section><h2>Your resources</h2>{owner.resources.map((resource) => <p key={resource.id}><strong>{resource.title}</strong> · {readable(resource.status)} <button disabled={busy} onClick={() => onSubmit({ action: resource.status === "published" ? "resource-withdraw" : "resource-publish", resourceId: resource.id, expectedVersion: resource.version })}>{resource.status === "published" ? "Withdraw" : "Publish"}</button></p>)}</section> : null}</details>;
}

function InvitationComposer({ busy, onSubmit }: Readonly<{ busy: boolean; onSubmit(body: Record<string, unknown>): void }>) {
  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ action: "provider-invite", recipientLabel: data.get("recipientLabel"), recipientEmail: data.get("recipientEmail"), subjectKind: "profile-completion", invitationContext: data.get("invitationContext") }); }}><h2>Invite a provider to complete a profile</h2><label>Recipient name<input name="recipientLabel" required /></label><label>Email<input name="recipientEmail" type="email" required /></label><label>Context<textarea name="invitationContext" required maxLength={600} /></label><button disabled={busy}>Issue invitation</button></form>;
}
