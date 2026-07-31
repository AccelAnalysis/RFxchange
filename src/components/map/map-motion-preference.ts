export const MAP_ROTATION_STORAGE_KEY = "rfxchange:map-rotation-enabled";
export const MAP_ROTATION_PREFERENCE_EVENT = "rfxchange:map-rotation-preference";

export function readMapRotationPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const value = window.localStorage.getItem(MAP_ROTATION_STORAGE_KEY);
    return value === null ? true : value === "true";
  } catch {
    return true;
  }
}

export function subscribeMapRotationPreference(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const notify = () => onStoreChange();
  window.addEventListener(MAP_ROTATION_PREFERENCE_EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(MAP_ROTATION_PREFERENCE_EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}

export function writeMapRotationPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MAP_ROTATION_STORAGE_KEY, String(enabled));
  } catch {
    // The preference remains session-local when browser storage is unavailable.
  }
  window.dispatchEvent(
    new CustomEvent<boolean>(MAP_ROTATION_PREFERENCE_EVENT, { detail: enabled }),
  );
}
