"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type {
  NetworkDiscoveryOrganization,
  NetworkDiscoveryProjection,
} from "../../application/network-discovery/network-discovery";
import type { ParticipantSpatialScope } from "../../application/participant/participant-spatial-context";
import { projectOrganizationActions } from "../../application/participant/organization-actions";
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
import { useParticipantSpatialContext } from "./useParticipantSpatialContext";

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
  readonly spatialScope: ParticipantSpatialScope;
  readonly discovery?: NetworkDiscoveryProjection | null;
  readonly focusedOrganization?: NetworkDiscoveryOrganization | null;
  readonly serviceAreaOptions?: readonly NetworkServiceAreaOption[];
  readonly officialResourceProviderOrganizationIds?: readonly string[];
  readonly status?: ExistingWorkspaceStatus;
}

function buildDiscoveryUrl(input: Readonly<{
  organizationId: string;
  capability: string;
  serviceAreaId: string | null;
  selectedOrganizationId?: string | null;
  page?: number;
}>): string {
  const params = new URLSearchParams({ organizationId: input.organizationId });
  if (input.capability) params.set("q", input.capability);
  if (input.serviceAreaId) params.set("serviceArea", input.serviceAreaId);
  if (input.selectedOrganizationId) params.set("selectedOrganization", input.selectedOrganizationId);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  return `/geography/canvas?${params.toString()}`;
}

