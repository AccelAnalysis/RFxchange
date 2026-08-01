import type { ControlledLocalityMapModel } from "../geography/controlled-locality-map.ts";
import type { GeographicPosition } from "../../domain/geography/boundary.ts";
import { localityDerivedCoordinate } from "../../domain/organization-markers/model.ts";
import {
  ORIENTATION_SCENARIO_ID,
  ORIENTATION_SCENARIO_VERSION,
  type OrientationJourney,
} from "../../domain/orientation/model.ts";

export const SYNTHETIC_ORIENTATION_PROVENANCE = "synthetic-orientation" as const;

export interface SyntheticOrientationNode {
  readonly id: string;
  readonly label: string;
  readonly role: "issuer" | "responder" | "teammate" | "opportunity";
  readonly coordinate: GeographicPosition;
  readonly provenance: typeof SYNTHETIC_ORIENTATION_PROVENANCE;
}

export type SyntheticOrientationPathKind =
  | "demand-signal"
  | "capability-match"
  | "teammate-discovery"
  | "joint-response"
  | "selected-outcome";

export interface SyntheticOrientationPath {
  readonly id: string;
  readonly kind: SyntheticOrientationPathKind;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly coordinates: readonly [GeographicPosition, GeographicPosition];
  readonly provenance: typeof SYNTHETIC_ORIENTATION_PROVENANCE;
}

export interface SyntheticOrientationScenario {
  readonly id: typeof ORIENTATION_SCENARIO_ID;
  readonly version: typeof ORIENTATION_SCENARIO_VERSION;
  readonly provenance: typeof SYNTHETIC_ORIENTATION_PROVENANCE;
  readonly localityLabel: string;
  readonly organizations: readonly SyntheticOrientationNode[];
  readonly opportunity: Readonly<{
    readonly node: SyntheticOrientationNode;
    readonly title: string;
    readonly need: string;
    readonly requiredCapabilities: readonly string[];
    readonly provenance: typeof SYNTHETIC_ORIENTATION_PROVENANCE;
  }>;
  readonly capabilityMatch: Readonly<{
    readonly matchedCapabilities: readonly string[];
    readonly explanation: string;
    readonly qualificationBoundary: string;
  }>;
  readonly capabilityGap: Readonly<{
    readonly capability: string;
    readonly explanation: string;
    readonly discoveryBoundary: string;
  }>;
  readonly teammateInvitation: Readonly<{
    readonly capacity: string;
    readonly context: string;
    readonly reviewState: "reviewed";
    readonly acceptanceState: "accepted";
    readonly nonbindingBoundary: string;
  }>;
  readonly jointResponse: Readonly<{
    readonly title: string;
    readonly sections: readonly Readonly<{
      readonly id: string;
      readonly requirement: string;
      readonly assignedTo: "Tutorial Responder" | "Tutorial Teammate" | "Joint";
      readonly state: "complete";
    }>[];
    readonly submissionBoundary: string;
  }>;
  readonly evaluation: Readonly<{
    readonly criteria: readonly Readonly<{ readonly id: string; readonly label: string; readonly weight: string }>[];
    readonly responses: readonly Readonly<{
      readonly id: string;
      readonly label: string;
      readonly findings: readonly string[];
    }>[];
    readonly selectedResponseId: string;
    readonly authorityBoundary: string;
  }>;
  readonly networkEffect: Readonly<{
    readonly summary: string;
    readonly outcomeBoundary: string;
  }>;
  readonly allPaths: readonly SyntheticOrientationPath[];
}

export interface SyntheticOrientationMapOverlay {
  readonly provenance: typeof SYNTHETIC_ORIENTATION_PROVENANCE;
  readonly stage: "discovery" | "invitation" | "response" | "selection" | "network-effect";
  readonly nodes: readonly SyntheticOrientationNode[];
  readonly paths: readonly SyntheticOrientationPath[];
  readonly accessibleSummary: string;
}

function path(
  id: string,
  kind: SyntheticOrientationPathKind,
  from: SyntheticOrientationNode,
  to: SyntheticOrientationNode,
): SyntheticOrientationPath {
  return Object.freeze({
    id,
    kind,
    fromNodeId: from.id,
    toNodeId: to.id,
    coordinates: Object.freeze([from.coordinate, to.coordinate]) as readonly [GeographicPosition, GeographicPosition],
    provenance: SYNTHETIC_ORIENTATION_PROVENANCE,
  });
}

