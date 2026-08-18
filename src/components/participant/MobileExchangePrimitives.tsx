"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";

import type {
  ExchangeMediaModel,
  FavoriteState,
  LensResultCardModel,
  RecordActionDefinition,
} from "../../application/participant/mobile-exchange-contracts";
import {
  PARTICIPANT_SHEET_SNAP_POINTS,
  type ParticipantSheetSnapPoint,
} from "../../application/participant/participant-spatial-context";

import styles from "./MobileExchangePrimitives.module.css";

const SNAP_INDEX = Object.freeze({ peek: 0, partial: 1, expanded: 2 } as const);

export interface ExchangeSheetLabels {
  readonly region: string;
  readonly dragHandle: string;
  readonly peek: string;
  readonly partial: string;
  readonly expanded: string;
}

export interface ExchangeCardLabels {
  readonly openDetail: string;
  readonly addFavorite: string;
  readonly removeFavorite: string;
  readonly favoriteUnavailable: string;
  readonly mediaFallback: string;
}

function nextSnapPoint(
  current: ParticipantSheetSnapPoint,
  deltaY: number,
  velocityY: number,
): ParticipantSheetSnapPoint {
  const currentIndex = SNAP_INDEX[current];
  const decisiveVelocity = Math.abs(velocityY) >= 0.55;
  const decisiveDistance = Math.abs(deltaY) >= 56;
  if (!decisiveVelocity && !decisiveDistance) return current;
  const direction = deltaY < 0 || velocityY < -0.55 ? 1 : -1;
  const nextIndex = Math.max(0, Math.min(2, currentIndex + direction));
  return PARTICIPANT_SHEET_SNAP_POINTS[nextIndex]!;
}

