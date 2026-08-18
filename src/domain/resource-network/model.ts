import type { TransactionalEmailRequest } from "../communications/transactional-email.ts";
import type { GeographyReleaseState } from "../geography/model.ts";
import type { ProviderAvailability, ProviderCategory, ProviderModality } from "../resource-providers/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";

export type ProviderPublicationStatus = "draft" | "published" | "withdrawn";

export interface ProviderDiscoveryPublication {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly version: number;
  readonly status: ProviderPublicationStatus;
  readonly sourceProfileVersion: number;
  readonly visibleServiceIds: readonly string[];
  readonly publishedAt: string | null;
  readonly withdrawnAt: string | null;
  readonly updatedByUserId: UserId;
  readonly updatedByMembershipId: OrganizationMembershipId;
  readonly updatedAt: string;
}

export type ProviderResourceKind = "service" | "program" | "workshop" | "funding-program" | "resource" | "announcement";
export type ProviderResourceStatus = "draft" | "published" | "withdrawn" | "expired";
export type ProviderResourceVisibility = "network" | "public";

export interface ProviderResource {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly version: number;
  readonly kind: ProviderResourceKind;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly serviceIds: readonly string[];
  readonly geographyIds: readonly string[];
  readonly modalities: readonly ProviderModality[];
  readonly eligibility: string;
  readonly intakeUrl: string | null;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly visibility: ProviderResourceVisibility;
  readonly status: ProviderResourceStatus;
  readonly moderation: Readonly<{ status: "clear" | "suppressed"; reason: string | null }>;
  readonly createdByUserId: UserId;
  readonly updatedByUserId: UserId;
  readonly publishedAt: string | null;
  readonly withdrawnAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProviderRequestMessage {
  readonly id: string;
  readonly referralId: string;
  readonly requesterOrganizationId: OrganizationId;
  readonly providerOrganizationId: OrganizationId;
  readonly authorOrganizationId: OrganizationId;
  readonly authorUserId: UserId;
  readonly body: string;
  readonly createdAt: string;
}

export type ProviderRequestMessageProjection = Readonly<Omit<ProviderRequestMessage, "authorUserId">>;

export interface ProviderAcquisitionInvitation {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly recipientLabel: string;
  readonly recipientEmail: string;
  readonly subjectKind: "profile-completion" | "public-opportunity";
  readonly subjectReference: string;
  readonly acquisitionContextId: string;
  readonly communication: TransactionalEmailRequest;
  readonly deliveryStatus: "queued" | "accepted" | "retryable-failure" | "terminal-failure";
  readonly attemptCount: number;
  readonly lastErrorCode: string | null;
  readonly createdByUserId: UserId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ProviderNetworkEventKind =
  | "publication-saved" | "publication-published" | "publication-withdrawn"
  | "resource-saved" | "resource-published" | "resource-withdrawn" | "resource-expired"
  | "request-message-added" | "provider-invitation-issued";

export interface ProviderNetworkEvent {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly objectType: "provider-publication" | "provider-resource" | "provider-request" | "provider-invitation";
  readonly objectId: string;
  readonly kind: ProviderNetworkEventKind;
  readonly aggregateVersion: number;
  readonly actorUserId: UserId;
  readonly actorMembershipId: OrganizationMembershipId;
  readonly commandId: string;
  readonly occurredAt: string;
}

export interface ProviderNetworkCommandReceipt {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly objectId: string;
  readonly action: ProviderNetworkEventKind;
  readonly requestFingerprint: string;
  readonly resultingVersion: number;
  readonly recordedAt: string;
}

export interface ProviderServiceTerritoryProjection {
  readonly geographyId: string;
  readonly name: string;
  readonly releaseState: GeographyReleaseState;
  readonly geometry: Readonly<{ type: "Polygon" | "MultiPolygon"; coordinates: unknown }>;
}

export interface ProviderDiscoveryServiceProjection {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly availability: ProviderAvailability;
}

export interface ProviderDiscoveryProjection {
  readonly organizationId: OrganizationId;
  readonly displayName: string;
  readonly publicationVersion: number;
  readonly sourceProfileVersion: number;
  readonly categories: readonly ProviderCategory[];
  readonly services: readonly ProviderDiscoveryServiceProjection[];
  readonly populationsServed: string;
  readonly eligibility: string;
  readonly intakeMethod: string;
  readonly modalities: readonly ProviderModality[];
  readonly languages: readonly string[];
  readonly availability: ProviderAvailability;
  readonly territory: ProviderServiceTerritoryProjection;
  readonly marker: Readonly<{
    id: string;
    coordinate: readonly [number, number];
    accessibleLocationLabel: string;
    privacyTreatment: "exact" | "approximate";
  }> | null;
  readonly match: Readonly<{ score: number; reasons: readonly string[] }>;
  readonly publishedAt: string;
  readonly updatedAt: string;
}

export interface ProviderResourceProjection extends Omit<ProviderResource, "moderation" | "createdByUserId" | "updatedByUserId"> {
  readonly providerDisplayName: string;
}

function stable(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) throw new Error(`${label} is malformed.`);
  return normalized;
}

function required(value: string, label: string, maximum: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} cannot exceed ${maximum} characters.`);
  return normalized;
}

function optionalTimestamp(value: string | null | undefined, label: string): string | null {
  if (!value?.trim()) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp.`);
  return new Date(parsed).toISOString();
}

