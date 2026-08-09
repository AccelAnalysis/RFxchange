import type { InterpretationProviderPort } from "../../application/ai-interpretation/ports.ts";
import type { InterpretationProviderRequest, InterpretationProviderResult } from "../../domain/ai-interpretation/model.ts";

const OUTPUT_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  required: ["proposals"],
  properties: {
    proposals: {
      type: "array", maxItems: 12,
      items: {
        type: "object", additionalProperties: false,
        required: ["amacsId", "targetKind", "rationale", "confidence", "ambiguityStatus", "clarificationQuestion", "sourceIndices", "provisionalLabel", "provisionalDefinition"],
        properties: {
          amacsId: { type: ["string", "null"] },
          targetKind: { type: "string", enum: ["market_need_dimension", "organization_capability_assertion", "rfx_capability_requirement", "request_family", "property_value", "credential_requirement", "response_section", "decision_factor", "market_role", "provisional_term"] },
          rationale: { type: "string", maxLength: 2_000 }, confidence: { type: "number", minimum: 0, maximum: 1 },
          ambiguityStatus: { type: "string", enum: ["none", "needs_clarification", "conflicting_sources", "insufficient_support"] },
          clarificationQuestion: { type: ["string", "null"], maxLength: 1_000 }, sourceIndices: { type: "array", minItems: 1, maxItems: 8, uniqueItems: true, items: { type: "integer", minimum: 0, maximum: 7 } },
          provisionalLabel: { type: ["string", "null"], maxLength: 300 }, provisionalDefinition: { type: ["string", "null"], maxLength: 2_000 },
        },
      },
    },
  },
});

interface OpenAiResponse {
  readonly id?: string;
  readonly output?: readonly Readonly<{ type?: string; content?: readonly Readonly<{ type?: string; text?: string; refusal?: string }>[] }>[];
  readonly usage?: Readonly<{ input_tokens?: number; output_tokens?: number; input_tokens_details?: Readonly<{ cached_tokens?: number }> }>;
}

function outputText(response: OpenAiResponse): string {
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "refusal") throw new Error("OpenAI refused the bounded interpretation request.");
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("OpenAI returned no structured interpretation output.");
}

