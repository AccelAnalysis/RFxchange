"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type {
  OpportunityDiscoveryItem,
  OpportunityDiscoveryResult,
} from "../../application/rfx/opportunity-discovery-service";
import { projectExchangeRoomActions } from "../../application/participant/exchange-room-actions";
import type { ParticipantSpatialScope } from "../../application/participant/participant-spatial-context";
import { useI18n } from "../i18n/I18nProvider";
import {
  ExchangeSpatialScene,
  type ExchangeHomeMarker,
  type ExchangeOpportunityMarker,
} from "../map/ExchangeSpatialScene";
import { StatePanel, StatusPill } from "../ui";
import {
  MapOverlaySurface,
  ParticipantShell,
  ResponsiveEdgeSheet,
  SpatialWorkspace,
} from "../participant/ParticipantWorkspace";
import { ExchangeRoomActionController } from "../participant/ExchangeRoomActionController";
import { useParticipantSpatialContext } from "../participant/useParticipantSpatialContext";

import styles from "./OpportunityDiscoveryWorkspace.module.css";

interface Props {
  readonly model: ControlledLocalityMapModel;
  readonly homeMarker: ExchangeHomeMarker;
  readonly spatialScope: ParticipantSpatialScope;
  readonly result: OpportunityDiscoveryResult;
  readonly selectedReference: string | null;
}

function markerId(reference: string): string {
  return `opportunity-${reference}`;
}

function queryHref(result: OpportunityDiscoveryResult, selectedReference?: string | null, cursor: string | null = result.query.cursor ?? null): string {
  const params = new URLSearchParams();
  if (result.query.text) params.set("q", result.query.text);
  if (result.query.deadlineWindow !== "all-open") params.set("deadline", result.query.deadlineWindow);
  if (result.query.watched !== null) params.set("watched", String(result.query.watched));
  for (const locality of result.query.localityIds) params.append("locality", locality);
  for (const capability of result.query.capabilityIds) params.append("capability", capability);
  for (const family of result.query.requestFamilyKeys) params.append("requestFamily", family);
  if (cursor) params.set("cursor", cursor);
  if (selectedReference) params.set("selected", selectedReference);
  return params.size ? `/opportunities?${params.toString()}` : "/opportunities";
}

