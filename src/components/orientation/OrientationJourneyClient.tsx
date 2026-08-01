"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  createSyntheticOrientationScenario,
  phaseOneOrientationOverlay,
} from "../../application/orientation/synthetic-scenario";
import {
  ORIENTATION_STEP_SEQUENCE,
  SLICE_2_10_MAX_ORIENTATION_STEP,
  type OrientationJourney,
  type OrientationStepKey,
} from "../../domain/orientation/model";
import { ExchangeSpatialScene, type ExchangeHomeMarker } from "../map/ExchangeSpatialScene";
import { ParticipantShell, ResponsiveEdgeSheet, SpatialWorkspace } from "../participant/ParticipantWorkspace";

import styles from "./OrientationJourneyClient.module.css";

const STEP_COPY = Object.freeze({
  "three-organization-scenario": Object.freeze({
    eyebrow: "Step 1 · Local network",
    summary: "Meet three synthetic organizations operating inside your selected locality.",
    detail: "They demonstrate issuer, responder, and complementary teammate roles without representing real organizations or live Exchange activity.",
  }),
  "opportunity-issuance": Object.freeze({
    eyebrow: "Step 2 · Demand signal",
    summary: "The tutorial issuer publishes a synthetic facilities modernization need.",
    detail: "This is instructional demand, not a live RFx, solicitation, commitment, or invitation to respond.",
  }),
  "capability-match": Object.freeze({
    eyebrow: "Step 3 · Potential fit",
    summary: "Published capabilities create a simplified potential match.",
    detail: "Capability alignment supports discovery only. It is not qualification, endorsement, ranking, or a prediction of selection.",
  }),
  "gap-and-teammate-discovery": Object.freeze({
    eyebrow: "Step 4 · Complementary capacity",
    summary: "A capability gap reveals a possible teammate in the local network.",
    detail: "Discovery does not create a team, confer authority, issue an invitation, or create a contractual relationship.",
  }),
} satisfies Partial<Record<OrientationStepKey, Readonly<{ eyebrow: string; summary: string; detail: string }>>>);

interface OrientationResponse {
  readonly journey?: OrientationJourney;
  readonly error?: string;
}

