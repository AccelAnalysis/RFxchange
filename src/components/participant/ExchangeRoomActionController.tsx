"use client";

import Link from "next/link";
import { useEffect } from "react";

import {
  type ExchangeRoomActionProjection,
} from "../../application/participant/exchange-room-actions";
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

export function ExchangeRoomActionController({
  activeLens,
  actions,
  onLensSelect,
  onNetworkFocus,
}: Readonly<{
  activeLens: ParticipantLensId;
  actions: readonly ExchangeRoomActionProjection[];
  onLensSelect(lens: ParticipantLensId): void;
  onNetworkFocus(intent: "organizations" | "capabilities"): void;
}>) {
  const { t } = useI18n();

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

  const disabledReasonKey = {
    "not-operational": "networkWorkspace.exchangeRoom.disabledReasons.notOperational",
    "not-applicable": "networkWorkspace.exchangeRoom.disabledReasons.notApplicable",
    "not-authorized": "networkWorkspace.exchangeRoom.disabledReasons.notAuthorized",
  } as const;

  return (
    <section
      className={styles.actionGrid}
      aria-label={t("networkWorkspace.exchangeRoom.actionsLabel")}
      data-exchange-room-action-grid
      data-active-lens={activeLens}
    >
      {actions.map((action) => {
        const label = t(action.labelKey);
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
          return (
            <button
              key={action.id}
              type="button"
              className={styles.activeAction}
              data-exchange-room-action={action.id}
              data-action-state="active"
              onClick={() => onNetworkFocus(action.resolvedHandler?.kind === "network-focus"
                ? action.resolvedHandler.intent
                : "organizations")}
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
            aria-label={`${label}. ${t(disabledReasonKey[reason])}`}
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
