"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
    router.prefetch(workspaceUrl);
    // The organization-visible animation can still play, but it no longer blocks the participant.
    // Auto-entry is brief and an immediate Enter link is rendered at the same time.
    const timer = window.setTimeout(() => {
      router.replace(workspaceUrl);
    }, reducedMotion ? 50 : 900);
    return () => window.clearTimeout(timer);
  }, [homeMarker, reducedMotion, router, workspaceUrl]);

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
          {homeMarker ? <Link href={workspaceUrl}>Enter now</Link> : null}
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
