import type {
  OrientationJourney,
  OrientationJourneyEvent,
} from "./model.ts";

export interface OrientationJourneyRepository {
  getById(id: string): Promise<OrientationJourney | null>;
  saveTransition(input: Readonly<{
    expectedRevision: number | null;
    journey: OrientationJourney;
    event: OrientationJourneyEvent;
  }>): Promise<void>;
}
