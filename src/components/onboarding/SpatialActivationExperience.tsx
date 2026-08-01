"use client";

import { useEffect, useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { ActivationJourneyState } from "../../application/onboarding/activation-journey";
import {
  ExchangeSpatialScene,
  type ExchangeHomeMarker,
} from "../map/ExchangeSpatialScene";
import { StatusPill } from "../ui";
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
  const [reducedMotion, setReducedMotion] = useState(false);
  const selectedGeographyId = activationState?.selectedGeography?.id ?? null;
  const markerActive = activationState?.marker?.status === "active";
  const sceneModelMatchesSelection = selectedGeographyId !== null &&
    String(sceneModel.selectedGeography.id) === selectedGeographyId;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

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
    }, reducedMotion ? 200 : 3_400);
    return () => window.clearTimeout(timer);
  }, [homeMarker, reducedMotion, workspaceUrl]);

  const mapVisible = activationState !== null;
  const sceneMode = homeMarker
    ? "organization"
    : selectedGeographyId && sceneModelMatchesSelection
      ? "locality"
      : "regional";
  const localityName = activationState?.selectedGeography?.name ?? sceneModel.selectedGeography.name;
  const statusText = homeMarker
    ? "Your organization is now visible. Entering The RFxchange."
    : activationState
      ? `Activation progress is preserved. Current step: ${activationState.nextStep.replaceAll("-", " ")}.`
      : "Create or sign in to an account to begin organization activation.";

  return (
    <div
      className={styles.experience}
      data-map-visible={mapVisible}
      data-entering-workspace={homeMarker !== null}
      data-reduced-motion={reducedMotion}
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
      {mapVisible ? (
        <div className={styles.continuityStatus} role="status" aria-live="polite">
          <StatusPill tone={homeMarker ? "positive" : "connection"}>
            {homeMarker ? "Organization visible" : localityName}
          </StatusPill>
          <span>{statusText}</span>
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
