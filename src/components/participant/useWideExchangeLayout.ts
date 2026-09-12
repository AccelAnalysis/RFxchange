"use client";

import { useSyncExternalStore } from "react";

const query = "(min-width: 1025px)";
function subscribe(listener: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

/** Presentation only; permissions and selected records remain server-authorized. */
export function useWideExchangeLayout(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
