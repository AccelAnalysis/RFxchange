"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import {
  PARTICIPANT_LENSES,
  PARTICIPANT_UTILITY_DESTINATIONS,
  participantNavigationState,
  type ParticipantLensId,
  type ParticipantNavigationState,
  type ParticipantUtilityId,
} from "../../application/participant/participant-lens-registry";
import {
  PARTICIPANT_INTELLIGENCE_CONTEXT_CHANGED_EVENT,
  readParticipantIntelligenceContext,
  writeParticipantIntelligenceContext,
} from "../../application/participant/intelligence-context-storage";
import {
  PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT,
  participantSpatialIntelligenceHref,
  participantSpatialLensHref,
  readActiveParticipantSpatialContext,
} from "../../application/participant/participant-spatial-context";
import { SignOutButton } from "../auth/SignOutButton";
import { BrandWordmark } from "../brand/BrandWordmark";
import { useI18n } from "../i18n/I18nProvider";

import styles from "./ParticipantTopNavigation.module.css";

export type ParticipantNavigationItem =
  | ParticipantNavigationState
  | "Network"
  | "Referrals"
  | "Resources"
  | "Quick Start"
  | "Account";

type NavigationDestination = Exclude<ParticipantNavigationState, null>;

const CANONICAL_INTELLIGENCE_HREF = "/geography/canvas";
const LENS_ICONS: Readonly<Record<ParticipantLensId, string>> = Object.freeze({
  "opportunities-rfx": "◎",
  resources: "◇",
  intelligence: "⌖",
  capabilities: "✦",
});

function normalizedActiveItem(item?: ParticipantNavigationItem): ParticipantNavigationState {
  switch (item) {
    case "Network":
      return "intelligence";
    case "Referrals":
      return "referrals";
    case "Resources":
      return "resources";
    case "Quick Start":
      return "quick-start";
    case "Account":
      return "account";
    default:
      return item ?? null;
  }
}

function isUnmodifiedPrimaryClick(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0
    && !event.altKey
    && !event.ctrlKey
    && !event.metaKey
    && !event.shiftKey;
}

function organizationInitials(name: string | null): string {
  if (!name) return "A";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "A";
}

