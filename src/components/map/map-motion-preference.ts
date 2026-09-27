import type { Map } from "mapbox-gl";

export const MAP_ROTATION_STORAGE_KEY = "rfxchange:map-rotation-enabled";
export const MAP_ROTATION_PREFERENCE_EVENT = "rfxchange:map-rotation-preference";

export function readMapRotationPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const value = window.localStorage.getItem(MAP_ROTATION_STORAGE_KEY);
    return value === "true";
  } catch {
    return false;
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

/** Native camera easing owns animation. A single listener continues the optional ambient scene. */
export function startAmbientMapRotation(
  map: Pick<Map, "on" | "off" | "easeTo" | "getBearing" | "stop">,
  allowed: () => boolean,
): () => void {
  let active = true;
  let moving = false;
  const rotate = () => {
    if (!active || !allowed()) return;
    moving = true;
    map.easeTo({ bearing: map.getBearing() + 90, duration: 56_250, easing: (t: number) => t, essential: false });
  };
  map.on("moveend", rotate);
  rotate();
  return () => {
    active = false;
    map.off("moveend", rotate);
    if (moving) map.stop();
  };
}
