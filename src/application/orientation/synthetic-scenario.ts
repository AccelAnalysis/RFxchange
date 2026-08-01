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

export interface SyntheticOrientationPath {
  readonly id: string;
  readonly kind: "capability-match" | "teammate-discovery";
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
  readonly allPaths: readonly SyntheticOrientationPath[];
}

export interface SyntheticOrientationMapOverlay {
  readonly provenance: typeof SYNTHETIC_ORIENTATION_PROVENANCE;
  readonly nodes: readonly SyntheticOrientationNode[];
  readonly paths: readonly SyntheticOrientationPath[];
  readonly accessibleSummary: string;
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
  const matchPath = Object.freeze({
    id: "tutorial-path-match",
    kind: "capability-match" as const,
    fromNodeId: opportunityNode.id,
    toNodeId: responder.id,
    coordinates: Object.freeze([opportunityNode.coordinate, responder.coordinate]) as readonly [GeographicPosition, GeographicPosition],
    provenance: SYNTHETIC_ORIENTATION_PROVENANCE,
  });
  const teammatePath = Object.freeze({
    id: "tutorial-path-teammate",
    kind: "teammate-discovery" as const,
    fromNodeId: responder.id,
    toNodeId: teammate.id,
    coordinates: Object.freeze([responder.coordinate, teammate.coordinate]) as readonly [GeographicPosition, GeographicPosition],
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
    allPaths: Object.freeze([matchPath, teammatePath]),
  });
}

export function phaseOneOrientationOverlay(
  scenario: SyntheticOrientationScenario,
  journey: OrientationJourney | null,
): SyntheticOrientationMapOverlay {
  const visibleStep = Math.min((journey?.completedThroughStep ?? 0) + 1, 4);
  const nodes = visibleStep >= 2
    ? Object.freeze([...scenario.organizations, scenario.opportunity.node])
    : scenario.organizations;
  const paths = Object.freeze([
    ...(visibleStep >= 3 ? [scenario.allPaths[0]] : []),
    ...(visibleStep >= 4 ? [scenario.allPaths[1]] : []),
  ]);
  return Object.freeze({
    provenance: SYNTHETIC_ORIENTATION_PROVENANCE,
    nodes,
    paths,
    accessibleSummary:
      visibleStep >= 4
        ? "Synthetic issuer, opportunity, responder, capability match, gap, and teammate discovery are visible."
        : visibleStep >= 3
          ? "Synthetic opportunity-to-responder capability alignment is visible."
          : visibleStep >= 2
            ? "A synthetic issuer opportunity is visible with three tutorial organizations."
            : "Three synthetic tutorial organizations are visible inside the selected locality.",
  });
}
