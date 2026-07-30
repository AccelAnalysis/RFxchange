import type {
  AdministrativeCase,
  AdministrativeCaseEvent,
  AdministrativeCaseEventId,
  AdministrativeCaseId,
} from "./model.ts";

export interface AdministrativeCaseRepository {
  getById(id: AdministrativeCaseId): Promise<AdministrativeCase | null>;
  listOpen(): Promise<readonly AdministrativeCase[]>;
  save(caseRecord: AdministrativeCase): Promise<void>;
  create(caseRecord: AdministrativeCase): Promise<void>;
}

export interface AdministrativeCaseEventRepository {
  getById(id: AdministrativeCaseEventId): Promise<AdministrativeCaseEvent | null>;
  listByCaseId(caseId: AdministrativeCaseId): Promise<readonly AdministrativeCaseEvent[]>;
  append(event: AdministrativeCaseEvent): Promise<void>;
}

export interface AdministrativeCaseLifecycleUnitOfWork {
  commitTransition(input: Readonly<{
    caseRecord: AdministrativeCase;
    event: AdministrativeCaseEvent;
  }>): Promise<void>;
}
