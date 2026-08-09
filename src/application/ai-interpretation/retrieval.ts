import type { AmacsCatalogPort } from "../amacs/catalog.ts";
import type { AmacsCapability, AmacsConceptInterpretationGuidance } from "../../domain/amacs/model.ts";
import type {
  InterpretationRetrievalResult,
  MinimizedInterpretationSource,
  RetrievedAmacsCandidate,
} from "../../domain/ai-interpretation/model.ts";

export const AMACS_INTERPRETATION_RETRIEVAL_VERSION = "amacs-0.5.0-lexical-v1";

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "before", "but", "by", "can", "for",
  "from", "heavy", "in", "is", "it", "lot", "need", "of", "on", "or", "our", "safe",
  "that", "the", "their", "to", "we", "with", "work",
]);

// RFxchange-owned retrieval cues improve candidate recall without changing AMACS labels or meaning.
const RETRIEVAL_CUES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  aircon: Object.freeze(["hvac"]),
  cooling: Object.freeze(["hvac"]),
  drainage: Object.freeze(["stormwater"]),
  flood: Object.freeze(["stormwater"]),
  flooding: Object.freeze(["stormwater"]),
  furnace: Object.freeze(["hvac"]),
  heating: Object.freeze(["hvac"]),
  hurricane: Object.freeze(["stormwater"]),
  rain: Object.freeze(["stormwater"]),
  rooftop: Object.freeze(["hvac"]),
  ventilation: Object.freeze(["hvac"]),
});
const CUE_TERMS = new Set(Object.values(RETRIEVAL_CUES).flat());

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokens(value: string): readonly string[] {
  const base = normalize(value).split(" ").filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  const expanded = base.flatMap((token) => [token, ...(RETRIEVAL_CUES[token] ?? [])]);
  return Object.freeze([...new Set(expanded)]);
}

function fieldTokens(value: string): Set<string> {
  return new Set(tokens(value));
}

interface RetrievalCatalogEntry { readonly capability: AmacsCapability; readonly guidance: AmacsConceptInterpretationGuidance | null }

function scoreCapability(entry: RetrievalCatalogEntry, queryTokens: readonly string[]): Readonly<{
  score: number;
  matchedTerms: readonly string[];
}> {
  const { capability, guidance } = entry;
  const label = fieldTokens(`${capability.conceptId} ${capability.preferredLabel}`);
  const aliases = fieldTokens(capability.aliases.join(" "));
  const definition = fieldTokens(capability.definition);
  const hierarchy = fieldTokens(`${capability.familyLabel} ${capability.domainLabel}`);
  const notes = fieldTokens(`${capability.inclusionNotes ?? ""} ${capability.exclusionNotes ?? ""}`);
  const relationships = fieldTokens(capability.replacementConceptIds.join(" "));
  const guidanceTokens = fieldTokens(guidance ? `${guidance.inclusionNotes} ${guidance.exclusionNotes} ${guidance.exampleActivities.join(" ")} ${guidance.exampleOutputs.join(" ")} ${guidance.clarificationQuestions.join(" ")}` : "");
  const matched = new Set<string>();
  let score = 0;
  for (const term of queryTokens) {
    if (label.has(term)) {
      score += CUE_TERMS.has(term) ? 32 : 14;
      matched.add(term);
    }
    if (aliases.has(term)) {
      score += CUE_TERMS.has(term) ? 24 : 11;
      matched.add(term);
    }
    if (definition.has(term)) {
      score += 4;
      matched.add(term);
    }
    if (hierarchy.has(term)) {
      score += 3;
      matched.add(term);
    }
    if (notes.has(term)) {
      score += 2;
      matched.add(term);
    }
    if (relationships.has(term)) { score += 2; matched.add(term); }
    if (guidanceTokens.has(term)) { score += 3; matched.add(term); }
  }
  const normalizedQuery = queryTokens.join(" ");
  if (normalizedQuery && normalize(capability.preferredLabel).includes(normalizedQuery)) score += 40;
  if (capability.aliases.some((alias) => normalize(alias).includes(normalizedQuery))) score += 30;
  return Object.freeze({ score, matchedTerms: Object.freeze([...matched].sort()) });
}

