import { createHash } from "node:crypto";

import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { TransactionalEmailRequest } from "../communications/transactional-email.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { UserId, OrganizationMembershipId } from "../users/model.ts";
import type { ResponderOpportunityProjection } from "./publication.ts";

export const OPPORTUNITY_DISCOVERY_SCHEMA_VERSION = 1 as const;
export const OPPORTUNITY_DISCOVERY_PAGE_SIZE = 24;
export const OPPORTUNITY_DISCOVERY_MAX_CANDIDATES = 250;

export type OpportunityDeadlineWindow = "all-open" | "next-7-days" | "next-30-days";
export type SavedOpportunityAlertPolicy = "off" | "immediate" | "daily-digest";

export interface OpportunityDiscoveryQuery {
  readonly text: string;
  readonly requestFamilyKeys: readonly string[];
  readonly capabilityIds: readonly string[];
  readonly localityIds: readonly string[];
  readonly deadlineWindow: OpportunityDeadlineWindow;
  readonly watched: boolean | null;
  readonly cursor: string | null;
  readonly limit: number;
}

export interface OpportunityWatch {
  readonly schemaVersion: typeof OPPORTUNITY_DISCOVERY_SCHEMA_VERSION;
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
  readonly opportunityReference: string;
  readonly status: "watching" | "removed";
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SavedOpportunitySearch {
  readonly schemaVersion: typeof OPPORTUNITY_DISCOVERY_SCHEMA_VERSION;
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
  readonly label: string;
  readonly query: Omit<OpportunityDiscoveryQuery, "cursor">;
  readonly alertPolicy: SavedOpportunityAlertPolicy;
  readonly status: "active" | "paused" | "deleted";
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OpportunitySavedSearchMatchEvent {
  readonly schemaVersion: typeof OPPORTUNITY_DISCOVERY_SCHEMA_VERSION;
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
  readonly savedSearchId: string;
  readonly savedSearchVersion: number;
  readonly opportunityReference: string;
  readonly projectionVersion: number;
  readonly projectionDigest: string;
  readonly evaluationPolicyVersion: 1;
  readonly matchedAt: string;
}

export interface OpportunityAlertIntent {
  readonly schemaVersion: typeof OPPORTUNITY_DISCOVERY_SCHEMA_VERSION;
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
  readonly matchEventIds: readonly string[];
  readonly opportunityReferences: readonly string[];
  readonly savedSearchIds: readonly string[];
  readonly deliveryMode: Exclude<SavedOpportunityAlertPolicy, "off">;
  readonly windowKey: string;
  readonly request: TransactionalEmailRequest;
  readonly status: "queued";
  readonly attemptCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OpportunityAlertRecipient {
  readonly userId: UserId;
  readonly displayName: string;
  readonly primaryEmail: string;
}

export interface OpportunityRelationCommandReceipt {
  readonly schemaVersion: typeof OPPORTUNITY_DISCOVERY_SCHEMA_VERSION;
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
  readonly action: "saved-search.create" | "saved-search.update" | "watch.set";
  readonly requestFingerprint: string;
  readonly resultingRecordId: string;
  readonly resultingVersion: number;
  readonly recordedAt: string;
}

export interface OpportunityRelationEvent {
  readonly schemaVersion: typeof OPPORTUNITY_DISCOVERY_SCHEMA_VERSION;
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
  readonly kind: "saved-search-created" | "saved-search-updated" | "opportunity-watched" | "opportunity-unwatched";
  readonly recordId: string;
  readonly recordVersion: number;
  readonly commandId: string;
  readonly occurredAt: string;
}

export interface OpportunityRelationBundle<T extends SavedOpportunitySearch | OpportunityWatch> {
  readonly record: T;
  readonly expectedVersion: number | null;
  readonly command: OpportunityRelationCommandReceipt;
  readonly event: OpportunityRelationEvent;
  readonly audit: OrganizationActionAuditEvent;
}

export interface OpportunityMatchBundle {
  readonly match: OpportunitySavedSearchMatchEvent;
  readonly alert: OpportunityAlertIntent | null;
}

export interface OpportunityDiscoveryRepository {
  listProjections(limit: number): Promise<readonly ResponderOpportunityProjection[]>;
  getProjection(reference: string): Promise<ResponderOpportunityProjection | null>;
  listSavedSearches(organizationId: OrganizationId, userId: UserId): Promise<readonly SavedOpportunitySearch[]>;
  getSavedSearch(id: string): Promise<SavedOpportunitySearch | null>;
  saveSavedSearch(bundle: OpportunityRelationBundle<SavedOpportunitySearch>): Promise<"created" | "replayed">;
  listWatches(organizationId: OrganizationId, userId: UserId): Promise<readonly OpportunityWatch[]>;
  getWatch(id: string): Promise<OpportunityWatch | null>;
  saveWatch(bundle: OpportunityRelationBundle<OpportunityWatch>): Promise<"created" | "replayed">;
  getCommand(id: string): Promise<OpportunityRelationCommandReceipt | null>;
  getAlertRecipient(search: SavedOpportunitySearch): Promise<OpportunityAlertRecipient | null>;
  listActiveSavedSearches(): Promise<readonly SavedOpportunitySearch[]>;
  saveMatch(bundle: OpportunityMatchBundle): Promise<"created" | "replayed">;
}

function normalizedStrings(values: readonly string[] | null | undefined, maximum = 24): readonly string[] {
  const normalized = (values ?? []).map((value) => value.trim().toLocaleLowerCase("en-US"));
  if (normalized.length > maximum || normalized.some((value) => !/^[a-z0-9][a-z0-9._:-]{0,190}$/.test(value))) {
    throw new Error("Opportunity query contains an unsupported structured filter.");
  }
  return Object.freeze([...new Set(normalized)].sort());
}

export function createOpportunityDiscoveryQuery(input: Readonly<{
  text?: string | null;
  requestFamilyKeys?: readonly string[] | null;
  capabilityIds?: readonly string[] | null;
  localityIds?: readonly string[] | null;
  deadlineWindow?: string | null;
  watched?: boolean | null;
  cursor?: string | null;
  limit?: number | null;
}>): OpportunityDiscoveryQuery {
  if (input.deadlineWindow && !["all-open", "next-7-days", "next-30-days"].includes(input.deadlineWindow)) {
    throw new Error("Opportunity query deadline window is unsupported.");
  }
  const deadlineWindow: OpportunityDeadlineWindow = input.deadlineWindow === "next-7-days" || input.deadlineWindow === "next-30-days"
    ? input.deadlineWindow
    : "all-open";
  const suppliedCursor = input.cursor?.trim() ?? "";
  if (suppliedCursor && !/^[A-Za-z0-9_-]{8,180}$/.test(suppliedCursor)) {
    throw new Error("Opportunity query cursor is malformed.");
  }
  const cursor = suppliedCursor || null;
  return Object.freeze({
    text: (input.text ?? "").trim().replace(/\s+/g, " ").slice(0, 120),
    requestFamilyKeys: normalizedStrings(input.requestFamilyKeys),
    capabilityIds: normalizedStrings(input.capabilityIds),
    localityIds: normalizedStrings(input.localityIds),
    deadlineWindow,
    watched: input.watched === true ? true : input.watched === false ? false : null,
    cursor,
    limit: Math.max(1, Math.min(48, Number.isInteger(input.limit) ? Number(input.limit) : OPPORTUNITY_DISCOVERY_PAGE_SIZE)),
  });
}

export function opportunityQueryFingerprint(query: Omit<OpportunityDiscoveryQuery, "cursor">): string {
  return createHash("sha256").update(JSON.stringify(query)).digest("hex");
}

export function opportunityWatchId(organizationId: string, userId: string, reference: string): string {
  return `oppwatch_${createHash("sha256").update(`${organizationId}:${userId}:${reference}`).digest("hex").slice(0, 40)}`;
}

export function opportunityDeadline(projection: ResponderOpportunityProjection): string {
  return projection.payload.timing.responseDeadline ?? "";
}

// Pinned AMACS 0.5.0 request-family compatibility for projections created before
// requestFamilyIndexKey was persisted. This map mirrors the immutable 0.5.0 request-family
// registry so old label-only projections compare against the same canonical IDs as new records.
const LEGACY_REQUEST_FAMILY_LABEL_TO_CANONICAL_KEY = Object.freeze({
  "request for information": "amacs-req-000001",
  "sources sought or capability request": "amacs-req-000002",
  "request for quotation": "amacs-req-000003",
  "request for proposals": "amacs-req-000004",
  "invitation for bids or tenders": "amacs-req-000005",
  "request for qualifications or statement of qualifications": "amacs-req-000006",
  "supplier or subcontractor request": "amacs-req-000007",
  "teaming or partner request": "amacs-req-000008",
  "product or service request": "amacs-req-000009",
  "site selection or location project rfi": "amacs-req-000010",
} as const);

export function requestFamilyIndexKeyForProjection(projection: ResponderOpportunityProjection): string {
  const indexed = typeof projection.requestFamilyIndexKey === "string"
    ? projection.requestFamilyIndexKey.trim()
    : "";
  if (indexed) return indexed.toLocaleLowerCase("en-US");
  const legacyLabel = (projection.payload.requestFamilyLabel || "")
    .trim()
    .toLocaleLowerCase("en-US");
  return LEGACY_REQUEST_FAMILY_LABEL_TO_CANONICAL_KEY[
    legacyLabel as keyof typeof LEGACY_REQUEST_FAMILY_LABEL_TO_CANONICAL_KEY
  ] ?? legacyLabel;
}

function terms(value: string): readonly string[] {
  return Object.freeze(value.toLocaleLowerCase("en-US").split(/[^\p{L}\p{N}]+/u).filter((item) => item.length >= 2));
}

export function opportunityMatchesQuery(input: Readonly<{
  projection: ResponderOpportunityProjection;
  query: Omit<OpportunityDiscoveryQuery, "cursor">;
  watched: boolean;
  now: string;
}>): boolean {
  const deadline = Date.parse(`${opportunityDeadline(input.projection)}T23:59:59.999Z`);
  const now = Date.parse(input.now);
  if (!Number.isFinite(deadline) || deadline <= now) return false;
  const days = (deadline - now) / 86_400_000;
  if (input.query.deadlineWindow === "next-7-days" && days > 7) return false;
  if (input.query.deadlineWindow === "next-30-days" && days > 30) return false;
  if (input.query.watched !== null && input.query.watched !== input.watched) return false;
  if (input.query.localityIds.length && !input.query.localityIds.some((id) => input.projection.payload.localities.some((item) => item.id.toLocaleLowerCase("en-US") === id))) return false;
  if (input.query.capabilityIds.length && !input.query.capabilityIds.some((id) => input.projection.capabilityIndexKeys.some((key) => key.toLocaleLowerCase("en-US") === id))) return false;
  if (input.query.requestFamilyKeys.length && !input.query.requestFamilyKeys.includes(requestFamilyIndexKeyForProjection(input.projection))) return false;
  const searchTerms = terms(input.query.text);
  if (!searchTerms.length) return true;
  const corpus = [
    input.projection.payload.title,
    input.projection.payload.summary,
    input.projection.payload.issuerDisplayName,
    input.projection.payload.requestFamilyLabel,
    ...input.projection.payload.localities.map((item) => item.label),
    ...input.projection.payload.requirements.flatMap((item) => [item.title, item.description, item.capabilityLabel ?? "", item.capabilityDefinition ?? ""]),
  ].join(" ").toLocaleLowerCase("en-US");
  return searchTerms.every((term) => corpus.includes(term));
}

export function opportunityDeadlineState(projection: ResponderOpportunityProjection, now: string): "open" | "due-soon" | "passed" {
  const remaining = Date.parse(`${opportunityDeadline(projection)}T23:59:59.999Z`) - Date.parse(now);
  if (!Number.isFinite(remaining) || remaining <= 0) return "passed";
  return remaining <= 7 * 86_400_000 ? "due-soon" : "open";
}
