"use client";

import type { ReactNode } from "react";

import {
  ControlGroup,
  OverlayPanel,
  ResponsiveSheet,
  SearchFilterFrame,
  StatusSummary,
  VisuallyHidden,
} from "../ui";

import styles from "./ParticipantWorkspace.module.css";
import b2Styles from "./ParticipantWorkspaceB2.module.css";
import { ParticipantTopNavigation, type ParticipantNavigationItem } from "./ParticipantTopNavigation";
import { usePersistentParticipantShell } from "./PersistentParticipantShell";

interface ParticipantShellProps {
  readonly activeItem?: ParticipantNavigationItem;
  readonly administrationHref?: string;
  readonly children: ReactNode;
}

interface WorkspaceProps {
  readonly ariaLabel: string;
  readonly children: ReactNode;
  readonly className?: string;
}

interface MapOverlaySurfaceProps {
  readonly children: ReactNode;
  readonly position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-right";
}

interface ResponsiveEdgeSheetProps {
  readonly ariaLabelledBy: string;
  readonly children: ReactNode;
  readonly side?: "left" | "right";
  readonly width?: "standard" | "wide";
}

/**
 * Compatibility boundary for participant workspaces that predate the persistent root-layout shell.
 * Within the governed Exchange shell it contributes only page content, preventing a route change
 * from destroying and recreating product identity or navigation. Transitional routes outside the
 * persistent shell retain the same truthful page-local navigation until they receive their own gate.
 */
export function ParticipantShell({
  activeItem,
  administrationHref,
  children,
}: ParticipantShellProps) {
  const persistentShell = usePersistentParticipantShell();
  if (persistentShell) return <>{children}</>;

  return (
    <div
      className={styles.participantShell}
      data-participant-shell="page-local"
      data-participant-default="warm-ivory"
    >
      <ParticipantTopNavigation activeItem={activeItem} administrationHref={administrationHref} />
      {children}
    </div>
  );
}

export function SpatialWorkspace({
  ariaLabel,
  children,
  className,
}: WorkspaceProps) {
  return (
    <main
      className={`${styles.spatialWorkspace} ${className ?? ""}`}
      data-participant-workspace="spatial"
      aria-label={ariaLabel}
    >
      {children}
    </main>
  );
}

export function OperationalWorkspace({
  ariaLabel,
  children,
  className,
}: WorkspaceProps) {
  return (
    <main
      className={`${styles.operationalWorkspace} ${className ?? ""}`}
      data-participant-workspace="operational"
      aria-label={ariaLabel}
    >
      {children}
    </main>
  );
}

export function MapOverlaySurface({
  children,
  position = "top-left",
}: MapOverlaySurfaceProps) {
  return <OverlayPanel position={position}>{children}</OverlayPanel>;
}

export function ResponsiveEdgeSheet({
  ariaLabelledBy,
  children,
  side = "right",
  width = "standard",
}: ResponsiveEdgeSheetProps) {
  return (
    <ResponsiveSheet labelledBy={ariaLabelledBy} side={side} width={width}>
      {children}
    </ResponsiveSheet>
  );
}

export function MapControlGroup({
  children,
  label,
}: Readonly<{ children: ReactNode; label: string }>) {
  return <ControlGroup label={label}>{children}</ControlGroup>;
}

export function LocalityStatusOverlay({
  locality,
  state,
  supportingText,
}: Readonly<{
  locality: string;
  state: string;
  supportingText?: string;
}>) {
  return (
    <StatusSummary
      eyebrow={state}
      title={locality}
      supportingText={supportingText}
      tone="positive"
    />
  );
}

export function SearchFilterOverlay() {
  return (
    <SearchFilterFrame
      label="Search the Exchange map"
      search={(
        <label className={b2Styles.searchField}>
          <VisuallyHidden>Search the Exchange map</VisuallyHidden>
          <span aria-hidden="true" className={styles.searchGlyph}>⌕</span>
          <input
            type="search"
            name="map-search"
            placeholder="Search organizations and capabilities"
            autoComplete="off"
          />
        </label>
      )}
      filters={(
        <details className={styles.filterDisclosure}>
          <summary className={b2Styles.filterSummary}>Filters</summary>
          <div className={styles.filterSurface}>
            <span>Visible layer</span>
            <strong>Organizations</strong>
            <p>
              Opportunity and resource layers remain unavailable until their approved
              product slices are complete.
            </p>
          </div>
        </details>
      )}
    />
  );
}
