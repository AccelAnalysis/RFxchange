import type {
  NaicsCatalogProjection,
  NaicsIndustry,
  NaicsReleaseMetadata,
} from "../../domain/naics/model.ts";

export interface NaicsCatalogPort {
  getRelease(): Promise<NaicsReleaseMetadata>;
  listIndustries(): Promise<readonly NaicsIndustry[]>;
  getIndustry(code: string, version: string): Promise<NaicsIndustry | null>;
  getProjection(): Promise<NaicsCatalogProjection>;
}
