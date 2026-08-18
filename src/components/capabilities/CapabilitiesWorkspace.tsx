"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import { createExchangeSelectionState } from "../../application/participant/mobile-exchange-contracts";
import type { ExchangeLensSelectableProjection } from "../../application/participant/lens-map-projection-adapter";
import type {
  CapabilitiesExchangeProjection,
  CapabilityOrganizationProjection,
} from "../../application/organizations/capabilities-exchange";
import { capabilitiesLocaleCatalog } from "../../application/organizations/capabilities-locale";
import type { Locale } from "../../i18n/config";
import { ExchangeSpatialScene, type ExchangeHomeMarker } from "../map/ExchangeSpatialScene";
import { ExchangeRoomActionController } from "../participant/ExchangeRoomActionController";
import {
  MapOverlaySurface,
  ParticipantShell,
  ResponsiveEdgeSheet,
  SpatialWorkspace,
} from "../participant/ParticipantWorkspace";

import styles from "./CapabilitiesWorkspace.module.css";

interface CapabilitiesWorkspaceProps {
  readonly model: ControlledLocalityMapModel;
  readonly homeMarker: ExchangeHomeMarker;
  readonly projection: CapabilitiesExchangeProjection;
  readonly serviceAreaOptions: readonly Readonly<{ id: string; label: string }>[];
  readonly locale: Locale;
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function CapabilitiesWorkspace({
  model,
  homeMarker,
  projection,
  serviceAreaOptions,
  locale,
}: CapabilitiesWorkspaceProps) {
  const copy = capabilitiesLocaleCatalog(locale);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [comparisonIds, setComparisonIds] = useState<readonly string[]>([]);
  const selected = projection.organizations.find(
    (organization) => organization.organizationId === projection.selectedOrganizationId,
  ) ?? null;
  const detailSelected = projection.domainQuery.selectedOrganizationId === projection.selectedOrganizationId
    ? selected
    : null;
  const selection = useMemo(() => selected
    ? createExchangeSelectionState({
        kind: "organization",
        source: "restored",
        selectedOrganization: {
          selectionKey: selected.card.identity.selectionKey,
          organizationId: selected.organizationId,
        },
        selectedMarker: {
          selectionKey: selected.card.identity.selectionKey,
          markerId: selected.markerId,
        },
      })
    : createExchangeSelectionState({ kind: "none" }), [selected]);
  const compared = comparisonIds.flatMap((id) => {
    const organization = projection.organizations.find((candidate) => candidate.organizationId === id);
    return organization ? [organization] : [];
  });

  const navigateToOrganization = (organizationId: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (organizationId) next.set("selectedOrganization", organizationId);
    else next.delete("selectedOrganization");
    router.push(`${pathname}?${next.toString()}`);
  };
  const selectMapObject = (object: ExchangeLensSelectableProjection) => {
    if (object.kind !== "area" && object.identity.organizationId) navigateToOrganization(object.identity.organizationId);
  };
  const toggleComparison = (organizationId: string) => {
    setComparisonIds((current) => current.includes(organizationId)
      ? current.filter((id) => id !== organizationId)
      : [...current.slice(-1), organizationId]);
  };

  return (
    <ParticipantShell activeItem="capabilities" organizationName={homeMarker.label}>
      <SpatialWorkspace ariaLabel={copy.title} className={styles.workspace}>
        <ExchangeSpatialScene
          model={model}
          mode="organization"
          marker={homeMarker}
          lensProjection={projection.discovery.map}
          lensSelection={selection}
          onLensProjectionSelect={selectMapObject}
          interactive
          workspaceOverlay="right"
          className={styles.map}
        />
        <MapOverlaySurface position="top-left">
          <form action="/capabilities" className={styles.search}>
            <div className={styles.heading}>
              <p>{copy.eyebrow}</p>
              <h1>{copy.title}</h1>
              <span>{copy.introduction}</span>
            </div>
            <label>
              <span>{copy.searchLabel}</span>
              <input name="q" defaultValue={projection.domainQuery.search} placeholder={copy.searchPlaceholder} />
            </label>
            <div className={styles.filterRow}>
              <label>
                <span>{copy.serviceAreaLabel}</span>
                <select name="serviceArea" defaultValue={projection.domainQuery.serviceGeographyId ?? ""}>
                  <option value="">All permitted areas</option>
                  {serviceAreaOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <label>
                <span>{copy.evidenceLabel}</span>
                <select name="evidence" defaultValue={projection.domainQuery.evidence}>
                  <option value="all">All</option>
                  <option value="self-reported">Self-reported</option>
                  <option value="evidence-submitted">Evidence submitted</option>
                  <option value="verified">Verified assertions</option>
                </select>
              </label>
            </div>
            <button type="submit">{copy.submitSearch}</button>
          </form>
        </MapOverlaySurface>

        <aside className={styles.results} aria-labelledby="capability-results-title">
          <div className={styles.resultsHeader}>
            <div><p>{copy.resultsTitle}</p><h2 id="capability-results-title">{projection.organizations.length}</h2></div>
            <ExchangeRoomActionController
              activeLens="capabilities"
              actions={projection.actionProjections}
              onNetworkFocus={() => undefined}
            />
          </div>
          {projection.organizations.length === 0 ? (
            <div className={styles.empty}><h3>{copy.emptyTitle}</h3><p>{copy.emptyBody}</p></div>
          ) : (
            <ul className={styles.cardList}>
              {projection.organizations.map((organization) => (
                <li key={organization.organizationId}>
                  <button
                    type="button"
                    className={organization.organizationId === projection.selectedOrganizationId ? styles.selectedCard : styles.card}
                    onClick={() => navigateToOrganization(organization.organizationId)}
                    aria-pressed={organization.organizationId === projection.selectedOrganizationId}
                  >
                    <span>{organization.ownOrganization ? copy.ownOrganization : copy.externalOrganization}</span>
                    <strong>{organization.organizationName}</strong>
                    <small>{organization.locality}</small>
                    <p>{organization.claims.slice(0, 3).map((claim) => claim.label).join(" · ") || copy.card.emptySummary}</p>
                    <em>{copy.readiness[organization.readiness]}</em>
                  </button>
                  {!organization.ownOrganization ? (
                    <button type="button" className={styles.compare} onClick={() => toggleComparison(organization.organizationId)}>
                      {comparisonIds.includes(organization.organizationId) ? copy.comparisonRemove : copy.comparisonTitle}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <Catalog copy={copy} projection={projection} />
          {compared.length > 0 ? <Comparison copy={copy} organizations={compared} /> : null}
        </aside>

        {detailSelected ? (
          <ResponsiveEdgeSheet ariaLabelledBy="capability-detail-title" side="right" width="standard">
            <article className={styles.detail} data-capability-organization={detailSelected.organizationId}>
              <header>
                <div><p>{detailSelected.ownOrganization ? copy.ownOrganization : copy.externalOrganization}</p><h2 id="capability-detail-title">{detailSelected.organizationName}</h2></div>
                <button type="button" onClick={() => navigateToOrganization(null)} aria-label={copy.closeDetail}>×</button>
              </header>
              <p className={styles.disclaimer}>{copy.comparisonDisclaimer}</p>
              <section><h3>{copy.assertionsTitle}</h3>{detailSelected.claims.length === 0 ? <p>{copy.card.emptySummary}</p> : detailSelected.claims.map((claim) => (
                <article className={styles.claim} key={claim.claimId}>
                  <h4>{claim.label}</h4><p>{claim.definition}</p>
                  <dl><div><dt>AMACS</dt><dd>{claim.domainLabel} · {claim.familyLabel}</dd></div><div><dt>{copy.evidenceStatus}</dt><dd>{statusLabel(claim.assertionStatus)}</dd></div><div><dt>{copy.serviceCoverage}</dt><dd>{claim.serviceGeographyIds.join(", ") || copy.noCoverage}</dd></div><div><dt>{copy.specialties}</dt><dd>{claim.specialties.join(", ") || copy.noSpecialties}</dd></div></dl>
                  {!claim.currentAmacsConcept ? <p className={styles.warning}>{copy.card.historicalRelease}</p> : null}
                </article>
              ))}</section>
              {detailSelected.ownOrganization ? <GapList copy={copy} organization={detailSelected} /> : null}
              {detailSelected.ownOrganization ? <Link className={styles.primaryLink} href="/organization-profile#market-profile-title">Manage confirmed capabilities</Link> : null}
            </article>
          </ResponsiveEdgeSheet>
        ) : null}
      </SpatialWorkspace>
    </ParticipantShell>
  );
}

function GapList({ copy, organization }: Readonly<{ copy: ReturnType<typeof capabilitiesLocaleCatalog>; organization: CapabilityOrganizationProjection }>) {
  return <section><h3>{copy.gapsTitle}</h3>{organization.gaps.length === 0 ? <p>{copy.noGaps}</p> : <ul>{organization.gaps.map((gap) => <li key={gap.id}>{copy.gapLabels[gap.id]} <strong>{gap.count}</strong></li>)}</ul>}</section>;
}

function Catalog({ copy, projection }: Readonly<{ copy: ReturnType<typeof capabilitiesLocaleCatalog>; projection: CapabilitiesExchangeProjection }>) {
  return <section className={styles.catalog} aria-labelledby="amacs-catalog-title"><h3 id="amacs-catalog-title">{copy.catalogTitle}</h3><p>{copy.catalogIntroduction}</p><form action="/capabilities"><label><span>{copy.catalogSearchLabel}</span><input name="amacs" defaultValue={projection.amacs.query} /></label><label><span>{copy.catalogDomainLabel}</span><select name="domain" defaultValue={projection.amacs.domainId ?? ""}><option value="">All domains</option>{projection.amacs.domains.map((domain) => <option key={domain.domainId} value={domain.domainId}>{domain.preferredLabel}</option>)}</select></label><button type="submit">{copy.catalogSubmit}</button></form><p><strong>{copy.provenance}:</strong> AMACS {projection.amacs.release.version} · {projection.amacs.release.sourceCommit.slice(0, 12)}</p>{projection.amacs.results.length === 0 ? <p>{copy.catalogEmpty}</p> : <ul>{projection.amacs.results.map(({ capability }) => <li key={capability.conceptId}><strong>{capability.preferredLabel}</strong><span>{capability.domainLabel} · {capability.familyLabel}</span><p>{capability.definition}</p></li>)}</ul>}</section>;
}

function Comparison({ copy, organizations }: Readonly<{ copy: ReturnType<typeof capabilitiesLocaleCatalog>; organizations: readonly CapabilityOrganizationProjection[] }>) {
  return <section className={styles.comparison} aria-labelledby="capability-comparison-title"><h3 id="capability-comparison-title">{copy.comparisonTitle}</h3><p>{copy.comparisonDisclaimer}</p><div>{organizations.map((organization) => <article key={organization.organizationId}><h4>{organization.organizationName}</h4><p>{organization.locality}</p><ul>{organization.claims.map((claim) => <li key={claim.claimId}>{claim.label} · {statusLabel(claim.assertionStatus)}</li>)}</ul></article>)}</div></section>;
}