function safeIntelligenceHref(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.origin !== window.location.origin || parsed.pathname !== CANONICAL_INTELLIGENCE_HREF) {
      return null;
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

function transitionMarkName(destination: NavigationDestination): string {
  return `rfxchange.participant-transition:${destination}`;
}

function subscribeLensHrefs(onStoreChange: () => void): () => void {
  window.addEventListener(PARTICIPANT_INTELLIGENCE_CONTEXT_CHANGED_EVENT, onStoreChange);
  window.addEventListener(PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(PARTICIPANT_INTELLIGENCE_CONTEXT_CHANGED_EVENT, onStoreChange);
    window.removeEventListener(PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function storedIntelligenceHref(): string {
  const spatialContext = readActiveParticipantSpatialContext();
  const safeQueryBaseHref = safeIntelligenceHref(readParticipantIntelligenceContext());
  return (spatialContext
    ? safeIntelligenceHref(participantSpatialIntelligenceHref(
        spatialContext,
        safeQueryBaseHref ?? spatialContext.returnHref,
      ))
    : safeQueryBaseHref) ?? CANONICAL_INTELLIGENCE_HREF;
}

interface ParticipantLensHrefSnapshot {
  readonly intelligenceHref: string;
  readonly opportunityHref: string;
  readonly resourceHref: string;
}

const DEFAULT_LENS_HREF_SNAPSHOT = JSON.stringify({
  intelligenceHref: CANONICAL_INTELLIGENCE_HREF,
  opportunityHref: "/opportunities",
  resourceHref: "/resources",
} satisfies ParticipantLensHrefSnapshot);

function storedLensHrefSnapshot(): string {
  return JSON.stringify({
    intelligenceHref: storedIntelligenceHref(),
    opportunityHref: participantSpatialLensHref("opportunities-rfx"),
    resourceHref: participantSpatialLensHref("resources"),
  } satisfies ParticipantLensHrefSnapshot);
}

function useTransitionFeedback(pathname: string) {
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();
  const pendingTransition = useRef<Readonly<{
    destination: NavigationDestination;
    fromPathname: string;
  }> | null>(null);
  const serializedLensHrefs = useSyncExternalStore(
    subscribeLensHrefs,
    storedLensHrefSnapshot,
    () => DEFAULT_LENS_HREF_SNAPSHOT,
  );
  const {
    intelligenceHref,
    opportunityHref,
    resourceHref,
  } = JSON.parse(serializedLensHrefs) as ParticipantLensHrefSnapshot;

  useEffect(() => {
    if (participantNavigationState(pathname) !== "intelligence") return;
    const currentHref = safeIntelligenceHref(
      `${pathname}${serializedSearchParams ? `?${serializedSearchParams}` : ""}`,
    );
    if (currentHref) writeParticipantIntelligenceContext(currentHref);
  }, [pathname, serializedSearchParams]);

  useEffect(() => {
    const transition = pendingTransition.current;
    if (!transition || participantNavigationState(pathname) !== transition.destination) return;
    const markName = transitionMarkName(transition.destination);
    const endMark = `${markName}:settled`;
    performance.clearMarks(endMark);
    performance.mark(endMark);
    performance.clearMeasures("rfxchange.participant-transition");
    performance.measure("rfxchange.participant-transition", markName, endMark);
    const measure = performance.getEntriesByName(
      "rfxchange.participant-transition",
      "measure",
    ).at(-1);
    const detail = Object.freeze({
      destination: transition.destination,
      fromPathname: transition.fromPathname,
      toPathname: pathname,
      durationMs: Math.max(0, measure?.duration ?? 0),
      documentNavigationEntries: performance.getEntriesByType("navigation").length,
    });
    pendingTransition.current = null;
    window.dispatchEvent(new CustomEvent("rfxchange:participant-transition", { detail }));
    console.info("rfxchange.participant-transition", detail);
  }, [pathname]);

  function begin(destination: NavigationDestination) {
    if (participantNavigationState(pathname) === destination) return;
    const markName = transitionMarkName(destination);
    performance.clearMarks(markName);
    performance.clearMarks(`${markName}:settled`);
    performance.mark(markName);
    pendingTransition.current = Object.freeze({ destination, fromPathname: pathname });
  }

  return {
    intelligenceHref,
    opportunityHref,
    resourceHref,
    begin,
  };
}

function NavigationLinkContent({
  label,
  loadingLabel,
  icon,
  mobile = false,
  onSettled,
}: Readonly<{
  label: string;
  loadingLabel: string;
  icon?: string;
  mobile?: boolean;
  onSettled?: () => void;
}>) {
  const { pending } = useLinkStatus();
  const observedPending = useRef(false);

  useEffect(() => {
    if (pending) observedPending.current = true;
    else if (observedPending.current) {
      observedPending.current = false;
      onSettled?.();
    }
  }, [onSettled, pending]);

  return (
    <>
      {mobile ? <span className={styles.lensIcon} aria-hidden="true">{icon}</span> : null}
      <span className={styles.lensLabel}>{label}</span>
      {pending ? (
        <span className={styles.liveStatus} role="status" aria-live="polite" data-link-pending="true">
          {loadingLabel}
        </span>
      ) : null}
    </>
  );
}

function lensHref(
  lensId: ParticipantLensId,
  snapshot: ParticipantLensHrefSnapshot,
): string {
  if (lensId === "intelligence") return snapshot.intelligenceHref;
  if (lensId === "opportunities-rfx") return snapshot.opportunityHref;
  if (lensId === "resources") return snapshot.resourceHref;
  throw new Error("Unavailable Capabilities lens cannot resolve a navigation href.");
}

function LensItems({
  activeState,
  hrefs,
  unavailableLensIds,
  beginNavigation,
  mobile = false,
}: Readonly<{
  activeState: ParticipantNavigationState;
  hrefs: ParticipantLensHrefSnapshot;
  unavailableLensIds: readonly ParticipantLensId[];
  beginNavigation(destination: NavigationDestination): void;
  mobile?: boolean;
}>) {
  const { t } = useI18n();
  const scopeId = useId().replaceAll(":", "");

  return PARTICIPANT_LENSES.map((lens) => {
    const label = t(lens.labelKey);
    const unavailable = lens.availability === "unavailable" || unavailableLensIds.includes(lens.id);
    if (unavailable) {
      const descriptionId = `${scopeId}-${lens.id}-availability`;
      return (
        <span
          key={lens.id}
          className={mobile ? styles.mobileUnavailableLens : styles.unavailableLens}
          role="link"
          aria-disabled="true"
          aria-label={label}
          aria-describedby={descriptionId}
          data-participant-lens={lens.id}
          data-availability="unavailable"
        >
          {mobile ? <span className={styles.lensIcon} aria-hidden="true">{LENS_ICONS[lens.id]}</span> : null}
          <span className={styles.lensLabel}>{label}</span>
          <small id={descriptionId}>{t("participantNavigation.notYetAvailable")}</small>
        </span>
      );
    }

    return (
      <Link
        key={lens.id}
        href={lensHref(lens.id, hrefs)}
        className={mobile ? styles.mobileLensLink : styles.lensLink}
        aria-current={activeState === lens.id ? "page" : undefined}
        data-participant-lens={lens.id}
        data-availability="enabled"
        data-mobile-lens-navigation={mobile ? "true" : undefined}
        onClick={(event) => {
          if (isUnmodifiedPrimaryClick(event)) beginNavigation(lens.id);
        }}
      >
        <NavigationLinkContent
          label={label}
          loadingLabel={`${t("participantNavigation.loadingDestination")} ${label}`}
          icon={LENS_ICONS[lens.id]}
          mobile={mobile}
        />
      </Link>
    );
  });
}

function moveMenuFocus(menu: HTMLElement, current: EventTarget | null, direction: 1 | -1) {
  const items = Array.from(
    menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled]):not([aria-disabled="true"])'),
  );
  if (!items.length) return;
  const currentIndex = current instanceof HTMLElement ? items.indexOf(current) : -1;
  const nextIndex = currentIndex < 0
    ? direction === 1 ? 0 : items.length - 1
    : (currentIndex + direction + items.length) % items.length;
  items[nextIndex]?.focus();
}

function AccountUtility({
  activeState,
  administrationHref: initialAdministrationHref,
  organizationName,
  quickStartUnavailable,
  beginNavigation,
}: Readonly<{
  activeState: ParticipantNavigationState;
  administrationHref?: string;
  organizationName: string | null;
  quickStartUnavailable: boolean;
  beginNavigation(destination: NavigationDestination): void;
}>) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [administrationHref, setAdministrationHref] = useState<string | null>(
    initialAdministrationHref ?? null,
  );
  const [administrationResolved, setAdministrationResolved] = useState(Boolean(initialAdministrationHref));
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  function resolveAdministration() {
    if (administrationResolved) return;
    setAdministrationResolved(true);
    void fetch("/api/participant-shell/administration", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json() as { administrationHref?: unknown };
        return typeof payload.administrationHref === "string" ? payload.administrationHref : null;
      })
      .then(setAdministrationHref)
      .catch(() => setAdministrationHref(null));
  }

  function showMenu(focusFirst = false) {
    setOpen(true);
    resolveAdministration();
    if (focusFirst) requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    });
  }

  function hideMenu(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => buttonRef.current?.focus());
  }

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: globalThis.PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) hideMenu();
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  const buttonLabel = organizationName
    ? `${t("participantNavigation.accountUtilities")}: ${organizationName}`
    : t("participantNavigation.accountUtilities");

  return (
    <div className={styles.accountUtility} data-participant-utility="account">
      <button
        ref={buttonRef}
        type="button"
        className={styles.accountButton}
        aria-label={buttonLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        data-current={activeState === "account" || activeState === "quick-start" || activeState === "referrals" ? "true" : undefined}
        onClick={() => open ? hideMenu() : showMenu()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            showMenu(true);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            hideMenu(true);
          }
        }}
      >
        <span className={styles.accountAvatar} aria-hidden="true">{organizationInitials(organizationName)}</span>
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          className={styles.accountMenu}
          role="menu"
          aria-label={t("participantNavigation.accountUtilities")}
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Escape") {
              event.preventDefault();
              hideMenu(true);
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              moveMenuFocus(event.currentTarget, event.target, 1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              moveMenuFocus(event.currentTarget, event.target, -1);
            } else if (event.key === "Home") {
              event.preventDefault();
              moveMenuFocus(event.currentTarget, null, 1);
            } else if (event.key === "End") {
              event.preventDefault();
              moveMenuFocus(event.currentTarget, null, -1);
            }
          }}
        >
          <Link
            role="menuitem"
            href={PARTICIPANT_UTILITY_DESTINATIONS.account.href}
            aria-current={activeState === "account" ? "page" : undefined}
            onClick={(event) => {
              if (isUnmodifiedPrimaryClick(event)) beginNavigation("account");
              else hideMenu();
            }}
          >
            <NavigationLinkContent
              label={t("participantNavigation.organizationProfile")}
              loadingLabel={`${t("participantNavigation.loadingDestination")} ${t("participantNavigation.organizationProfile")}`}
              onSettled={hideMenu}
            />
          </Link>
          {quickStartUnavailable ? (
            <span className={styles.unavailableUtility} role="menuitem" aria-disabled="true" data-availability="unavailable">
              <span>{t("participantNavigation.quickStart")}</span>
              <small>{t("participantNavigation.notYetAvailable")}</small>
            </span>
          ) : (
            <Link
              role="menuitem"
              href={PARTICIPANT_UTILITY_DESTINATIONS["quick-start"].href}
              aria-current={activeState === "quick-start" ? "page" : undefined}
              onClick={(event) => {
                if (isUnmodifiedPrimaryClick(event)) beginNavigation("quick-start");
                else hideMenu();
              }}
            >
              <NavigationLinkContent
                label={t("participantNavigation.quickStart")}
                loadingLabel={`${t("participantNavigation.loadingDestination")} ${t("participantNavigation.quickStart")}`}
                onSettled={hideMenu}
              />
            </Link>
          )}
          <Link
            role="menuitem"
            href={PARTICIPANT_UTILITY_DESTINATIONS.referrals.href}
            aria-current={activeState === "referrals" ? "page" : undefined}
            onClick={(event) => {
              if (isUnmodifiedPrimaryClick(event)) beginNavigation("referrals");
              else hideMenu();
            }}
          >
            <NavigationLinkContent
              label={t("participantNavigation.referrals")}
              loadingLabel={`${t("participantNavigation.loadingDestination")} ${t("participantNavigation.referrals")}`}
              onSettled={hideMenu}
            />
          </Link>
          {administrationHref ? (
            <Link role="menuitem" href={administrationHref} onClick={() => hideMenu()}>
              {t("participantNavigation.administration")}
            </Link>
          ) : null}
          <SignOutButton className={styles.signOut} role="menuitem" />
        </div>
      ) : null}
    </div>
  );
}

