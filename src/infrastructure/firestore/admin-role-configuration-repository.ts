import type { Firestore } from "firebase-admin/firestore";

import type { PlatformAdministratorId } from "../../domain/admin-authorization/model.ts";
import type { PlatformAdministratorRoleConfigurationRepository } from "../../domain/admin-authorization/role-configuration-repository.ts";
import {
  createPlatformAdministratorRoleConfiguration,
  type PlatformAdministratorRoleConfiguration,
} from "../../domain/admin-authorization/role-configuration.ts";

export const ADMIN_ROLE_CONFIGURATION_COLLECTION = "adminRoleConfigurations" as const;
export const ADMIN_ROLE_CONFIGURATION_SCHEMA_VERSION = 1 as const;

function persisted(configuration: PlatformAdministratorRoleConfiguration) {
  return Object.freeze({
    schemaVersion: ADMIN_ROLE_CONFIGURATION_SCHEMA_VERSION,
    administratorId: configuration.administratorId,
    rolePresetKeys: configuration.rolePresetKeys,
    addedPermissions: configuration.addedPermissions,
    removedPermissions: configuration.removedPermissions,
    createdAt: configuration.createdAt,
    updatedAt: configuration.updatedAt,
  });
}

function hydrate(id: string, raw: FirebaseFirestore.DocumentData | undefined): PlatformAdministratorRoleConfiguration | null {
  if (!raw) return null;
  if (raw.schemaVersion !== ADMIN_ROLE_CONFIGURATION_SCHEMA_VERSION) {
    throw new Error(`Administrator role configuration ${id} has an unsupported schema version.`);
  }
  if (raw.administratorId !== id) {
    throw new Error("Administrator role configuration identity does not match its document path.");
  }
  for (const field of ["rolePresetKeys", "addedPermissions", "removedPermissions"]) {
    if (!Array.isArray(raw[field]) || !raw[field].every((value: unknown) => typeof value === "string")) {
      throw new Error(`Administrator role configuration ${id} has invalid ${field}.`);
    }
  }
  return createPlatformAdministratorRoleConfiguration({
    administratorId: id,
    rolePresetKeys: raw.rolePresetKeys,
    addedPermissions: raw.addedPermissions,
    removedPermissions: raw.removedPermissions,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  });
}

export class FirestorePlatformAdministratorRoleConfigurationRepository
  implements PlatformAdministratorRoleConfigurationRepository
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getByAdministratorId(
    administratorId: PlatformAdministratorId,
  ): Promise<PlatformAdministratorRoleConfiguration | null> {
    const snapshot = await this.db.collection(ADMIN_ROLE_CONFIGURATION_COLLECTION).doc(administratorId).get();
    return hydrate(snapshot.id, snapshot.data());
  }

  async save(configuration: PlatformAdministratorRoleConfiguration): Promise<void> {
    await this.db
      .collection(ADMIN_ROLE_CONFIGURATION_COLLECTION)
      .doc(configuration.administratorId)
      .set(persisted(configuration));
  }
}
