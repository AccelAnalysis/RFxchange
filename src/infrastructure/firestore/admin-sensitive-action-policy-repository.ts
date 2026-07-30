import type { Firestore } from "firebase-admin/firestore";

import type { AdminPermissionKey } from "../../domain/admin-authorization/model.ts";
import type { AdminSensitiveActionPolicyRepository } from "../../domain/admin-authorization/condition-policy-repository.ts";
import {
  createAdminSensitiveActionPolicy,
  type AdminSensitiveActionPolicy,
} from "../../domain/admin-authorization/conditions.ts";

export const ADMIN_SENSITIVE_ACTION_POLICY_COLLECTION = "adminSensitiveActionPolicies" as const;
export const ADMIN_SENSITIVE_ACTION_POLICY_SCHEMA_VERSION = 1 as const;

function persisted(policy: AdminSensitiveActionPolicy) {
  return Object.freeze({
    schemaVersion: ADMIN_SENSITIVE_ACTION_POLICY_SCHEMA_VERSION,
    permission: policy.permission,
    requiredConditions: policy.requiredConditions,
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  });
}

function hydrate(
  id: string,
  raw: FirebaseFirestore.DocumentData | undefined,
): AdminSensitiveActionPolicy | null {
  if (!raw) return null;
  if (raw.schemaVersion !== ADMIN_SENSITIVE_ACTION_POLICY_SCHEMA_VERSION) {
    throw new Error(`Sensitive action policy ${id} has an unsupported schema version.`);
  }
  if (raw.permission !== id) {
    throw new Error("Sensitive action policy permission does not match its document path.");
  }
  if (!Array.isArray(raw.requiredConditions)) {
    throw new Error(`Sensitive action policy ${id} has invalid condition configuration.`);
  }
  return createAdminSensitiveActionPolicy({
    permission: id,
    requiredConditions: raw.requiredConditions,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  });
}

export class FirestoreAdminSensitiveActionPolicyRepository
  implements AdminSensitiveActionPolicyRepository
{
  private readonly db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async getByPermission(permission: AdminPermissionKey): Promise<AdminSensitiveActionPolicy | null> {
    const snapshot = await this.db
      .collection(ADMIN_SENSITIVE_ACTION_POLICY_COLLECTION)
      .doc(permission)
      .get();
    return hydrate(snapshot.id, snapshot.data());
  }

  async listAll(): Promise<readonly AdminSensitiveActionPolicy[]> {
    const snapshot = await this.db.collection(ADMIN_SENSITIVE_ACTION_POLICY_COLLECTION).get();
    return Object.freeze(
      snapshot.docs.map((document) => {
        const policy = hydrate(document.id, document.data());
        if (!policy) throw new Error(`Sensitive action policy ${document.id} is missing.`);
        return policy;
      }),
    );
  }

  async save(policy: AdminSensitiveActionPolicy): Promise<void> {
    await this.db
      .collection(ADMIN_SENSITIVE_ACTION_POLICY_COLLECTION)
      .doc(policy.permission)
      .set(persisted(policy));
  }
}
