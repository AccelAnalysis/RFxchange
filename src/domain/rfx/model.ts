import type { AmacsRegistryRecord, AmacsReleaseMetadata } from "../amacs/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type RfxId = Brand<string, "RfxId">;
export const RFX_AGGREGATE_SCHEMA_VERSION = 1 as const;
export const RFX_CREATION_SOURCE_SCHEMA_VERSION = 1 as const;
export const RFX_AMACS_RELEASE_VERSION = "0.5.0" as const;
export const RFX_AMACS_SOURCE_COMMIT = "da7879f2609271b067ae6d02875e9388a02c4fe5" as const;

export interface RfxCreationSource {
  readonly kind: "blank";
  readonly schemaVersion: typeof RFX_CREATION_SOURCE_SCHEMA_VERSION;
}

export interface RequestFamilySnapshot {
  readonly amacsReleaseVersion: typeof RFX_AMACS_RELEASE_VERSION;
  readonly amacsSourceCommit: typeof RFX_AMACS_SOURCE_COMMIT;
  readonly requestFamilyId: string;
  readonly labelSnapshot: string;
  readonly purposeSnapshot: string;
  readonly lifecycleSnapshot: readonly string[];
  readonly defaultEndpointSnapshot: string;
  readonly supportsAwardSnapshot: boolean;
  readonly defaultResponseTemplateIdSnapshot: string;
  readonly defaultDecisionTemplateIdSnapshot: string;
  readonly defaultGovernanceProfileIdSnapshot: string;
  readonly allowedGovernanceProfileIdsSnapshot: readonly string[];
  readonly recommendedRequirementBundleIdsSnapshot: readonly string[];
  readonly selectedAt: string;
}

export interface RfxAggregate {
  readonly id: RfxId;
  readonly schemaVersion: typeof RFX_AGGREGATE_SCHEMA_VERSION;
  readonly issuerOrganizationId: OrganizationId;
  readonly lifecycleState: "draft";
  readonly version: number;
  readonly requestFamily: RequestFamilySnapshot;
  readonly creationSource: RfxCreationSource;
  readonly createdByUserId: UserId;
  readonly createdByMembershipId: OrganizationMembershipId;
  readonly updatedByUserId: UserId;
  readonly updatedByMembershipId: OrganizationMembershipId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type RfxEventKind = "rfx-draft-created" | "rfx-request-family-changed";

export interface RfxEvent {
  readonly id: string;
  readonly rfxId: RfxId;
  readonly issuerOrganizationId: OrganizationId;
  readonly kind: RfxEventKind;
  readonly aggregateVersion: number;
  readonly actorUserId: UserId;
  readonly actorMembershipId: OrganizationMembershipId;
  readonly commandId: string;
  readonly requestFamily: RequestFamilySnapshot;
  readonly priorRequestFamily: RequestFamilySnapshot | null;
  readonly occurredAt: string;
}

export interface RfxCommandReceipt {
  readonly id: string;
  readonly issuerOrganizationId: OrganizationId;
  readonly rfxId: RfxId;
  readonly action: "create-draft" | "change-request-family";
  readonly requestFingerprint: string;
  readonly resultingVersion: number;
  readonly recordedAt: string;
}

function required(value: unknown, label: string, maximum = 512): string {
  if (typeof value !== "string") throw new Error(`${label} is invalid.`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maximum) throw new Error(`${label} is invalid.`);
  return normalized;
}

function stable(value: unknown, label: string): string {
  const normalized = required(value, label, 191);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new Error(`${label} is malformed.`);
  }
  return normalized;
}

function timestamp(value: string, label: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} is invalid.`);
  return new Date(parsed).toISOString();
}

function stringList(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${label} is invalid.`);
  return Object.freeze(value.map((item) => stable(item, label)));
}

export function rfxId(value: string): RfxId {
  return stable(value, "RFx id") as RfxId;
}

export function requestFamilySnapshotFromAmacs(input: Readonly<{
  release: AmacsReleaseMetadata;
  record: AmacsRegistryRecord;
  selectedAt: string;
}>): RequestFamilySnapshot {
  if (
    input.release.version !== RFX_AMACS_RELEASE_VERSION
    || input.release.sourceCommit !== RFX_AMACS_SOURCE_COMMIT
  ) {
    throw new Error("The governed AMACS release is unavailable.");
  }
  if (input.record.status !== "active") {
    throw new Error("The selected request type is unavailable.");
  }
  if (typeof input.record.supports_award !== "boolean") {
    throw new Error("The selected request type is malformed.");
  }
  return Object.freeze({
    amacsReleaseVersion: RFX_AMACS_RELEASE_VERSION,
    amacsSourceCommit: RFX_AMACS_SOURCE_COMMIT,
    requestFamilyId: stable(input.record.request_family_id, "Request family id"),
    labelSnapshot: required(input.record.preferred_label, "Request family label"),
    purposeSnapshot: required(input.record.purpose, "Request family purpose", 1_200),
    lifecycleSnapshot: stringList(input.record.lifecycle, "Request family lifecycle"),
    defaultEndpointSnapshot: stable(input.record.default_endpoint, "Default endpoint"),
    supportsAwardSnapshot: input.record.supports_award,
    defaultResponseTemplateIdSnapshot: stable(input.record.default_response_template_id, "Response template id"),
    defaultDecisionTemplateIdSnapshot: stable(input.record.default_decision_template_id, "Decision template id"),
    defaultGovernanceProfileIdSnapshot: stable(input.record.default_governance_profile_id, "Governance profile id"),
    allowedGovernanceProfileIdsSnapshot: stringList(input.record.allowed_governance_profile_ids, "Allowed governance profile id"),
    recommendedRequirementBundleIdsSnapshot: stringList(input.record.recommended_requirement_bundle_ids, "Requirement bundle id"),
    selectedAt: timestamp(input.selectedAt, "Request family selection time"),
  });
}

export function createRfxDraft(input: Readonly<{
  id: string;
  issuerOrganizationId: OrganizationId;
  requestFamily: RequestFamilySnapshot;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxAggregate {
  const now = timestamp(input.now, "RFx creation time");
  return Object.freeze({
    id: rfxId(input.id),
    schemaVersion: RFX_AGGREGATE_SCHEMA_VERSION,
    issuerOrganizationId: input.issuerOrganizationId,
    lifecycleState: "draft",
    version: 1,
    requestFamily: input.requestFamily,
    creationSource: Object.freeze({ kind: "blank", schemaVersion: RFX_CREATION_SOURCE_SCHEMA_VERSION }),
    createdByUserId: input.actorUserId,
    createdByMembershipId: input.actorMembershipId,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    createdAt: now,
    updatedAt: now,
  });
}

export function changeRfxRequestFamily(input: Readonly<{
  aggregate: RfxAggregate;
  expectedVersion: number;
  requestFamily: RequestFamilySnapshot;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxAggregate {
  if (input.aggregate.lifecycleState !== "draft") throw new Error("Only a draft RFx can change request type.");
  if (!Number.isInteger(input.expectedVersion) || input.expectedVersion !== input.aggregate.version) {
    throw new Error(`RFx changed; current version is ${input.aggregate.version}.`);
  }
  if (input.requestFamily.requestFamilyId === input.aggregate.requestFamily.requestFamilyId) {
    throw new Error("Choose a different request type.");
  }
  return Object.freeze({
    ...input.aggregate,
    version: input.aggregate.version + 1,
    requestFamily: input.requestFamily,
    updatedByUserId: input.actorUserId,
    updatedByMembershipId: input.actorMembershipId,
    updatedAt: timestamp(input.now, "RFx update time"),
  });
}
