"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { ParticipantSpatialScope } from "../../application/participant/participant-spatial-context";
import type { ResourcesMobileWorkspaceQuery } from "../../application/resource-network/resource-network-workspace";
import {
  buildResourcesMobileProjection,
  resourcesMobileCopy,
  resourcesMobileValueLabel,
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

function requestPartyLabel(referral: Referral, organizationId: string, ownOrganizationLabel: string): string {
  if (organizationId === String(referral.providerContext?.providerOrganizationId)) return referral.recipientLabel;
  return referral.role === "recipient" ? referral.senderOrganizationName : ownOrganizationLabel;
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
  const selectedResource = resources.find((resource) => resource.id === queryState.resourceId) ?? null;
  const actionBusy = busy || navigationPending;
  const mobileCopy = resourcesMobileCopy(locale);
  const valueLabel = (value: string) => resourcesMobileValueLabel(locale, value);
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
    navigationContext: {
      query: queryState.query,
      availability: queryState.availability,
      rfxReference: queryState.rfxReference,
      rfxGap: queryState.rfxGap,
      returnTo: queryState.returnTo,
    },
    selection: { providerOrganizationId: queryState.providerId, resourceId: queryState.resourceId, requestId: queryState.requestId, source: "restored" },
    camera: spatialContext.camera,
  }), [authorization, locale, model.selectedGeography.id, model.selectedGeography.name, providers, queryState.availability, queryState.providerId, queryState.query, queryState.requestId, queryState.resourceId, queryState.returnTo, queryState.rfxGap, queryState.rfxReference, referrals, resources, spatialContext.camera, spatialScope.organizationId]);
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
    if (form.get("consent") !== "yes") { setNotice(mobileCopy.consentRequired); return; }
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
      setNotice(`${mobileCopy.requestSentPrefix} ${selected.displayName}.`);
      const referral = typeof result.referral === "object" && result.referral
        ? result.referral as Record<string, unknown>
        : null;
      const requestId = typeof referral?.id === "string" ? referral.id : null;
      if (requestId) updateWorkspaceQuery({ request: requestId });
      else refreshAuthoritativeState();
    } catch (error) {
      // An uncertain response keeps the same command in memory and actor-scoped session storage.
      // Re-entering the same provider, service, publication and summary after reload replays it.
      setNotice(error instanceof Error ? error.message : mobileCopy.requestFailed);
    }
    finally { setBusy(false); }
  }

  async function resourceAction(body: Record<string, unknown>) {
    setBusy(true); setNotice(null);
    try { await post("/api/resources", { ...body, commandId: `resource-${crypto.randomUUID()}` }); refreshAuthoritativeState(); }
    catch (error) { setNotice(error instanceof Error ? error.message : mobileCopy.resourceActionFailed); }
    finally { setBusy(false); }
  }

  async function referralAction(body: Record<string, unknown>) {
    setBusy(true); setNotice(null);
    try { await post("/api/referrals", { ...body, commandId: `provider-request-${crypto.randomUUID()}` }); refreshAuthoritativeState(); }
    catch (error) { setNotice(error instanceof Error ? error.message : mobileCopy.providerActionFailed); }
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
          <label>{t("resourceNetworkWorkspace.search")}<input key={`q:${queryState.query}`} name="q" defaultValue={queryState.query} type="search" maxLength={160} placeholder={mobileCopy.searchPlaceholder} /></label>
          <label>{t("resourceNetworkWorkspace.availability")}<select key={`availability:${queryState.availability}`} name="availability" defaultValue={queryState.availability}><option value="all">{mobileCopy.allStates}</option><option value="available">{mobileCopy.availableState}</option><option value="limited">{mobileCopy.limitedState}</option><option value="unknown">{mobileCopy.unknownState}</option></select></label>
          <button disabled={actionBusy} type="submit">{t("resourceNetworkWorkspace.applyFilters")}</button>
        </form>
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
        <div className={styles.columns}>
          <section aria-label={mobileCopy.providerResults}><h2>{providers.length} {t("resourceNetworkWorkspace.providers")}</h2>{providers.length ? <ul className={styles.list}>{providers.map((provider, resultIndex) => <li key={String(provider.organizationId)}><button type="button" aria-current={String(provider.organizationId) === selectedOrganizationId} disabled={actionBusy} onClick={() => selectProvider(String(provider.organizationId), resultIndex)}><strong>{provider.displayName}</strong><span>{provider.services.map((service) => service.name).join(" · ")}</span><small>{queryState.query ? mobileCopy.searchMatch : mobileCopy.localityMatch} · {valueLabel(provider.availability)}</small></button></li>)}</ul> : <div className={styles.empty}><strong>{t("resourceNetworkWorkspace.empty")}</strong><p>{mobileCopy.broaderSearch}</p></div>}</section>
          <section className={styles.detail} aria-live="polite">{selected ? <><p className={styles.status}>{valueLabel(selected.availability)} · {selected.territory.name}</p><h2>{selected.displayName}</h2><p>{selected.populationsServed}</p><dl><div><dt>{mobileCopy.eligibilityLabel}</dt><dd>{selected.eligibility}</dd></div><div><dt>{mobileCopy.intakeLabel}</dt><dd>{selected.intakeMethod}</dd></div><div><dt>{mobileCopy.languagesLabel}</dt><dd>{selected.languages.join(", ")}</dd></div><div><dt>{mobileCopy.modalitiesLabel}</dt><dd>{selected.modalities.map(valueLabel).join(", ")}</dd></div></dl>{authorization.referralManage ? <form action={connect} className={styles.form}><label>{mobileCopy.serviceLabel}<select name="serviceId" required>{selected.services.map((service) => <option key={service.id} value={service.id}>{service.name} · {valueLabel(service.availability)}</option>)}</select></label><label>{mobileCopy.needLabel}<textarea name="summary" required maxLength={1200} /></label><WorkflowExplainer explainerKey="provider-connection" /><label className={styles.check}><input name="consent" value="yes" type="checkbox" required />{mobileCopy.consentPrefix} {selected.displayName}.</label><button disabled={actionBusy} type="submit">{mobileCopy.sendRequest}</button></form> : <p className={styles.notice}>{mobileCopy.requestAuthority}</p>}</> : <p>{mobileCopy.selectProvider}</p>}</section>
        </div>
        <section className={styles.fieldAlternative} aria-label={mobileCopy.territoriesTitle}><h2>{mobileCopy.territoriesTitle}</h2><ul>{providers.map((provider) => <li key={String(provider.organizationId)}><strong>{provider.displayName}</strong><span>{mobileCopy.servesPrefix} {provider.territory.name}; {mobileCopy.territoryExplanation}</span></li>)}</ul></section>
        {resources.length ? <section className={styles.resources}><h2>{mobileCopy.resourcesTitle}</h2><ul>{resources.map((resource) => <li key={resource.id} aria-current={resource.id === queryState.resourceId}><strong>{resource.title}</strong><span>{resource.providerDisplayName} · {valueLabel(resource.kind)}</span><p>{resource.summary}</p><button type="button" disabled={actionBusy} onClick={() => updateWorkspaceQuery({ provider: String(resource.organizationId), resource: resource.id, request: null })}>{mobileCopy.viewResource}</button></li>)}</ul>{selectedResource ? <article className={styles.detail} aria-live="polite"><p className={styles.status}>{valueLabel(selectedResource.status)} · {valueLabel(selectedResource.kind)}</p><h2>{selectedResource.title}</h2><p>{selectedResource.description}</p><dl><div><dt>{mobileCopy.eligibilityLabel}</dt><dd>{selectedResource.eligibility}</dd></div></dl>{selectedResource.intakeUrl ? <a href={selectedResource.intakeUrl}>{mobileCopy.openIntake}</a> : <p>{mobileCopy.contactProvider}</p>}</article> : null}</section> : null}
        <section className={styles.requests}>
          <h2>{mobileCopy.requestsTitle}</h2>
          {adjunctState.requests === "restricted" ? <p className={styles.notice}>{mobileCopy.requestRestricted}</p> : null}
          {adjunctState.requests === "unavailable" ? <p className={styles.notice} role="status">{mobileCopy.requestUnavailable}</p> : null}
          {providerReferrals.length ? <ul>{providerReferrals.map((referral) => <li key={referral.id}>
            <strong>{referral.role === "sender" ? referral.recipientLabel : referral.senderOrganizationName}</strong>
            <span>{valueLabel(referral.status)}</span>
            {referral.notificationStatus === "delivery-outcome-unknown" ? <p className={styles.notice} role="status">{t("referralWorkspace.notificationStates.deliveryOutcomeUnknown")}</p> : null}
            <p>{referral.summary}</p>
            <button type="button" aria-current={referral.id === queryState.requestId} disabled={actionBusy} onClick={() => updateWorkspaceQuery({ request: referral.id })}>{t("resourceNetworkWorkspace.viewCommunication")}</button>
            {referral.role === "recipient" && referral.status === "sent" ? <div><WorkflowExplainer explainerKey="provider-response" /><button disabled={actionBusy} onClick={() => referralAction({ action: "accepted", referralId: referral.id, expectedVersion: referral.version })}>{mobileCopy.accept}</button><button disabled={actionBusy} onClick={() => referralAction({ action: "declined", referralId: referral.id, expectedVersion: referral.version })}>{mobileCopy.decline}</button><form className={styles.inlineForm} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); referralAction({ action: "redirected", referralId: referral.id, expectedVersion: referral.version, suggestedProviderOrganizationId: data.get("provider"), redirectReason: data.get("reason") }); }}><label>{mobileCopy.suggestProvider}<select name="provider" required><option value="">{mobileCopy.chooseProvider}</option>{providers.filter((provider) => String(provider.organizationId) !== String(referral.providerContext?.providerOrganizationId)).map((provider) => <option key={String(provider.organizationId)} value={String(provider.organizationId)}>{provider.displayName}</option>)}</select></label><label>{mobileCopy.reason}<input name="reason" required maxLength={600} /></label><button disabled={actionBusy}>{mobileCopy.redirect}</button></form></div> : null}
            {["sent", "accepted", "contacted"].includes(referral.status) ? <form className={styles.inlineForm} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); resourceAction({ action: "message-add", referralId: referral.id, message: data.get("message") }); }}><label>{mobileCopy.privateMessage}<textarea name="message" required maxLength={2000} /></label><button disabled={actionBusy}>{mobileCopy.addMessage}</button></form> : null}
            {referral.providerRedirect ? <p>Suggested provider: {referral.providerRedirect.suggestedProviderDisplayName}. {referral.providerRedirect.reason}</p> : null}
          </li>)}</ul> : <p>{mobileCopy.noRequests}</p>}
        </section>
        {adjunctState.management === "unavailable" ? <p className={styles.notice} role="status">{mobileCopy.managementUnavailable}</p> : null}
        {owner?.serviceProfile ? <section id="resource-management"><OwnerManagement owner={Object.freeze({ ...owner, serviceProfile: owner.serviceProfile })} busy={actionBusy} initiallyOpen={queryState.manageMode !== null} onSubmit={resourceAction} /></section> : null}
        {selectedRequest ? <section className={styles.requests}><h2>{mobileCopy.communicationTitle}</h2><article><strong>{selectedRequest.role === "recipient" ? selectedRequest.senderOrganizationName : selectedRequest.recipientLabel}</strong>{selectedMessages.length ? <ol>{selectedMessages.map((message) => <li key={message.id}><small>{requestPartyLabel(selectedRequest, String(message.authorOrganizationId), mobileCopy.yourOrganization)} · {new Date(message.createdAt).toLocaleString(locale)}</small><p>{message.body}</p></li>)}</ol> : <p>{t("resourceNetworkWorkspace.noMessages")}</p>}</article></section> : null}
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
        <div className={styles.mobileOperations} data-resources-mobile-operations>
          {queryState.rfxReference || queryState.rfxGap ? <section className={styles.originContext} aria-label={mobileCopy.context}>
            <strong>{mobileCopy.context}</strong>
            <small>{mobileCopy.contextOnly}</small>
            {queryState.returnTo ? <a href={queryState.returnTo}>{mobileCopy.return}</a> : null}
          </section> : null}
          <form className={styles.filters} onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            updateWorkspaceQuery({ q: String(data.get("q") ?? ""), availability: String(data.get("availability") ?? "all"), provider: null });
          }}>
            <label>{t("resourceNetworkWorkspace.search")}<input key={`mobile-q:${queryState.query}`} name="q" defaultValue={queryState.query} type="search" maxLength={160} placeholder={mobileCopy.searchPlaceholder} /></label>
            <label>{t("resourceNetworkWorkspace.availability")}<select key={`mobile-availability:${queryState.availability}`} name="availability" defaultValue={queryState.availability}><option value="all">{mobileCopy.allStates}</option><option value="available">{mobileCopy.availableState}</option><option value="limited">{mobileCopy.limitedState}</option><option value="unknown">{mobileCopy.unknownState}</option></select></label>
            <button disabled={actionBusy} type="submit">{t("resourceNetworkWorkspace.applyFilters")}</button>
          </form>
          {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
          <section className={styles.detail} aria-live="polite">{selected ? <><p className={styles.status}>{valueLabel(selected.availability)} · {selected.territory.name}</p><h2>{selected.displayName}</h2><p>{selected.populationsServed}</p><dl><div><dt>{mobileCopy.eligibilityLabel}</dt><dd>{selected.eligibility}</dd></div><div><dt>{mobileCopy.intakeLabel}</dt><dd>{selected.intakeMethod}</dd></div></dl>{authorization.referralManage ? <form action={connect} className={styles.form}><label>{mobileCopy.serviceLabel}<select name="serviceId" required>{selected.services.map((service) => <option key={service.id} value={service.id}>{service.name} · {valueLabel(service.availability)}</option>)}</select></label><label>{mobileCopy.needLabel}<textarea name="summary" required maxLength={1200} /></label><WorkflowExplainer explainerKey="provider-connection" /><label className={styles.check}><input name="consent" value="yes" type="checkbox" required />{mobileCopy.consentPrefix} {selected.displayName}.</label><button disabled={actionBusy} type="submit">{mobileCopy.sendRequest}</button></form> : <p className={styles.notice}>{mobileCopy.requestAuthority}</p>}</> : <p>{mobileCopy.selectProviderCard}</p>}</section>
          {selectedResource ? <section className={styles.resources} aria-live="polite"><p className={styles.status}>{valueLabel(selectedResource.status)} · {valueLabel(selectedResource.kind)}</p><h2>{selectedResource.title}</h2><p>{selectedResource.description}</p><dl><div><dt>{mobileCopy.eligibilityLabel}</dt><dd>{selectedResource.eligibility}</dd></div></dl>{selectedResource.intakeUrl ? <a href={selectedResource.intakeUrl}>{mobileCopy.openIntake}</a> : <p>{mobileCopy.contactProvider}</p>}</section> : null}
          <section className={styles.requests}><h2>{mobileCopy.requestsTitle}</h2>{adjunctState.requests === "restricted" ? <p className={styles.notice}>{mobileCopy.requestRestricted}</p> : null}{adjunctState.requests === "unavailable" ? <p className={styles.notice} role="status">{mobileCopy.requestUnavailable}</p> : null}{selectedRequest ? <article><strong>{selectedRequest.role === "recipient" ? selectedRequest.senderOrganizationName : selectedRequest.recipientLabel}</strong><p>{selectedRequest.summary}</p>{selectedRequest.role === "recipient" && selectedRequest.status === "sent" ? <div><WorkflowExplainer explainerKey="provider-response" /><button disabled={actionBusy} onClick={() => referralAction({ action: "accepted", referralId: selectedRequest.id, expectedVersion: selectedRequest.version })}>{mobileCopy.accept}</button><button disabled={actionBusy} onClick={() => referralAction({ action: "declined", referralId: selectedRequest.id, expectedVersion: selectedRequest.version })}>{mobileCopy.decline}</button><form className={styles.inlineForm} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); referralAction({ action: "redirected", referralId: selectedRequest.id, expectedVersion: selectedRequest.version, suggestedProviderOrganizationId: data.get("provider"), redirectReason: data.get("reason") }); }}><label>{mobileCopy.suggestProvider}<select name="provider" required><option value="">{mobileCopy.chooseProvider}</option>{providers.filter((provider) => String(provider.organizationId) !== String(selectedRequest.providerContext?.providerOrganizationId)).map((provider) => <option key={String(provider.organizationId)} value={String(provider.organizationId)}>{provider.displayName}</option>)}</select></label><label>{mobileCopy.reason}<input name="reason" required maxLength={600} /></label><button disabled={actionBusy}>{mobileCopy.redirect}</button></form></div> : null}{["sent", "accepted", "contacted"].includes(selectedRequest.status) ? <form className={styles.inlineForm} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); resourceAction({ action: "message-add", referralId: selectedRequest.id, message: data.get("message") }); }}><label>{mobileCopy.privateMessage}<textarea name="message" required maxLength={2000} /></label><button disabled={actionBusy}>{mobileCopy.addMessage}</button></form> : null}{selectedMessages.length ? <ol>{selectedMessages.map((message) => <li key={message.id}><small>{requestPartyLabel(selectedRequest, String(message.authorOrganizationId), mobileCopy.yourOrganization)} · {new Date(message.createdAt).toLocaleString(locale)}</small><p>{message.body}</p></li>)}</ol> : <p>{t("resourceNetworkWorkspace.noMessages")}</p>}</article> : <p>{mobileCopy.selectRequest}</p>}</section>
          {adjunctState.management === "unavailable" ? <p className={styles.notice} role="status">{mobileCopy.managementUnavailable}</p> : null}
          {owner?.serviceProfile ? <section id="resource-management-mobile"><OwnerManagement owner={Object.freeze({ ...owner, serviceProfile: owner.serviceProfile })} busy={actionBusy} initiallyOpen={queryState.manageMode !== null} onSubmit={resourceAction} /></section> : null}
        </div>
      </ExchangeBottomSheet>
    </SpatialWorkspace>
  </ParticipantShell>;
}

