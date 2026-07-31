"use client";

import { useEffect, useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { ActivationJourneyState } from "../../application/onboarding/activation-journey";
import { ExchangeSpatialScene } from "../map/ExchangeSpatialScene";
import { ActivationJourneyClient } from "./ActivationJourneyClient";

import styles from "./SpatialActivationExperience.module.css";

export function SpatialActivationExperience({
  mapModel,
}: Readonly<{ mapModel: ControlledLocalityMapModel }>) {
  const [activationState, setActivationState] = useState<ActivationJourneyState | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function refreshActivationState() {
      try {
        const response = await fetch("/api/onboarding/activation", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setActivationState(null);
          return;
        }
        const result = (await response.json()) as { state?: ActivationJourneyState };
        if (!cancelled) setActivationState(result.state ?? null);
      } catch {
        // The account and activation forms remain usable if the visual background cannot refresh.
      }
    }

    void refreshActivationState();
    timer = window.setInterval(() => void refreshActivationState(), 1_500);
    window.addEventListener("focus", refreshActivationState);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearInterval(timer);
      window.removeEventListener("focus", refreshActivationState);
    };
  }, []);

  const mapVisible = activationState !== null;
  const sceneMode = activationState?.selectedGeography ? "locality" : "regional";

  return (
    <div className={styles.experience} data-map-visible={mapVisible}>
      {mapVisible ? (
        <div className={styles.mapLayer}>
          <ExchangeSpatialScene model={mapModel} mode={sceneMode} activationOverlay />
        </div>
      ) : null}
      <div className={styles.content}>
        <ActivationJourneyClient mapModel={mapModel} />
      </div>
    </div>
  );
}