export function OrientationJourneyClient({
  model,
  marker,
  initialJourney,
}: Readonly<{
  model: ControlledLocalityMapModel;
  marker: ExchangeHomeMarker;
  initialJourney: OrientationJourney | null;
}>) {
  const [journey, setJourney] = useState(initialJourney);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scenario = useMemo(() => createSyntheticOrientationScenario(model), [model]);
  const journeyRef = useRef<HTMLDivElement | null>(null);
  const overlay = useMemo(() => phaseOneOrientationOverlay(scenario, journey), [scenario, journey]);
  const completed = journey?.completedThroughStep ?? 0;
  const currentStep = ORIENTATION_STEP_SEQUENCE[Math.min(completed, SLICE_2_10_MAX_ORIENTATION_STEP - 1)];
  const copy = (currentStep ? STEP_COPY[currentStep.key as keyof typeof STEP_COPY] : undefined) ?? STEP_COPY["three-organization-scenario"];

  useEffect(() => {
    journeyRef.current?.closest("aside")?.scrollTo({ top: 0, behavior: "auto" });
  }, [journey?.completedThroughStep, journey?.restartCount]);

  async function mutate(body: Readonly<Record<string, string>>) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/orientation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json() as OrientationResponse;
      if (!response.ok || !result.journey) throw new Error(result.error ?? "Orientation could not be updated.");
      setJourney(result.journey);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Orientation could not be updated.");
    } finally {
      setPending(false);
    }
  }

  const phaseComplete = completed >= SLICE_2_10_MAX_ORIENTATION_STEP;

  return (
    <ParticipantShell activeItem="Intelligence">
      <SpatialWorkspace ariaLabel="RFxchange synthetic orientation workspace">
        <ExchangeSpatialScene
          model={model}
          mode="locality"
          marker={marker}
          interactive
          showSearch={false}
          workspaceOverlay="right"
          tutorialOverlay={overlay}
        />
        <ResponsiveEdgeSheet ariaLabelledBy="orientation-title" side="right">
          <div ref={journeyRef} className={styles.journey} data-orientation-scenario={scenario.id} data-synthetic-provenance={scenario.provenance}>
            <div className={styles.tutorialFlag}>Synthetic tutorial · not live activity</div>
            <p className={styles.progress}>Part 1 of 2 · {completed} of 8 steps completed</p>
            <h1 id="orientation-title">See how the Exchange works</h1>
            <ul className={styles.legend} aria-label="Synthetic tutorial map roles">
              <li data-role="issuer"><span aria-hidden="true">I</span> Tutorial Issuer</li>
              <li data-role="responder"><span aria-hidden="true">R</span> Tutorial Responder</li>
              <li data-role="teammate"><span aria-hidden="true">T</span> Tutorial Teammate</li>
            </ul>

            {!journey ? (
              <>
                <p className={styles.lede}>
                  Walk through one versioned scenario on the real controlled map. Your organization marker stays visible, while every tutorial organization, opportunity, and connection is synthetic.
                </p>
                <button className={styles.primary} type="button" disabled={pending} onClick={() => mutate({ action: "start" })}>
                  {pending ? "Starting…" : "Start orientation"}
                </button>
              </>
            ) : phaseComplete ? (
              <>
                <p className={styles.eyebrow}>Part one complete</p>
                <h2>From demand to a possible teammate</h2>
                <p className={styles.lede}>
                  You have seen the local network, a synthetic need, a potential capability fit, and complementary teammate discovery. Invitation, response, human evaluation, and the network effect continue in the next approved slice.
                </p>
                <div className={styles.boundary}>No live opportunity, response, teammate invitation, ranking, or credibility record was created.</div>
                <button className={styles.secondary} type="button" disabled={pending} onClick={() => mutate({ action: "restart" })}>
                  {pending ? "Restarting…" : "Restart part one"}
                </button>
              </>
            ) : (
              <>
                <p className={styles.eyebrow}>{copy.eyebrow}</p>
                <h2>{copy.summary}</h2>
                <p className={styles.lede}>{copy.detail}</p>
                {currentStep?.key === "opportunity-issuance" ? (
                  <div className={styles.fact}><span>Synthetic need</span><strong>{scenario.opportunity.title}</strong><small>{scenario.opportunity.requiredCapabilities.join(" · ")}</small></div>
                ) : null}
                {currentStep?.key === "capability-match" ? (
                  <div className={styles.fact}><span>Potential alignment</span><strong>{scenario.capabilityMatch.matchedCapabilities.join(" + ")}</strong><small>{scenario.capabilityMatch.qualificationBoundary}</small></div>
                ) : null}
                {currentStep?.key === "gap-and-teammate-discovery" ? (
                  <div className={styles.fact}><span>Capability gap</span><strong>{scenario.capabilityGap.capability}</strong><small>{scenario.capabilityGap.discoveryBoundary}</small></div>
                ) : null}
                <button
                  className={styles.primary}
                  type="button"
                  disabled={pending || !currentStep}
                  onClick={() => currentStep && mutate({ action: "complete-step", stepKey: currentStep.key })}
                >
                  {pending ? "Saving…" : completed === 3 ? "Complete part one" : "Continue"}
                </button>
                <button className={styles.textButton} type="button" disabled={pending} onClick={() => mutate({ action: "restart" })}>Restart</button>
              </>
            )}
            {error ? <p className={styles.error} role="alert">{error}</p> : null}
            <p className={styles.locality}>Controlled locality: <strong>{scenario.localityLabel}</strong></p>
          </div>
        </ResponsiveEdgeSheet>
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