export function createSyntheticOrientationScenario(
  model: ControlledLocalityMapModel,
): SyntheticOrientationScenario {
  const selected = model.features.find((feature) => feature.role === "selected");
  if (!selected) throw new Error("Orientation requires an authoritative selected-locality boundary.");

  const coordinate = (seed: string, phaseDegrees: number) => localityDerivedCoordinate(
    `tutorial:${ORIENTATION_SCENARIO_ID}:${seed}`,
    model.selectedGeography,
    selected.boundary.geometry,
    { radiusScale: 4, phaseDegrees },
  );
  const issuer = Object.freeze({
    id: "tutorial-issuer",
    label: "Tutorial Issuer",
    role: "issuer" as const,
    coordinate: coordinate("issuer", 30),
    provenance: SYNTHETIC_ORIENTATION_PROVENANCE,
  });
  const responder = Object.freeze({
    id: "tutorial-responder",
    label: "Tutorial Responder",
    role: "responder" as const,
    coordinate: coordinate("responder", 150),
    provenance: SYNTHETIC_ORIENTATION_PROVENANCE,
  });
  const teammate = Object.freeze({
    id: "tutorial-teammate",
    label: "Tutorial Teammate",
    role: "teammate" as const,
    coordinate: coordinate("teammate", 270),
    provenance: SYNTHETIC_ORIENTATION_PROVENANCE,
  });
  const opportunityNode = Object.freeze({
    id: "tutorial-opportunity",
    label: "Tutorial Facilities Need",
    role: "opportunity" as const,
    coordinate: coordinate("opportunity", 210),
    provenance: SYNTHETIC_ORIENTATION_PROVENANCE,
  });

  return Object.freeze({
    id: ORIENTATION_SCENARIO_ID,
    version: ORIENTATION_SCENARIO_VERSION,
    provenance: SYNTHETIC_ORIENTATION_PROVENANCE,
    localityLabel: model.selectedGeography.name,
    organizations: Object.freeze([issuer, responder, teammate]),
    opportunity: Object.freeze({
      node: opportunityNode,
      title: "Tutorial facilities modernization need",
      need: "Coordinate a facilities modernization effort across building systems and controls.",
      requiredCapabilities: Object.freeze([
        "Facilities project coordination",
        "Mechanical systems",
        "Building automation controls",
      ]),
      provenance: SYNTHETIC_ORIENTATION_PROVENANCE,
    }),
    capabilityMatch: Object.freeze({
      matchedCapabilities: Object.freeze([
        "Facilities project coordination",
        "Mechanical systems",
      ]),
      explanation: "The responder's published tutorial capabilities align with two stated needs.",
      qualificationBoundary: "Potential capability fit is not qualification, endorsement, or a prediction of selection.",
    }),
    capabilityGap: Object.freeze({
      capability: "Building automation controls",
      explanation: "The responder does not cover one required capability, so the tutorial searches for a complementary organization.",
      discoveryBoundary: "Discovery identifies a possible teammate; it does not create a team, contract, or authority.",
    }),
    teammateInvitation: Object.freeze({
      capacity: "Building automation controls specialist",
      context: "Contribute controls integration approach, implementation assumptions, and schedule dependencies to the synthetic joint response.",
      reviewState: "reviewed" as const,
      acceptanceState: "accepted" as const,
      nonbindingBoundary: "Accepting an Exchange invitation is not a subcontract, joint venture, teaming agreement, or other binding relationship.",
    }),
    jointResponse: Object.freeze({
      title: "Synthetic coordinated response",
      sections: Object.freeze([
        Object.freeze({ id: "approach", requirement: "Project approach", assignedTo: "Tutorial Responder" as const, state: "complete" as const }),
        Object.freeze({ id: "mechanical", requirement: "Mechanical modernization", assignedTo: "Tutorial Responder" as const, state: "complete" as const }),
        Object.freeze({ id: "controls", requirement: "Controls integration", assignedTo: "Tutorial Teammate" as const, state: "complete" as const }),
        Object.freeze({ id: "schedule", requirement: "Schedule and dependencies", assignedTo: "Joint" as const, state: "complete" as const }),
      ]),
      submissionBoundary: "This tutorial submit action creates no live RFx response, receipt, commitment, or external-system submission.",
    }),
    evaluation: Object.freeze({
      criteria: Object.freeze([
        Object.freeze({ id: "coverage", label: "Requirement coverage", weight: "40%" }),
        Object.freeze({ id: "approach", label: "Implementation approach", weight: "35%" }),
        Object.freeze({ id: "schedule", label: "Schedule confidence", weight: "25%" }),
      ]),
      responses: Object.freeze([
        Object.freeze({
          id: "tutorial-response-joint",
          label: "Coordinated responder + teammate",
          findings: Object.freeze(["Complete coverage", "Integrated approach", "Dependencies stated"]),
        }),
        Object.freeze({
          id: "tutorial-response-alternate",
          label: "Alternate synthetic response",
          findings: Object.freeze(["Partial controls coverage", "Sound core approach", "Clarification needed"]),
        }),
      ]),
      selectedResponseId: "tutorial-response-joint",
      authorityBoundary: "The issuer makes the tutorial selection. RFxchange organizes stated criteria and comparison; it does not automatically choose a winner.",
    }),
    networkEffect: Object.freeze({
      summary: "Capability became discoverable, demand became visible, a gap produced a teammate connection, the team responded, and the issuer selected an outcome.",
      outcomeBoundary: "This is a synthetic learning outcome, not an award, contract, verified economic outcome, or credibility event.",
    }),
    allPaths: Object.freeze([
      path("tutorial-path-demand", "demand-signal", issuer, opportunityNode),
      path("tutorial-path-match", "capability-match", opportunityNode, responder),
      path("tutorial-path-teammate", "teammate-discovery", responder, teammate),
      path("tutorial-path-response", "joint-response", teammate, opportunityNode),
      path("tutorial-path-outcome", "selected-outcome", opportunityNode, issuer),
    ]),
  });
}