export function ParticipantTopNavigation({
  activeItem,
  administrationHref,
  organizationName = null,
  unavailableLensIds = [],
  unavailableUtilityIds = [],
}: Readonly<{
  activeItem?: ParticipantNavigationItem;
  administrationHref?: string;
  organizationName?: string | null;
  unavailableLensIds?: readonly ParticipantLensId[];
  unavailableUtilityIds?: readonly ParticipantUtilityId[];
}>) {
  const { t } = useI18n();
  const pathname = usePathname();
  const activeState = activeItem === undefined
    ? participantNavigationState(pathname)
    : normalizedActiveItem(activeItem);
  const transition = useTransitionFeedback(pathname);
  const hrefs: ParticipantLensHrefSnapshot = Object.freeze({
    intelligenceHref: transition.intelligenceHref,
    opportunityHref: transition.opportunityHref,
    resourceHref: transition.resourceHref,
  });

  return (
    <>
      <header className={styles.header} data-participant-navigation data-participant-shell-header>
        <div className={styles.brand}><BrandWordmark compact /></div>
        <nav className={styles.desktopLenses} aria-label={t("participantNavigation.ariaLabel")}>
          <LensItems
            activeState={activeState}
            hrefs={hrefs}
            unavailableLensIds={unavailableLensIds}
            beginNavigation={transition.begin}
          />
        </nav>
        <AccountUtility
          activeState={activeState}
          administrationHref={administrationHref}
          organizationName={organizationName}
          quickStartUnavailable={unavailableUtilityIds.includes("quick-start")}
          beginNavigation={transition.begin}
        />
      </header>
      <nav
        className={styles.mobileBottomNavigation}
        aria-label={t("participantNavigation.ariaLabel")}
        data-mobile-lens-navigation="persistent-bottom"
      >
        <LensItems
          activeState={activeState}
          hrefs={hrefs}
          unavailableLensIds={unavailableLensIds}
          beginNavigation={transition.begin}
          mobile
        />
      </nav>
    </>
  );
}
