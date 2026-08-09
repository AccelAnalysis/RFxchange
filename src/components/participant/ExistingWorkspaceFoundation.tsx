"use client";

import Link from "next/link";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type {
  NetworkDiscoveryOrganization,
  NetworkDiscoveryProjection,
} from "../../application/network-discovery/network-discovery";
import {
  createExistingWorkspaceState,
  existingWorkspaceStorageKey,
  parseExistingWorkspaceState,
  serializeExistingWorkspaceState,
  type ExistingWorkspaceState,
} from "../../application/participant/existing-workspace-state";
import type { NetworkServiceAreaOption } from "../../infrastructure/network-discovery/runtime";
import { formatDate } from "../../i18n/format";
import { useI18n } from "../i18n/I18nProvider";
import {
  ExchangeSpatialScene,
  type ExchangeHomeMarker,
} from "../map/ExchangeSpatialScene";
import {
  AlertBanner,
  ObjectCard,
  StatePanel,
  StatusPill,
} from "../ui";
import {
  MapOverlaySurface,
  ParticipantShell,
  ResponsiveEdgeSheet,
  SpatialWorkspace,
} from "./ParticipantWorkspace";

import styles from "./ExistingWorkspaceFoundation.module.css";

export type ExistingWorkspaceStatus =
  | "ready"
  | "loading"
  | "empty"
  | "error"
  | "permission"
  | "expired"
  | "recovery";

interface ExistingWorkspaceFoundationProps {
  readonly model: ControlledLocalityMapModel;
  readonly homeMarker: ExchangeHomeMarker;
  readonly organizationId: string;
  readonly discovery?: NetworkDiscoveryProjection | null;
  readonly serviceAreaOptions?: readonly NetworkServiceAreaOption[];
  readonly status?: ExistingWorkspaceStatus;
}

const WORKSPACE_STATE_EVENT = "rfxchange:existing-workspace-state";
const workspaceMemoryStore = new Map<string, string>();

function readWorkspaceSnapshot(storageKey: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored !== null) {
      workspaceMemoryStore.set(storageKey, stored);
      return stored;
    }
  } catch {
    // Browser UI-state storage may be unavailable. Authority and domain state do not depend on it.
  }
  return workspaceMemoryStore.get(storageKey) ?? fallback;
}

function persistWorkspaceSnapshot(storageKey: string, state: ExistingWorkspaceState): void {
  const snapshot = serializeExistingWorkspaceState(state);
  workspaceMemoryStore.set(storageKey, snapshot);
  try {
    window.localStorage.setItem(storageKey, snapshot);
  } catch {
    // UI state persistence is optional and never affects authority or domain state.
  }
  window.dispatchEvent(new CustomEvent(WORKSPACE_STATE_EVENT, { detail: storageKey }));
}

function buildDiscoveryUrl(input: Readonly<{
  organizationId: string;
  capability: string;
  serviceAreaId: string | null;
  page?: number;
}>): string {
  const params = new URLSearchParams({ organizationId: input.organizationId });
  if (input.capability) params.set("q", input.capability);
  if (input.serviceAreaId) params.set("serviceArea", input.serviceAreaId);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  return `/geography/canvas?${params.toString()}`;
}

function visibleLocation(
  organization: NetworkDiscoveryOrganization,
  labels: Readonly<{
    approximate: string;
    localityOnly: string;
  }>,
): string {
  const location = organization.profile.location;
  if (location.visibility === "exact") {
    const address = location.displayAddress;
    return [
      address.addressLine1,
      address.addressLine2,
      `${address.locality}, ${address.regionCode} ${address.postalCode}`,
    ].filter(Boolean).join(", ");
  }
  if (location.visibility === "approximate") {
    return `${location.localityName} · ${labels.approximate}`;
  }
  return `${location.localityName} · ${labels.localityOnly}`;
}

