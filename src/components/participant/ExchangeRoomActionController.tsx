"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { exchangeRoomLocaleCatalog } from "../../application/participant/exchange-room-locale";
import { reopenExchangeRoomActionPanel } from "../../application/participant/exchange-room-spatial-controls";
import type { ExchangeRoomActionProjection } from "../../application/participant/exchange-room-actions";
import {
  PARTICIPANT_LENS_IDS,
  type ParticipantLensId,
} from "../../application/participant/participant-lens-registry";
import { participantSpatialLensHref } from "../../application/participant/participant-spatial-context";
import { useI18n } from "../i18n/I18nProvider";

import styles from "./ExchangeRoomActionController.module.css";

interface ActionAuthorizationProjection {
  readonly openPlatform: boolean;
  readonly rfxCreate: boolean;
  readonly referralManage: boolean;
  readonly resourceManage: boolean;
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
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
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
      event.stopPropagation();
      reopenExchangeRoomActionPanel();
      onLensSelect(lens);
    };
    document.addEventListener("click", handleLensActivation, true);
    return () => document.removeEventListener("click", handleLensActivation, true);
  }, [onLensSelect]);
}

function privilegedPermission(actionId: string, authorization: ActionAuthorizationProjection): boolean | null {
  if (actionId === "opportunities.create-rfx") return authorization.openPlatform && authorization.rfxCreate;
  if (actionId === "resources.my-requests") return authorization.openPlatform && authorization.referralManage;
  if (actionId === "resources.provider-status") return authorization.openPlatform && authorization.resourceManage;
  if (actionId === "referrals.new") return authorization.openPlatform && authorization.referralManage;
  return null;
}

function privilegedHref(actionId: string): string | null {
  if (actionId === "opportunities.create-rfx") return "/opportunities/manage";
  if (actionId === "resources.my-requests") return "/resources";
  if (actionId === "resources.provider-status") return "/provider-application";
  if (actionId === "referrals.new") return participantSpatialLensHref("referrals");
  return null;
}

export function ExchangeRoomActionController({
  activeLens,
  actions,
  onNetworkFocus,
}: Readonly<{
  activeLens: ParticipantLensId;
  actions: readonly ExchangeRoomActionProjection[];
  onNetworkFocus(intent: "organizations" | "capabilities"): void;
}>) {
  const { locale } = useI18n();
  const messages = exchangeRoomLocaleCatalog(locale);
  const [authorization, setAuthorization] = useState<ActionAuthorizationProjection>(DENIED_ACTION_AUTHORIZATION);
  const [networkDiscoveryAvailable, setNetworkDiscoveryAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    const discoveryFrame = window.requestAnimationFrame(() => {
      if (!active) return;
      setNetworkDiscoveryAvailable(Boolean(document.querySelector('form[action="/geography/canvas"]')));
    });
    void fetch("/geography/canvas/action-authorization", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => response.ok ? response.json() : DENIED_ACTION_AUTHORIZATION)
      .then((payload: Partial<ActionAuthorizationProjection>) => {
        if (!active) return;
        setAuthorization(Object.freeze({
          openPlatform: payload.openPlatform === true,
          rfxCreate: payload.rfxCreate === true,
          referralManage: payload.referralManage === true,
          resourceManage: payload.resourceManage === true,
        }));
      })
      .catch(() => active && setAuthorization(DENIED_ACTION_AUTHORIZATION));
    return () => {
      active = false;
      window.cancelAnimationFrame(discoveryFrame);
    };
  }, []);

  return (
    <section className={styles.actionGrid} aria-label={messages.actionsLabel} data-exchange-room-action-grid data-active-lens={activeLens}>
      {actions.map((action) => {
        const label = messages.actions[action.id];
        const permission = privilegedPermission(action.id, authorization);
        const networkIntent = action.id === "intelligence.organizations"
          ? "organizations" as const
          : action.id === "intelligence.capabilities"
            ? "capabilities" as const
            : null;
        if (networkIntent && networkDiscoveryAvailable) {
          return <button key={action.id} type="button" className={styles.activeAction} data-exchange-room-action={action.id} data-action-state="active" onClick={() => onNetworkFocus(networkIntent)}>{label}</button>;
        }
        if (permission === true && action.applicable) {
          const href = privilegedHref(action.id);
          if (href) return <Link key={action.id} className={styles.activeAction} href={href} data-exchange-room-action={action.id} data-action-state="active">{label}</Link>;
        }
        if (permission === null && action.availability === "active" && action.resolvedHandler?.kind === "href") {
          return <Link key={action.id} className={styles.activeAction} href={action.resolvedHandler.href} data-exchange-room-action={action.id} data-action-state="active">{label}</Link>;
        }
        if (permission === null && action.availability === "active" && action.resolvedHandler?.kind === "network-focus") {
          const intent = action.resolvedHandler.intent;
          return <button key={action.id} type="button" className={styles.activeAction} data-exchange-room-action={action.id} data-action-state="active" onClick={() => onNetworkFocus(intent)}>{label}</button>;
        }
        const reason = permission === false && action.applicable
          ? "not-authorized" as const
          : networkIntent && !networkDiscoveryAvailable
            ? "not-operational" as const
            : action.disabledReason ?? "not-operational";
        return <button key={action.id} type="button" className={styles.disabledAction} disabled aria-label={`${label}. ${messages.disabledReasons[reason]}`} data-exchange-room-action={action.id} data-action-state="disabled" data-disabled-reason={reason}>{label}</button>;
      })}
    </section>
  );
}
