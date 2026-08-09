import { createHash } from "node:crypto";

import type {
  InterpretationQuotaPolicy,
  InterpretationSourceInput,
  MinimizedInterpretationSource,
} from "../../domain/ai-interpretation/model.ts";
import { INTERPRETATION_SOURCE_TYPES } from "../../domain/ai-interpretation/model.ts";

const PROHIBITED_PATTERNS = Object.freeze([
  { pattern: /\b(?:sk|pk|rk|api)[-_ ]?(?:live|test|prod)?[-_ ]?[A-Za-z0-9]{16,}\b/gi, replacement: "[REDACTED_SECRET]" },
  { pattern: /\b(?:password|passwd|secret|token)\s*[:=]\s*\S+/gi, replacement: "[REDACTED_SECRET]" },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[REDACTED_GOVERNMENT_ID]" },
  { pattern: /\b(?:\d[ -]*?){13,19}\b/g, replacement: "[REDACTED_PAYMENT_NUMBER]" },
  { pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replacement: "[REDACTED_EMAIL]" },
  { pattern: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: "[REDACTED_PHONE]" },
]);

function stableSourceRef(value: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/.test(normalized)) {
    throw new Error("Interpretation source_ref must be a stable identifier of at most 240 characters.");
  }
  return normalized;
}

function boundedLocator(value: string | undefined): string {
  const normalized = value?.trim() ?? "";
  if (normalized.length > 1_000) throw new Error("Interpretation source locator exceeds 1,000 characters.");
  return normalized;
}

function redact(value: string): Readonly<{ text: string; count: number }> {
  let text = value;
  let count = 0;
  for (const entry of PROHIBITED_PATTERNS) {
    text = text.replace(entry.pattern, () => {
      count += 1;
      return entry.replacement;
    });
  }
  return Object.freeze({ text, count });
}

export function estimateInterpretationInputTokens(characterCount: number): number {
  return Math.max(1, Math.ceil(characterCount / 4));
}

export function minimizeInterpretationSources(
  sources: readonly InterpretationSourceInput[],
  policy: InterpretationQuotaPolicy,
): readonly MinimizedInterpretationSource[] {
  if (sources.length === 0) throw new Error("At least one interpretation source is required.");
  if (sources.length > policy.maxSourcesPerRequest) {
    throw new Error(`Interpretation accepts at most ${policy.maxSourcesPerRequest} sources per request.`);
  }

  const seen = new Set<string>();
  let totalCharacters = 0;
  const minimized = sources.map((source) => {
    if (!INTERPRETATION_SOURCE_TYPES.includes(source.sourceType)) {
      throw new Error(`Unsupported interpretation source type: ${String(source.sourceType)}.`);
    }
    if (!source.inclusionAuthorized) {
      throw new Error(`Interpretation source ${source.sourceRef || "(missing)"} was not authorized for inclusion.`);
    }
    if (source.sourceType === "participant_document" && source.attachmentOptIn !== true) {
      throw new Error("Participant document text requires explicit attachment opt-in.");
    }
    const sourceRef = stableSourceRef(source.sourceRef);
    if (seen.has(sourceRef)) throw new Error(`Duplicate interpretation source_ref: ${sourceRef}.`);
    seen.add(sourceRef);

    const original = source.text.trim().replace(/\s+/g, " ");
    if (!original) throw new Error(`Interpretation source ${sourceRef} is empty.`);
    totalCharacters += original.length;
    if (totalCharacters > policy.maxSourceCharacters) {
      throw new Error(`Interpretation source content exceeds ${policy.maxSourceCharacters} characters.`);
    }
    const redacted = redact(original);
    return Object.freeze({
      sourceRef,
      sourceType: source.sourceType,
      minimizedText: redacted.text,
      locator: boundedLocator(source.locator),
      originalCharacterCount: original.length,
      minimizedCharacterCount: redacted.text.length,
      redactionCount: redacted.count,
      contentSha256: createHash("sha256").update(original).digest("hex"),
    });
  });

  const estimatedTokens = estimateInterpretationInputTokens(
    minimized.reduce((total, source) => total + source.minimizedCharacterCount, 0),
  );
  if (estimatedTokens > policy.maxInputTokensPerRequest) {
    throw new Error(`Interpretation input exceeds ${policy.maxInputTokensPerRequest} estimated tokens.`);
  }
  return Object.freeze(minimized);
}

export function sourceExcerpt(source: MinimizedInterpretationSource): string {
  return source.minimizedText.slice(0, 2_000);
}