async function loadAllCapabilities(catalog: AmacsCatalogPort): Promise<readonly RetrievalCatalogEntry[]> {
  const capabilities: AmacsCapability[] = [];
  for (const domain of await catalog.listDomains()) {
    for (const family of await catalog.listFamilies(domain.domainId)) {
      capabilities.push(...await catalog.listCapabilities(family.familyId));
    }
  }
  return Object.freeze(await Promise.all(capabilities.map(async (capability) => Object.freeze({ capability, guidance: await catalog.getConceptInterpretationGuidance(capability.conceptId) }))));
}

export class AmacsInterpretationRetrievalService {
  private readonly catalog: AmacsCatalogPort;
  private readonly cache = new Map<string, readonly RetrievedAmacsCandidate[]>();
  private capabilityCache: Promise<readonly RetrievalCatalogEntry[]> | null = null;

  constructor(catalog: AmacsCatalogPort) {
    this.catalog = catalog;
  }

  async retrieve(
    sources: readonly MinimizedInterpretationSource[],
    limit = 16,
  ): Promise<InterpretationRetrievalResult> {
    const release = await this.catalog.getRelease();
    const queryTokens = tokens(sources.map((source) => source.minimizedText).join(" "));
    const key = `${release.version}:${queryTokens.join("|")}:${limit}`;
    const cached = this.cache.get(key);
    if (cached) {
      return Object.freeze({
        releaseVersion: release.version,
        retrievalVersion: AMACS_INTERPRETATION_RETRIEVAL_VERSION,
        candidates: cached,
        complexity: this.complexity(cached),
        cacheHit: true,
      });
    }

    this.capabilityCache ??= loadAllCapabilities(this.catalog);
    const scored = (await this.capabilityCache)
      .map((entry) => ({ ...entry, ...scoreCapability(entry, queryTokens) }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) =>
        right.score - left.score ||
        left.capability.preferredLabel.localeCompare(right.capability.preferredLabel) ||
        left.capability.conceptId.localeCompare(right.capability.conceptId),
      )
      .slice(0, Math.max(1, Math.min(24, Math.floor(limit))))
      .map(({ capability, guidance, score, matchedTerms }) => Object.freeze({
        conceptId: capability.conceptId,
        preferredLabel: capability.preferredLabel,
        definition: capability.definition,
        domainId: capability.domainId,
        domainLabel: capability.domainLabel,
        familyId: capability.familyId,
        familyLabel: capability.familyLabel,
        aliases: capability.aliases,
        replacementConceptIds: capability.replacementConceptIds,
        interpretationGuidance: guidance ? Object.freeze({ inclusionNotes: guidance.inclusionNotes, exclusionNotes: guidance.exclusionNotes, exampleActivities: guidance.exampleActivities, exampleOutputs: guidance.exampleOutputs, commonConfusionConceptIds: guidance.commonConfusionConceptIds, clarificationQuestions: guidance.clarificationQuestions }) : null,
        releaseVersion: capability.releaseVersion,
        retrievalScore: score,
        matchedTerms,
      }));
    const candidates = Object.freeze(scored);
    this.cache.set(key, candidates);
    return Object.freeze({
      releaseVersion: release.version,
      retrievalVersion: AMACS_INTERPRETATION_RETRIEVAL_VERSION,
      candidates,
      complexity: this.complexity(candidates),
      cacheHit: false,
    });
  }

  private complexity(candidates: readonly RetrievedAmacsCandidate[]): "simple" | "ambiguous" {
    if (candidates.length === 0 || candidates[0].retrievalScore < 30) return "ambiguous";
    if (candidates.length > 1 && candidates[0].retrievalScore - candidates[1].retrievalScore < 3) {
      return "ambiguous";
    }
    return "simple";
  }
}