function ResourceComposer({ busy, profile, geographyIds, onSubmit }: Readonly<{ busy: boolean; profile: ProviderServiceProfile; geographyIds: readonly string[]; onSubmit(body: Record<string, unknown>): void }>) {
  const { locale } = useI18n();
  const copy = resourcesMobileCopy(locale);
  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ action: "resource-create", kind: data.get("kind"), title: data.get("title"), summary: data.get("summary"), description: data.get("description"), eligibility: data.get("eligibility"), intakeUrl: data.get("intakeUrl"), visibility: data.get("visibility"), serviceIds: [data.get("serviceId")], geographyIds, modalities: profile.modalities }); }}><h2>{copy.createDraft}</h2><label>{copy.typeLabel}<select name="kind">{["resource", "program", "workshop", "funding-program", "announcement"].map((kind) => <option key={kind} value={kind}>{resourcesMobileValueLabel(locale, kind)}</option>)}</select></label><label>{copy.serviceLabel}<select name="serviceId">{profile.services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label><label>{copy.titleLabel}<input name="title" required maxLength={180} /></label><label>{copy.summaryLabel}<textarea name="summary" required maxLength={600} /></label><label>{copy.descriptionLabel}<textarea name="description" required maxLength={4000} /></label><label>{copy.eligibilityLabel}<textarea name="eligibility" required maxLength={1200} /></label><label>{copy.intakeUrlLabel}<input name="intakeUrl" type="url" /></label><label>{copy.visibilityLabel}<select name="visibility"><option value="network">{copy.networkVisibility}</option><option value="public">{copy.publicVisibility}</option></select></label><button disabled={busy}>{copy.saveDraft}</button></form>;
}