export function orientationMapOverlay(
  scenario: SyntheticOrientationScenario,
  journey: OrientationJourney | null,
): SyntheticOrientationMapOverlay {
  const visibleStep = Math.min((journey?.completedThroughStep ?? 0) + 1, 8);
  const nodes = visibleStep >= 2
    ? Object.freeze([...scenario.organizations, scenario.opportunity.node])
    : scenario.organizations;
  const paths = Object.freeze([
    ...(visibleStep >= 2 ? [scenario.allPaths[0]] : []),
    ...(visibleStep >= 3 ? [scenario.allPaths[1]] : []),
    ...(visibleStep >= 4 ? [scenario.allPaths[2]] : []),
    ...(visibleStep >= 6 ? [scenario.allPaths[3]] : []),
    ...(visibleStep >= 7 ? [scenario.allPaths[4]] : []),
  ]);
  const stage = visibleStep >= 8
    ? "network-effect" as const
    : visibleStep >= 7
      ? "selection" as const
      : visibleStep >= 6
        ? "response" as const
        : visibleStep >= 5
          ? "invitation" as const
          : "discovery" as const;
  return Object.freeze({
    provenance: SYNTHETIC_ORIENTATION_PROVENANCE,
    stage,
    nodes,
    paths,
    accessibleSummary:
      stage === "network-effect"
        ? "The complete synthetic network path connects issuer demand, responder capability, teammate contribution, joint response, and human-selected outcome."
        : stage === "selection"
          ? "The synthetic issuer, opportunity, responder, teammate, joint response, and human selection path are visible."
          : stage === "response"
            ? "The synthetic responder and teammate contributions connect to the joint response."
            : stage === "invitation"
              ? "The synthetic responder-to-teammate discovery path is now an explicitly reviewed nonbinding invitation."
              : visibleStep >= 4
                ? "Synthetic issuer, opportunity, responder, capability match, gap, and teammate discovery are visible."
                : visibleStep >= 3
                  ? "Synthetic opportunity-to-responder capability alignment is visible."
                  : visibleStep >= 2
                    ? "A synthetic issuer opportunity is visible with three tutorial organizations."
                    : "Three synthetic tutorial organizations are visible inside the selected locality.",
  });
}

/** @deprecated Use the complete eight-step overlay. */
export const phaseOneOrientationOverlay = orientationMapOverlay;