function finiteNonnegative(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function configuredNonnegativeNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export class OpenAiResponsesInterpretationAdapter implements InterpretationProviderPort {
  private readonly apiKey: string | null;
  private readonly primaryModel: string;
  private readonly escalationModel: string | null;
  private readonly endpoint: string;
  private readonly timeoutMs: number;
  private readonly inputMicrousdPerMillion: number | null;
  private readonly outputMicrousdPerMillion: number | null;

  constructor(input: Readonly<{ apiKey?: string; primaryModel?: string; escalationModel?: string; endpoint?: string; timeoutMs?: number; inputMicrousdPerMillion?: number; outputMicrousdPerMillion?: number }> = {}) {
    this.apiKey = input.apiKey?.trim() || process.env.OPENAI_API_KEY?.trim() || null;
    this.primaryModel = input.primaryModel?.trim() || process.env.RFXCHANGE_AI_PRIMARY_MODEL?.trim() || "gpt-5.6-luna";
    this.escalationModel = input.escalationModel?.trim() || process.env.RFXCHANGE_AI_ESCALATION_MODEL?.trim() || "gpt-5.6-terra";
    this.endpoint = input.endpoint?.trim() || "https://api.openai.com/v1/responses";
    this.timeoutMs = input.timeoutMs ?? 20_000;
    this.inputMicrousdPerMillion = input.inputMicrousdPerMillion ?? configuredNonnegativeNumber(process.env.RFXCHANGE_AI_INPUT_MICROUSD_PER_MILLION_TOKENS);
    this.outputMicrousdPerMillion = input.outputMicrousdPerMillion ?? configuredNonnegativeNumber(process.env.RFXCHANGE_AI_OUTPUT_MICROUSD_PER_MILLION_TOKENS);
  }

  availability() {
    if (process.env.RFXCHANGE_AI_PROVIDER_ENABLED?.trim().toLowerCase() !== "true") return Object.freeze({ available: false as const, reason: "provider-disabled" as const, provider: "openai" });
    if (!this.apiKey) return Object.freeze({ available: false as const, reason: "missing-secret" as const, provider: "openai" });
    return Object.freeze({ available: true as const, provider: "openai", primaryModel: this.primaryModel, escalationModel: this.escalationModel });
  }

  async interpret(input: InterpretationProviderRequest): Promise<InterpretationProviderResult> {
    if (!this.apiKey) throw new Error("OpenAI API key is unavailable.");
    const model = input.complexity === "ambiguous" && this.escalationModel ? this.escalationModel : this.primaryModel;
    const started = performance.now();
    const requestBody = JSON.stringify({
        model, store: false, safety_identifier: input.safetyIdentifier, max_output_tokens: 2_000,
        reasoning: { effort: input.complexity === "ambiguous" ? "medium" : "low" },
        instructions: "You are a bounded classification component. Use only the supplied AMACS candidate IDs. Never infer authority, verification, qualification, credibility, or a final business record. Return suggestions requiring human confirmation. If no supplied concept is supported, use a provisional_term with a null amacsId. Evidence sourceIndices are zero-based indices into the supplied sources.",
        input: JSON.stringify({ purpose: input.purpose, amacsRelease: input.releaseVersion, candidates: input.retrievedCandidates.map(({ conceptId, preferredLabel, definition, domainLabel, familyLabel, aliases, replacementConceptIds, interpretationGuidance }) => ({ conceptId, preferredLabel, definition, domainLabel, familyLabel, aliases, replacementConceptIds, interpretationGuidance })), sources: input.sources.map(({ sourceRef, sourceType, minimizedText }) => ({ sourceRef, sourceType, text: minimizedText })) }),
        text: { format: { type: "json_schema", name: "rfxchange_amacs_interpretation", strict: true, schema: OUTPUT_SCHEMA } },
      });
    let response: Response | null = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        response = await fetch(this.endpoint, { method: "POST", signal: AbortSignal.timeout(this.timeoutMs), headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json", "X-Client-Request-Id": input.requestId }, body: requestBody });
      } catch (cause) {
        if (attempt === 1) throw cause;
        continue;
      }
      if (response.ok || (response.status !== 429 && response.status < 500) || attempt === 1) break;
    }
    if (!response) throw new Error("OpenAI Responses API returned no response.");
    if (!response.ok) throw new Error(`OpenAI Responses API failed with status ${response.status}.`);
    const json = await response.json() as OpenAiResponse;
    const parsed = JSON.parse(outputText(json)) as { proposals?: unknown };
    if (!Array.isArray(parsed.proposals)) throw new Error("OpenAI structured output omitted proposals.");
    const inputTokens = finiteNonnegative(json.usage?.input_tokens);
    const outputTokens = finiteNonnegative(json.usage?.output_tokens);
    const costAvailable = this.inputMicrousdPerMillion !== null && this.outputMicrousdPerMillion !== null;
    const estimatedCostMicrousd = costAvailable ? Math.ceil((inputTokens * this.inputMicrousdPerMillion! + outputTokens * this.outputMicrousdPerMillion!) / 1_000_000) : null;
    return Object.freeze({ provider: "openai", model, providerRequestId: response.headers.get("x-request-id") ?? json.id ?? null, proposals: Object.freeze(parsed.proposals) as InterpretationProviderResult["proposals"], usage: Object.freeze({ inputTokens, outputTokens, cachedInputTokens: finiteNonnegative(json.usage?.input_tokens_details?.cached_tokens) }), latencyMs: Math.max(0, Math.round(performance.now() - started)), estimatedCostMicrousd, costBasis: costAvailable ? "configured-estimate" : "unavailable" });
  }
}
