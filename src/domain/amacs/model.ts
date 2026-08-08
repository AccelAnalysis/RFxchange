export interface AmacsReleaseMetadata {
  readonly version: string;
  readonly releasedAt: string;
  readonly sourceCommit: string;
  readonly projectionVersion: string;
}

export interface AmacsDomain {
  readonly domainId: string;
  readonly preferredLabel: string;
  readonly definition: string;
  readonly status: string;
}

export interface AmacsFamily {
  readonly familyId: string;
  readonly domainId: string;
  readonly preferredLabel: string;
  readonly definition: string;
  readonly status: string;
}

export interface AmacsCapability {
  readonly conceptId: string;
  readonly preferredLabel: string;
  readonly definition: string;
  readonly domainId: string;
  readonly domainLabel: string;
  readonly familyId: string;
  readonly familyLabel: string;
  readonly aliases: readonly string[];
  readonly inclusionNotes?: string;
  readonly exclusionNotes?: string;
  readonly status: string;
  readonly replacementConceptIds: readonly string[];
  readonly releaseVersion: string;
}

export interface AmacsCapabilitySearch {
  readonly query: string;
  readonly domainId?: string | null;
  readonly familyId?: string | null;
  readonly page?: number;
  readonly pageSize?: number;
}

export interface AmacsCapabilitySearchResult {
  readonly capability: AmacsCapability;
  readonly score: number;
  readonly matchedBy: "label" | "alias" | "definition-or-hierarchy";
}

export interface AmacsCapabilitySearchPage {
  readonly release: AmacsReleaseMetadata;
  readonly query: string;
  readonly results: readonly AmacsCapabilitySearchResult[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly pageCount: number;
}

export interface HistoricalAmacsCapabilityReference {
  readonly releaseVersion: string;
  readonly conceptId: string;
  readonly labelSnapshot: string;
  readonly definitionSnapshot?: string;
}

export interface AmacsRegistryRecord {
  readonly [key: string]: unknown;
}

export interface AmacsConceptInterpretationGuidance {
  readonly conceptId: string;
  readonly amacsRelease: string;
  readonly inclusionNotes: string;
  readonly exclusionNotes: string;
  readonly exampleActivities: readonly string[];
  readonly exampleOutputs: readonly string[];
  readonly commonConfusionConceptIds: readonly string[];
  readonly clarificationQuestions: readonly string[];
  readonly guidanceStatus: "draft" | "reviewed" | "approved" | "deprecated";
  readonly versionIntroduced: string;
}
