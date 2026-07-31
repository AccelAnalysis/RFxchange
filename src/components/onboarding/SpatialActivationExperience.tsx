"use client";

import { useEffect, useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { ActivationJourneyState } from "../../application/onboarding/activation-journey";
import {
  ExchangeSpatialScene,
  type ExchangeHomeMarker,
} from "../map/ExchangeSpatialScene";
import { ActivationJourneyClient } from "./ActivationJourneyClient";

import styles from "./SpatialActivationExperience.module.css";

interface HomeSceneResponse {
  readonly marker: ExchangeHomeMarker;
  readonly controlledPlatformUrl: string;
}

export function SpatialActivationExperience({
  mapModel,
}: Readonly<{ mapModel: ControlledLocalityMapModel }>) {
  const [activationState, setActivationState] = useState<ActivationJourneyState | null>(null);
  const [homeMarker, setHomeMarker] = useState<ExchangeHomeMarker | null>(null);
  const [workspaceUrl, setWorkspaceUrl] = useState("/geography/canvas");

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

  useEffect(() => {
    if (activationState?.marker?.status !== "active" || homeMarker) return;
    let cancelled = false;

    fetch("/api/onboarding/home-scene", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as HomeSceneResponse;
      })
      .then((result) => {
        if (!cancelled && result) {
          setHomeMarker(result.marker);
          setWorkspaceUrl(result.controlledPlatformUrl || "/geography/canvas");
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [activationState?.marker?.status, homeMarker]);

  useEffect(() => {
    if (!homeMarker) return;
    const timer = window.setTimeout(() => {
      window.location.assign(workspaceUrl);
    }, 3_400);
    return () => window.clearTimeout(timer);
  }, [homeMarker, workspaceUrl]);

  const mapVisible = activationState !== null;
  const sceneMode = homeMarker
    ? "organization"
    : activationState?.selectedGeography
      ? "locality"
      : "regional";

  return (
    <div
      className={styles.experience}
      data-map-visible={mapVisible}
      data-entering-workspace={homeMarker !== null}
    >
      {mapVisible ? (
        <div className={styles.mapLayer}>
          <ExchangeSpatialScene
            model={mapModel}
            mode={sceneMode}
            marker={homeMarker}
            activationOverlay={!homeMarker}
          />
        </div>
      ) : null}
      <div className={styles.content}>
        <ActivationJourneyClient mapModel={mapModel} />
      </div>
    </div>
  );
}
