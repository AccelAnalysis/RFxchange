"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { ParticipantSpatialScope } from "../../application/participant/participant-spatial-context";
import type { ResourcesMobileWorkspaceQuery } from "../../application/resource-network/resource-network-workspace";
import {
  buildResourcesMobileProjection,
  resourcesMobileCopy,
  type ResourcesMobileAuthorization,
} from "../../application/resource-network/mobile-resource-exchange";
import { exchangeRoomLocaleCatalog } from "../../application/participant/exchange-room-locale";
import type { ExchangeGovernedAreaGeometry, ExchangeLensSelectableProjection } from "../../application/participant/lens-map-projection-adapter";
import type { ProviderDiscoveryProjection, ProviderRequestMessageProjection, ProviderResourceProjection } from "../../domain/resource-network/model";
import type { ProviderServiceProfile } from "../../domain/resource-providers/model";
import type { RecipientReferralProjection, SenderReferralProjection } from "../../domain/referrals/model";
import {
  ExchangeSpatialScene,
  type ExchangeHomeMarker,
  type ExchangeOrganizationMarker,
} from "../map/ExchangeSpatialScene";
import { useI18n } from "../i18n/I18nProvider";
import { WorkflowExplainer } from "../network-education/WorkflowExplainer";
import { ParticipantShell, SpatialWorkspace } from "../participant/ParticipantWorkspace";
import { ExchangeBottomSheet, ExchangeResultCard } from "../participant/MobileExchangePrimitives";
import { useParticipantSpatialContext } from "../participant/useParticipantSpatialContext";
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
  readonly spatialScope: ParticipantSpatialScope;
  readonly organizations: readonly Readonly<{ organizationId: string; marker: ExchangeOrganizationMarker }>[];
  readonly providers: readonly ProviderDiscoveryProjection[];
  readonly resources: readonly ProviderResourceProjection[];
  readonly referrals: readonly Referral[];
  readonly owner: Owner;
  readonly adjunctState: Readonly<{
    requests: "available" | "restricted" | "unavailable";
    management: "available" | "restricted" | "unavailable";
  }>;
  readonly authorization: ResourcesMobileAuthorization;
  readonly commandRecoveryScope: string;
  readonly queryState: ResourcesMobileWorkspaceQuery;
  readonly selectedMessages: readonly ProviderRequestMessageProjection[];
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

