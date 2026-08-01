import type {
  AcquisitionContextEnvelope,
  AcquisitionContextEvent,
} from "./model.ts";
import type { AccessJourneyId } from "../lifecycle/model.ts";
import type { UserId } from "../users/model.ts";

export interface AcquisitionContextRepository {
  getById(id: string): Promise<AcquisitionContextEnvelope | null>;
  create(context: AcquisitionContextEnvelope, event: AcquisitionContextEvent): Promise<void>;
  bind(input: Readonly<{
    id: string;
    browserSecretDigest: string;
    userId: UserId;
    accessJourneyId: AccessJourneyId;
    now: string;
    eventId: string;
  }>): Promise<AcquisitionContextEnvelope>;
  resume(input: Readonly<{
    id: string;
    userId: UserId;
    accessJourneyId: AccessJourneyId;
    now: string;
    eventId: string;
  }>): Promise<AcquisitionContextEnvelope>;
}
