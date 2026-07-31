import type { UserId } from "../users/model.ts";
import type { ActivationJourneyContext } from "./model.ts";

export interface ActivationJourneyContextRepository {
  getByUserId(userId: UserId): Promise<ActivationJourneyContext | null>;
  save(context: ActivationJourneyContext): Promise<void>;
}
