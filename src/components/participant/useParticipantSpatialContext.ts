"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import {
  PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT,
  PARTICIPANT_SPATIAL_ACTIVE_KEY,
  commitParticipantSpatialStorage,
  createParticipantSpatialContext,
  legacyParticipantSpatialStorageKey,
  parseParticipantSpatialContext,
  participantSpatialStorageKey,
  resolveParticipantSpatialStorage,
  serializeParticipantSpatialContext,
  type ParticipantSpatialContext,
  type ParticipantSpatialScope,
} from "../../application/participant/participant-spatial-context";

const memory = new Map<string, string>();

export function useParticipantSpatialContext(input: Readonly<{
  scope: ParticipantSpatialScope;
  homeMarkerId: string;
  activeLens: ParticipantSpatialContext["activeLens"];
}>): readonly [ParticipantSpatialContext, (update: (current: ParticipantSpatialContext) => ParticipantSpatialContext) => void] {
  const storageKey = useMemo(() => participantSpatialStorageKey(input.scope), [input.scope]);
  const legacyStorageKey = useMemo(
    () => legacyParticipantSpatialStorageKey(input.scope),
    [input.scope],
  );
  const fallback = useMemo(
    () => createParticipantSpatialContext({ scope: input.scope, homeMarkerId: input.homeMarkerId, activeLens: input.activeLens }),
    [input.activeLens, input.homeMarkerId, input.scope],
  );
  const fallbackSnapshot = useMemo(() => serializeParticipantSpatialContext(fallback), [fallback]);
  const subscribe = useCallback((notify: () => void) => {
    const handle = (event: Event) => {
      if (event instanceof StorageEvent && event.key
        && event.key !== storageKey && event.key !== legacyStorageKey) return;
      if (event instanceof CustomEvent && event.detail
        && event.detail !== storageKey && event.detail !== legacyStorageKey) return;
      if (!(event instanceof StorageEvent) && !(event instanceof CustomEvent)) memory.clear();
      notify();
    };
    window.addEventListener("storage", handle);
    window.addEventListener(PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT, handle);
    return () => {
      window.removeEventListener("storage", handle);
      window.removeEventListener(PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT, handle);
    };
  }, [legacyStorageKey, storageKey]);
  const getSnapshot = useCallback(() => {
    try {
      const resolution = resolveParticipantSpatialStorage(
        window.sessionStorage,
        input.scope,
        fallbackSnapshot,
      );
      memory.set(storageKey, resolution.serialized);
      return resolution.serialized;
    } catch {
      return memory.get(storageKey) ?? fallbackSnapshot;
    }
  }, [fallbackSnapshot, input.scope, legacyStorageKey, storageKey]);
  const serialized = useSyncExternalStore(subscribe, getSnapshot, () => fallbackSnapshot);
  useEffect(() => {
    try {
      const resolution = resolveParticipantSpatialStorage(
        window.sessionStorage,
        input.scope,
        fallbackSnapshot,
      );
      commitParticipantSpatialStorage(window.sessionStorage, input.scope, resolution);
    } catch { /* optional continuity pointer */ }
  }, [fallbackSnapshot, input.scope]);
  const context = useMemo(
    () => parseParticipantSpatialContext(serialized, input.scope) ?? fallback,
    [fallback, input.scope, serialized],
  );
  const update = useCallback((mutate: (current: ParticipantSpatialContext) => ParticipantSpatialContext) => {
    const current = parseParticipantSpatialContext(getSnapshot(), input.scope) ?? fallback;
    const next = mutate(current);
    const value = serializeParticipantSpatialContext(next);
    memory.set(storageKey, value);
    try {
      window.sessionStorage.setItem(storageKey, value);
      window.sessionStorage.setItem(PARTICIPANT_SPATIAL_ACTIVE_KEY, storageKey);
    } catch { /* in-memory continuity remains available */ }
    window.dispatchEvent(new CustomEvent(PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT, { detail: storageKey }));
  }, [fallback, getSnapshot, input.scope, storageKey]);

  return Object.freeze([context, update]);
}
