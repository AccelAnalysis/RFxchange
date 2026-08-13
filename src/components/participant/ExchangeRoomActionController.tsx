"use client";

import Link from "next/link";
import { useEffect } from "react";

import { exchangeRoomLocaleCatalog } from "../../application/participant/exchange-room-locale";
import type { ExchangeRoomActionProjection } from "../../application/participant/exchange-room-actions";
import {
  PARTICIPANT_LENS_IDS,
  type ParticipantLensId,
} from "../../application/participant/participant-lens-registry";
import { useI18n } from "../i18n/I18nProvider";

import styles from "./ExchangeRoomActionController.module.css";

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

export function useExchangeRoomLensController(
  onLensSelect: (lens: ParticipantLensId) => void,
): void {
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
      onLensSelect(lens);
    };

    document.addEventListener("click", handleLensActivation, true);
    return () => document.removeEventListener("click", handleLensActivation, true);
  }, [onLensSelect]);
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

  return (
    <section
      className={styles.actionGrid}
      aria-label={messages.actionsLabel}
      data-exchange-room-action-grid
      data-active-lens={activeLens}
    >
      {actions.map((action) => {
        const label = messages.actions[action.id];
        if (action.availability === "active" && action.resolvedHandler?.kind === "href") {
          return (
            <Link
              key={action.id}
              className={styles.activeAction}
              href={action.resolvedHandler.href}
              data-exchange-room-action={action.id}
              data-action-state="active"
            >
              {label}
            </Link>
          );
        }
        if (action.availability === "active" && action.resolvedHandler?.kind === "network-focus") {
          const intent = action.resolvedHandler.intent;
          return (
            <button
              key={action.id}
              type="button"
              className={styles.activeAction}
              data-exchange-room-action={action.id}
              data-action-state="active"
              onClick={() => onNetworkFocus(intent)}
            >
              {label}
            </button>
          );
        }
        const reason = action.disabledReason ?? "not-operational";
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
          >
            {label}
          </button>
        );
      })}
    </section>
  );
}