function timestamp(value: string, label: string): string {
  const normalized = optionalTimestamp(value, label);
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function safeUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const url = new URL(value.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error("Resource intake URL must be a safe HTTP(S) URL.");
  return url.toString();
}

export function createProviderPublication(input: Readonly<{
  organizationId: OrganizationId; sourceProfileVersion: number; visibleServiceIds: readonly string[];
  actorUserId: UserId; actorMembershipId: OrganizationMembershipId; now: string;
}>): ProviderDiscoveryPublication {
  const visibleServiceIds = Object.freeze([...new Set(input.visibleServiceIds.map((value) => stable(value, "Visible service id")))]);
  if (!visibleServiceIds.length) throw new Error("At least one provider service must be selected for discovery.");
  return Object.freeze({ id: String(input.organizationId), organizationId: input.organizationId, version: 1, status: "draft", sourceProfileVersion: input.sourceProfileVersion, visibleServiceIds, publishedAt: null, withdrawnAt: null, updatedByUserId: input.actorUserId, updatedByMembershipId: input.actorMembershipId, updatedAt: timestamp(input.now, "Publication time") });
}

export function updateProviderPublication(input: Readonly<{
  current: ProviderDiscoveryPublication; expectedVersion: number; sourceProfileVersion: number;
  visibleServiceIds: readonly string[]; action: "save" | "publish" | "withdraw";
  actorUserId: UserId; actorMembershipId: OrganizationMembershipId; now: string;
}>): ProviderDiscoveryPublication {
  if (input.current.version !== input.expectedVersion) throw new Error(`Provider publication changed; current version is ${input.current.version}.`);
  const now = timestamp(input.now, "Publication update time");
  const visibleServiceIds = Object.freeze([...new Set(input.visibleServiceIds.map((value) => stable(value, "Visible service id")))]);
  if (!visibleServiceIds.length) throw new Error("At least one provider service must remain selected.");
  if (input.action === "save" && input.current.status === "published") throw new Error("Published provider discovery must be withdrawn before changing its service selection.");
  if (input.action === "publish" && !["draft", "withdrawn"].includes(input.current.status)) throw new Error("Provider discovery is already published.");
  if (input.action === "withdraw" && input.current.status !== "published") throw new Error("Only published provider discovery can be withdrawn.");
  return Object.freeze({ ...input.current, version: input.current.version + 1, sourceProfileVersion: input.sourceProfileVersion, visibleServiceIds, status: input.action === "publish" ? "published" : input.action === "withdraw" ? "withdrawn" : "draft", publishedAt: input.action === "publish" ? now : input.current.publishedAt, withdrawnAt: input.action === "withdraw" ? now : null, updatedByUserId: input.actorUserId, updatedByMembershipId: input.actorMembershipId, updatedAt: now });
}

export function createProviderResource(input: Readonly<{
  id: string; organizationId: OrganizationId; kind: ProviderResourceKind; title: string; summary: string; description: string;
  serviceIds: readonly string[]; geographyIds: readonly string[]; modalities: readonly ProviderModality[]; eligibility: string;
  intakeUrl?: string | null; startsAt?: string | null; endsAt?: string | null; visibility: ProviderResourceVisibility;
  actorUserId: UserId; now: string;
}>): ProviderResource {
  const now = timestamp(input.now, "Resource creation time");
  const startsAt = optionalTimestamp(input.startsAt, "Resource start time");
  const endsAt = optionalTimestamp(input.endsAt, "Resource end time");
  if (startsAt && endsAt && endsAt <= startsAt) throw new Error("Resource end time must follow its start time.");
  return Object.freeze({ id: stable(input.id, "Resource id"), organizationId: input.organizationId, version: 1, kind: input.kind, title: required(input.title, "Resource title", 180), summary: required(input.summary, "Resource summary", 600), description: required(input.description, "Resource description", 4000), serviceIds: Object.freeze([...new Set(input.serviceIds.map((value) => stable(value, "Resource service id")))]), geographyIds: Object.freeze([...new Set(input.geographyIds.map((value) => stable(value, "Resource geography id")))]), modalities: Object.freeze([...new Set(input.modalities)]), eligibility: required(input.eligibility, "Resource eligibility", 1200), intakeUrl: safeUrl(input.intakeUrl), startsAt, endsAt, visibility: input.visibility, status: "draft", moderation: Object.freeze({ status: "clear", reason: null }), createdByUserId: input.actorUserId, updatedByUserId: input.actorUserId, publishedAt: null, withdrawnAt: null, createdAt: now, updatedAt: now });
}

export function updateProviderResource(input: Readonly<{
  current: ProviderResource; expectedVersion: number; action: "publish" | "withdraw" | "expire"; actorUserId: UserId; now: string;
}>): ProviderResource {
  if (input.current.version !== input.expectedVersion) throw new Error(`Provider resource changed; current version is ${input.current.version}.`);
  const now = timestamp(input.now, "Resource update time");
  if (input.action === "publish" && !["draft", "withdrawn"].includes(input.current.status)) throw new Error("Only a draft or withdrawn resource can be published.");
  if (input.action === "withdraw" && input.current.status !== "published") throw new Error("Only a published resource can be withdrawn.");
  if (input.action === "expire" && input.current.status !== "published") throw new Error("Only a published resource can expire.");
  return Object.freeze({ ...input.current, version: input.current.version + 1, status: input.action === "publish" ? "published" : input.action === "withdraw" ? "withdrawn" : "expired", publishedAt: input.action === "publish" ? now : input.current.publishedAt, withdrawnAt: input.action === "withdraw" ? now : input.current.withdrawnAt, updatedByUserId: input.actorUserId, updatedAt: now });
}

export function createProviderRequestMessage(input: Readonly<{
  id: string; referralId: string; requesterOrganizationId: OrganizationId; providerOrganizationId: OrganizationId;
  authorOrganizationId: OrganizationId; authorUserId: UserId; body: string; now: string;
}>): ProviderRequestMessage {
  if (![input.requesterOrganizationId, input.providerOrganizationId].includes(input.authorOrganizationId)) throw new Error("Message author is outside this provider request.");
  return Object.freeze({ id: stable(input.id, "Provider request message id"), referralId: stable(input.referralId, "Provider request id"), requesterOrganizationId: input.requesterOrganizationId, providerOrganizationId: input.providerOrganizationId, authorOrganizationId: input.authorOrganizationId, authorUserId: input.authorUserId, body: required(input.body, "Provider request message", 2000), createdAt: timestamp(input.now, "Message creation time") });
}

export function projectProviderRequestMessage(message: ProviderRequestMessage): ProviderRequestMessageProjection {
  const { authorUserId, ...projection } = message;
  void authorUserId;
  return Object.freeze(projection);
}

export function publicProviderResource(resource: ProviderResource, providerDisplayName: string, now: string): ProviderResourceProjection | null {
  const effectiveStatus = resource.status === "published" && resource.endsAt && resource.endsAt <= timestamp(now, "Projection time") ? "expired" : resource.status;
  if (effectiveStatus !== "published" || resource.moderation.status !== "clear") return null;
  const { moderation, createdByUserId, updatedByUserId, ...projection } = resource;
  void moderation;
  void createdByUserId;
  void updatedByUserId;
  return Object.freeze({ ...projection, providerDisplayName: required(providerDisplayName, "Provider display name", 160) });
}
