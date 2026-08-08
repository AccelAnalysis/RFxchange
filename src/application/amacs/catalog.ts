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

export interface AmacsCatalogPort {
  getRelease(): Promise<AmacsReleaseMetadata>;
  searchCapabilities(query: AmacsCapabilitySearch): Promise<AmacsCapabilitySearchPage>;
  listDomains(): Promise<readonly AmacsDomain[]>;
  listFamilies(domainId: string): Promise<readonly AmacsFamily[]>;
  listCapabilities(familyId: string): Promise<readonly AmacsCapability[]>;
  getCapability(capabilityId: string): Promise<AmacsCapability | null>;
  hasCanonicalCapability(capabilityId: string): Promise<boolean>;
  listMarketRoles(): Promise<readonly AmacsRegistryRecord[]>;
  getRequestFamily(requestFamilyId: string): Promise<AmacsRegistryRecord | null>;
  getRequirementType(requirementTypeId: string): Promise<AmacsRegistryRecord | null>;
  getResponseTemplate(responseTemplateId: string): Promise<AmacsRegistryRecord | null>;
  getDecisionTemplate(decisionTemplateId: string): Promise<AmacsRegistryRecord | null>;
  getReadinessRules(requestFamilyId: string): Promise<readonly AmacsRegistryRecord[]>;
  getConceptInterpretationGuidance(
    capabilityId: string,
  ): Promise<AmacsConceptInterpretationGuidance | null>;
  resolveHistoricalCapability(
    reference: HistoricalAmacsCapabilityReference,
  ): Promise<AmacsCapability | null>;
}

export interface AmacsContractValidationResult<T> {
  readonly valid: boolean;
  readonly value: T | null;
  readonly errors: readonly string[];
}

export interface AmacsRuntimeContractValidatorPort {
  validate<T>(schemaName: string, value: unknown): Promise<AmacsContractValidationResult<T>>;
}
