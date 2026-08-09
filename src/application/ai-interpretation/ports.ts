import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import type { AmacsInterpretationPurpose } from "../../domain/amacs/contracts.ts";
import type {
  InterpretationAuthorityScope,
  InterpretationProviderAvailability,
  InterpretationProviderRequest,
  InterpretationProviderResult,
} from "../../domain/ai-interpretation/model.ts";

export interface InterpretationAuthorityPort {
  authorize(input: Readonly<{
    context: AuthenticatedServerContext | null;
    organizationId: string;
    membershipId: string;
    purpose: AmacsInterpretationPurpose;
  }>): Promise<
    | Readonly<{ allowed: true; scope: InterpretationAuthorityScope }>
    | Readonly<{ allowed: false; reason: string }>
  >;
}

export interface InterpretationFeaturePolicyPort {
  inspect(input: Readonly<{
    tenantId: string;
    organizationId: string;
    purpose: AmacsInterpretationPurpose;
  }>): Promise<Readonly<{
    enabled: boolean;
    reason: "enabled" | "tenant-disabled" | "purpose-disabled";
  }>>;
}

export interface InterpretationProviderPort {
  availability(): InterpretationProviderAvailability;
  interpret(input: InterpretationProviderRequest): Promise<InterpretationProviderResult>;
}

export interface ContentSafeInterpretationObserver {
  record(event: Readonly<{
    requestId: string;
    organizationId: string;
    userId: string;
    outcome: string;
    failureClass: string | null;
    latencyMs: number;
  }>): void;
}
