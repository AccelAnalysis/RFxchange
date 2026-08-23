"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { exchangeRoomLocaleCatalog } from "../../application/participant/exchange-room-locale";
import type {
  ExchangeRoomActionIntent,
  ExchangeRoomActionProjection,
} from "../../application/participant/exchange-room-actions";
import {
  PARTICIPANT_LENS_IDS,
  type ParticipantLensId,
} from "../../application/participant/participant-lens-registry";
import {
  PARTICIPANT_SPATIAL_ACTIVE_KEY,
  PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT,
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

let exchangeRoomAuthorizationSnapshot: LensAuthorizationProjection | null = null;
const exchangeRoomAuthorizationListeners = new Set<() => void>();
let exchangeRoomAuthorizationRequestLens: ParticipantLensId | null = null;
let exchangeRoomAuthorizationGeneration = 0;

function subscribeExchangeRoomAuthorization(listener: () => void): () => void {
  exchangeRoomAuthorizationListeners.add(listener);
  return () => exchangeRoomAuthorizationListeners.delete(listener);
}

function exchangeRoomAuthorizationStoreSnapshot(): LensAuthorizationProjection | null {
  return exchangeRoomAuthorizationSnapshot;
}

function publishExchangeRoomAuthorization(snapshot: LensAuthorizationProjection): void {
  exchangeRoomAuthorizationSnapshot = snapshot;
  for (const listener of exchangeRoomAuthorizationListeners) listener();
}

function ensureExchangeRoomAuthorization(lens: ParticipantLensId): void {
  if (exchangeRoomAuthorizationRequestLens === lens) return;
  if (exchangeRoomAuthorizationSnapshot?.lens === lens && exchangeRoomAuthorizationRequestLens === null) return;

  const generation = ++exchangeRoomAuthorizationGeneration;
  exchangeRoomAuthorizationRequestLens = lens;
  publishExchangeRoomAuthorization(Object.freeze({
    lens,
    authorization: DENIED_ACTION_AUTHORIZATION,
  }));

  void fetch("/geography/canvas/action-authorization", {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => response.ok ? response.json() : DENIED_ACTION_AUTHORIZATION)
    .then((payload: Partial<ActionAuthorizationProjection>) => {
      if (generation !== exchangeRoomAuthorizationGeneration) return;
      publishExchangeRoomAuthorization(Object.freeze({
        lens,
        authorization: Object.freeze({
          openPlatform: payload.openPlatform === true,
          rfxCreate: payload.rfxCreate === true,
          referralManage: payload.referralManage === true,
          resourceManage: payload.resourceManage === true,
        }),
      }));
    })
    .catch(() => {
      if (generation !== exchangeRoomAuthorizationGeneration) return;
      publishExchangeRoomAuthorization(Object.freeze({
        lens,
        authorization: DENIED_ACTION_AUTHORIZATION,
      }));
    })
    .finally(() => {
      if (generation === exchangeRoomAuthorizationGeneration) {
        exchangeRoomAuthorizationRequestLens = null;
      }
    });
}

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

export function ExchangeRoomActionController({
  activeLens,
  actions,
  onNetworkFocus,
  onActionIntent,
  placement = "workspace",
}: Readonly<{
  activeLens: ParticipantLensId;
  actions: readonly ExchangeRoomActionProjection[];
  onNetworkFocus(intent: "organizations" | "capabilities"): void;
  onActionIntent?: (intent: ExchangeRoomActionIntent) => void;
  placement?: "workspace" | "sheet";
}>) {
  const { locale } = useI18n();
  const messages = exchangeRoomLocaleCatalog(locale);
  const authorizationState = useSyncExternalStore(
    subscribeExchangeRoomAuthorization,
    exchangeRoomAuthorizationStoreSnapshot,
    () => null,
  );
  const [networkDiscoveryAvailable, setNetworkDiscoveryAvailable] = useState(false);
  const authorization = authorizationState?.lens === activeLens
    ? authorizationState.authorization
    : DENIED_ACTION_AUTHORIZATION;

  useEffect(() => {
    ensureExchangeRoomAuthorization(activeLens);
  }, [activeLens]);

  useEffect(() => {
    let active = true;
    const discoveryFrame = window.requestAnimationFrame(() => {
      if (!active) return;
      setNetworkDiscoveryAvailable(Boolean(document.querySelector('form[action="/geography/canvas"]')));
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
        const label = messages.actions[action.labelKey];
        const permission = refreshedPermission(action, authorization);
        const activeHandler = permission === true && action.operational && action.applicable
          ? action.handlerCandidate
          : permission === null && action.availability === "active"
            ? action.resolvedHandler
            : null;

        if (activeHandler?.kind === "href") {
          return (
            <Link
              key={action.id}
              className={styles.activeAction}
              href={activeHandler.href}
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
        if (activeHandler?.kind === "network-focus" && networkDiscoveryAvailable) {
          return (
            <button
              key={action.id}
              type="button"
              className={styles.activeAction}
              data-exchange-room-action={action.id}
              data-action-state="active"
              data-operational={String(action.operational)}
              data-applicable={String(action.applicable)}
              data-authorized="true"
              onClick={() => onNetworkFocus(activeHandler.intent)}
            >
              {label}
            </button>
          );
        }
        if (activeHandler?.kind === "intent" && onActionIntent) {
          return (
            <button
              key={action.id}
              type="button"
              className={styles.activeAction}
              data-exchange-room-action={action.id}
              data-action-state="active"
              data-operational={String(action.operational)}
              data-applicable={String(action.applicable)}
              data-authorized="true"
              onClick={() => onActionIntent(activeHandler.intent)}
            >
              {label}
            </button>
          );
        }

        const reason = !action.operational
          ? "not-operational" as const
          : !action.applicable
            ? "not-applicable" as const
            : permission === false
              ? "not-authorized" as const
              : activeHandler?.kind === "network-focus" && !networkDiscoveryAvailable
                ? "not-operational" as const
                : activeHandler?.kind === "intent" && !onActionIntent
                  ? "not-operational" as const
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