export function ExchangeBottomSheet({
  labelledBy,
  labels,
  snapPoint,
  summary,
  actionRail,
  children,
  initialScrollTop = 0,
  onSnapPointChange,
  onScrollPositionChange,
}: Readonly<{
  labelledBy: string;
  labels: ExchangeSheetLabels;
  snapPoint: ParticipantSheetSnapPoint;
  summary: ReactNode;
  actionRail: ReactNode;
  children: ReactNode;
  initialScrollTop?: number;
  onSnapPointChange(next: ParticipantSheetSnapPoint): void;
  onScrollPositionChange?(scrollTop: number): void;
}>) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<Readonly<{
    pointerId: number;
    startY: number;
    lastY: number;
    lastAt: number;
    velocityY: number;
  }> | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.scrollTop = Math.max(0, initialScrollTop);
  }, [initialScrollTop]);

  const setSnap = useCallback((next: ParticipantSheetSnapPoint) => {
    setDragOffset(0);
    setDragging(false);
    onSnapPointChange(next);
  }, [onSnapPointChange]);

  const beginDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = Object.freeze({
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      lastAt: performance.now(),
      velocityY: 0,
    });
    setDragging(true);
  };

  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const current = dragState.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const now = performance.now();
    const elapsed = Math.max(1, now - current.lastAt);
    const velocityY = (event.clientY - current.lastY) / elapsed;
    const deltaY = event.clientY - current.startY;
    dragState.current = Object.freeze({
      ...current,
      lastY: event.clientY,
      lastAt: now,
      velocityY,
    });
    setDragOffset(Math.max(-180, Math.min(180, deltaY)));
  };

  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const current = dragState.current;
    if (!current || current.pointerId !== event.pointerId) return;
    dragState.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setSnap(nextSnapPoint(snapPoint, event.clientY - current.startY, current.velocityY));
  };

  const style = useMemo(() => ({
    "--exchange-sheet-drag-offset": `${dragOffset}px`,
  }) as CSSProperties, [dragOffset]);

  return (
    <aside
      className={styles.sheet}
      data-mobile-exchange-sheet
      data-snap-point={snapPoint}
      data-dragging={dragging ? "true" : undefined}
      aria-labelledby={labelledBy}
      aria-label={labels.region}
      style={style}
    >
      <div className={styles.sheetChrome}>
        <button
          type="button"
          className={styles.dragHandle}
          aria-label={labels.dragHandle}
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span aria-hidden="true" />
        </button>
        <div className={styles.sheetSummary}>{summary}</div>
        <div className={styles.snapControls} role="group" aria-label={labels.region}>
          {PARTICIPANT_SHEET_SNAP_POINTS.map((point) => (
            <button
              key={point}
              type="button"
              data-snap-control={point}
              aria-pressed={snapPoint === point}
              onClick={() => setSnap(point)}
            >
              {labels[point]}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.actionRailSlot}>{actionRail}</div>
      <div
        ref={contentRef}
        className={styles.sheetContent}
        data-sheet-scroll-region
        tabIndex={snapPoint === "peek" ? -1 : 0}
        aria-hidden={snapPoint === "peek" ? true : undefined}
        onScroll={(event) => onScrollPositionChange?.(
          Math.max(0, Math.round(event.currentTarget.scrollTop)),
        )}
      >
        {children}
      </div>
    </aside>
  );
}

export function ExchangeMedia({
  media,
  fallbackLabel,
}: Readonly<{
  media: ExchangeMediaModel | null;
  fallbackLabel: string;
}>) {
  const resolvedFallback = media?.fallbackLabel ?? fallbackLabel;
  if (!media || media.kind === "fallback" || (!media.assetReference && !media.posterReference)) {
    return (
      <div className={styles.mediaFallback} data-media-kind="fallback" role="img" aria-label={resolvedFallback}>
        <span aria-hidden="true">RFx</span>
        <small>{resolvedFallback}</small>
      </div>
    );
  }

  const source = media.posterReference ?? media.assetReference;
  return (
    <div className={styles.media} data-media-kind={media.kind}>
      {/* Repository media references are server-derived. Full video playback remains domain-owned. */}
      <img src={source ?? ""} alt={media.alt} loading="lazy" />
      {media.kind === "video-poster" ? <span className={styles.playBadge} aria-hidden="true">▶</span> : null}
    </div>
  );
}

function invokeRecordAction(
  action: RecordActionDefinition,
  label: string,
  onIntent?: (intent: string) => void,
): ReactNode {
  if (action.availability !== "enabled" || !action.handler) {
    return (
      <button
        key={action.id}
        type="button"
        disabled
        data-record-action={action.id}
        data-action-label-key={action.labelKey}
        data-action-state="disabled"
        data-disabled-reason={action.disabledReason ?? "not-operational"}
      >
        {label}
      </button>
    );
  }
  if (action.handler.kind === "href") {
    return (
      <Link
        key={action.id}
        href={action.handler.href}
        data-record-action={action.id}
        data-action-label-key={action.labelKey}
      >
        {label}
      </Link>
    );
  }
  return (
    <button
      key={action.id}
      type="button"
      data-record-action={action.id}
      data-action-label-key={action.labelKey}
      onClick={() => onIntent?.(action.handler?.kind === "intent" ? action.handler.intent : "")}
    >
      {label}
    </button>
  );
}

export function ExchangeFavorite({
  favorite,
  labels,
  onIntent,
}: Readonly<{
  favorite: FavoriteState;
  labels: ExchangeCardLabels;
  onIntent?: (intent: string) => void;
}>) {
  if (!favorite.visible || favorite.availability === "hidden") return null;
  const label = favorite.favorited ? labels.removeFavorite : labels.addFavorite;
  if (favorite.availability !== "enabled" || !favorite.handler) {
    return (
      <button
        type="button"
        className={styles.favorite}
        disabled
        aria-label={`${label}. ${labels.favoriteUnavailable}`}
        data-favorite-state="disabled"
      >
        <span aria-hidden="true">☆</span>
      </button>
    );
  }
  if (favorite.handler.kind === "href") {
    return (
      <Link className={styles.favorite} href={favorite.handler.href} aria-label={label} data-favorite-state={favorite.favorited ? "saved" : "unsaved"}>
        <span aria-hidden="true">{favorite.favorited ? "★" : "☆"}</span>
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={styles.favorite}
      aria-label={label}
      data-favorite-state={favorite.favorited ? "saved" : "unsaved"}
      onClick={() => onIntent?.(favorite.handler?.kind === "intent" ? favorite.handler.intent : "")}
    >
      <span aria-hidden="true">{favorite.favorited ? "★" : "☆"}</span>
    </button>
  );
}

export function ExchangeResultCard({
  card,
  labels,
  selected,
  onSelect,
  onOpen,
  resolveRecordActionLabel,
  onFavoriteIntent,
  onRecordActionIntent,
}: Readonly<{
  card: LensResultCardModel;
  labels: ExchangeCardLabels;
  selected: boolean;
  onSelect(): void;
  onOpen(): void;
  resolveRecordActionLabel(labelKey: string): string;
  onFavoriteIntent?(intent: string): void;
  onRecordActionIntent?(intent: string): void;
}>) {
  return (
    <article
      className={styles.card}
      data-exchange-result-card
      data-selection-key={card.identity.selectionKey}
      data-selected={selected ? "true" : "false"}
      aria-current={selected ? "true" : undefined}
    >
      <div className={styles.cardMedia}>
        <ExchangeMedia media={card.media} fallbackLabel={labels.mediaFallback} />
        <ExchangeFavorite favorite={card.favorite} labels={labels} onIntent={onFavoriteIntent} />
      </div>
      <button
        type="button"
        className={styles.cardOpen}
        aria-label={`${labels.openDetail}: ${card.title}`}
        onFocus={onSelect}
        onPointerEnter={onSelect}
        onClick={() => {
          onSelect();
          onOpen();
        }}
      >
        <span className={styles.cardHeading}>
          <strong>{card.title}</strong>
          {card.indicator ? (
            <small data-emphasis={card.indicator.emphasis}>
              {card.indicator.label}: {card.indicator.value}
            </small>
          ) : null}
        </span>
        {card.organizationIdentity ? <span className={styles.organizationIdentity}>{card.organizationIdentity}</span> : null}
        {card.locality ? <span className={styles.locality}>{card.locality}</span> : null}
        {card.summary ? <span className={styles.summary}>{card.summary}</span> : null}
        {card.metadata.length > 0 ? (
          <span className={styles.metadata}>
            {card.metadata.map((item) => (
              <span key={item.id}><b>{item.label}</b> {item.value}</span>
            ))}
          </span>
        ) : null}
      </button>
      {card.recordActions.length > 0 ? (
        <div className={styles.recordActions}>
          {card.recordActions.map((action) => invokeRecordAction(
            action,
            resolveRecordActionLabel(action.labelKey),
            onRecordActionIntent,
          ))}
        </div>
      ) : null}
    </article>
  );
}