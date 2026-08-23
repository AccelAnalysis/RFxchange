import type { LocationProfileMaterializationPacket } from "../geography-fabric/resolver.ts";
import type {
  ProviderCanonicalComparison,
  ProviderPromotionApproval,
  ProviderPromotionCommand,
  ProviderSeedPromotionCandidate,
} from "./promotion.ts";

export interface ProviderPromotionPlanSnapshot {
  readonly schemaVersion: number;
  readonly marketKey: string;
  readonly donorRepository: string;
  readonly donorCommit: string;
  readonly sourceCounts: Readonly<{
    candidates: number;
    locations: number;
    acceptedGeocodes: number;
    unresolvedGeocodes: number;
    heldOut: number;
  }>;
  readonly dispositionCounts: Readonly<Record<string, number>>;
}

export interface ProviderPromotionSourceRecord {
  readonly id: string;
  readonly candidateId: string;
  readonly seedKey: string;
  readonly displayName: string;
  readonly serviceSummary: string;
  readonly serviceAreaLabels: readonly string[];
  readonly primarySourceId: string;
  readonly website: string | null;
  readonly aliases: readonly string[];
  readonly acceptedLocation: Readonly<{
    locationKey: string;
    label: string;
    addressLine1: string;
    addressLine2: string | null;
    locality: string;
    regionCode: string;
    postalCode: string;
    countryCode: string;
    matchedAddress: string;
    acceptedPoint: Readonly<{ longitude: number; latitude: number }>;
    acceptedPointFingerprint: string;
    geocodeProvider: string;
    geocodeBenchmark: string;
    geocodedAt: string;
  }>;
  readonly sourcePlan: ProviderPromotionPlanSnapshot;
  readonly sourcePlanFingerprint: string;
  readonly sourceRecordFingerprint: string;
  readonly preparedAt: string;
}

export interface ProviderPromotionGeographyPreparation {
  readonly id: string;
  readonly candidateId: string;
  readonly sourceRecordFingerprint: string;
  readonly geographyProfileFingerprint: string;
  readonly packet: LocationProfileMaterializationPacket;
  readonly preparedAt: string;
}

export interface SeededProviderLocation {
  readonly id: string;
  readonly organizationId: string;
  readonly candidateId: string;
  readonly sourceLocationKey: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly locality: string;
  readonly regionCode: string;
  readonly postalCode: string;
  readonly countryCode: string;
  readonly matchedAddress: string;
  readonly coordinate: Readonly<{ longitude: number; latitude: number }>;
  readonly acceptedPointFingerprint: string;
  readonly geocodeProvider: string;
  readonly geocodeBenchmark: string;
  readonly geocodedAt: string;
  readonly provenance: "source-backed-seed";
  readonly participantConfirmed: false;
  readonly publicProjection: "disabled";
  readonly createdAt: string;
}

export interface SeededProviderClassification {
  readonly id: string;
  readonly organizationId: string;
  readonly candidateId: string;
  readonly providerClass: string;
  readonly participationPolicy: string;
  readonly providerType: string;
  readonly resourceCategory: string;
  readonly claimState: "unclaimed";
  readonly officialProviderStatus: "not-established";
  readonly providerDiscovery: "disabled";
  readonly sourceRecordFingerprint: string;
  readonly createdAt: string;
}

export interface SeededProviderResourceDraft {
  readonly id: string;
  readonly organizationId: string;
  readonly candidateId: string;
  readonly title: string;
  readonly summary: string;
  readonly resourceCategory: string;
  readonly serviceAreaLabels: readonly string[];
  readonly sourceUrl: string | null;
  readonly status: "draft";
  readonly participantEditable: false;
  readonly publication: "disabled";
  readonly sourceRecordFingerprint: string;
  readonly createdAt: string;
}

export type ProviderPromotionWriteKind =
  | "organization-created"
  | "organization-attached"
  | "organization-profile-created"
  | "organization-discovery-created"
  | "seeded-location-created"
  | "geography-profile-materialized"
  | "provider-classification-created"
  | "resource-draft-created"
  | "promotion-command-recorded"
  | "promotion-event-recorded";

export interface ProviderPromotionWriteRecord {
  readonly kind: ProviderPromotionWriteKind;
  readonly id: string;
}

export interface ProviderPromotionPreview {
  readonly mode: "preview";
  readonly commandId: string;
  readonly candidateId: string;
  readonly targetOrganizationMode: "create" | "attach-existing";
  readonly targetOrganizationId: string;
  readonly targetLocationId: string;
  readonly targetProviderResourceId: string;
  readonly geographyProfileId: string;
  readonly writes: readonly ProviderPromotionWriteRecord[];
  readonly publishProviderDiscovery: false;
  readonly publishResource: false;
  readonly generatedAt: string;
}

export interface ProviderPromotionReceipt {
  readonly id: string;
  readonly commandId: string;
  readonly candidateId: string;
  readonly targetOrganizationId: string;
  readonly targetOrganizationMode: "create" | "attach-existing";
  readonly targetLocationId: string;
  readonly targetProviderResourceId: string;
  readonly geographyProfileId: string;
  readonly requestFingerprint: string;
  readonly writes: readonly ProviderPromotionWriteRecord[];
  readonly publishProviderDiscovery: false;
  readonly publishResource: false;
  readonly committedAt: string;
}

export interface ProviderPromotionEvidenceBundle {
  readonly candidate: ProviderSeedPromotionCandidate;
  readonly source: ProviderPromotionSourceRecord;
  readonly geography: ProviderPromotionGeographyPreparation;
  readonly comparison: ProviderCanonicalComparison;
  readonly approval: ProviderPromotionApproval;
}

export interface ProviderPromotionStagingBundle
  extends ProviderPromotionEvidenceBundle {
  readonly command: ProviderPromotionCommand;
}
