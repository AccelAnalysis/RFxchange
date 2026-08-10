"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import {
  createSyntheticOrientationScenario,
  orientationMapOverlay,
} from "../../application/orientation/synthetic-scenario";
import {
  ORIENTATION_STEP_SEQUENCE,
  SLICE_2_11_MAX_ORIENTATION_STEP,
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
  "teammate-invitation": Object.freeze({
    eyebrow: "Step 5 · Review and accept",
    summary: "The discovered teammate reviews a defined contribution before accepting.",
    detail: "The invitation carries context and capacity, but acceptance remains a nonbinding Exchange workflow state.",
  }),
  "joint-response": Object.freeze({
    eyebrow: "Step 6 · Structured response",
    summary: "Requirements become assigned, reviewable response sections.",
    detail: "The responder and teammate can see who contributes each section and whether the synthetic response is complete.",
  }),
  "human-evaluation": Object.freeze({
    eyebrow: "Step 7 · Human evaluation",
    summary: "The issuer compares responses against the criteria it stated.",
    detail: "RFxchange can organize evidence and comparison. The issuer—not an automated winner model—makes the selection.",
  }),
  "network-effect": Object.freeze({
    eyebrow: "Step 8 · Connected outcome",
    summary: "See the complete Exchange journey as one geographic network.",
    detail: "Demand, discoverable capability, a gap, a teammate, a joint response, and a human-selected outcome now connect on the map.",
  }),
} satisfies Record<OrientationStepKey, Readonly<{ eyebrow: string; summary: string; detail: string }>>);

