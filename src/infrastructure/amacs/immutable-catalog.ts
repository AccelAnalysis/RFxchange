import type { AmacsCatalogPort } from "../../application/amacs/catalog.ts";
import type {
  AmacsCapability,
  AmacsCapabilitySearch,
  AmacsCapabilitySearchPage,
  AmacsConceptInterpretationGuidance,
  AmacsDomain,
  AmacsFamily,
  AmacsRegistryRecord,
  AmacsReleaseMetadata,
  HistoricalAmacsCapabilityReference,
} from "../../domain/amacs/model.ts";

export interface GeneratedAmacsCatalog {
  readonly release: AmacsReleaseMetadata;
  readonly domains: readonly AmacsDomain[];
  readonly families: readonly AmacsFamily[];
  readonly capabilities: readonly AmacsCapability[];
}

export interface GeneratedAmacsSearchIndex {
  readonly releaseVersion: string;
  readonly projectionVersion: string;
  readonly entries: readonly Readonly<{
    conceptId: string;
    preferredLabel: string;
    normalizedLabel: string;
    normalizedAliases: readonly string[];
    normalizedCorpus: string;
  }>[];
}

export interface GeneratedAmacsRegistries {
  readonly releaseVersion: string;
  readonly registries: Readonly<Record<string, readonly AmacsRegistryRecord[]>>;
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function boundedInteger(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(value ?? fallback)));
}

