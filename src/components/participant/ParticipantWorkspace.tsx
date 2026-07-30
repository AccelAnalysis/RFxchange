import Link from "next/link";
import type { ReactNode } from "react";

import { BrandWordmark } from "../brand/BrandWordmark";

import styles from "./ParticipantWorkspace.module.css";

type ParticipantNavigationItem =
  | "Intelligence"
  | "Referrals"
  | "Opportunities"
  | "Resources"
  | "Account";

interface ParticipantShellProps {
  readonly activeItem?: ParticipantNavigationItem;
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

const primaryNavigation = [
  { label: "Intelligence", href: "/geography/canvas", available: true },
  { label: "Referrals", available: false },
  { label: "Opportunities", available: false },
  { label: "Resources", available: false },
] as const;

function NavigationItems({
  activeItem,
}: Readonly<{ activeItem?: ParticipantNavigationItem }>) {
  return (
    <>
      {primaryNavigation.map((item) =>
        item.available ? (
          <Link
            key={item.label}
            href={item.href}
            aria-current={activeItem === item.label ? "page" : undefined}
          >
            {item.label}
          </Link>
        ) : (
          <span
            key={item.label}
            aria-disabled="true"
            title="Available in a later approved product slice"
          >
            {item.label}
          </span>
        ),
      )}
      <Link
        href="/organization-profile"
        aria-current={activeItem === "Account" ? "page" : undefined}
      >
        Account
      </Link>
    </>
  );
}

export function ParticipantTopNavigation({
  activeItem,
}: Readonly<{ activeItem?: ParticipantNavigationItem }>) {
  return (
    <header className={styles.navigation} data-participant-navigation>
      <BrandWordmark compact />
      <nav className={styles.desktopNavigation} aria-label="Primary participant navigation">
        <NavigationItems activeItem={activeItem} />
      </nav>
      <details className={styles.mobileNavigation}>
        <summary>Menu</summary>
        <nav aria-label="Primary participant navigation">
          <NavigationItems activeItem={activeItem} />
        </nav>
      </details>
    </header>
  );
}

export function ParticipantShell({
  activeItem,
  children,
}: ParticipantShellProps) {
  return (
    <div
      className={styles.participantShell}
      data-participant-shell
      data-participant-default="warm-ivory"
    >
      <ParticipantTopNavigation activeItem={activeItem} />
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
  return (
    <section
      className={styles.mapOverlay}
      data-map-overlay
      data-position={position}
    >
      {children}
    </section>
  );
}

export function ResponsiveEdgeSheet({
  ariaLabelledBy,
  children,
  side = "right",
  width = "standard",
}: ResponsiveEdgeSheetProps) {
  return (
    <aside
      className={styles.edgeSheet}
      data-edge={side}
      data-mobile-surface="sheet"
      data-width={width}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </aside>
  );
}

export function MapControlGroup({
  children,
  label,
}: Readonly<{ children: ReactNode; label: string }>) {
  return (
    <div className={styles.mapControlGroup} aria-label={label}>
      {children}
    </div>
  );
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
    <div className={styles.localityStatus}>
      <span>{state}</span>
      <strong>{locality}</strong>
      {supportingText ? <small>{supportingText}</small> : null}
    </div>
  );
}

export function SearchFilterOverlay() {
  return (
    <div className={styles.searchFilter} role="search" aria-label="Search the Exchange map">
      <label>
        <span className={styles.srOnly}>Search the Exchange map</span>
        <span aria-hidden="true" className={styles.searchGlyph}>⌕</span>
        <input
          type="search"
          name="map-search"
          placeholder="Search organizations and capabilities"
          autoComplete="off"
        />
      </label>
      <details className={styles.filterDisclosure}>
        <summary>Filters</summary>
        <div className={styles.filterSurface}>
          <span>Visible layer</span>
          <strong>Organizations</strong>
          <p>
            Opportunity and resource layers remain unavailable until their approved
            product slices are complete.
          </p>
        </div>
      </details>
    </div>
  );
}
