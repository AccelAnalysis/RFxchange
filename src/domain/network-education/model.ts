import type { NetworkEducationPathKey, NetworkExplainerKey } from "../../application/network-education/catalog.ts";
import { NETWORK_EDUCATION_CATALOG_VERSION } from "../../application/network-education/catalog.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";

export type NetworkEducationStatus = "active" | "dismissed" | "completed";
export type NetworkEducationAction =
  | "path-selected"
  | "item-completed"
  | "guide-dismissed"
  | "guide-reopened"
  | "guide-completed"
  | "explainer-viewed"
  | "explainer-dismissed"
  | "catalog-synchronized";

export interface NetworkEducationProgress {
  readonly id: string;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly membershipId: OrganizationMembershipId;
  readonly contentVersion: number;
  readonly version: number;
  readonly status: NetworkEducationStatus;
  readonly recommendedPath: NetworkEducationPathKey;
  readonly activePath: NetworkEducationPathKey;
  readonly resumeItemKey: string | null;
  readonly completedItemKeys: readonly string[];
  readonly viewedExplainerKeys: readonly NetworkExplainerKey[];
  readonly dismissedExplainerKeys: readonly NetworkExplainerKey[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly dismissedAt: string | null;
  readonly completedAt: string | null;
}

export interface NetworkEducationEvent {
  readonly id: string;
  readonly progressId: string;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly membershipId: OrganizationMembershipId;
  readonly kind: NetworkEducationAction;
  readonly aggregateVersion: number;
  readonly contentVersion: number;
  readonly pathKey: NetworkEducationPathKey;
  readonly itemKey: string | null;
  readonly explainerKey: NetworkExplainerKey | null;
  readonly commandId: string;
  readonly occurredAt: string;
}

export interface NetworkEducationCommandReceipt {
  readonly id: string;
  readonly progressId: string;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly action: NetworkEducationAction;
  readonly requestFingerprint: string;
  readonly resultingVersion: number;
  readonly recordedAt: string;
}

function timestamp(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("Education timestamp must be valid.");
  return new Date(parsed).toISOString();
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

export function createNetworkEducationProgress(input: Readonly<{
  id: string;
  userId: UserId;
  organizationId: OrganizationId;
  membershipId: OrganizationMembershipId;
  recommendedPath: NetworkEducationPathKey;
  now: string;
}>): NetworkEducationProgress {
  const now = timestamp(input.now);
  return Object.freeze({
    id: input.id,
    userId: input.userId,
    organizationId: input.organizationId,
    membershipId: input.membershipId,
    contentVersion: NETWORK_EDUCATION_CATALOG_VERSION,
    version: 0,
    status: "active",
    recommendedPath: input.recommendedPath,
    activePath: input.recommendedPath,
    resumeItemKey: null,
    completedItemKeys: Object.freeze([]),
    viewedExplainerKeys: Object.freeze([]),
    dismissedExplainerKeys: Object.freeze([]),
    createdAt: now,
    updatedAt: now,
    dismissedAt: null,
    completedAt: null,
  });
}

export function updateNetworkEducationProgress(input: Readonly<{
  current: NetworkEducationProgress;
  expectedVersion: number;
  action: NetworkEducationAction;
  recommendedPath: NetworkEducationPathKey;
  pathKey?: NetworkEducationPathKey | null;
  itemKey?: string | null;
  explainerKey?: NetworkExplainerKey | null;
  now: string;
}>): NetworkEducationProgress {
  if (input.current.version !== input.expectedVersion) {
    throw new Error(`Education progress changed; current version is ${input.current.version}.`);
  }
  const now = timestamp(input.now);
  const pathKey = input.pathKey ?? input.current.activePath;
  const completedItems = input.action === "item-completed" && input.itemKey
    ? unique([...input.current.completedItemKeys, input.itemKey])
    : input.current.completedItemKeys;
  const viewedExplainers = input.action === "explainer-viewed" && input.explainerKey
    ? unique([...input.current.viewedExplainerKeys, input.explainerKey])
    : input.current.viewedExplainerKeys;
  const dismissedExplainers = input.action === "explainer-dismissed" && input.explainerKey
    ? unique([...input.current.dismissedExplainerKeys, input.explainerKey])
    : input.current.dismissedExplainerKeys;
  const status = input.action === "guide-dismissed"
    ? "dismissed"
    : input.action === "guide-completed"
      ? "completed"
      : input.action === "guide-reopened" || input.action === "path-selected" || input.action === "item-completed"
        ? "active"
        : input.current.status;
  return Object.freeze({
    ...input.current,
    contentVersion: NETWORK_EDUCATION_CATALOG_VERSION,
    version: input.current.version + 1,
    status,
    recommendedPath: input.recommendedPath,
    activePath: pathKey,
    resumeItemKey: input.action === "item-completed" ? input.itemKey ?? null : input.current.resumeItemKey,
    completedItemKeys: completedItems,
    viewedExplainerKeys: viewedExplainers,
    dismissedExplainerKeys: dismissedExplainers,
    updatedAt: now,
    dismissedAt: input.action === "guide-dismissed" ? now : input.action === "guide-reopened" ? null : input.current.dismissedAt,
    completedAt: input.action === "guide-completed" ? now : input.action === "guide-reopened" ? null : input.current.completedAt,
  });
}
