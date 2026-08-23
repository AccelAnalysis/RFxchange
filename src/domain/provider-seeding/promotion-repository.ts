import type {
  ProviderCanonicalMatchEvidence,
  ProviderPromotionCommand,
} from "./promotion.ts";
import type {
  ProviderCanonicalSearchSnapshot,
  ProviderPromotionReceipt,
  ProviderSeedPromotionEvidenceBundle,
  ProviderSeedPromotionWriteSet,
  ProviderSeedSourceRecord,
} from "./promotion-runtime.ts";

export interface ProviderSeedPromotionEvidenceRepository {
  loadForCommand(
    command: ProviderPromotionCommand,
  ): Promise<ProviderSeedPromotionEvidenceBundle | null>;
}

export interface ProviderCanonicalOrganizationSearchInput {
  readonly candidateId: string;
  readonly sourceRecord: ProviderSeedSourceRecord;
  readonly generatedAt: string;
  readonly excludeOrganizationIds: readonly string[];
}

export interface ProviderCanonicalOrganizationSearchPort {
  searchCurrent(
    input: ProviderCanonicalOrganizationSearchInput,
  ): Promise<ProviderCanonicalSearchSnapshot>;
}

export interface ProviderSeedPromotionUnitOfWork {
  commit(writeSet: ProviderSeedPromotionWriteSet): Promise<ProviderPromotionReceipt>;
}

export interface ProviderSeedPromotionRepositories {
  readonly evidence: ProviderSeedPromotionEvidenceRepository;
  readonly unitOfWork: ProviderSeedPromotionUnitOfWork;
}

export function providerCanonicalMatchSet(
  matches: readonly ProviderCanonicalMatchEvidence[],
): readonly ProviderCanonicalMatchEvidence[] {
  return Object.freeze(
    [...matches].sort((left, right) =>
      left.organizationId.localeCompare(right.organizationId)
    ),
  );
}
