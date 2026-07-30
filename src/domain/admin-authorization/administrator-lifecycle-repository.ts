import type { PlatformAdministratorId } from "./model.ts";
import type {
  PlatformAdministratorAccount,
  PlatformAdministratorLifecycleEvent,
  PlatformAdministratorLifecycleEventId,
} from "./administrator-lifecycle.ts";

export interface PlatformAdministratorLifecycleRepository {
  getByAdministratorId(administratorId: PlatformAdministratorId): Promise<PlatformAdministratorAccount | null>;
  getBySubject(subject: string): Promise<PlatformAdministratorAccount | null>;
  save(account: PlatformAdministratorAccount): Promise<void>;
  appendEvent(event: PlatformAdministratorLifecycleEvent): Promise<void>;
  getEventById(eventId: PlatformAdministratorLifecycleEventId): Promise<PlatformAdministratorLifecycleEvent | null>;
  listEventsForAdministrator(administratorId: PlatformAdministratorId): Promise<readonly PlatformAdministratorLifecycleEvent[]>;
}
