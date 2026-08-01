export type VisualAuthorityKind =
  | "organization-projection"
  | "published-opportunity-projection"
  | "provider-service-territory"
  | "relationship-event"
  | "credibility-evidence"
  | "outcome-evidence";

export interface VisualAuthorityReference {
  readonly kind: VisualAuthorityKind;
  readonly recordId: string;
  readonly projectionVersion: number;
  readonly observedAt: string;
}

export interface GeographicVisualPosition {
  readonly longitude: number;
  readonly latitude: number;
  readonly precision: "exact" | "approximate" | "locality-only";
}

export interface OrganizationNodeVisualInput {
  readonly objectType: "organization-node";
  readonly organizationId: string;
  readonly label: string;
  readonly position: GeographicVisualPosition;
  readonly authority: VisualAuthorityReference & Readonly<{ kind: "organization-projection" }>;
  readonly relationship: "own" | "permitted" | "subordinate-location";
}

export interface OpportunityBeaconVisualInput {
  readonly objectType: "opportunity-beacon";
  readonly opportunityId: string;
  readonly label: string;
  readonly position: GeographicVisualPosition | null;
  readonly authority: VisualAuthorityReference & Readonly<{ kind: "published-opportunity-projection" }>;
}

export interface ServiceFieldVisualInput {
  readonly objectType: "service-field";
  readonly providerOrganizationId: string;
  readonly geographyIds: readonly string[];
  readonly authority: VisualAuthorityReference & Readonly<{ kind: "provider-service-territory" }>;
}

export interface RelationshipPathVisualInput {
  readonly objectType: "relationship-path";
  readonly relationshipId: string;
  readonly pathKind: "referral" | "team" | "rfx";
  readonly fromObjectId: string;
  readonly toObjectId: string;
  readonly authority: VisualAuthorityReference & Readonly<{ kind: "relationship-event" }>;
}

export interface EvidenceSealVisualInput {
  readonly objectType: "evidence-seal";
  readonly evidenceId: string;
  readonly label: string;
  readonly authority: VisualAuthorityReference & Readonly<{ kind: "credibility-evidence" }>;
}

export interface OutcomePathVisualInput {
  readonly objectType: "outcome-path";
  readonly outcomeId: string;
  readonly fromObjectId: string;
  readonly toObjectId: string;
  readonly authority: VisualAuthorityReference & Readonly<{ kind: "outcome-evidence" }>;
}

export type AuthorityGatedVisualInput =
  | OrganizationNodeVisualInput
  | OpportunityBeaconVisualInput
  | ServiceFieldVisualInput
  | RelationshipPathVisualInput
  | EvidenceSealVisualInput
  | OutcomePathVisualInput;

export const authorityGatedVisualPolicy = Object.freeze({
  syntheticRuntimeObjectsAllowed: false,
  plannedObjectsMayRenderAsLive: false,
  missingAuthorityBehavior: "omit-and-explain",
  privacyPrecisionMustBePreserved: true,
} as const);

export function assertAuthorityGatedVisualInput(input: AuthorityGatedVisualInput): void {
  if (!input.authority.recordId.trim()) {
    throw new Error("Authority-gated visual input requires a source record id.");
  }
  if (!Number.isInteger(input.authority.projectionVersion) || input.authority.projectionVersion < 1) {
    throw new Error("Authority-gated visual input requires a positive projection version.");
  }
  if (!Number.isFinite(Date.parse(input.authority.observedAt))) {
    throw new Error("Authority-gated visual input requires an authoritative observation timestamp.");
  }
  if ("position" in input && input.position) {
    if (input.position.longitude < -180 || input.position.longitude > 180) {
      throw new Error("Visual longitude is outside the valid range.");
    }
    if (input.position.latitude < -90 || input.position.latitude > 90) {
      throw new Error("Visual latitude is outside the valid range.");
    }
  }
}
