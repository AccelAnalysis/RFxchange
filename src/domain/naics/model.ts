export interface NaicsReleaseMetadata {
  readonly version: string;
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly retrievedAt: string;
  readonly sourceSha256: string;
  readonly level: 6;
  readonly entryCount: number;
}

export interface NaicsIndustry {
  readonly code: string;
  readonly title: string;
}

export interface NaicsCatalogProjection {
  readonly release: NaicsReleaseMetadata;
  readonly entries: readonly NaicsIndustry[];
}
