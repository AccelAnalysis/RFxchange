import type { ReactNode } from "react";

import styles from "./Primitives.module.css";

type PrimitiveTone = "neutral" | "information" | "connection" | "positive" | "restricted";
type StateKind = "loading" | "empty" | "success" | "error" | "permission" | "expired" | "recovery";

function classes(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function NavigationFrame({
  brand,
  desktopNavigation,
  mobileNavigation,
  mobileLabel = "Menu",
  className,
}: Readonly<{
  brand: ReactNode;
  desktopNavigation: ReactNode;
  mobileNavigation: ReactNode;
  mobileLabel?: string;
  className?: string;
}>) {
  return (
    <header className={classes(styles.navigation, className)} data-ui-navigation>
      <div className={styles.navigationBrand}>{brand}</div>
      <nav className={styles.desktopNavigation} aria-label="Primary participant navigation">
        {desktopNavigation}
      </nav>
      <details className={styles.mobileNavigation}>
        <summary>{mobileLabel}</summary>
        <nav aria-label="Primary participant navigation">{mobileNavigation}</nav>
      </details>
    </header>
  );
}

export function OverlayPanel({
  children,
  className,
  label,
  position = "top-left",
}: Readonly<{
  children: ReactNode;
  className?: string;
  label?: string;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-right";
}>) {
  return (
    <section
      className={classes(styles.overlayPanel, className)}
      data-ui-overlay
      data-position={position}
      aria-label={label}
    >
      {children}
    </section>
  );
}

export function ResponsiveSheet({
  labelledBy,
  children,
  className,
  side = "right",
  width = "standard",
}: Readonly<{
  labelledBy: string;
  children: ReactNode;
  className?: string;
  side?: "left" | "right";
  width?: "standard" | "wide";
}>) {
  return (
    <aside
      className={classes(styles.sheet, className)}
      data-ui-sheet
      data-edge={side}
      data-mobile-surface="sheet"
      data-width={width}
      aria-labelledby={labelledBy}
    >
      {children}
    </aside>
  );
}

export function ControlGroup({
  children,
  className,
  label,
}: Readonly<{ children: ReactNode; className?: string; label: string }>) {
  return (
    <div className={classes(styles.controlGroup, className)} role="group" aria-label={label}>
      {children}
    </div>
  );
}

export function SearchFilterFrame({
  search,
  filters,
  className,
  label = "Search and filter",
}: Readonly<{
  search: ReactNode;
  filters: ReactNode;
  className?: string;
  label?: string;
}>) {
  return (
    <div className={classes(styles.searchFilter, className)} role="search" aria-label={label}>
      <div className={styles.searchSlot}>{search}</div>
      <div className={styles.filterSlot}>{filters}</div>
    </div>
  );
}

export function StatusSummary({
  eyebrow,
  title,
  supportingText,
  tone = "neutral",
  className,
}: Readonly<{
  eyebrow: string;
  title: string;
  supportingText?: string;
  tone?: PrimitiveTone;
  className?: string;
}>) {
  return (
    <div className={classes(styles.statusSummary, className)} data-tone={tone}>
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      {supportingText ? <small>{supportingText}</small> : null}
    </div>
  );
}

export function StatusPill({
  children,
  tone = "neutral",
}: Readonly<{ children: ReactNode; tone?: PrimitiveTone }>) {
  return (
    <span className={styles.statusPill} data-tone={tone}>
      {children}
    </span>
  );
}

export function AlertBanner({
  title,
  children,
  tone = "information",
  action,
}: Readonly<{
  title: string;
  children: ReactNode;
  tone?: PrimitiveTone;
  action?: ReactNode;
}>) {
  return (
    <section
      className={styles.alertBanner}
      data-tone={tone}
      role={tone === "restricted" ? "alert" : "status"}
      aria-labelledby={`alert-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
    >
      <div>
        <strong id={`alert-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{title}</strong>
        <div className={styles.alertBody}>{children}</div>
      </div>
      {action ? <div className={styles.alertAction}>{action}</div> : null}
    </section>
  );
}

export function StatePanel({
  state,
  title,
  children,
  action,
}: Readonly<{
  state: StateKind;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}>) {
  const liveRole = state === "error" || state === "permission" ? "alert" : "status";
  return (
    <section
      className={styles.statePanel}
      data-state={state}
      role={liveRole}
      aria-live={state === "loading" ? "polite" : undefined}
      aria-busy={state === "loading" ? true : undefined}
    >
      <span className={styles.stateGlyph} aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <div className={styles.stateBody}>{children}</div>
        {action ? <div className={styles.stateAction}>{action}</div> : null}
      </div>
    </section>
  );
}

export function ObjectCard({
  eyebrow,
  title,
  children,
  metadata,
  status,
  tone = "neutral",
}: Readonly<{
  eyebrow?: string;
  title: string;
  children: ReactNode;
  metadata?: ReactNode;
  status?: ReactNode;
  tone?: PrimitiveTone;
}>) {
  return (
    <article className={styles.objectCard} data-tone={tone}>
      <header>
        <div>
          {eyebrow ? <span className={styles.objectEyebrow}>{eyebrow}</span> : null}
          <h3>{title}</h3>
        </div>
        {status ? <div>{status}</div> : null}
      </header>
      <div className={styles.objectBody}>{children}</div>
      {metadata ? <footer>{metadata}</footer> : null}
    </article>
  );
}

export function Timeline({
  items,
  label,
}: Readonly<{
  label: string;
  items: readonly Readonly<{
    id: string;
    title: string;
    detail?: ReactNode;
    status?: ReactNode;
    current?: boolean;
  }>[];
}>) {
  return (
    <ol className={styles.timeline} aria-label={label}>
      {items.map((item) => (
        <li key={item.id} aria-current={item.current ? "step" : undefined}>
          <span className={styles.timelineMarker} aria-hidden="true" />
          <div>
            <div className={styles.timelineTitle}>
              <strong>{item.title}</strong>
              {item.status ? <span>{item.status}</span> : null}
            </div>
            {item.detail ? <div className={styles.timelineDetail}>{item.detail}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DataTable({
  caption,
  columns,
  rows,
}: Readonly<{
  caption: string;
  columns: readonly string[];
  rows: readonly Readonly<{ id: string; cells: readonly ReactNode[] }>[];
}>) {
  return (
    <div className={styles.tableScroller} tabIndex={0} role="region" aria-label={`${caption} table`}>
      <table className={styles.dataTable}>
        <caption>{caption}</caption>
        <thead>
          <tr>{columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {row.cells.map((cell, index) => index === 0
                ? <th key={`${row.id}-${index}`} scope="row">{cell}</th>
                : <td key={`${row.id}-${index}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VisuallyHidden({ children }: Readonly<{ children: ReactNode }>) {
  return <span className={styles.visuallyHidden}>{children}</span>;
}