export function OpportunityDiscoveryWorkspace({ model, homeMarker, spatialScope, result, selectedReference }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saveLabel, setSaveLabel] = useState(result.query.text || t("rfxWorkspace.discovery.saved.defaultLabel"));
  const [alertPolicy, setAlertPolicy] = useState("off");
  const [spatialContext, updateSpatialContext] = useParticipantSpatialContext({
    scope: spatialScope,
    homeMarkerId: homeMarker.id,
    activeLens: "opportunities-rfx",
  });
  const selected = result.items.find((item) => item.reference === selectedReference)
    ?? result.items.find((item) => markerId(item.reference) === spatialContext.selection.markerId)
    ?? null;
  const exchangeActions = useMemo(() => projectExchangeRoomActions({
    activeLens: "opportunities-rfx",
    viewerOrganizationId: spatialScope.organizationId,
    selectedOrganizationId: spatialScope.organizationId,
    selectedOrganizationIsOfficialResourceProvider: false,
    openPlatformActionsAuthorized: true,
    actionAuthorization: Object.freeze({ rfxCreate: false, referralManage: false, resourceManage: false }),
    currentOpportunityReference: selected?.reference ?? null,
  }), [selected?.reference, spatialScope.organizationId]);
  const opportunityMarkers: readonly ExchangeOpportunityMarker[] = useMemo(() => {
    const coordinate = [model.camera.center.longitude, model.camera.center.latitude] as const;
    return Object.freeze(result.items
      .filter((item) => item.localities.some((locality) => locality.id === spatialScope.geographyId))
      .map((item) => Object.freeze({
        id: markerId(item.reference),
        coordinate,
        label: item.title,
        accessibleLocationLabel: item.localities.map((locality) => locality.label).join(", "),
      })));
  }, [model.camera.center.latitude, model.camera.center.longitude, result.items, spatialScope.geographyId]);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (result.query.deadlineWindow !== "all-open") filters.deadline = result.query.deadlineWindow;
    if (result.query.watched !== null) filters.watched = String(result.query.watched);
    if (result.query.requestFamilyKeys.length) filters.requestFamily = result.query.requestFamilyKeys.join(",");
    if (result.query.capabilityIds.length) filters.capability = result.query.capabilityIds.join(",");
    if (result.query.localityIds.length) filters.locality = result.query.localityIds.join(",");
    updateSpatialContext((current) => Object.freeze({
      ...current,
      activeLens: "opportunities-rfx" as const,
      lensState: Object.freeze({
        ...current.lensState,
        "opportunities-rfx": Object.freeze({
          ...current.lensState["opportunities-rfx"],
          search: result.query.text,
          filters: Object.freeze(filters),
        }),
      }),
      panelOpen: selected !== null,
      originLens: current.activeLens,
    }));
  }, [
    result.query.capabilityIds,
    result.query.deadlineWindow,
    result.query.localityIds,
    result.query.requestFamilyKeys,
    result.query.text,
    result.query.watched,
    selected,
    updateSpatialContext,
  ]);

  function select(item: OpportunityDiscoveryItem | null) {
    updateSpatialContext((current) => Object.freeze({
      ...current,
      activeLens: "opportunities-rfx" as const,
      selection: Object.freeze({
        organizationId: spatialScope.organizationId,
        markerId: item ? markerId(item.reference) : homeMarker.id,
        relationshipId: null,
      }),
      panelOpen: Boolean(item),
      originLens: current.activeLens,
    }));
    router.replace(queryHref(result, item?.reference ?? null), { scroll: false });
  }

  async function post(body: Record<string, unknown>) {
    const response = await fetch("/api/opportunities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("request-failed");
    return response.json();
  }

  async function saveSearch() {
    setBusy("save");
    setMessage(null);
    try {
      await post({
        action: "save-search",
        commandId: crypto.randomUUID(),
        label: saveLabel,
        alertPolicy,
        query: { ...result.query, cursor: null },
      });
      setMessage(t("rfxWorkspace.discovery.saved.confirmed"));
      router.refresh();
    } catch {
      setMessage(t("rfxWorkspace.discovery.actionError"));
    } finally {
      setBusy(null);
    }
  }

  async function setWatch(item: OpportunityDiscoveryItem) {
    setBusy("watch");
    setMessage(null);
    try {
      await post({ action: "set-watch", commandId: crypto.randomUUID(), reference: item.reference, watching: !item.watched });
      setMessage(item.watched ? t("rfxWorkspace.discovery.watch.removed") : t("rfxWorkspace.discovery.watch.confirmed"));
      router.refresh();
    } catch {
      setMessage(t("rfxWorkspace.discovery.actionError"));
    } finally {
      setBusy(null);
    }
  }

  async function updateSavedSearch(savedSearch: OpportunityDiscoveryResult["savedSearches"][number], status: "active" | "paused" | "deleted") {
    setBusy(`saved-${savedSearch.id}`);
    setMessage(null);
    try {
      await post({
        action: "save-search",
        commandId: crypto.randomUUID(),
        savedSearchId: savedSearch.id,
        expectedVersion: savedSearch.version,
        label: savedSearch.label,
        alertPolicy: savedSearch.alertPolicy,
        query: savedSearch.query,
        status,
      });
      setMessage(t("rfxWorkspace.discovery.saved.updated"));
      router.refresh();
    } catch {
      setMessage(t("rfxWorkspace.discovery.actionError"));
    } finally {
      setBusy(null);
    }
  }

  const selectedMarkerId = selected ? markerId(selected.reference) : null;
  return (
    <ParticipantShell activeItem="opportunities-rfx">
      <SpatialWorkspace ariaLabel={t("rfxWorkspace.discovery.ariaLabel")}>
        <ExchangeSpatialScene
          model={model}
          mode="locality"
          marker={homeMarker}
          opportunityMarkers={opportunityMarkers}
          focusedMarkerId={selectedMarkerId}
          onOpportunityMarkerSelect={(id) => select(result.items.find((item) => markerId(item.reference) === id) ?? null)}
          initialCamera={spatialContext.camera}
          onCameraChange={(camera) => updateSpatialContext((current) => Object.freeze({ ...current, activeLens: "opportunities-rfx" as const, camera }))}
          interactive
          showSearch={false}
          workspaceOverlay={selected ? "right" : "left"}
        />

        <MapOverlaySurface position="top-left">
          <section className={styles.search} aria-label={t("rfxWorkspace.discovery.search.ariaLabel")}>
            <div className={styles.heading}>
              <div><p>{t("rfxWorkspace.discovery.eyebrow")}</p><h1>{t("rfxWorkspace.discovery.title")}</h1></div>
              <nav className={styles.headingActions} aria-label={t("rfxWorkspace.teaming.navigation")}><Link href="/opportunities/team-invitations">{t("rfxWorkspace.teaming.receivedInvitations")}</Link><Link href="/opportunities/manage">{t("rfxWorkspace.discovery.manage")}</Link></nav>
            </div>
            <form role="search" action="/opportunities" method="get" className={styles.form}>
              <label><span>{t("rfxWorkspace.discovery.search.label")}</span><input name="q" type="search" defaultValue={result.query.text} placeholder={t("rfxWorkspace.discovery.search.placeholder")} /></label>
              <label><span>{t("rfxWorkspace.discovery.detail.requestType")}</span>{(result.query.requestFamilyKeys.length ? result.query.requestFamilyKeys : [""]).map((value, index) => <input key={`requestFamily:${index}:${value}`} data-opportunity-request-family-filter name="requestFamily" defaultValue={value} />)}</label>
              <label><span>{t("rfxWorkspace.capabilitySearch")}</span>{(result.query.capabilityIds.length ? result.query.capabilityIds : [""]).map((value, index) => <input key={`capability:${index}:${value}`} data-opportunity-capability-filter name="capability" defaultValue={value} />)}</label>
              <label><span>{t("rfxWorkspace.discovery.detail.location")}</span>{(result.query.localityIds.length ? result.query.localityIds : [""]).map((value, index) => <input key={`locality:${index}:${value}`} data-opportunity-locality-filter name="locality" defaultValue={value} placeholder={index === 0 ? spatialScope.geographyId : undefined} />)}</label>
              <label><span>{t("rfxWorkspace.discovery.search.deadline")}</span><select name="deadline" defaultValue={result.query.deadlineWindow}><option value="all-open">{t("rfxWorkspace.discovery.search.allOpen")}</option><option value="next-7-days">{t("rfxWorkspace.discovery.search.next7")}</option><option value="next-30-days">{t("rfxWorkspace.discovery.search.next30")}</option></select></label>
              <label className={styles.check}><input name="watched" type="checkbox" value="true" defaultChecked={result.query.watched === true} /><span>{t("rfxWorkspace.discovery.search.watched")}</span></label>
              <div className={styles.actions}><button type="submit">{t("rfxWorkspace.discovery.search.submit")}</button><Link href="/opportunities">{t("rfxWorkspace.discovery.search.clear")}</Link></div>
            </form>
            <div className={styles.summary} aria-live="polite"><strong>{t("rfxWorkspace.discovery.search.count", { count: result.items.length })}</strong><span>{t("rfxWorkspace.discovery.search.truth")}</span></div>
            <section className={styles.deadlines} aria-labelledby="opportunity-deadline-view-title"><h2 id="opportunity-deadline-view-title">{t("rfxWorkspace.discovery.deadlines.title")}</h2><ul><li><strong>{result.deadlines.next7Days.length}</strong><span>{t("rfxWorkspace.discovery.deadlines.next7")}</span></li><li><strong>{result.deadlines.next30Days.length}</strong><span>{t("rfxWorkspace.discovery.deadlines.next30")}</span></li><li><strong>{result.deadlines.later.length}</strong><span>{t("rfxWorkspace.discovery.deadlines.later")}</span></li></ul><p>{t("rfxWorkspace.discovery.deadlines.source")}</p></section>
            {result.items.length ? <ul className={styles.results} aria-label={t("rfxWorkspace.discovery.resultsLabel")}>{result.items.map((item) => <li key={item.reference}><button type="button" aria-pressed={selected?.reference === item.reference} data-opportunity-reference={item.reference} onClick={() => select(item)}><span><strong>{item.title}</strong><small>{item.issuerDisplayName}</small></span><span>{item.localities.map((locality) => locality.label).join(" · ")}</span><span>{t("rfxWorkspace.discovery.deadline", { date: item.responseDeadline })}</span></button></li>)}</ul> : result.nextCursor ? <StatePanel state="loading" title={t("rfxWorkspace.discovery.more")}><span data-opportunity-scan-incomplete>{t("rfxWorkspace.discovery.search.truth")}</span></StatePanel> : <StatePanel state="empty" title={t("rfxWorkspace.discovery.emptyTitle")}>{t("rfxWorkspace.discovery.emptyBody")}</StatePanel>}
            {result.nextCursor ? <Link className={styles.more} href={queryHref(result, null, result.nextCursor)}>{t("rfxWorkspace.discovery.more")}</Link> : null}
            <details className={styles.save}><summary>{t("rfxWorkspace.discovery.saved.action")}</summary><label><span>{t("rfxWorkspace.discovery.saved.label")}</span><input value={saveLabel} onChange={(event) => setSaveLabel(event.target.value)} maxLength={80} /></label><label><span>{t("rfxWorkspace.discovery.saved.alertPolicy")}</span><select value={alertPolicy} onChange={(event) => setAlertPolicy(event.target.value)}><option value="off">{t("rfxWorkspace.discovery.saved.off")}</option><option value="immediate">{t("rfxWorkspace.discovery.saved.immediate")}</option><option value="daily-digest">{t("rfxWorkspace.discovery.saved.daily")}</option></select></label><button type="button" disabled={busy !== null || !saveLabel.trim()} onClick={saveSearch}>{busy === "save" ? t("rfxWorkspace.discovery.pending") : t("rfxWorkspace.discovery.saved.confirm")}</button>{result.savedSearches.length ? <p>{t("rfxWorkspace.discovery.saved.count", { count: result.savedSearches.length })}</p> : null}</details>
            {result.savedSearches.length ? <ul className={styles.savedList} aria-label={t("rfxWorkspace.discovery.saved.listLabel")}>{result.savedSearches.map((savedSearch) => <li key={savedSearch.id}><span><strong>{savedSearch.label}</strong><small>{savedSearch.status}</small></span><span><button type="button" disabled={busy !== null} onClick={() => updateSavedSearch(savedSearch, savedSearch.status === "paused" ? "active" : "paused")}>{savedSearch.status === "paused" ? t("rfxWorkspace.discovery.saved.resume") : t("rfxWorkspace.discovery.saved.pause")}</button><button type="button" disabled={busy !== null} onClick={() => updateSavedSearch(savedSearch, "deleted")}>{t("rfxWorkspace.discovery.saved.delete")}</button></span></li>)}</ul> : null}
            {message ? <p role="status" className={styles.message}>{message}</p> : null}
          </section>
        </MapOverlaySurface>

        {selected ? <ResponsiveEdgeSheet ariaLabelledBy="opportunity-detail-title" side="right" width="standard"><article className={styles.detail} data-selected-opportunity-reference={selected.reference}><header><div><p>{t("rfxWorkspace.discovery.detail.eyebrow")}</p><h2 id="opportunity-detail-title">{selected.title}</h2></div><button type="button" onClick={() => select(null)} aria-label={t("rfxWorkspace.discovery.detail.close")}>×</button></header><div className={styles.pills}><StatusPill tone="information">{t("rfxWorkspace.discovery.detail.discovered")}</StatusPill>{selected.deadlineState === "due-soon" ? <StatusPill tone="connection">{t("rfxWorkspace.discovery.detail.dueSoon")}</StatusPill> : null}</div><p>{selected.summary}</p><dl><div><dt>{t("rfxWorkspace.discovery.detail.issuer")}</dt><dd>{selected.issuerDisplayName}</dd></div><div><dt>{t("rfxWorkspace.discovery.detail.requestType")}</dt><dd>{selected.requestFamilyLabel}</dd></div><div><dt>{t("rfxWorkspace.discovery.detail.location")}</dt><dd>{selected.localities.map((locality) => locality.label).join(" · ")}</dd></div><div><dt>{t("rfxWorkspace.discovery.detail.deadline")}</dt><dd>{selected.responseDeadline}</dd></div></dl><section><h3>{t("rfxWorkspace.discovery.detail.requirements")}</h3><ul>{selected.projection.payload.requirements.map((requirement, index) => <li key={`${requirement.title}-${index}`}><strong>{requirement.title}</strong><span>{requirement.description}</span></li>)}</ul></section><ExchangeRoomActionController
          activeLens="opportunities-rfx"
          actions={exchangeActions}
          onNetworkFocus={() => undefined}
          onActionIntent={(intent) => {
            if (intent === "opportunity-watch" && busy === null) void setWatch(selected);
          }}
          placement="sheet"
        /><p className={styles.disclaimer}>{t("rfxWorkspace.discovery.detail.disclaimer")}</p></article></ResponsiveEdgeSheet> : null}
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
