import type { PlatformAdministratorId } from "./model.ts";
import type {
  PrivilegedAdministratorDevice,
  PrivilegedAdministratorSession,
  PrivilegedDeviceId,
  PrivilegedSecurityEvent,
  PrivilegedSecurityEventId,
  PrivilegedSessionId,
} from "./privileged-security.ts";

export interface PrivilegedAdministratorSecurityRepository {
  getSession(sessionId: PrivilegedSessionId): Promise<PrivilegedAdministratorSession | null>;
  saveSession(session: PrivilegedAdministratorSession): Promise<void>;
  listActiveSessions(administratorId: PlatformAdministratorId): Promise<readonly PrivilegedAdministratorSession[]>;
  getDevice(deviceId: PrivilegedDeviceId): Promise<PrivilegedAdministratorDevice | null>;
  saveDevice(device: PrivilegedAdministratorDevice): Promise<void>;
  listDevices(administratorId: PlatformAdministratorId): Promise<readonly PrivilegedAdministratorDevice[]>;
  appendSecurityEvent(event: PrivilegedSecurityEvent): Promise<void>;
  getSecurityEvent(eventId: PrivilegedSecurityEventId): Promise<PrivilegedSecurityEvent | null>;
}
