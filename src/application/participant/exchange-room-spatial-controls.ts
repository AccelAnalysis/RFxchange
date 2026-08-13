import {
  PARTICIPANT_SPATIAL_ACTIVE_KEY,
  PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT,
  PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX,
  readActiveParticipantSpatialContext,
  serializeParticipantSpatialContext,
} from "./participant-spatial-context";

export function reopenExchangeRoomActionPanel(): void {
  if (typeof window === "undefined") return;
  const context = readActiveParticipantSpatialContext();
  if (!context || context.panelOpen) return;
  try {
    const storageKey = window.sessionStorage.getItem(PARTICIPANT_SPATIAL_ACTIVE_KEY);
    if (!storageKey?.startsWith(PARTICIPANT_SPATIAL_CONTEXT_STORAGE_PREFIX)) return;
    window.sessionStorage.setItem(storageKey, serializeParticipantSpatialContext(Object.freeze({
      ...context,
      panelOpen: true,
    })));
    window.dispatchEvent(new CustomEvent(PARTICIPANT_SPATIAL_CONTEXT_CHANGED_EVENT, { detail: storageKey }));
  } catch {
    // Optional continuity state never broadens authority or blocks lens selection.
  }
}