const ACTION_LABELS: Readonly<Record<OrientationStepKey, string>> = Object.freeze({
  "three-organization-scenario": "Continue",
  "opportunity-issuance": "Continue",
  "capability-match": "Continue",
  "gap-and-teammate-discovery": "Continue to invitation",
  "teammate-invitation": "Accept synthetic invitation",
  "joint-response": "Submit synthetic response",
  "human-evaluation": "Make human tutorial selection",
  "network-effect": "Complete orientation",
});

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
  const overlay = useMemo(() => orientationMapOverlay(scenario, journey), [scenario, journey]);
  const completed = journey?.completedThroughStep ?? 0;
  const currentStep = ORIENTATION_STEP_SEQUENCE[Math.min(completed, SLICE_2_11_MAX_ORIENTATION_STEP - 1)];
  const copy = currentStep ? STEP_COPY[currentStep.key] : STEP_COPY["three-organization-scenario"];

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

  const orientationComplete = journey?.status === "completed" && completed === SLICE_2_11_MAX_ORIENTATION_STEP;
  const part = completed < 4 ? 1 : 2;

  return (
    <ParticipantShell activeItem="Network">
      <SpatialWorkspace ariaLabel="RFxchange synthetic orientation workspace">
        <ExchangeSpatialScene
          model={model}
          mode="locality"
          marker={marker}
          interactive
          showSearch={false}
          workspaceOverlay="right"
          tutorialOverlay={overlay}
          continuousMotion="instructional"
        />
        <ResponsiveEdgeSheet ariaLabelledBy="orientation-title" side="right">
          <div ref={journeyRef} className={styles.journey} data-orientation-scenario={scenario.id} data-synthetic-provenance={scenario.provenance}>
            <div className={styles.tutorialFlag}>Synthetic tutorial · not live activity</div>
            <p className={styles.progress}>Part {part} of 2 · {completed} of 8 steps completed</p>
            <h1 id="orientation-title">See how the Exchange works</h1>
            <ul className={styles.legend} aria-label="Synthetic tutorial map roles">
              <li data-role="issuer"><span aria-hidden="true">I</span> Tutorial Issuer</li>
              <li data-role="responder"><span aria-hidden="true">R</span> Tutorial Responder</li>
              <li data-role="teammate"><span aria-hidden="true">T</span> Tutorial Teammate</li>
            </ul>

            {!journey ? (
              <>
                <p className={styles.lede}>
                  Walk through one versioned scenario on the real controlled map. Your organization marker stays visible, while every tutorial organization, opportunity, response, and connection is synthetic.
                </p>
                <button className={styles.primary} type="button" disabled={pending} onClick={() => mutate({ action: "start" })}>
                  {pending ? "Starting…" : "Start orientation"}
                </button>
              </>
            ) : orientationComplete ? (
              <>
                <p className={styles.eyebrow}>Orientation complete</p>
                <h2>A connected network, not isolated tools</h2>
                <p className={styles.lede}>{scenario.networkEffect.summary}</p>
                <div className={styles.boundary}>{scenario.networkEffect.outcomeBoundary}</div>
                <p className={styles.nextStep}>Your completion is saved. First-value selection follows in the next approved activation step.</p>
                <Link className={styles.primary} href="/first-value">Choose what to do first</Link>
                <button className={styles.secondary} type="button" disabled={pending} onClick={() => mutate({ action: "restart" })}>
                  {pending ? "Restarting…" : "Restart orientation"}
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
                {currentStep?.key === "teammate-invitation" ? (
                  <section className={styles.workflowCard} aria-label="Synthetic teammate invitation">
                    <span>Defined capacity</span>
                    <h3>{scenario.teammateInvitation.capacity}</h3>
                    <p>{scenario.teammateInvitation.context}</p>
                    <dl className={styles.statusPair}><div><dt>Context</dt><dd>Reviewed</dd></div><div><dt>Decision</dt><dd>Ready to accept</dd></div></dl>
                    <small>{scenario.teammateInvitation.nonbindingBoundary}</small>
                  </section>
                ) : null}
                {currentStep?.key === "joint-response" ? (
                  <section className={styles.workflowCard} aria-labelledby="response-title">
                    <span>Synthetic response workspace</span>
                    <h3 id="response-title">{scenario.jointResponse.title}</h3>
                    <ul className={styles.requirements}>
                      {scenario.jointResponse.sections.map((section) => (
                        <li key={section.id}><div><strong>{section.requirement}</strong><small>{section.assignedTo}</small></div><b>Complete</b></li>
                      ))}
                    </ul>
                    <small>{scenario.jointResponse.submissionBoundary}</small>
                  </section>
                ) : null}
                {currentStep?.key === "human-evaluation" ? (
                  <section className={styles.workflowCard} aria-labelledby="evaluation-title">
                    <span>Issuer comparison</span>
                    <h3 id="evaluation-title">Stated criteria, human decision</h3>
                    <div className={styles.comparison} role="table" aria-label="Synthetic response comparison">
                      <div className={styles.comparisonHeader} role="row">
                        <b role="columnheader">Criterion</b>
                        {scenario.evaluation.responses.map((response) => <b role="columnheader" key={response.id}>{response.label}</b>)}
                      </div>
                      {scenario.evaluation.criteria.map((criterion, index) => (
                        <div className={styles.comparisonRow} role="row" key={criterion.id}>
                          <span role="rowheader">{criterion.label} <small>{criterion.weight}</small></span>
                          {scenario.evaluation.responses.map((response) => <span role="cell" key={response.id}>{response.findings[index]}</span>)}
                        </div>
                      ))}
                    </div>
                    <small>{scenario.evaluation.authorityBoundary}</small>
                  </section>
                ) : null}
                {currentStep?.key === "network-effect" ? (
                  <section className={styles.workflowCard} aria-label="Complete synthetic network effect">
                    <span>Complete network effect</span>
                    <h3>Five connected moments on one map</h3>
                    <ol className={styles.networkSequence}>
                      <li>Demand became visible</li><li>Capability became discoverable</li><li>A gap revealed a teammate</li><li>The team responded</li><li>The issuer selected an outcome</li>
                    </ol>
                    <small>{scenario.networkEffect.outcomeBoundary}</small>
                  </section>
                ) : null}

                <button
                  className={styles.primary}
                  type="button"
                  disabled={pending || !currentStep}
                  onClick={() => currentStep && mutate({ action: "complete-step", stepKey: currentStep.key })}
                >
                  {pending ? "Saving…" : currentStep ? ACTION_LABELS[currentStep.key] : "Continue"}
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
