import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { RfxAggregate, RfxCommandReceipt, RfxEvent, RfxId } from "./model.ts";

export class RfxPersistenceConflictError extends Error {
  readonly code = "persistence-conflict" as const;

  constructor(message: string) {
    super(message);
    this.name = "RfxPersistenceConflictError";
  }
}

export interface RfxPersistenceBundle {
  readonly aggregate: RfxAggregate;
  readonly expectedVersion: number | null;
  readonly event: RfxEvent;
  readonly command: RfxCommandReceipt;
  readonly audit: OrganizationActionAuditEvent;
}

export interface RfxRepository {
  getById(id: RfxId): Promise<RfxAggregate | null>;
  listByIssuerOrganizationId(organizationId: OrganizationId): Promise<readonly RfxAggregate[]>;
  getCommand(id: string): Promise<RfxCommandReceipt | null>;
  save(bundle: RfxPersistenceBundle): Promise<"created" | "replayed">;
}
