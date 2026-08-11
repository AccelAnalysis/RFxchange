"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  PARTICIPANT_LENSES,
  PARTICIPANT_UTILITY_DESTINATIONS,
  participantNavigationState,
  type ParticipantNavigationState,
} from "../../application/participant/participant-lens-registry";
import { SignOutButton } from "../auth/SignOutButton";
import { BrandWordmark } from "../brand/BrandWordmark";
import { useI18n } from "../i18n/I18nProvider";

import styles from "./ParticipantTopNavigation.module.css";

/**
 * Legacy page-local values remain accepted only while transitional workspaces are migrated. They
 * normalize to the governed lens/utility registry and are never rendered as peer destinations.
 */
export type ParticipantNavigationItem =
  | ParticipantNavigationState
  | "Network"
  | "Referrals"
  | "Resources"
  | "Quick Start"
  | "Account";

type NavigationDestination = Exclude<ParticipantNavigationState, null>;

const INTELLIGENCE_CONTEXT_STORAGE_KEY = "rfxchange:participant:intelligence-href";
const CANONICAL_INTELLIGENCE_HREF = "/geography/canvas";

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
  return (
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
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

function useTransitionFeedback(pathname: string) {
  const [pendingDestination, setPendingDestination] = useState<NavigationDestination | null>(null);
  const [intelligenceHref, setIntelligenceHref] = useState(CANONICAL_INTELLIGENCE_HREF);
  const pendingRef = useRef<Readonly<{
    destination: NavigationDestination;
    markName: string;
    startedAt: number;
    fromPathname: string;
  }> | null>(null);

  useEffect(() => {
    const current = pathname === CANONICAL_INTELLIGENCE_HREF
      ? safeIntelligenceHref(`${window.location.pathname}${window.location.search}`)
      : null;
    const stored = safeIntelligenceHref(
      window.sessionStorage.getItem(INTELLIGENCE_CONTEXT_STORAGE_KEY),
    );
    const resolved = current ?? stored;
    if (resolved) setIntelligenceHref(resolved);
  }, [pathname]);

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending || participantNavigationState(pathname) !== pending.destination) return;

    const endedAt = performance.now();
    const endMark = `${pending.markName}:settled`;
    performance.mark(endMark);
    performance.measure(
      "rfxchange.participant-transition",
      pending.markName,
      endMark,
    );
    const detail = Object.freeze({
      destination: pending.destination,
      fromPathname: pending.fromPathname,
      toPathname: pathname,
      durationMs: Math.max(0, endedAt - pending.startedAt),
      documentNavigationEntries: performance.getEntriesByType("navigation").length,
    });
    window.dispatchEvent(new CustomEvent("rfxchange:participant-transition", { detail }));
    console.info("rfxchange.participant-transition", detail);
    pendingRef.current = null;
    setPendingDestination(null);
  }, [pathname]);

  function begin(destination: NavigationDestination) {
    const currentState = participantNavigationState(pathname);
    if (currentState === destination) return;

    if (currentState === "intelligence" && destination !== "intelligence") {
      const currentHref = safeIntelligenceHref(
        `${window.location.pathname}${window.location.search}`,
      );
      if (currentHref) {
        setIntelligenceHref(currentHref);
        window.sessionStorage.setItem(INTELLIGENCE_CONTEXT_STORAGE_KEY, currentHref);
      }
    }

    const markName = `rfxchange.participant-transition:${destination}:${Date.now()}`;
    performance.mark(markName);
    pendingRef.current = Object.freeze({
      destination,
      markName,
      startedAt: performance.now(),
      fromPathname: pathname,
    });
    setPendingDestination(destination);
  }

  return Object.freeze({ pendingDestination, intelligenceHref, begin });
}

function LensItems({
  activeState,
  intelligenceHref,
  pendingDestination,
  beginNavigation,
  onNavigate,
}: Readonly<{
  activeState: ParticipantNavigationState;
  intelligenceHref: string;
  pendingDestination: NavigationDestination | null;
  beginNavigation(destination: NavigationDestination): void;
  onNavigate?: () => void;
}>) {
  const { t } = useI18n();
  const scopeId = useId().replaceAll(":", "");

  return PARTICIPANT_LENSES.map((lens) => {
    const label = t(lens.labelKey);
    if (lens.availability === "unavailable") {
      const descriptionId = `${scopeId}-${lens.id}-availability`;
      return (
        <span
          key={lens.id}
          className={styles.unavailableLens}
          role="link"
          aria-disabled="true"
          aria-label={label}
          aria-describedby={descriptionId}
          data-participant-lens={lens.id}
          data-availability="unavailable"
        >
          <span>{label}</span>
          <small id={descriptionId}>{t("participantNavigation.notYetAvailable")}</small>
        </span>
      );
    }

    const href = lens.id === "intelligence" ? intelligenceHref : lens.href;
    return (
      <Link
        key={lens.id}
        href={href}
        className={styles.lensLink}
        aria-current={activeState === lens.id ? "page" : undefined}
        aria-busy={pendingDestination === lens.id ? "true" : undefined}
        data-participant-lens={lens.id}
        data-availability="enabled"
        data-pending={pendingDestination === lens.id ? "true" : undefined}
        onClick={(event) => {
          if (isUnmodifiedPrimaryClick(event)) beginNavigation(lens.id);
          onNavigate?.();
        }}
      >
        {label}
      </Link>
    );
  });
}

