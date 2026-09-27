import type { ControlledLocalityMapModel } from "../../application/geography/controlled-locality-map";
import type { ParticipantMapCamera } from "../../application/geography/map-view";
import type { SyntheticOrientationMapOverlay } from "../../application/orientation/synthetic-scenario";
import type {
  ExchangeGovernedAreaGeometry,
  ExchangeLensSelectableProjection,
  ExchangeSpatialGeometry,
} from "../../application/participant/lens-map-projection-adapter";
import type {
  ExchangeSelectionState,
  LensMapProjection,
} from "../../application/participant/mobile-exchange-contracts";
export type ExchangeSpatialSceneMode = "regional" | "locality" | "organization";
export type ExchangeContinuousMotion = "instructional" | "milestone";

export interface ExchangeHomeMarker {
  readonly id: string;
  readonly organizationId?: string;
  readonly coordinate: readonly [longitude: number, latitude: number];
  readonly label: string;
  readonly accessibleLocationLabel?: string;
  readonly precision?: "exact" | "approximate";
}

export type ExchangeOrganizationMarker = ExchangeHomeMarker;
export type ExchangeOpportunityMarker = ExchangeHomeMarker;

export interface ExchangeRelationshipPath {
  readonly id: string;
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  readonly label: string;
  readonly status: "sent" | "accepted" | "contacted" | "closed";
}

export interface ExchangeServiceField {
  readonly id: string;
  readonly label: string;
  readonly geometry: ExchangeSpatialGeometry;
  readonly selected?: boolean;
}

export interface ExchangeSpatialSceneProps {
  readonly model: ControlledLocalityMapModel;
  readonly mode: ExchangeSpatialSceneMode;
  readonly marker?: ExchangeHomeMarker | null;
  readonly organizationMarkers?: readonly ExchangeOrganizationMarker[];
  readonly opportunityMarkers?: readonly ExchangeOpportunityMarker[];
  readonly relationshipPaths?: readonly ExchangeRelationshipPath[];
  readonly serviceFields?: readonly ExchangeServiceField[];
  readonly lensProjection?: LensMapProjection | null;
  readonly lensSelection?: ExchangeSelectionState | null;
  readonly governedAreaGeometries?: readonly ExchangeGovernedAreaGeometry[];
  readonly onLensProjectionSelect?: (projection: ExchangeLensSelectableProjection) => void;
  readonly focusedMarkerId?: string | null;
  readonly onOrganizationMarkerSelect?: (markerId: string) => void;
  readonly onOpportunityMarkerSelect?: (markerId: string) => void;
  readonly initialCamera?: ParticipantMapCamera | null;
  readonly onCameraChange?: (camera: ParticipantMapCamera) => void;
  readonly interactive?: boolean;
  readonly activationOverlay?: boolean;
  readonly workspaceOverlay?: "left" | "right" | null;
  readonly adaptiveWorkspace?: boolean;
  readonly showSearch?: boolean;
  readonly homeLocalityFocus?: boolean;
  readonly tutorialOverlay?: SyntheticOrientationMapOverlay | null;
  readonly continuousMotion?: ExchangeContinuousMotion | null;
  readonly className?: string;
  readonly embedded?: boolean;
}
