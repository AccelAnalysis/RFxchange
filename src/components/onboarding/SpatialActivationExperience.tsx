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

interface SpatialModelResponse {
  readonly model: ControlledLocalityMapModel;
}

export function SpatialActivationExperience({
  mapModel,
}: Readonly<{ mapModel: ControlledLocalityMapModel }>) {
  const [activationState, setActivationState] = useState<ActivationJourneyState | null>(null);
  const [sceneModel, setSceneModel] = useState(mapModel);
  const [homeMarker, setHomeMarker] = useState<ExchangeHomeMarker | null>(null);
  const [workspaceUrl, setWorkspaceUrl] = useState("/geography/canvas");
  const selectedGeographyId = activationState?.selectedGeography?.id ?? null;
  const markerActive = activationState?.marker?.status === "active";
  const sceneModelMatchesSelection = selectedGeographyId !== null &&
    String(sceneModel.selectedGeography.id) === selectedGeographyId;

  useEffect(() => {
    if (!selectedGeographyId || sceneModelMatchesSelection) return;
    let cancelled = false;

    fetch("/api/onboarding/spatial-model", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as SpatialModelResponse;
      })
      .then((result) => {
        if (!cancelled && result?.model) setSceneModel(result.model);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [sceneModelMatchesSelection, selectedGeographyId]);

  useEffect(() => {
    if (!markerActive || homeMarker) return;
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
  }, [homeMarker, markerActive]);

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
    : selectedGeographyId && sceneModelMatchesSelection
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
            model={sceneModel}
            mode={sceneMode}
            marker={homeMarker}
            activationOverlay={!homeMarker}
          />
        </div>
      ) : null}
      <div className={styles.content}>
        <ActivationJourneyClient
          mapModel={sceneModel}
          onStateChange={setActivationState}
        />
      </div>
    </div>
  );
}