function moveMenuFocus(menu: HTMLElement, current: EventTarget | null, direction: 1 | -1) {
  const items = Array.from(
    menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
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
  pendingDestination,
  beginNavigation,
}: Readonly<{
  activeState: ParticipantNavigationState;
  administrationHref?: string;
  organizationName: string | null;
  pendingDestination: NavigationDestination | null;
  beginNavigation(destination: NavigationDestination): void;
}>) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [administrationHref, setAdministrationHref] = useState<string | null>(
    initialAdministrationHref ?? null,
  );
  const [administrationResolved, setAdministrationResolved] = useState(
    Boolean(initialAdministrationHref),
  );
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
        return typeof payload.administrationHref === "string"
          ? payload.administrationHref
          : null;
      })
      .then(setAdministrationHref)
      .catch(() => setAdministrationHref(null));
  }

  function showMenu(focusFirst = false) {
    setOpen(true);
    resolveAdministration();
    if (focusFirst) {
      requestAnimationFrame(() => {
        menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
      });
    }
  }

  function hideMenu(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) requestAnimationFrame(() => buttonRef.current?.focus());
  }

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        hideMenu();
      }
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
        data-current={activeState === "account" || activeState === "quick-start" ? "true" : undefined}
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
        <span className={styles.accountAvatar} aria-hidden="true">
          {organizationInitials(organizationName)}
        </span>
        <span className={styles.accountText}>
          {organizationName ? <strong>{organizationName}</strong> : null}
          <small>{t("participantNavigation.account")}</small>
        </span>
        <span className={styles.chevron} aria-hidden="true">⌄</span>
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
            aria-busy={pendingDestination === "account" ? "true" : undefined}
            onClick={(event) => {
              if (isUnmodifiedPrimaryClick(event)) beginNavigation("account");
              hideMenu();
            }}
          >
            {t("participantNavigation.organizationProfile")}
          </Link>
          <Link
            role="menuitem"
            href={PARTICIPANT_UTILITY_DESTINATIONS["quick-start"].href}
            aria-current={activeState === "quick-start" ? "page" : undefined}
            aria-busy={pendingDestination === "quick-start" ? "true" : undefined}
            onClick={(event) => {
              if (isUnmodifiedPrimaryClick(event)) beginNavigation("quick-start");
              hideMenu();
            }}
          >
            {t("participantNavigation.quickStart")}
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

function MobileLensMenu({
  children,
  label,
}: Readonly<{ children: (close: () => void) => ReactNode; label: string }>) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <details
      ref={detailsRef}
      className={styles.mobileLensMenu}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
          detailsRef.current?.querySelector<HTMLElement>("summary")?.focus();
        }
      }}
    >
      <summary>{label}</summary>
      <nav aria-label={label}>{children(close)}</nav>
    </details>
  );
}

export function ParticipantTopNavigation({
  activeItem,
  administrationHref,
  organizationName = null,
}: Readonly<{
  activeItem?: ParticipantNavigationItem;
  administrationHref?: string;
  organizationName?: string | null;
}>) {
  const { t } = useI18n();
  const pathname = usePathname();
  const activeState = activeItem === undefined
    ? participantNavigationState(pathname)
    : normalizedActiveItem(activeItem);
  const transition = useTransitionFeedback(pathname);
  const pendingLens = PARTICIPANT_LENSES.find(
    (lens) => lens.id === transition.pendingDestination,
  );
  const pendingLabel = pendingLens
    ? t(pendingLens.labelKey)
    : transition.pendingDestination === "account"
      ? t("participantNavigation.organizationProfile")
      : transition.pendingDestination === "quick-start"
        ? t("participantNavigation.quickStart")
        : null;

  return (
    <header
      className={styles.header}
      data-participant-navigation
      data-participant-shell-header
    >
      <div className={styles.brand}><BrandWordmark compact /></div>
      <nav className={styles.desktopLenses} aria-label={t("participantNavigation.ariaLabel")}>
        <LensItems
          activeState={activeState}
          intelligenceHref={transition.intelligenceHref}
          pendingDestination={transition.pendingDestination}
          beginNavigation={transition.begin}
        />
      </nav>
      <MobileLensMenu label={t("participantNavigation.menu")}>
        {(close) => (
          <LensItems
            activeState={activeState}
            intelligenceHref={transition.intelligenceHref}
            pendingDestination={transition.pendingDestination}
            beginNavigation={transition.begin}
            onNavigate={close}
          />
        )}
      </MobileLensMenu>
      <AccountUtility
        activeState={activeState}
        administrationHref={administrationHref}
        organizationName={organizationName}
        pendingDestination={transition.pendingDestination}
        beginNavigation={transition.begin}
      />
      <span className={styles.liveStatus} role="status" aria-live="polite" aria-atomic="true">
        {pendingLabel
          ? `${t("participantNavigation.loadingDestination")} ${pendingLabel}`
          : ""}
      </span>
    </header>
  );
}
