"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { exchangeRoomLocaleCatalog } from "../../application/participant/exchange-room-locale";
import type { ExchangeRoomActionProjection } from "../../application/participant/exchange-room-actions";
import {
  PARTICIPANT_LENS_IDS,
  type ParticipantLensId,
} from "../../application/participant/participant-lens-registry";
import {
  PARTICIPANT_SPATIAL_ACTIVE_KEY,
  PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT,
  participantSpatialLensHref,
  readActiveParticipantSpatialContext,
  serializeParticipantSpatialContext,
} from "../../application/participant/participant-spatial-context";
import { useI18n } from "../i18n/I18nProvider";

import styles from "./ExchangeRoomActionController.module.css";

interface ActionAuthorizationProjection {
  readonly openPlatform: boolean;
  readonly rfxCreate: boolean;
  readonly referralManage: boolean;
  readonly resourceManage: boolean;
}

interface LensAuthorizationProjection {
  readonly lens: ParticipantLensId;
  readonly authorization: ActionAuthorizationProjection;
}

const DENIED_ACTION_AUTHORIZATION: ActionAuthorizationProjection = Object.freeze({
  openPlatform: false,
  rfxCreate: false,
  referralManage: false,
  resourceManage: false,
});

function isParticipantLensId(value: string | undefined): value is ParticipantLensId {
  return Boolean(value && PARTICIPANT_LENS_IDS.includes(value as ParticipantLensId));
}

function isOrdinaryPrimaryActivation(event: globalThis.MouseEvent): boolean {
  return event.button === 0
    && !event.altKey
    && !event.ctrlKey
    && !event.metaKey
    && !event.shiftKey;
}

function reopenActiveExchangeRoomSurface(): void {
  const current = readActiveParticipantSpatialContext();
  if (!current) return;
  try {
    const storageKey = window.sessionStorage.getItem(PARTICIPANT_SPATIAL_ACTIVE_KEY);
    if (!storageKey) return;
    const reopened = Object.freeze({
      ...current,
      panelOpen: true,
      sheetSnapPoint: current.sheetSnapPoint === "peek" ? "partial" : current.sheetSnapPoint,
    });
    window.sessionStorage.setItem(storageKey, serializeParticipantSpatialContext(reopened));
    window.dispatchEvent(new CustomEvent(PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT, { detail: storageKey }));
  } catch {
    // Optional continuity state is non-authorizing and never changes protected-route authority.
  }
}

