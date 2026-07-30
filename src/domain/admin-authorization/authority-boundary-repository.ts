import type {
  AdministrativeBoundaryEvent,
  AdministrativeBoundaryEventId,
} from "./authority-boundaries.ts";
import type { PlatformAdministratorId } from "./model.ts";

export interface AdministrativeBoundaryEventRepository {
  append(event: AdministrativeBoundaryEvent): Promise<void>;
  getById(id: AdministrativeBoundaryEventId): Promise<AdministrativeBoundaryEvent | null>;
  listByAdministratorId(
    administratorId: PlatformAdministratorId,
  ): Promise<readonly AdministrativeBoundaryEvent[]>;
}
