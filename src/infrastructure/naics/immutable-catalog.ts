import type { NaicsCatalogPort } from "../../application/naics/catalog.ts";
import type {
  NaicsCatalogProjection,
  NaicsIndustry,
  NaicsReleaseMetadata,
} from "../../domain/naics/model.ts";

export class ImmutableNaicsCatalog implements NaicsCatalogPort {
  private readonly release: NaicsReleaseMetadata;
  private readonly entries: readonly NaicsIndustry[];
  private readonly byCode: ReadonlyMap<string, NaicsIndustry>;

  constructor(
    release: NaicsReleaseMetadata,
    entries: readonly NaicsIndustry[],
  ) {
    if (
      release.version !== "2022" ||
      release.level !== 6 ||
      release.entryCount !== entries.length ||
      !/^https:\/\/www\.census\.gov\/naics\//.test(release.sourceUrl) ||
      !/^[a-f0-9]{64}$/.test(release.sourceSha256)
    ) {
      throw new Error("NAICS release metadata is inconsistent.");
    }
    const normalized = entries.map((entry) => {
      const code = entry.code.trim();
      const title = entry.title.trim().replace(/\s+/g, " ");
      if (!/^\d{6}$/.test(code) || !title) {
        throw new Error("NAICS catalog contains a malformed six-digit industry.");
      }
      return Object.freeze({ code, title });
    });
    const byCode = new Map(normalized.map((entry) => [entry.code, entry]));
    if (byCode.size !== normalized.length) {
      throw new Error("NAICS catalog contains duplicate industry codes.");
    }
    this.release = Object.freeze({ ...release });
    this.entries = Object.freeze(normalized);
    this.byCode = byCode;
  }

  async getRelease(): Promise<NaicsReleaseMetadata> {
    return this.release;
  }

  async listIndustries(): Promise<readonly NaicsIndustry[]> {
    return this.entries;
  }

  async getIndustry(code: string, version: string): Promise<NaicsIndustry | null> {
    if (version.trim() !== this.release.version) return null;
    return this.byCode.get(code.trim()) ?? null;
  }

  async getProjection(): Promise<NaicsCatalogProjection> {
    return Object.freeze({ release: this.release, entries: this.entries });
  }
}
