import type { GeographyId } from "./model";
import type { AuthoritativeBoundaryGeometry } from "./boundary";

export interface AuthoritativeBoundaryGeometryRepository {
  getByGeographyId(geographyId: GeographyId): Promise<AuthoritativeBoundaryGeometry | null>;
}
