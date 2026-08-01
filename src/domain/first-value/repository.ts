import type { AccessLifecycleRecord } from "../lifecycle/model.ts";
import type { ActivationReleaseEvent, FirstValueSelection } from "./model.ts";

export interface FirstValueSelectionRepository {
  getByAccessJourneyId(accessJourneyId: string): Promise<FirstValueSelection | null>;
  saveSelection(input: Readonly<{
    expectedUpdatedAt: string | null;
    selection: FirstValueSelection;
    event: ActivationReleaseEvent;
  }>): Promise<void>;
  releaseOpen(input: Readonly<{
    lifecycle: AccessLifecycleRecord;
    selection: FirstValueSelection;
    event: ActivationReleaseEvent;
  }>): Promise<"released" | "already-open">;
}