function WorkspaceBoundary({ status }: Readonly<{ status: Exclude<ExistingWorkspaceStatus, "ready"> }>) {
  const { t } = useI18n();
  const actionHref: Partial<Record<Exclude<ExistingWorkspaceStatus, "ready">, string>> = {
    empty: "/join",
    error: "/geography/canvas",
    permission: "/geography/canvas",
    expired: "/signin?returnTo=%2Fgeography%2Fcanvas",
    recovery: "/join",
  };
  const href = actionHref[status];
  return (
    <ParticipantShell activeItem="Intelligence">
      <main className={styles.stateWorkspace} aria-label={t("networkWorkspace.status.ariaLabel")}>
        <StatePanel
          state={status}
          title={t(`networkWorkspace.status.${status}.title`)}
          action={href
            ? <Link className={styles.stateAction} href={href}>{t(`networkWorkspace.status.${status}.action`)}</Link>
            : undefined}
        >
          {t(`networkWorkspace.status.${status}.body`)}
        </StatePanel>
      </main>
    </ParticipantShell>
  );
}

export function ExistingWorkspaceFoundation({
  model,
  homeMarker,
  organizationId,
  discovery = null,
  serviceAreaOptions = [],
  status = "ready",
}: ExistingWorkspaceFoundationProps) {
  const { locale, t } = useI18n();
  const storageKey = useMemo(
    () => existingWorkspaceStorageKey(organizationId),
    [organizationId],
  );
  const fallbackState = useMemo(
    () => createExistingWorkspaceState({ organizationId, selectedObjectId: homeMarker.id }),
    [homeMarker.id, organizationId],
  );
  const fallbackSnapshot = useMemo(
    () => serializeExistingWorkspaceState(fallbackState),
    [fallbackState],
  );
  const authorizedObjectIds = useMemo(
    () => new Set([
      homeMarker.id,
      ...(discovery?.organizations.map((organization) => organization.marker.id) ?? []),
    ]),
    [discovery?.organizations, homeMarker.id],
  );

  const subscribe = useCallback((onStoreChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) onStoreChange();
    };
    const handleWorkspaceState = (event: Event) => {
      if ((event as CustomEvent<string>).detail === storageKey) onStoreChange();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(WORKSPACE_STATE_EVENT, handleWorkspaceState);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(WORKSPACE_STATE_EVENT, handleWorkspaceState);
    };
  }, [storageKey]);

  const getSnapshot = useCallback(
    () => readWorkspaceSnapshot(storageKey, fallbackSnapshot),
    [fallbackSnapshot, storageKey],
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => fallbackSnapshot,
  );
  const workspaceState = useMemo(() => {
    const restored = parseExistingWorkspaceState(snapshot, organizationId);
    return restored && authorizedObjectIds.has(restored.selectedObjectId)
      ? restored
      : fallbackState;
  }, [authorizedObjectIds, fallbackState, organizationId, snapshot]);

  if (status !== "ready") return <WorkspaceBoundary status={status} />;

  const panelOpen = workspaceState.panelOpen;
  const selectedHome = workspaceState.selectedObjectId === homeMarker.id;
  const selectedOrganization = discovery?.organizations.find(
    (organization) => organization.marker.id === workspaceState.selectedObjectId,
  ) ?? null;
  const locality = model.selectedGeography.name;
  const locationLabel = homeMarker.accessibleLocationLabel ?? `${locality} organization location`;
  const serviceAreaNames = new Map(serviceAreaOptions.map((option) => [option.id, option.name]));
  const networkMarkers = discovery?.organizations.map((organization) => organization.marker) ?? [];

  const selectObject = (selectedObjectId: string, panelOpenValue = true) => {
    if (!authorizedObjectIds.has(selectedObjectId)) return;
    persistWorkspaceSnapshot(storageKey, createExistingWorkspaceState({
      organizationId,
      selectedObjectId,
      panelOpen: panelOpenValue,
      viewportIntent: selectedObjectId === homeMarker.id ? "organization-home" : "selected-object",
    }));
  };

  const updatePanel = (panelOpenValue: boolean) => {
    persistWorkspaceSnapshot(storageKey, createExistingWorkspaceState({
      organizationId,
      selectedObjectId: workspaceState.selectedObjectId,
      panelOpen: panelOpenValue,
      viewportIntent: workspaceState.viewportIntent,
    }));
  };

  const query = discovery?.query;
  const capability = query?.capability ?? "";
  const serviceAreaId = query?.serviceGeographyId ?? null;
  const clearHref = buildDiscoveryUrl({ organizationId, capability: "", serviceAreaId: null });
  const locationLabels = {
    approximate: t("networkWorkspace.detail.approximateLocation"),
    localityOnly: t("networkWorkspace.detail.localityOnlyLocation"),
  };

  return (
    <ParticipantShell activeItem="Intelligence">
      <SpatialWorkspace ariaLabel={t("networkWorkspace.ariaLabel")}>
        <ExchangeSpatialScene
          model={model}
          mode="organization"
          marker={homeMarker}
          organizationMarkers={networkMarkers}
          focusedMarkerId={workspaceState.selectedObjectId}
          onOrganizationMarkerSelect={(markerId) => selectObject(markerId)}
          interactive
          showSearch={false}
          workspaceOverlay={panelOpen ? "right" : "left"}
        />

        {discovery ? (
          <MapOverlaySurface position="top-left">
            <section className={styles.networkSearch} aria-label={t("networkWorkspace.search.ariaLabel")}>
              <form className={styles.networkForm} role="search" method="get" action="/geography/canvas">
                <input type="hidden" name="organizationId" value={organizationId} />
                <label className={styles.networkField}>
                  <span>{t("networkWorkspace.search.capabilityLabel")}</span>
                  <input
                    type="search"
                    name="q"
                    defaultValue={capability}
                    placeholder={t("networkWorkspace.search.placeholder")}
                    autoComplete="off"
                  />
                </label>
                <div className={styles.networkFilterGrid}>
                  <div className={styles.networkField}>
                    <span>{t("networkWorkspace.search.basedIn")}</span>
                    <strong>{locality}</strong>
                  </div>
                  <label className={styles.networkField}>
                    <span>{t("networkWorkspace.search.serviceArea")}</span>
                    <select name="serviceArea" defaultValue={serviceAreaId ?? ""}>
                      <option value="">{t("networkWorkspace.search.anyServiceArea")}</option>
                      {serviceAreaOptions.map((option) => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className={styles.networkSearchActions}>
                  <button className={styles.primaryAction} type="submit">{t("networkWorkspace.search.submit")}</button>
                  {(capability || serviceAreaId) ? (
                    <Link className={styles.secondaryAction} href={clearHref}>{t("networkWorkspace.search.clear")}</Link>
                  ) : null}
                </div>
              </form>

              <div className={styles.networkResultSummary} aria-live="polite">
                <strong>{t("networkWorkspace.search.resultCount", { count: discovery.totalMatched })}</strong>
                <span>{t("networkWorkspace.search.lowDensity")}</span>
              </div>

              {discovery.organizations.length > 0 ? (
                <ul className={styles.networkResults} aria-label={t("networkWorkspace.search.listLabel")}>
                  {discovery.organizations.map((organization) => {
                    const selected = organization.marker.id === workspaceState.selectedObjectId;
                    const matchLabel = organization.match.kind === "capability"
                      ? t("networkWorkspace.match.capability")
                      : organization.match.kind === "organization-name"
                        ? t("networkWorkspace.match.organizationName")
                        : t("networkWorkspace.match.browse");
                    return (
                      <li key={organization.organizationId}>
                        <button
                          type="button"
                          className={styles.networkResultButton}
                          data-selected={selected}
                          aria-pressed={selected}
                          onClick={() => selectObject(organization.marker.id)}
                        >
                          <span className={styles.resultHeading}>
                            <strong>{organization.profile.displayName}</strong>
                            <small>{matchLabel}</small>
                          </span>
                          <span className={styles.resultCapabilities}>
                            {(organization.match.matchedCapabilityNames.length > 0
                              ? organization.match.matchedCapabilityNames
                              : organization.capabilities.length > 0
                                ? organization.capabilities.map((item) => item.label)
                                : organization.profile.capabilities.map((item) => item.name)
                            ).slice(0, 3).join(" · ")}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <StatePanel state="empty" title={t("networkWorkspace.search.noResultsTitle")}>
                  {t("networkWorkspace.search.noResultsBody")}
                </StatePanel>
              )}

              {discovery.pageCount > 1 ? (
                <nav className={styles.networkPagination} aria-label={t("networkWorkspace.search.paginationLabel")}>
                  {discovery.hasPreviousPage ? (
                    <Link href={buildDiscoveryUrl({
                      organizationId,
                      capability,
                      serviceAreaId,
                      page: discovery.page - 1,
                    })}>{t("networkWorkspace.search.previous")}</Link>
                  ) : <span />}
                  <span>{t("networkWorkspace.search.page", { page: discovery.page, pageCount: discovery.pageCount })}</span>
                  {discovery.hasNextPage ? (
                    <Link href={buildDiscoveryUrl({
                      organizationId,
                      capability,
                      serviceAreaId,
                      page: discovery.page + 1,
                    })}>{t("networkWorkspace.search.next")}</Link>
                  ) : <span />}
                </nav>
              ) : null}
              <p className={styles.matchDisclaimer}>{t("networkWorkspace.match.disclaimer")}</p>
            </section>
          </MapOverlaySurface>
        ) : null}

        <div className={styles.workspaceActions}>
          <button
            type="button"
            className={styles.organizationHomeButton}
            onClick={() => selectObject(homeMarker.id)}
            aria-expanded={panelOpen && selectedHome}
            aria-controls="organization-detail-panel"
          >
            <span className={styles.organizationNode} aria-hidden="true">RF</span>
            <span>
              <small>{t("networkWorkspace.home.eyebrow")}</small>
              <strong>{homeMarker.label}</strong>
            </span>
          </button>
        </div>

        {panelOpen ? (
          <ResponsiveEdgeSheet ariaLabelledBy="organization-detail-title" side="right" width="standard">
            <div id="organization-detail-panel" className={styles.organizationHome}>
              <div className={styles.sheetHeader}>
                <div>
                  <p className={styles.eyebrow}>
                    {selectedOrganization
                      ? t("networkWorkspace.detail.eyebrow")
                      : t("networkWorkspace.home.eyebrow")}
                  </p>
                  <h1 id="organization-detail-title">
                    {selectedOrganization?.profile.displayName ?? homeMarker.label}
                  </h1>
                </div>
                <button type="button" className={styles.closeButton} onClick={() => updatePanel(false)}>
                  <span aria-hidden="true">×</span>
                  <span className={styles.srOnly}>{t("networkWorkspace.detail.close")}</span>
                </button>
              </div>

              {selectedOrganization ? (
                <>
                  <div className={styles.statusRow}>
                    <StatusPill tone="information">
                      {selectedOrganization.match.kind === "capability"
                        ? t("networkWorkspace.match.capability")
                        : selectedOrganization.match.kind === "organization-name"
                          ? t("networkWorkspace.match.organizationName")
                          : t("networkWorkspace.match.browse")}
                    </StatusPill>
                    <StatusPill tone="connection">{locality}</StatusPill>
                  </div>

                  <dl className={styles.organizationFacts}>
                    <div>
                      <dt>{t("networkWorkspace.detail.baseLocality")}</dt>
                      <dd>{selectedOrganization.profile.location.localityName}</dd>
                    </div>
                    <div>
                      <dt>{t("networkWorkspace.detail.visibleLocation")}</dt>
                      <dd>{visibleLocation(selectedOrganization, locationLabels)}</dd>
                    </div>
                    <div>
                      <dt>{t("networkWorkspace.detail.serviceAreas")}</dt>
                      <dd>
                        {selectedOrganization.serviceGeographyIds.length > 0
                          ? selectedOrganization.serviceGeographyIds
                              .map((id) => serviceAreaNames.get(id) ?? id)
                              .join(" · ")
                          : t("networkWorkspace.detail.noServiceAreas")}
                      </dd>
                    </div>
                  </dl>

                  <section className={styles.capabilitySection} aria-labelledby="capability-list-title">
                    <p className={styles.eyebrow}>{t("networkWorkspace.detail.capabilities")}</p>
                    <h2 id="capability-list-title">
                      {selectedOrganization.capabilities.length > 0
                        ? "Confirmed organization capability claims"
                        : t("networkWorkspace.detail.capabilityEvidence")}
                    </h2>
                    <ul className={styles.capabilityList}>
                      {selectedOrganization.capabilities.length > 0
                        ? selectedOrganization.capabilities.map((capabilityItem) => (
                            <li key={capabilityItem.id}>
                              <strong>{capabilityItem.label}</strong>
                              <span>{capabilityItem.domainLabel} → {capabilityItem.familyLabel}</span>
                              <small>{capabilityItem.provenanceLabel} · {capabilityItem.assertionStatus.replaceAll("_", " ")} · not independently verified</small>
                            </li>
                          ))
                        : selectedOrganization.profile.capabilities.map((capabilityItem) => (
                            <li key={capabilityItem.id}>
                              <strong>{capabilityItem.name}</strong>
                              <span>{capabilityItem.description}</span>
                              <small>Legacy activation profile capability</small>
                            </li>
                          ))}
                    </ul>
                  </section>

                  <section className={styles.publicContact} aria-labelledby="public-contact-title">
                    <p className={styles.eyebrow}>{t("networkWorkspace.detail.publicContact")}</p>
                    <h2 id="public-contact-title">
                      {selectedOrganization.profile.mainContact?.displayName
                        ?? t("networkWorkspace.detail.contactUnavailable")}
                    </h2>
                    {selectedOrganization.profile.mainContact ? (
                      <p>
                        {selectedOrganization.profile.mainContact.roleTitle} · {selectedOrganization.profile.mainContact.email}
                      </p>
                    ) : null}
                    {selectedOrganization.profile.website ? (
                      <p>
                        <a href={selectedOrganization.profile.website} target="_blank" rel="noreferrer">
                          {t("networkWorkspace.detail.website")}
                        </a>
                      </p>
                    ) : null}
                  </section>

                  <AlertBanner title={t("networkWorkspace.detail.profileEvidenceTitle")} tone="information">
                    {t("networkWorkspace.detail.profileEvidence")}
                  </AlertBanner>
                </>
              ) : (
                <>
                  <div className={styles.statusRow}>
                    <StatusPill tone="positive">{t("networkWorkspace.home.activeNode")}</StatusPill>
                    <StatusPill tone="connection">{locality}</StatusPill>
                  </div>

                  <ObjectCard
                    eyebrow={t("networkWorkspace.home.visibleNow")}
                    title={t("networkWorkspace.home.positionTitle")}
                    tone="connection"
                    status={selectedHome ? <StatusPill tone="information">{t("networkWorkspace.home.selected")}</StatusPill> : null}
                    metadata={<span>{t("networkWorkspace.home.projectionMetadata")}</span>}
                  >
                    <dl className={styles.organizationFacts}>
                      <div>
                        <dt>{t("networkWorkspace.home.locality")}</dt>
                        <dd>{locality}</dd>
                      </div>
                      <div>
                        <dt>{t("networkWorkspace.home.visibleLocation")}</dt>
                        <dd>{locationLabel}</dd>
                      </div>
                      <div>
                        <dt>{t("networkWorkspace.home.mapSource")}</dt>
                        <dd>{model.attribution.label} · {model.attribution.vintage}</dd>
                      </div>
                      <div>
                        <dt>{t("networkWorkspace.home.viewport")}</dt>
                        <dd>{t("networkWorkspace.home.viewportBody")}</dd>
                      </div>
                    </dl>
                    <div className={styles.cardActions}>
                      <Link className={styles.primaryAction} href="/organization-profile">
                        {t("networkWorkspace.home.manageProfile")}
                      </Link>
                    </div>
                  </ObjectCard>

                  <AlertBanner title={t("networkWorkspace.home.scopeTitle")} tone="information">
                    {t("networkWorkspace.home.scopeBody")}
                  </AlertBanner>
                </>
              )}

              <section className={styles.provenance} aria-labelledby="provenance-title">
                <p className={styles.eyebrow}>{t("networkWorkspace.provenance.eyebrow")}</p>
                <h2 id="provenance-title">{t("networkWorkspace.provenance.title")}</h2>
                <dl>
                  <div>
                    <dt>{t("networkWorkspace.provenance.authority")}</dt>
                    <dd>{model.attribution.label}</dd>
                  </div>
                  <div>
                    <dt>{t("networkWorkspace.provenance.vintage")}</dt>
                    <dd>{model.attribution.vintage}</dd>
                  </div>
                  <div>
                    <dt>{t("networkWorkspace.provenance.retrieved")}</dt>
                    <dd>{formatDate(locale, model.attribution.retrievedAt)}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </ResponsiveEdgeSheet>
        ) : null}
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
