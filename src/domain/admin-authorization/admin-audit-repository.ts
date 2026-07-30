import type {
  PlatformAdministrativeAuditEvent,
  PlatformAdminAuditEventId,
} from "./admin-audit.ts";
import type { PlatformAdministratorId } from "./model.ts";

export interface PlatformAdministrativeAuditRepository {
  append(event: PlatformAdministrativeAuditEvent): Promise<void>;
  getById(id: PlatformAdminAuditEventId): Promise<PlatformAdministrativeAuditEvent | null>;
  listByAdministratorId(administratorId: PlatformAdministratorId): Promise<readonly PlatformAdministrativeAuditEvent[]>;
  listByTarget(objectType: string, objectId: string): Promise<readonly PlatformAdministrativeAuditEvent[]>;
}
