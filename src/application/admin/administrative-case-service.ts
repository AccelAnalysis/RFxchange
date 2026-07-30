import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
import {
  assessAdministrativeCaseSla,
  transitionAdministrativeCase,
  type AdministrativeCase,
  type AdministrativeCaseSlaState,
  type AdministrativeCaseStatus,
} from "../../domain/admin-cases/model.ts";
import type {
  AdministrativeCaseLifecycleUnitOfWork,
  AdministrativeCaseRepository,
} from "../../domain/admin-cases/repository.ts";
import { createAdministrativeWorkItem } from "../../domain/admin-work-queue/model.ts";

function assertPermission(
  authority: PlatformAdministratorAuthorityContext,
  permission: AdministrativeCase["readPermission"] | AdministrativeCase["actionPermission"],
): void {
  const decision = authorizeAdministrativeAction(
    authority,
    createAdministrativeActionRequirement({ permission }),
  );
  if (decision.kind !== "allow") {
    throw new Error(`Administrative case access denied: ${decision.reason}.`);
  }
}

export class AdministrativeCaseService {
  private readonly cases: AdministrativeCaseRepository;
  private readonly lifecycle: AdministrativeCaseLifecycleUnitOfWork;

  constructor(input: Readonly<{
    cases: AdministrativeCaseRepository;
    lifecycle: AdministrativeCaseLifecycleUnitOfWork;
  }>) {
    this.cases = input.cases;
    this.lifecycle = input.lifecycle;
  }

  async get(
    authority: PlatformAdministratorAuthorityContext,
    id: AdministrativeCase["id"],
  ): Promise<AdministrativeCase | null> {
    const record = await this.cases.getById(id);
    if (!record) return null;
    assertPermission(authority, record.readPermission);
    return record;
  }

  async transition(input: Readonly<{
    authority: PlatformAdministratorAuthorityContext;
    caseRecord: AdministrativeCase;
    eventId: string;
    nextStatus: AdministrativeCaseStatus;
    reason: string;
    now: string;
  }>): Promise<AdministrativeCase> {
    assertPermission(input.authority, input.caseRecord.actionPermission);
    const result = transitionAdministrativeCase({
      caseRecord: input.caseRecord,
      eventId: input.eventId,
      actorAdministratorId: input.authority.administratorId,
      nextStatus: input.nextStatus,
      reason: input.reason,
      now: input.now,
    });
    await this.lifecycle.commitTransition(result);
    return result.caseRecord;
  }

  async openQueue(
    authority: PlatformAdministratorAuthorityContext,
    now: string,
  ): Promise<readonly Readonly<{
    caseRecord: AdministrativeCase;
    slaState: AdministrativeCaseSlaState;
  }>[]> {
    const records = await this.cases.listOpen();
    return Object.freeze(
      records
        .filter((record) => {
          try {
            assertPermission(authority, record.readPermission);
            return true;
          } catch {
            return false;
          }
        })
        .map((caseRecord) =>
          Object.freeze({ caseRecord, slaState: assessAdministrativeCaseSla(caseRecord, now) }),
        ),
    );
  }
}

export function administrativeCaseToWorkItem(caseRecord: AdministrativeCase) {
  return createAdministrativeWorkItem({
    id: caseRecord.id,
    caseNumber: caseRecord.caseNumber,
    objectType: caseRecord.objectType,
    objectId: caseRecord.objectId,
    organizationId: caseRecord.organizationId,
    userId: caseRecord.userId,
    type: caseRecord.type,
    severity: caseRecord.severity,
    source: caseRecord.source,
    geography: caseRecord.geography,
    assignedAdministratorId: caseRecord.assignedAdministratorId,
    createdAt: caseRecord.createdAt,
    slaDueAt: caseRecord.slaDueAt,
    status: caseRecord.status,
    evidenceReferences: caseRecord.evidenceReferences,
    relatedCaseNumbers: [],
    requiredPermission: caseRecord.readPermission,
  });
}
