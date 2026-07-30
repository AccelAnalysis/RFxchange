import type { PlatformAdministratorAuthorityContext } from "../../domain/admin-authorization/model.ts";
import type { AdministrativeBoundaryEventRepository } from "../../domain/admin-authorization/authority-boundary-repository.ts";
import {
  evaluateAndRecordAdministrativeBoundary,
  type AdministrativeBoundaryAction,
  type AdministrativeBoundaryDecision,
  type EvaluateAdministrativeBoundaryInput,
} from "../../domain/admin-authorization/authority-boundaries.ts";

export class AdministrativeAuthorityBoundaryService {
  private readonly events: AdministrativeBoundaryEventRepository;

  constructor(events: AdministrativeBoundaryEventRepository) {
    this.events = events;
  }

  async evaluate(
    context: PlatformAdministratorAuthorityContext,
    action: AdministrativeBoundaryAction,
    input: EvaluateAdministrativeBoundaryInput,
  ): Promise<AdministrativeBoundaryDecision> {
    const result = evaluateAndRecordAdministrativeBoundary(context, action, input);
    await this.events.append(result.event);
    return result.decision;
  }
}