export function useExchangeRoomLensController(onLensSelect: (lens: ParticipantLensId) => void): void {
  useEffect(() => {
    const handleLensActivation = (event: globalThis.MouseEvent) => {
      if (!isOrdinaryPrimaryActivation(event)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[data-participant-lens]");
      if (!link) return;
      const lens = link.dataset.participantLens;
      if (!isParticipantLensId(lens)) return;
      event.preventDefault();
      onLensSelect(lens);
      reopenActiveExchangeRoomSurface();
    };
    document.addEventListener("click", handleLensActivation, true);
    return () => document.removeEventListener("click", handleLensActivation, true);
  }, [onLensSelect]);
}

function refreshedPermission(
  action: ExchangeRoomActionProjection,
  authorization: ActionAuthorizationProjection,
): boolean | null {
  if (action.authorization === "room-participant") return null;
  if (!authorization.openPlatform) return false;
  if (action.authorization === "open-platform-rfx-create") return authorization.rfxCreate;
  if (action.authorization === "open-platform-resource-manage") return authorization.resourceManage;
  if (action.authorization === "open-platform-referral-manage") return authorization.referralManage;
  return null;
}

function privilegedHref(actionId: string): string | null {
  if (actionId === "opportunities.create-rfx") return "/opportunities/manage";
  if (actionId === "resources.find-providers" || actionId === "resources.browse-resources") {
    return participantSpatialLensHref("resources");
  }
  if (actionId === "resources.my-requests") return "/resources";
  if (actionId === "resources.provider-status") return "/provider-application";
  return null;
}

export function ExchangeRoomActionController({
  activeLens,
  actions,
  onNetworkFocus,
  placement = "workspace",
}: Readonly<{
  activeLens: ParticipantLensId;
  actions: readonly ExchangeRoomActionProjection[];
  onNetworkFocus(intent: "organizations" | "capabilities"): void;
  placement?: "workspace" | "sheet";
}>) {
  const { locale } = useI18n();
  const messages = exchangeRoomLocaleCatalog(locale);
  const [authorizationState, setAuthorizationState] = useState<LensAuthorizationProjection>(() => Object.freeze({
    lens: activeLens,
    authorization: DENIED_ACTION_AUTHORIZATION,
  }));
  const [networkDiscoveryAvailable, setNetworkDiscoveryAvailable] = useState(false);
  const authorization = authorizationState.lens === activeLens
    ? authorizationState.authorization
    : DENIED_ACTION_AUTHORIZATION;

  useEffect(() => {
    let active = true;
    const discoveryFrame = window.requestAnimationFrame(() => {
      if (!active) return;
      setNetworkDiscoveryAvailable(Boolean(document.querySelector('form[action="/geography/canvas"]')));
    });
    void fetch("/geography/canvas/action-authorization", {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then(async (response) => response.ok ? response.json() : DENIED_ACTION_AUTHORIZATION)
      .then((payload: Partial<ActionAuthorizationProjection>) => {
        if (!active) return;
        setAuthorizationState(Object.freeze({
          lens: activeLens,
          authorization: Object.freeze({
            openPlatform: payload.openPlatform === true,
            rfxCreate: payload.rfxCreate === true,
            referralManage: payload.referralManage === true,
            resourceManage: payload.resourceManage === true,
          }),
        }));
      })
      .catch(() => {
        if (!active) return;
        setAuthorizationState(Object.freeze({
          lens: activeLens,
          authorization: DENIED_ACTION_AUTHORIZATION,
        }));
      });
    return () => {
      active = false;
      window.cancelAnimationFrame(discoveryFrame);
    };
  }, [activeLens]);

  return (
    <section
      className={styles.actionGrid}
      aria-label={messages.actionsLabel}
      data-exchange-room-action-grid
      data-active-lens={activeLens}
      data-action-rail-placement={placement}
    >
      {actions.map((action) => {
        const label = messages.actions[action.id];
        const permission = refreshedPermission(action, authorization);
        const networkIntent = action.id === "intelligence.organizations"
          ? "organizations" as const
          : action.id === "intelligence.capabilities"
            ? "capabilities" as const
            : null;

        if (networkIntent && networkDiscoveryAvailable) {
          return (
            <button
              key={action.id}
              type="button"
              className={styles.activeAction}
              data-exchange-room-action={action.id}
              data-action-state="active"
              data-operational="true"
              data-applicable="true"
              data-authorized="true"
              onClick={() => onNetworkFocus(networkIntent)}
            >
              {label}
            </button>
          );
        }
        if (permission === true && action.operational && action.applicable) {
          const href = privilegedHref(action.id);
          if (href) {
            return (
              <Link
                key={action.id}
                className={styles.activeAction}
                href={href}
                data-exchange-room-action={action.id}
                data-action-state="active"
                data-operational={String(action.operational)}
                data-applicable={String(action.applicable)}
                data-authorized="true"
              >
                {label}
              </Link>
            );
          }
        }
        if (permission === null && action.availability === "active" && action.resolvedHandler?.kind === "href") {
          return (
            <Link
              key={action.id}
              className={styles.activeAction}
              href={action.resolvedHandler.href}
              data-exchange-room-action={action.id}
              data-action-state="active"
              data-operational={String(action.operational)}
              data-applicable={String(action.applicable)}
              data-authorized={String(action.authorized)}
            >
              {label}
            </Link>
          );
        }
        if (permission === null && action.availability === "active" && action.resolvedHandler?.kind === "network-focus") {
          const intent = action.resolvedHandler.intent;
          return (
            <button
              key={action.id}
              type="button"
              className={styles.activeAction}
              data-exchange-room-action={action.id}
              data-action-state="active"
              data-operational={String(action.operational)}
              data-applicable={String(action.applicable)}
              data-authorized={String(action.authorized)}
              onClick={() => onNetworkFocus(intent)}
            >
              {label}
            </button>
          );
        }

        const reason = !action.operational
          ? "not-operational" as const
          : !action.applicable
            ? "not-applicable" as const
            : networkIntent && !networkDiscoveryAvailable
              ? "not-operational" as const
              : permission === false
                ? "not-authorized" as const
                : action.disabledReason ?? "not-operational";
        return (
          <button
            key={action.id}
            type="button"
            className={styles.disabledAction}
            disabled
            aria-label={`${label}. ${messages.disabledReasons[reason]}`}
            data-exchange-room-action={action.id}
            data-action-state="disabled"
            data-disabled-reason={reason}
            data-operational={String(action.operational)}
            data-applicable={String(action.applicable)}
            data-authorized={String(permission === null ? action.authorized : permission)}
          >
            {label}
          </button>
        );
      })}
    </section>
  );
}