function visibleLocation(
  organization: NetworkDiscoveryOrganization,
  labels: Readonly<{
    near: string;
    inLocality: string;
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
    return labels.near.replace("{locality}", location.localityName);
  }
  return labels.inLocality.replace("{locality}", location.localityName);
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
    <ParticipantShell activeItem="Network">
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
  spatialScope,
  discovery = null,
  focusedOrganization = null,
  serviceAreaOptions = [],
  officialResourceProviderOrganizationIds = [],
  status = "ready",
}: ExistingWorkspaceFoundationProps) {
  const { locale, t } = useI18n();
  const [spatialContext, updateSpatialContext] = useParticipantSpatialContext({
    scope: spatialScope,
    homeMarkerId: homeMarker.id,
    activeLens: "intelligence",
  });
  const resultListRef = useRef<HTMLUListElement | null>(null);
  const appliedFocusedOrganizationIdRef = useRef<string | null>(null);
  const organizationsByMarkerId = useMemo(() => new Map(
    [
      ...(discovery?.organizations ?? []),
      ...(focusedOrganization ? [focusedOrganization] : []),
    ].map((organization) => [organization.marker.id, organization]),
  ), [discovery?.organizations, focusedOrganization]);
  const authorizedObjectIds = useMemo(() => new Set([homeMarker.id, ...organizationsByMarkerId.keys()]), [homeMarker.id, organizationsByMarkerId]);
  const restoredSelectionIsAuthorized = authorizedObjectIds.has(spatialContext.selection.markerId);
  const selectedObjectId = restoredSelectionIsAuthorized
    ? spatialContext.selection.markerId
    : homeMarker.id;

  useEffect(() => {
    if (restoredSelectionIsAuthorized) return;
    updateSpatialContext((current) => Object.freeze({
      ...current,
      selection: Object.freeze({
        organizationId,
        markerId: homeMarker.id,
        relationshipId: null,
      }),
      panelOpen: true,
    }));
  }, [homeMarker.id, organizationId, restoredSelectionIsAuthorized, updateSpatialContext]);
  useEffect(() => {
    if (!focusedOrganization) {
      appliedFocusedOrganizationIdRef.current = null;
      return;
    }
    if (
      appliedFocusedOrganizationIdRef.current === String(focusedOrganization.organizationId)
    ) return;
    appliedFocusedOrganizationIdRef.current = String(focusedOrganization.organizationId);
    updateSpatialContext((current) => Object.freeze({
      ...current,
      activeLens: "intelligence" as const,
      selection: Object.freeze({
        organizationId: String(focusedOrganization.organizationId),
        markerId: focusedOrganization.marker.id,
        relationshipId: null,
      }),
      panelOpen: true,
      originLens: current.activeLens,
    }));
  }, [focusedOrganization, updateSpatialContext]);

  const panelOpen = spatialContext.panelOpen;
  const selectedHome = selectedObjectId === homeMarker.id;
  const selectedOrganization = organizationsByMarkerId.get(selectedObjectId) ?? null;
  const selectedOrganizationId = selectedOrganization ? String(selectedOrganization.organizationId) : organizationId;
  const selectedOrganizationQueryId = selectedHome ? null : selectedOrganizationId;
  const organizationActions = projectOrganizationActions({
    viewerOrganizationId: organizationId,
    selectedOrganizationId,
    officialResourceProvider: officialResourceProviderOrganizationIds.includes(selectedOrganizationId),
  });
  const locality = model.selectedGeography.name;
  const locationLabel = homeMarker.accessibleLocationLabel ?? `${locality} organization location`;
  const serviceAreaNames = new Map(serviceAreaOptions.map((option) => [option.id, option.name]));
  const networkMarkers = [...organizationsByMarkerId.values()].map((organization) => organization.marker);

  const selectObject = (selectedObjectId: string, panelOpenValue = true) => {
    if (!authorizedObjectIds.has(selectedObjectId)) return;
    const selected = organizationsByMarkerId.get(selectedObjectId);
    updateSpatialContext((current) => Object.freeze({
      ...current,
      activeLens: "intelligence" as const,
      selection: Object.freeze({
        organizationId: selected ? String(selected.organizationId) : organizationId,
        markerId: selectedObjectId,
        relationshipId: null,
      }),
      panelOpen: panelOpenValue,
      originLens: current.activeLens,
    }));
  };

  const updatePanel = (panelOpenValue: boolean) => {
    updateSpatialContext((current) => Object.freeze({ ...current, panelOpen: panelOpenValue }));
  };

  const query = discovery?.query;
  const capability = query?.capability ?? "";
  const serviceAreaId = query?.serviceGeographyId ?? null;
  useEffect(() => {
    const page = query?.page ?? 1;
    const returnHref = buildDiscoveryUrl({
      organizationId,
      capability,
      serviceAreaId,
      selectedOrganizationId: selectedOrganizationQueryId,
      page,
    });
    const nextFilterValues: Record<string, string> = {};
    if (serviceAreaId) nextFilterValues.serviceArea = serviceAreaId;
    const nextFilters: Readonly<Record<string, string>> = Object.freeze(nextFilterValues);
    updateSpatialContext((current) => {
      const lensState = current.lensState.intelligence;
      if (
        current.activeLens === "intelligence" &&
        current.returnHref === returnHref &&
        lensState.search === capability &&
        lensState.resultPage === page &&
        lensState.filters.serviceArea === (serviceAreaId ?? undefined)
      ) return current;
      return Object.freeze({
        ...current,
        activeLens: "intelligence" as const,
        returnHref,
        lensState: Object.freeze({
          ...current.lensState,
          intelligence: Object.freeze({
            ...lensState,
            search: capability,
            filters: nextFilters,
            resultPage: page,
            resultIndex: lensState.search === capability && lensState.filters.serviceArea === (serviceAreaId ?? undefined) ? lensState.resultIndex : 0,
            listScrollTop: lensState.search === capability && lensState.filters.serviceArea === (serviceAreaId ?? undefined) ? lensState.listScrollTop : 0,
          }),
        }),
      });
    });
  }, [capability, organizationId, query?.page, selectedOrganizationQueryId, serviceAreaId, updateSpatialContext]);
  useEffect(() => {
    if (resultListRef.current) resultListRef.current.scrollTop = spatialContext.lensState.intelligence.listScrollTop;
  }, [spatialContext.lensState.intelligence.listScrollTop]);
  const clearHref = buildDiscoveryUrl({
    organizationId,
    capability: "",
    serviceAreaId: null,
    selectedOrganizationId: selectedOrganizationQueryId,
  });
  const locationLabels = {
    near: t("networkWorkspace.detail.nearLocation", { locality }),
    inLocality: t("networkWorkspace.detail.inLocality", { locality }),
  };

  if (status !== "ready") return <WorkspaceBoundary status={status} />;

  return (
    <ParticipantShell activeItem="Network">
      <SpatialWorkspace ariaLabel={t("networkWorkspace.ariaLabel")}>
        <ExchangeSpatialScene
          model={model}
          mode="organization"
          marker={homeMarker}
          organizationMarkers={networkMarkers}
          focusedMarkerId={selectedObjectId}
          onOrganizationMarkerSelect={(markerId) => selectObject(markerId)}
          initialCamera={spatialContext.camera}
          onCameraChange={(camera) => updateSpatialContext((current) => Object.freeze({
            ...current,
            activeLens: "intelligence" as const,
            camera,
          }))}
          interactive
          showSearch={false}
          workspaceOverlay={panelOpen ? "right" : "left"}
        />

        {discovery ? (
          <MapOverlaySurface position="top-left">
            <section className={styles.networkSearch} aria-label={t("networkWorkspace.search.ariaLabel")}>
              <form className={styles.networkForm} role="search" method="get" action="/geography/canvas">
                <input type="hidden" name="organizationId" value={organizationId} />
                {selectedOrganizationQueryId ? (
                  <input type="hidden" name="selectedOrganization" value={selectedOrganizationQueryId} />
                ) : null}
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
                <ul
                  ref={resultListRef}
                  className={styles.networkResults}
                  aria-label={t("networkWorkspace.search.listLabel")}
                  onScroll={(event) => {
                    const listScrollTop = Math.max(0, Math.round(event.currentTarget.scrollTop));
                    updateSpatialContext((current) => Object.freeze({
                      ...current,
                      lensState: Object.freeze({
                        ...current.lensState,
                        intelligence: Object.freeze({ ...current.lensState.intelligence, listScrollTop }),
                      }),
                    }));
                  }}
                >
                  {discovery.organizations.map((organization, resultIndex) => {
                    const selected = organization.marker.id === selectedObjectId;
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
                          data-organization-id={String(organization.organizationId)}
                          data-marker-id={organization.marker.id}
                          data-selected={selected}
                          aria-pressed={selected}
                          onClick={() => {
                            selectObject(organization.marker.id);
                            updateSpatialContext((current) => Object.freeze({
                              ...current,
                              lensState: Object.freeze({
                                ...current.lensState,
                                intelligence: Object.freeze({ ...current.lensState.intelligence, resultIndex }),
                              }),
                            }));
                          }}
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
                      selectedOrganizationId: selectedOrganizationQueryId,
                      page: discovery.page - 1,
                    })}>{t("networkWorkspace.search.previous")}</Link>
                  ) : <span />}
                  <span>{t("networkWorkspace.search.page", { page: discovery.page, pageCount: discovery.pageCount })}</span>
                  {discovery.hasNextPage ? (
                    <Link href={buildDiscoveryUrl({
                      organizationId,
                      capability,
                      serviceAreaId,
                      selectedOrganizationId: selectedOrganizationQueryId,
                      page: discovery.page + 1,
                    })}>{t("networkWorkspace.search.next")}</Link>
                  ) : <span />}
                </nav>
              ) : null}
              <p className={styles.matchDisclaimer}>{t("networkWorkspace.match.disclaimer")}</p>
            </section>
          </MapOverlaySurface>
        ) : null}

        {panelOpen ? (
          <ResponsiveEdgeSheet ariaLabelledBy="organization-detail-title" side="right" width="standard">
            <div
              id="organization-detail-panel"
              className={styles.organizationHome}
              data-selected-organization-id={selectedOrganizationId}
            >
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
                      {t("networkWorkspace.detail.capabilityEvidence")}
                    </h2>
                    <ul className={styles.capabilityList}>
                      {selectedOrganization.capabilities.length > 0
                        ? selectedOrganization.capabilities.map((capabilityItem) => (
                            <li key={capabilityItem.id}>
                              <strong>{capabilityItem.label}</strong>
                              <span>{capabilityItem.definition}</span>
                            </li>
                          ))
                        : selectedOrganization.profile.capabilities.map((capabilityItem) => (
                            <li key={capabilityItem.id}>
                              <strong>{capabilityItem.name}</strong>
                              <span>{capabilityItem.description}</span>
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

              <section className={styles.cardActions} aria-label={t("networkWorkspace.detail.actions")}>
                {organizationActions.map((action) => action.availability === "available" && action.href ? (
                  <Link key={action.id} className={styles.secondaryAction} href={action.href} data-organization-action={action.id}>
                    {t(`networkWorkspace.actions.${action.id}`)}
                  </Link>
                ) : (
                  <span key={action.id} aria-disabled="true" data-organization-action={action.id} title={t(`networkWorkspace.actionReasons.${action.reason}`)}>
                    {t(`networkWorkspace.actions.${action.id}`)}
                  </span>
                ))}
              </section>

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
