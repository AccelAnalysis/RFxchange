import type { OrganizationId } from "../../domain/organizations/model";
import type {
  StoredAsset,
  StoredAssetAccessActor,
  StoredAssetCategory,
  StoredAssetId,
  StoredAssetObjectReceipt,
} from "../../domain/storage/model";
import {
  activateStoredAsset,
  createStoredAssetDraft,
  evaluateStoredAssetAccess,
} from "../../domain/storage/model";
import type { StoredAssetRepository } from "../../domain/storage/repository";
import type { UserId } from "../../domain/users/model";

export interface PrivateObjectStore {
  put(input: Readonly<{
    readonly objectPath: string;
    readonly contentType: string;
    readonly bytes: Uint8Array;
    readonly metadata: Readonly<Record<string, string>>;
  }>): Promise<StoredAssetObjectReceipt>;
  get(objectPath: string): Promise<Readonly<{ readonly contentType: string; readonly bytes: Uint8Array }>>;
  delete(objectPath: string): Promise<void>;
}

export interface StoredAssetServiceDependencies {
  readonly assets: StoredAssetRepository;
  readonly objects: PrivateObjectStore;
}

export class StoredAssetAccessError extends Error {
  readonly code: "wrong-organization" | "missing-permission" | "asset-unavailable";

  constructor(code: StoredAssetAccessError["code"], message: string) {
    super(message);
    this.name = "StoredAssetAccessError";
    this.code = code;
  }
}

function assertAccess(
  actor: StoredAssetAccessActor,
  organizationId: OrganizationId,
  category: StoredAssetCategory,
  operation: "create" | "read" | "delete",
): void {
  const decision = evaluateStoredAssetAccess(actor, { organizationId, category }, operation);
  if (!decision.allowed) {
    throw new StoredAssetAccessError(decision.reason, `Stored asset ${operation} denied: ${decision.reason}.`);
  }
}

export async function storeOrganizationAsset(
  input: Readonly<{
    readonly actor: StoredAssetAccessActor;
    readonly id: string;
    readonly organizationId: OrganizationId;
    readonly category: string;
    readonly originalFilename: string;
    readonly contentType: string;
    readonly bytes: Uint8Array;
    readonly createdByUserId: UserId;
    readonly retentionAssignmentId?: string | null;
    readonly now: string;
  }>,
  dependencies: StoredAssetServiceDependencies,
): Promise<StoredAsset> {
  const draft = createStoredAssetDraft({
    id: input.id,
    organizationId: input.organizationId,
    category: input.category,
    originalFilename: input.originalFilename,
    contentType: input.contentType,
    sizeBytes: input.bytes.byteLength,
    createdByUserId: input.createdByUserId,
    retentionAssignmentId: input.retentionAssignmentId,
    now: input.now,
  });
  assertAccess(input.actor, draft.organizationId, draft.category, "create");

  await dependencies.assets.create(draft);
  const receipt = await dependencies.objects.put({
    objectPath: draft.objectPath,
    contentType: draft.contentType,
    bytes: input.bytes,
    metadata: Object.freeze({
      rfxAssetId: draft.id,
      rfxOrganizationId: draft.organizationId,
      rfxCategory: draft.category,
      rfxSensitivity: draft.sensitivity,
      rfxVisibility: draft.visibility,
    }),
  });

  const active = activateStoredAsset(draft, receipt, new Date().toISOString());
  try {
    await dependencies.assets.save(active);
  } catch (error) {
    try {
      await dependencies.objects.delete(draft.objectPath);
    } catch {
      // Reconciliation tooling can identify a pending metadata record if object compensation fails.
    }
    throw error;
  }
  return active;
}

export async function readOrganizationAsset(
  input: Readonly<{
    readonly actor: StoredAssetAccessActor;
    readonly assetId: StoredAssetId;
  }>,
  dependencies: StoredAssetServiceDependencies,
): Promise<Readonly<{ readonly asset: StoredAsset; readonly bytes: Uint8Array }>> {
  const asset = await dependencies.assets.getById(input.assetId);
  if (!asset || asset.status !== "active") {
    throw new StoredAssetAccessError("asset-unavailable", "Stored asset is unavailable.");
  }
  assertAccess(input.actor, asset.organizationId, asset.category, "read");
  const object = await dependencies.objects.get(asset.objectPath);
  if (object.contentType !== asset.contentType || object.bytes.byteLength !== asset.sizeBytes) {
    throw new Error("Stored object no longer matches its active metadata record.");
  }
  return Object.freeze({ asset, bytes: object.bytes });
}
