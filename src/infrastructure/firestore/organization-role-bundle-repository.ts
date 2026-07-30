import type { Firestore } from "firebase-admin/firestore";

import type { OrganizationRoleBundleRepository } from "../../domain/authorization/organization-role-bundle-repository.ts";
import {
  createOrganizationRoleBundle,
  organizationRoleBundleKey,
  type OrganizationRoleBundle,
  type OrganizationRoleBundleKey,
} from "../../domain/authorization/organization-role-bundles.ts";

export const ORGANIZATION_ROLE_BUNDLE_COLLECTION = "organizationRoleBundles" as const;
export const ORGANIZATION_ROLE_BUNDLE_SCHEMA_VERSION = 1 as const;

interface PersistedOrganizationRoleBundle {
  readonly schemaVersion: typeof ORGANIZATION_ROLE_BUNDLE_SCHEMA_VERSION;
  readonly key: string;
  readonly displayName: string;
  readonly description: string;
  readonly permissions: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

function persisted(bundle: OrganizationRoleBundle): PersistedOrganizationRoleBundle {
  return Object.freeze({
    schemaVersion: ORGANIZATION_ROLE_BUNDLE_SCHEMA_VERSION,
    key: bundle.key,
    displayName: bundle.displayName,
    description: bundle.description,
    permissions: Object.freeze([...bundle.permissions]),
    createdAt: bundle.createdAt,
    updatedAt: bundle.updatedAt,
  });
}

function hydrate(
  id: string,
  raw: FirebaseFirestore.DocumentData | undefined,
): OrganizationRoleBundle | null {
  if (!raw) return null;
  if (raw.schemaVersion !== ORGANIZATION_ROLE_BUNDLE_SCHEMA_VERSION) {
    throw new Error(`Organization role bundle ${id} has an unsupported schema version.`);
  }
  if (raw.key !== id) {
    throw new Error("Organization role bundle identity does not match document path.");
  }
  if (!Array.isArray(raw.permissions) || !raw.permissions.every((value) => typeof value === "string")) {
    throw new Error(`Organization role bundle ${id} has invalid permissions.`);
  }
  return createOrganizationRoleBundle({
    key: organizationRoleBundleKey(id),
    displayName: String(raw.displayName ?? ""),
    description: String(raw.description ?? ""),
    permissions: raw.permissions,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  });
}

export class FirestoreOrganizationRoleBundleRepository
  implements OrganizationRoleBundleRepository
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getByKey(key: OrganizationRoleBundleKey): Promise<OrganizationRoleBundle | null> {
    const snapshot = await this.db.collection(ORGANIZATION_ROLE_BUNDLE_COLLECTION).doc(key).get();
    return hydrate(snapshot.id, snapshot.data());
  }

  async listAll(): Promise<readonly OrganizationRoleBundle[]> {
    const snapshot = await this.db.collection(ORGANIZATION_ROLE_BUNDLE_COLLECTION).get();
    return Object.freeze(
      snapshot.docs.map((document) => {
        const bundle = hydrate(document.id, document.data());
        if (!bundle) throw new Error(`Organization role bundle ${document.id} is missing.`);
        return bundle;
      }),
    );
  }

  async save(bundle: OrganizationRoleBundle): Promise<void> {
    await this.db.collection(ORGANIZATION_ROLE_BUNDLE_COLLECTION).doc(bundle.key).set(persisted(bundle));
  }
}