function OwnerManagement({ owner, busy, initiallyOpen, onSubmit }: Readonly<{ owner: NonNullable<Owner> & { serviceProfile: ProviderServiceProfile }; busy: boolean; initiallyOpen: boolean; onSubmit(body: Record<string, unknown>): void }>) {
  const { locale } = useI18n();
  const copy = resourcesMobileCopy(locale);
  const [visibleServiceIds, setVisibleServiceIds] = useState<readonly string[]>(owner.publication?.visibleServiceIds ?? owner.serviceProfile.services.map((service) => service.id));
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  useEffect(() => {
    if (initiallyOpen && detailsRef.current) detailsRef.current.open = true;
  }, [initiallyOpen]);
  function toggle(id: string, selected: boolean) { setVisibleServiceIds((current) => selected ? Object.freeze([...new Set([...current, id])]) : Object.freeze(current.filter((value) => value !== id))); }
  return <details ref={detailsRef} className={styles.manage}><summary>{copy.managementTitle}</summary><section><h2>{copy.publicationTitle}</h2><p>{copy.publicationNote}</p><WorkflowExplainer explainerKey="provider-resource-publication" /><div className={styles.serviceChecks}>{owner.serviceProfile.services.map((service) => <label key={service.id}><input type="checkbox" checked={visibleServiceIds.includes(service.id)} onChange={(event) => toggle(service.id, event.target.checked)} disabled={owner.publication?.status === "published"} />{service.name}</label>)}</div><button disabled={busy || !visibleServiceIds.length} onClick={() => onSubmit({ action: owner.publication?.status === "published" ? "publication-withdraw" : "publication-publish", expectedVersion: owner.publication?.version ?? null, visibleServiceIds })}>{owner.publication?.status === "published" ? copy.withdrawBeforeEdit : copy.publishServices}</button></section><ResourceComposer busy={busy} profile={owner.serviceProfile} geographyIds={owner.serviceGeography?.serviceGeographyIds.map(String) ?? []} onSubmit={onSubmit} /><InvitationComposer busy={busy} onSubmit={onSubmit} />{owner.resources.length ? <section><h2>{copy.yourResources}</h2>{owner.resources.map((resource) => <p key={resource.id}><strong>{resource.title}</strong> · {resourcesMobileValueLabel(locale, resource.status)} <button disabled={busy} onClick={() => onSubmit({ action: resource.status === "published" ? "resource-withdraw" : "resource-publish", resourceId: resource.id, expectedVersion: resource.version })}>{resource.status === "published" ? copy.withdraw : copy.publish}</button></p>)}</section> : null}</details>;
}

function InvitationComposer({ busy, onSubmit }: Readonly<{ busy: boolean; onSubmit(body: Record<string, unknown>): void }>) {
  const { locale } = useI18n();
  const copy = resourcesMobileCopy(locale);
  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ action: "provider-invite", recipientLabel: data.get("recipientLabel"), recipientEmail: data.get("recipientEmail"), subjectKind: "profile-completion", invitationContext: data.get("invitationContext") }); }}><h2>{copy.inviteTitle}</h2><label>{copy.recipientName}<input name="recipientLabel" required /></label><label>{copy.emailLabel}<input name="recipientEmail" type="email" required /></label><label>{copy.contextLabel}<textarea name="invitationContext" required maxLength={600} /></label><button disabled={busy}>{copy.issueInvitation}</button></form>;
}