export function ResourceNetworkWorkspace({ model, homeMarker, spatialScope, organizations, providers, resources, referrals, owner, adjunctState, authorization, commandRecoveryScope, queryState, selectedMessages }: Props) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [navigationPending, startNavigation] = useTransition();
  const providerRequestCommandRef = useRef<Readonly<{ fingerprint: string; commandId: string }> | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const providerRequestStorageKey = `${PROVIDER_REQUEST_STORAGE_KEY}:${encodeURIComponent(commandRecoveryScope)}`;
  const [spatialContext, updateSpatialContext] = useParticipantSpatialContext({ scope: spatialScope, homeMarkerId: homeMarker.id, activeLens: "resources" });
  const selectedOrganizationId = queryState.providerId ?? queryState.organizationId ?? spatialContext.selection.organizationId;
  const selected = providers.find((provider) => String(provider.organizationId) === selectedOrganizationId) ?? null;
  const providerReferrals = referrals.filter((referral) => referral.purpose === "provider-connection");
  const selectedRequest = providerReferrals.find((referral) => referral.id === queryState.requestId) ?? null;
  const actionBusy = busy || navigationPending;
  const mobileCopy = resourcesMobileCopy(locale);
  const actionCopy = exchangeRoomLocaleCatalog(locale);
  const mobileProjection = useMemo(() => buildResourcesMobileProjection({
    viewerOrganizationId: spatialScope.organizationId,
    geography: { id: String(model.selectedGeography.id), label: model.selectedGeography.name },
    providers,
    resources,
    requests: referrals,
    authorization,
    locale,
    search: queryState.query,
    availability: queryState.availability,
    selection: { providerOrganizationId: queryState.providerId, resourceId: queryState.resourceId, requestId: queryState.requestId, source: "restored" },
    camera: spatialContext.camera,
  }), [authorization, locale, model.selectedGeography.id, model.selectedGeography.name, providers, queryState.availability, queryState.providerId, queryState.query, queryState.requestId, queryState.resourceId, referrals, resources, spatialContext.camera, spatialScope.organizationId]);
  const governedAreaGeometries = useMemo(() => mobileProjection.serviceTerritories.map((binding) => Object.freeze({ areaId: binding.area.areaId, geographyId: binding.area.geographyId, geometryReference: binding.geometryReference, geometry: binding.geometry as ExchangeGovernedAreaGeometry["geometry"] })), [mobileProjection.serviceTerritories]);

  useEffect(() => {
    updateSpatialContext((current) => {
      const lensState = current.lensState.resources;
      const availability = queryState.availability === "all" ? "" : queryState.availability;
      const filterValues: Record<string, string> = {};
      if (availability) filterValues.availability = availability;
      const filters: Readonly<Record<string, string>> = Object.freeze(filterValues);
      if (current.activeLens === "resources" && lensState.search === queryState.query && (lensState.filters.availability ?? "") === availability) return current;
      return Object.freeze({
        ...current,
        activeLens: "resources" as const,
        lensState: Object.freeze({
          ...current.lensState,
          resources: Object.freeze({
            ...lensState,
            search: queryState.query,
            filters,
            resultPage: 1,
            resultIndex: lensState.search === queryState.query && (lensState.filters.availability ?? "") === availability ? lensState.resultIndex : 0,
            listScrollTop: lensState.search === queryState.query && (lensState.filters.availability ?? "") === availability ? lensState.listScrollTop : 0,
          }),
        }),
      });
    });
  }, [queryState.availability, queryState.query, updateSpatialContext]);
  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = spatialContext.lensState.resources.listScrollTop;
  }, [spatialContext.lensState.resources.listScrollTop]);
  useEffect(() => {
    const focusedOrganizationId = queryState.organizationId ?? queryState.providerId;
    if (!focusedOrganizationId) return;
    const organization = organizations.find(
      (candidate) => candidate.organizationId === focusedOrganizationId,
    );
    const crossGeographyProvider = queryState.providerId
      ? providers.find(
          (candidate) => String(candidate.organizationId) === queryState.providerId && candidate.marker === null,
        )
      : null;
    if (!organization && crossGeographyProvider) {
      if (
        spatialContext.selection.organizationId === spatialScope.organizationId
        && spatialContext.selection.markerId === homeMarker.id
      ) return;
      updateSpatialContext((current) => Object.freeze({
        ...current,
        activeLens: "resources" as const,
        selection: Object.freeze({
          organizationId: spatialScope.organizationId,
          markerId: homeMarker.id,
          relationshipId: null,
        }),
        panelOpen: true,
        originLens: current.activeLens,
      }));
      return;
    }
    if (
      !organization
      || (
        spatialContext.selection.organizationId === organization.organizationId
        && spatialContext.selection.markerId === organization.marker.id
      )
    ) return;
    updateSpatialContext((current) => Object.freeze({
      ...current,
      activeLens: "resources" as const,
      selection: Object.freeze({
        organizationId: organization.organizationId,
        markerId: organization.marker.id,
        relationshipId: null,
      }),
      panelOpen: true,
      originLens: current.activeLens,
    }));
  }, [homeMarker.id, organizations, providers, queryState.organizationId, queryState.providerId, spatialContext.selection.markerId, spatialContext.selection.organizationId, spatialScope.organizationId, updateSpatialContext]);

  function selectOrganization(markerId: string) {
    const organization = organizations.find((candidate) => candidate.marker.id === markerId);
    const organizationId = organization?.organizationId ?? spatialScope.organizationId;
    updateSpatialContext((current) => Object.freeze({
      ...current,
      activeLens: "resources" as const,
      selection: Object.freeze({ organizationId, markerId, relationshipId: null }),
      panelOpen: true,
      originLens: current.activeLens,
    }));
    updateWorkspaceQuery({
      organization: organization ? organizationId : null,
      provider: providers.some((provider) => String(provider.organizationId) === organizationId) ? organizationId : null,
    });
  }

  function selectProvider(organizationId: string, resultIndex: number) {
    const organization = organizations.find((candidate) => candidate.organizationId === organizationId);
    if (organization) selectOrganization(organization.marker.id);
    else {
      updateWorkspaceQuery({ organization: null, provider: organizationId });
      updateSpatialContext((current) => Object.freeze({
        ...current,
        activeLens: "resources" as const,
        selection: Object.freeze({
          organizationId: spatialScope.organizationId,
          markerId: homeMarker.id,
          relationshipId: null,
        }),
        panelOpen: true,
        originLens: current.activeLens,
      }));
    }
    updateSpatialContext((current) => Object.freeze({
      ...current,
      lensState: Object.freeze({
        ...current.lensState,
        resources: Object.freeze({ ...current.lensState.resources, resultIndex }),
      }),
    }));
  }

  function updateWorkspaceQuery(updates: Readonly<Partial<Record<"q" | "availability" | "organization" | "provider" | "request" | "resource" | "manage", string | null | undefined>>>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || (key === "availability" && value === "all")) next.delete(key);
      else next.set(key, value);
    }
    const destination = `${pathname}${next.size ? `?${next.toString()}` : ""}`;
    startNavigation(() => router.replace(destination, { scroll: false }));
  }

  function selectLensProjection(projection: ExchangeLensSelectableProjection) {
    const selectionKey = projection.kind === "area"
      ? projection.associationSelectionKey
      : projection.identity.selectionKey;
    if (!selectionKey) return;
    if (selectionKey.startsWith("organization:")) {
      const organizationId = selectionKey.slice("organization:".length);
      selectProvider(organizationId, Math.max(0, providers.findIndex((provider) => String(provider.organizationId) === organizationId)));
    } else if (selectionKey.startsWith("provider-resource:")) {
      const resourceId = selectionKey.slice("provider-resource:".length);
      const resource = resources.find((candidate) => candidate.id === resourceId);
      updateWorkspaceQuery({ provider: resource ? String(resource.organizationId) : null, resource: resourceId, request: null });
    } else if (selectionKey.startsWith("provider-request:")) {
      updateWorkspaceQuery({ request: selectionKey.slice("provider-request:".length), resource: null });
    }
  }

  function selectCard(selectionKey: string) {
    const mapped = mobileProjection.discovery.map.objects.find((object) =>
      (object.kind === "organization" || object.kind === "record")
      && object.identity.selectionKey === selectionKey,
    );
    if (mapped && (mapped.kind === "organization" || mapped.kind === "record")) {
      selectLensProjection(mapped);
      return;
    }
    if (selectionKey.startsWith("organization:")) {
      const organizationId = selectionKey.slice("organization:".length);
      selectProvider(organizationId, Math.max(0, providers.findIndex((provider) => String(provider.organizationId) === organizationId)));
    } else if (selectionKey.startsWith("provider-resource:")) {
      const resourceId = selectionKey.slice("provider-resource:".length);
      const resource = resources.find((candidate) => candidate.id === resourceId);
      updateWorkspaceQuery({ provider: resource ? String(resource.organizationId) : null, resource: resourceId, request: null });
    } else if (selectionKey.startsWith("provider-request:")) {
      updateWorkspaceQuery({ request: selectionKey.slice("provider-request:".length), resource: null });
    }
  }

  function refreshAuthoritativeState() {
    startNavigation(() => router.refresh());
  }

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
      const result = await post("/api/referrals", { action: "create-and-send", commandId, recipientKind: "organization", recipientOrganizationId: String(selected.organizationId), recipientLabel: selected.displayName, need: "introduction", summary, urgency: "standard", preferredContactMethod: "platform", purpose: "provider-connection", providerOrganizationId: String(selected.organizationId), serviceId, publicationVersion: selected.publicationVersion, sharedFields, consentAcknowledged: true });
      clearRetryStableCommand({
        storage: browserSessionStorage(),
        storageKey: providerRequestStorageKey,
        commandId,
      });
      providerRequestCommandRef.current = null;
      setNotice(`Request sent to ${selected.displayName}.`);
      const referral = typeof result.referral === "object" && result.referral
        ? result.referral as Record<string, unknown>
        : null;
      const requestId = typeof referral?.id === "string" ? referral.id : null;
      if (requestId) updateWorkspaceQuery({ request: requestId });
      else refreshAuthoritativeState();
    } catch (error) {
      // An uncertain response keeps the same command in memory and actor-scoped session storage.
      // Re-entering the same provider, service, publication and summary after reload replays it.
      setNotice(error instanceof Error ? error.message : "Request failed.");
    }
    finally { setBusy(false); }
  }

  async function resourceAction(body: Record<string, unknown>) {
    setBusy(true); setNotice(null);
    try { await post("/api/resources", { ...body, commandId: `resource-${crypto.randomUUID()}` }); refreshAuthoritativeState(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Resource action failed."); }
    finally { setBusy(false); }
  }

  async function referralAction(body: Record<string, unknown>) {
    setBusy(true); setNotice(null);
    try { await post("/api/referrals", { ...body, commandId: `provider-request-${crypto.randomUUID()}` }); refreshAuthoritativeState(); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Provider request action failed."); }
    finally { setBusy(false); }
  }

  return <ParticipantShell activeItem="Resources">
    <SpatialWorkspace ariaLabel={t("resourceNetworkWorkspace.ariaLabel")} className={styles.workspace}>
      {/* Stage 3 rendered serviceFields={serviceFields}; Stage 4 consumes the shared
          lens projection instead so the same map never receives duplicate overlays. */}
      <ExchangeSpatialScene
        model={model}
        mode="organization"
        marker={homeMarker}
        lensProjection={mobileProjection.discovery.map}
        lensSelection={mobileProjection.selection}
        governedAreaGeometries={governedAreaGeometries}
        onLensProjectionSelect={selectLensProjection}
        focusedMarkerId={spatialContext.selection.markerId}
        onOrganizationMarkerSelect={selectOrganization}
        initialCamera={spatialContext.camera}
        onCameraChange={(camera) => updateSpatialContext((current) => Object.freeze({ ...current, activeLens: "resources" as const, camera }))}
        interactive
        showSearch={false}
        workspaceOverlay="right"
      />
      <aside
        ref={panelRef}
        className={styles.panel}
        onScroll={(event) => {
          const listScrollTop = Math.max(0, Math.round(event.currentTarget.scrollTop));
          updateSpatialContext((current) => Object.freeze({
            ...current,
            lensState: Object.freeze({
              ...current.lensState,
              resources: Object.freeze({ ...current.lensState.resources, listScrollTop }),
            }),
          }));
        }}
      >
        <header><p className={styles.eyebrow}>{t("resourceNetworkWorkspace.eyebrow")}</p><h1>{t("resourceNetworkWorkspace.title")}</h1><p>{t("resourceNetworkWorkspace.supporting")}</p></header>
        {queryState.rfxReference || queryState.rfxGap ? <section className={styles.originContext} aria-label={mobileCopy.context}>
          <strong>{mobileCopy.context}</strong>
          {queryState.rfxReference ? <span>RFx {queryState.rfxReference}</span> : null}
          {queryState.rfxGap ? <p>{queryState.rfxGap}</p> : null}
          <small>{mobileCopy.contextOnly}</small>
          {queryState.returnTo ? <a href={queryState.returnTo}>{mobileCopy.return}</a> : null}
        </section> : null}
        <nav className={styles.actionRail} aria-label={actionCopy.actionsLabel}>
          {mobileProjection.actionRail.actions.map((action) => action.availability === "enabled" && action.handler?.kind === "href"
            ? <a key={action.id} href={action.handler.href}>{actionCopy.actions[action.labelKey as keyof typeof actionCopy.actions]}</a>
            : <button key={action.id} type="button" disabled data-disabled-reason={action.disabledReason ?? undefined}>{actionCopy.actions[action.labelKey as keyof typeof actionCopy.actions]}</button>)}
        </nav>
        <form className={styles.filters} onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          updateWorkspaceQuery({
            q: String(data.get("q") ?? ""),
            availability: String(data.get("availability") ?? "all"),
            provider: null,
          });
        }}>
          <label>{t("resourceNetworkWorkspace.search")}<input key={`q:${queryState.query}`} name="q" defaultValue={queryState.query} type="search" maxLength={160} placeholder="Capital, workshops, assistance…" /></label>
          <label>{t("resourceNetworkWorkspace.availability")}<select key={`availability:${queryState.availability}`} name="availability" defaultValue={queryState.availability}><option value="all">All maintained states</option><option value="available">Available</option><option value="limited">Limited</option><option value="unknown">Unknown</option></select></label>
          <button disabled={actionBusy} type="submit">{t("resourceNetworkWorkspace.applyFilters")}</button>
        </form>
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
        <div className={styles.columns}>
          <section aria-label="Provider results"><h2>{providers.length} {t("resourceNetworkWorkspace.providers")}</h2>{providers.length ? <ul className={styles.list}>{providers.map((provider, resultIndex) => <li key={String(provider.organizationId)}><button type="button" aria-current={String(provider.organizationId) === selectedOrganizationId} disabled={actionBusy} onClick={() => selectProvider(String(provider.organizationId), resultIndex)}><strong>{provider.displayName}</strong><span>{provider.services.map((service) => service.name).join(" · ")}</span><small>{provider.match.reasons.join(" · ")}</small></button></li>)}</ul> : <div className={styles.empty}><strong>{t("resourceNetworkWorkspace.empty")}</strong><p>Try broader terms or another maintained availability state.</p></div>}</section>
          <section className={styles.detail} aria-live="polite">{selected ? <><p className={styles.status}>{readable(selected.availability)} · {selected.territory.name}</p><h2>{selected.displayName}</h2><p>{selected.populationsServed}</p><dl><div><dt>Eligibility</dt><dd>{selected.eligibility}</dd></div><div><dt>Intake</dt><dd>{selected.intakeMethod}</dd></div><div><dt>Languages</dt><dd>{selected.languages.join(", ")}</dd></div><div><dt>Modalities</dt><dd>{selected.modalities.map(readable).join(", ")}</dd></div></dl><form action={connect} className={styles.form}><label>Service<select name="serviceId" required>{selected.services.map((service) => <option key={service.id} value={service.id}>{service.name} · {readable(service.availability)}</option>)}</select></label><label>What do you need?<textarea name="summary" required maxLength={1200} /></label><WorkflowExplainer explainerKey="provider-connection" /><label className={styles.check}><input name="consent" value="yes" type="checkbox" required />Share my organization name and this summary only with {selected.displayName}.</label><button disabled={actionBusy} type="submit">Send provider request</button></form></> : <p>Select a provider to see its published services and territory.</p>}</section>
        </div>
        <section className={styles.fieldAlternative} aria-label="Accessible service territory descriptions"><h2>Service territories</h2><ul>{providers.map((provider) => <li key={String(provider.organizationId)}><strong>{provider.displayName}</strong><span>Serves {provider.territory.name}; this field is separate from the provider&apos;s office marker.</span></li>)}</ul></section>
        {resources.length ? <section className={styles.resources}><h2>Published resources</h2><ul>{resources.map((resource) => <li key={resource.id}><strong>{resource.title}</strong><span>{resource.providerDisplayName} · {readable(resource.kind)}</span><p>{resource.summary}</p>{resource.intakeUrl ? <a href={resource.intakeUrl}>Open intake information</a> : null}</li>)}</ul></section> : null}
        <section className={styles.requests}>
          <h2>Provider requests</h2>
          {adjunctState.requests === "restricted" ? <p className={styles.notice}>Provider requests require current referral authority.</p> : null}
          {adjunctState.requests === "unavailable" ? <p className={styles.notice} role="status">Private provider requests could not be loaded. Public provider and resource discovery remains available.</p> : null}
          {providerReferrals.length ? <ul>{providerReferrals.map((referral) => <li key={referral.id}>
            <strong>{referral.role === "sender" ? referral.recipientLabel : referral.senderOrganizationName}</strong>
            <span>{readable(referral.status)}</span>
            {referral.notificationStatus === "delivery-outcome-unknown" ? <p className={styles.notice} role="status">{t("referralWorkspace.notificationStates.deliveryOutcomeUnknown")}</p> : null}
            <p>{referral.summary}</p>
            <button type="button" aria-current={referral.id === queryState.requestId} disabled={actionBusy} onClick={() => updateWorkspaceQuery({ request: referral.id })}>{t("resourceNetworkWorkspace.viewCommunication")}</button>
            {referral.role === "recipient" && referral.status === "sent" ? <div><WorkflowExplainer explainerKey="provider-response" /><button disabled={actionBusy} onClick={() => referralAction({ action: "accepted", referralId: referral.id, expectedVersion: referral.version })}>Accept</button><button disabled={actionBusy} onClick={() => referralAction({ action: "declined", referralId: referral.id, expectedVersion: referral.version })}>Decline</button><form className={styles.inlineForm} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); referralAction({ action: "redirected", referralId: referral.id, expectedVersion: referral.version, suggestedProviderOrganizationId: data.get("provider"), redirectReason: data.get("reason") }); }}><label>Suggest another published provider<select name="provider" required><option value="">Choose provider</option>{providers.filter((provider) => String(provider.organizationId) !== String(referral.providerContext?.providerOrganizationId)).map((provider) => <option key={String(provider.organizationId)} value={String(provider.organizationId)}>{provider.displayName}</option>)}</select></label><label>Reason<input name="reason" required maxLength={600} /></label><button disabled={actionBusy}>Redirect</button></form></div> : null}
            {["sent", "accepted", "contacted"].includes(referral.status) ? <form className={styles.inlineForm} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); resourceAction({ action: "message-add", referralId: referral.id, message: data.get("message") }); }}><label>Private request message<textarea name="message" required maxLength={2000} /></label><button disabled={actionBusy}>Add message</button></form> : null}
            {referral.providerRedirect ? <p>Suggested provider: {referral.providerRedirect.suggestedProviderDisplayName}. {referral.providerRedirect.reason}</p> : null}
          </li>)}</ul> : <p>No provider requests yet.</p>}
        </section>
        {adjunctState.management === "unavailable" ? <p className={styles.notice} role="status">Provider management could not be loaded. Refresh before making provider changes.</p> : null}
        {owner?.serviceProfile ? <section id="resource-management"><OwnerManagement owner={Object.freeze({ ...owner, serviceProfile: owner.serviceProfile })} busy={actionBusy} onSubmit={resourceAction} /></section> : null}
        {selectedRequest ? <section className={styles.requests}><h2>Request communication history</h2><article><strong>{selectedRequest.role === "recipient" ? selectedRequest.senderOrganizationName : selectedRequest.recipientLabel}</strong>{selectedMessages.length ? <ol>{selectedMessages.map((message) => <li key={message.id}><small>{requestPartyLabel(selectedRequest, String(message.authorOrganizationId))} · {new Date(message.createdAt).toLocaleString()}</small><p>{message.body}</p></li>)}</ol> : <p>{t("resourceNetworkWorkspace.noMessages")}</p>}</article></section> : null}
      </aside>
      <ExchangeBottomSheet
        labelledBy="resources-mobile-results"
        labels={{ region: mobileCopy.results, dragHandle: mobileCopy.results, peek: mobileCopy.peek, partial: mobileCopy.partial, expanded: mobileCopy.expanded }}
        snapPoint={spatialContext.sheetSnapPoint}
        summary={<strong id="resources-mobile-results">{mobileProjection.discovery.results.status === "ready" ? `${mobileProjection.discovery.results.cards.length} ${mobileCopy.results}` : mobileCopy.empty}</strong>}
        actionRail={<nav className={styles.actionRail} aria-label={actionCopy.actionsLabel}>{mobileProjection.actionRail.actions.map((action) => action.availability === "enabled" && action.handler?.kind === "href" ? <a key={action.id} href={action.handler.href}>{actionCopy.actions[action.labelKey as keyof typeof actionCopy.actions]}</a> : <button key={action.id} type="button" disabled>{actionCopy.actions[action.labelKey as keyof typeof actionCopy.actions]}</button>)}</nav>}
        initialScrollTop={spatialContext.sheetScrollTop}
        onSnapPointChange={(sheetSnapPoint) => updateSpatialContext((current) => Object.freeze({ ...current, sheetSnapPoint }))}
        onScrollPositionChange={(sheetScrollTop) => updateSpatialContext((current) => Object.freeze({ ...current, sheetScrollTop }))}
      >
        {mobileProjection.discovery.results.status === "ready" ? mobileProjection.discovery.results.cards.map((card) => <ExchangeResultCard
          key={card.identity.selectionKey}
          card={card}
          selected={mobileProjection.selection.selectionKey === card.identity.selectionKey}
          labels={{ openDetail: mobileCopy.open, addFavorite: mobileCopy.save, removeFavorite: mobileCopy.remove, favoriteUnavailable: mobileCopy.unavailable, mediaFallback: mobileCopy.fallback }}
          onSelect={() => selectCard(card.identity.selectionKey)}
          onOpen={() => updateSpatialContext((current) => Object.freeze({ ...current, sheetSnapPoint: "expanded" as const }))}
          resolveRecordActionLabel={(key) => t(key)}
        />) : <p>{mobileCopy.empty}</p>}
      </ExchangeBottomSheet>
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
