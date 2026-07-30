import type { Firestore } from "firebase-admin/firestore";

import type { AdminRolePresetRepository } from "../../domain/admin-authorization/role-preset-repository.ts";
import {
  adminRolePresetKey,
  createAdminRolePreset,
  type AdminRolePreset,
  type AdminRolePresetKey,
} from "../../domain/admin-authorization/role-presets.ts";

export const ADMIN_ROLE_PRESET_COLLECTION = "adminRolePresets" as const;
export const ADMIN_ROLE_PRESET_SCHEMA_VERSION = 1 as const;

interface PersistedAdminRolePreset {
  readonly schemaVersion: typeof ADMIN_ROLE_PRESET_SCHEMA_VERSION;
  readonly key: string;
  readonly displayName: string;
  readonly description: string;
  readonly permissions: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

function toPersisted(preset: AdminRolePreset): PersistedAdminRolePreset {
  return Object.freeze({
    schemaVersion: ADMIN_ROLE_PRESET_SCHEMA_VERSION,
    key: preset.key,
    displayName: preset.displayName,
    description: preset.description,
    permissions: Object.freeze(preset.grants.map((grant) => grant.permission)),
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
  });
}

function fromPersisted(id: string, raw: FirebaseFirestore.DocumentData | undefined): AdminRolePreset | null {
  if (!raw) return null;
  if (raw.schemaVersion !== ADMIN_ROLE_PRESET_SCHEMA_VERSION) {
    throw new Error(`Administrative role preset ${id} has an unsupported schema version.`);
  }
  if (raw.key !== id) throw new Error("Administrative role preset identity does not match its document path.");
  if (!Array.isArray(raw.permissions) || !raw.permissions.every((value) => typeof value === "string")) {
    throw new Error(`Administrative role preset ${id} has invalid permissions.`);
  }
  return createAdminRolePreset({
    key: adminRolePresetKey(id),
    displayName: String(raw.displayName ?? ""),
    description: String(raw.description ?? ""),
    permissions: raw.permissions,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  });
}

export class FirestoreAdminRolePresetRepository implements AdminRolePresetRepository {
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getByKey(key: AdminRolePresetKey): Promise<AdminRolePreset | null> {
    const snapshot = await this.db.collection(ADMIN_ROLE_PRESET_COLLECTION).doc(key).get();
    return fromPersisted(snapshot.id, snapshot.data());
  }

  async listAll(): Promise<readonly AdminRolePreset[]> {
    const snapshot = await this.db.collection(ADMIN_ROLE_PRESET_COLLECTION).get();
    return Object.freeze(
      snapshot.docs.map((document) => {
        const preset = fromPersisted(document.id, document.data());
        if (!preset) throw new Error(`Administrative role preset ${document.id} is missing.`);
        return preset;
      }),
    );
  }

  async save(preset: AdminRolePreset): Promise<void> {
    await this.db.collection(ADMIN_ROLE_PRESET_COLLECTION).doc(preset.key).set(toPersisted(preset));
  }
}
