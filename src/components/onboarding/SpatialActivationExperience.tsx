"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { ActivationJourneyState } from "../../application/onboarding/activation-journey";
import { loadRequiredSceneWithRetry } from "../../application/onboarding/required-scene-recovery";
import {
  ExchangeSpatialScene,
  type ExchangeHomeMarker,
} from "../map/ExchangeSpatialScene";
import { useI18n } from "../i18n/I18nProvider";
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

async function fetchRequiredScene<T>(
  url: string,
  signal: AbortSignal,
  validate: (payload: unknown) => boolean,
): Promise<T> {
  return loadRequiredSceneWithRetry(async (requestSignal) => {
    const response = await fetch(url, { cache: "no-store", signal: requestSignal });
    if (!response.ok) throw new Error(`Required scene request failed with HTTP ${response.status}.`);
    const payload = await response.json() as unknown;
    if (!validate(payload)) throw new Error("Required scene response was incomplete.");
    return payload as T;
  }, signal);
}

export function SpatialActivationExperience({
  mapModel,
}: Readonly<{ mapModel: ControlledLocalityMapModel }>) {
  const { t } = useI18n();
  const router = useRouter();
  const [activationState, setActivationState] = useState<ActivationJourneyState | null>(null);
  const [sceneModel, setSceneModel] = useState(mapModel);
  const [homeMarker, setHomeMarker] = useState<ExchangeHomeMarker | null>(null);
  const [workspaceUrl, setWorkspaceUrl] = useState("/geography/canvas");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [spatialModelFailed, setSpatialModelFailed] = useState(false);
  const [homeSceneFailed, setHomeSceneFailed] = useState(false);
  const [spatialRetryKey, setSpatialRetryKey] = useState(0);
  const [homeSceneRetryKey, setHomeSceneRetryKey] = useState(0);
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
    const controller = new AbortController();

    fetchRequiredScene<SpatialModelResponse>(
      "/api/onboarding/spatial-model",
      controller.signal,
      (payload) => Boolean(payload && typeof payload === "object" && "model" in payload),
    )
      .then((result) => {
        if (result?.model) {
          setSpatialModelFailed(false);
          setSceneModel(result.model);
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSpatialModelFailed(true);
      });

    return () => {
      controller.abort();
    };
  }, [sceneModelMatchesSelection, selectedGeographyId, spatialRetryKey]);

  useEffect(() => {
    if (!markerActive || homeMarker) return;
    const controller = new AbortController();

    fetchRequiredScene<HomeSceneResponse>(
      "/api/onboarding/home-scene",
      controller.signal,
      (payload) => Boolean(payload && typeof payload === "object" && "marker" in payload),
    )
      .then((result) => {
        if (result) {
          setHomeSceneFailed(false);
          setHomeMarker(result.marker);
          setWorkspaceUrl(result.controlledPlatformUrl || "/geography/canvas");
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setHomeSceneFailed(true);
      });

    return () => {
      controller.abort();
    };
  }, [homeMarker, homeSceneRetryKey, markerActive]);

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
            continuousMotion={homeMarker ? "milestone" : "instructional"}
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
      {spatialModelFailed || homeSceneFailed ? (
        <div className={styles.recoveryStack}>
          {spatialModelFailed ? (
            <div className={styles.recoveryNotice} role="alert">
              <span>{t("mapStabilization.spatialModelFailure")}</span>
              <button type="button" onClick={() => {
                setSpatialModelFailed(false);
                setSpatialRetryKey((value) => value + 1);
              }}>
                {t("mapStabilization.retry")}
              </button>
            </div>
          ) : null}
          {homeSceneFailed ? (
            <div className={styles.recoveryNotice} role="alert">
              <span>{t("mapStabilization.homeSceneFailure")}</span>
              <button type="button" onClick={() => {
                setHomeSceneFailed(false);
                setHomeSceneRetryKey((value) => value + 1);
              }}>
                {t("mapStabilization.retry")}
              </button>
            </div>
          ) : null}
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
