import type { InterpretationFeaturePolicyPort } from "../../application/ai-interpretation/ports.ts";
import type { AmacsInterpretationPurpose } from "../../domain/amacs/contracts.ts";

const PURPOSES = new Set<AmacsInterpretationPurpose>([
  "seller_capability_declaration", "buyer_need_definition", "provider_service_definition",
  "evidence_linking", "request_structure", "response_assistance", "outcome_classification", "other",
]);

export class EnvironmentInterpretationFeaturePolicy implements InterpretationFeaturePolicyPort {
  async inspect(input: Readonly<{ tenantId: string; organizationId: string; purpose: AmacsInterpretationPurpose }>) {
    const enabled = process.env.RFXCHANGE_AI_INTERPRETATION_ENABLED?.trim().toLowerCase() === "true";
    if (!enabled) return Object.freeze({ enabled: false as const, reason: "tenant-disabled" as const });
    const enabledOrganizations = (process.env.RFXCHANGE_AI_ENABLED_ORGANIZATION_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
    if (enabledOrganizations.length > 0 && !enabledOrganizations.includes(input.organizationId)) return Object.freeze({ enabled: false as const, reason: "tenant-disabled" as const });
    const allowed = (process.env.RFXCHANGE_AI_INTERPRETATION_PURPOSES ?? "seller_capability_declaration,buyer_need_definition,provider_service_definition,evidence_linking,request_structure,response_assistance")
      .split(",").map((value) => value.trim()).filter((value): value is AmacsInterpretationPurpose => PURPOSES.has(value as AmacsInterpretationPurpose));
    if (!allowed.includes(input.purpose)) return Object.freeze({ enabled: false as const, reason: "purpose-disabled" as const });
    return Object.freeze({ enabled: true as const, reason: "enabled" as const });
  }
}