function recordId(record: AmacsRegistryRecord, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

export class ImmutableAmacsCatalog implements AmacsCatalogPort {
  private readonly catalog: GeneratedAmacsCatalog;
  private readonly registries: GeneratedAmacsRegistries;
  private readonly capabilityById: ReadonlyMap<string, AmacsCapability>;
  private readonly searchById: ReadonlyMap<string, GeneratedAmacsSearchIndex["entries"][number]>;
  private readonly historicalCatalogs: ReadonlyMap<string, GeneratedAmacsCatalog>;

  constructor(
    catalog: GeneratedAmacsCatalog,
    searchIndex: GeneratedAmacsSearchIndex,
    registries: GeneratedAmacsRegistries,
    historicalCatalogs: ReadonlyMap<string, GeneratedAmacsCatalog>,
  ) {
    this.catalog = catalog;
    this.registries = registries;
    if (
      catalog.release.version !== searchIndex.releaseVersion ||
      catalog.release.projectionVersion !== searchIndex.projectionVersion ||
      catalog.release.version !== registries.releaseVersion
    ) {
      throw new Error("AMACS generated projections do not share one immutable release identity.");
    }
    this.capabilityById = new Map(catalog.capabilities.map((capability) => [capability.conceptId, capability]));
    this.searchById = new Map(searchIndex.entries.map((entry) => [entry.conceptId, entry]));
    this.historicalCatalogs = historicalCatalogs;
    if (this.capabilityById.size !== searchIndex.entries.length) {
      throw new Error("AMACS search index does not cover every projected capability.");
    }
  }

  async getRelease(): Promise<AmacsReleaseMetadata> {
    return this.catalog.release;
  }

  async listDomains(): Promise<readonly AmacsDomain[]> {
    return this.catalog.domains;
  }

  async listFamilies(domainId: string): Promise<readonly AmacsFamily[]> {
    return this.catalog.families.filter((family) => family.domainId === domainId);
  }

  async listCapabilities(familyId: string): Promise<readonly AmacsCapability[]> {
    return this.catalog.capabilities.filter((capability) => capability.familyId === familyId);
  }

  async getCapability(capabilityId: string): Promise<AmacsCapability | null> {
    return this.capabilityById.get(capabilityId) ?? null;
  }

  async hasCanonicalCapability(capabilityId: string): Promise<boolean> {
    return this.capabilityById.has(capabilityId);
  }

  async searchCapabilities(input: AmacsCapabilitySearch): Promise<AmacsCapabilitySearchPage> {
    const query = normalize(input.query).slice(0, 240);
    const terms = query.split(" ").filter(Boolean);
    const matches = this.catalog.capabilities.flatMap((capability) => {
      if (input.domainId && capability.domainId !== input.domainId) return [];
      if (input.familyId && capability.familyId !== input.familyId) return [];
      const index = this.searchById.get(capability.conceptId);
      if (!index) return [];
      if (!query) return [{ capability, score: 0, matchedBy: "definition-or-hierarchy" as const }];
      let score = -1;
      let matchedBy: "label" | "alias" | "definition-or-hierarchy" = "definition-or-hierarchy";
      if (index.normalizedLabel === query) {
        score = 100;
        matchedBy = "label";
      } else if (index.normalizedAliases.includes(query)) {
        score = 95;
        matchedBy = "alias";
      } else if (index.normalizedLabel.includes(query)) {
        score = 80;
        matchedBy = "label";
      } else if (index.normalizedAliases.some((alias) => alias.includes(query))) {
        score = 70;
        matchedBy = "alias";
      } else if (terms.every((term) => index.normalizedCorpus.includes(term))) {
        score = 50;
      } else if (terms.some((term) => index.normalizedCorpus.includes(term))) {
        score = 20;
      }
      return score < 0 ? [] : [{ capability, score, matchedBy }];
    });
    matches.sort((left, right) =>
      right.score - left.score ||
      left.capability.preferredLabel.localeCompare(right.capability.preferredLabel) ||
      left.capability.conceptId.localeCompare(right.capability.conceptId),
    );
    const pageSize = boundedInteger(input.pageSize, 25, 1, 100);
    const requestedPage = boundedInteger(input.page, 1, 1, 10_000);
    const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
    const page = Math.min(requestedPage, pageCount);
    const start = (page - 1) * pageSize;
    return Object.freeze({
      release: this.catalog.release,
      query: input.query.trim(),
      results: Object.freeze(matches.slice(start, start + pageSize)),
      page,
      pageSize,
      total: matches.length,
      pageCount,
    });
  }

  async listMarketRoles(): Promise<readonly AmacsRegistryRecord[]> {
    return this.registries.registries["market-roles"] ?? [];
  }

  private registryRecord(registry: string, key: string, id: string): AmacsRegistryRecord | null {
    return this.registries.registries[registry]?.find((record) => recordId(record, key) === id) ?? null;
  }

  async getRequestFamily(requestFamilyId: string): Promise<AmacsRegistryRecord | null> {
    return this.registryRecord("request-families", "request_family_id", requestFamilyId);
  }

  async getRequirementType(requirementTypeId: string): Promise<AmacsRegistryRecord | null> {
    return this.registryRecord("requirement-types", "requirement_type_id", requirementTypeId);
  }

  async getResponseTemplate(responseTemplateId: string): Promise<AmacsRegistryRecord | null> {
    return this.registryRecord("response-templates", "response_template_id", responseTemplateId);
  }

  async getDecisionTemplate(decisionTemplateId: string): Promise<AmacsRegistryRecord | null> {
    return this.registryRecord("decision-templates", "decision_template_id", decisionTemplateId);
  }

  async getReadinessRules(requestFamilyId: string): Promise<readonly AmacsRegistryRecord[]> {
    return (this.registries.registries["readiness-rules"] ?? []).filter((record) => {
      const applies = record.applies_to_request_family_ids;
      return Array.isArray(applies) && (applies.length === 0 || applies.includes(requestFamilyId));
    });
  }

  async getConceptInterpretationGuidance(
    capabilityId: string,
  ): Promise<AmacsConceptInterpretationGuidance | null> {
    const guidance = this.registries.registries["concept-interpretation-guidance"]?.find(
      (record) => recordId(record, "concept_id") === capabilityId,
    );
    return (guidance as AmacsConceptInterpretationGuidance | undefined) ?? null;
  }

  async resolveHistoricalCapability(
    reference: HistoricalAmacsCapabilityReference,
  ): Promise<AmacsCapability | null> {
    const historical = this.historicalCatalogs.get(reference.releaseVersion);
    if (!historical) return null;
    const capability = historical.capabilities.find((entry) => entry.conceptId === reference.conceptId);
    if (!capability) return null;
    if (capability.preferredLabel !== reference.labelSnapshot) return null;
    if (reference.definitionSnapshot && capability.definition !== reference.definitionSnapshot) return null;
    return capability;
  }
}
