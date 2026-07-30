import type { UserId } from "../users/model.ts";
import type { PrimaryOperatingGeographySelection } from "./model.ts";

export interface PrimaryOperatingGeographySelectionRepository {
  getByUserId(userId: UserId): Promise<PrimaryOperatingGeographySelection | null>;
  save(selection: PrimaryOperatingGeographySelection): Promise<void>;
}
