import type { ProviderPromotionCommand } from "./promotion.ts";
import type {
  ProviderPromotionReceipt,
  ProviderSeedPromotionEvidenceBundle,
  ProviderSeedPromotionWriteSet,
} from "./promotion-runtime.ts";

export interface ProviderSeedPromotionEvidenceRepository {
  loadForCommand(
    command: ProviderPromotionCommand,
  ): Promise<ProviderSeedPromotionEvidenceBundle | null>;
}

export interface ProviderSeedPromotionUnitOfWork {
  commit(writeSet: ProviderSeedPromotionWriteSet): Promise<ProviderPromotionReceipt>;
}

export interface ProviderSeedPromotionRepositories {
  readonly evidence: ProviderSeedPromotionEvidenceRepository;
  readonly unitOfWork: ProviderSeedPromotionUnitOfWork;
}
