import { createHash } from "node:crypto";

import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";
import type { RfxResponse } from "./cycle.ts";
import type { TeamParticipation } from "./teaming.ts";

export const RFX_RESPONSE_COLLABORATION_SCHEMA_VERSION = 1 as const;

export interface RfxResponseSectionAssignment {
  readonly schemaVersion: typeof RFX_RESPONSE_COLLABORATION_SCHEMA_VERSION;
  readonly id: string;
  readonly responseId: string;
  readonly opportunityReference: string;
  readonly leadOrganizationId: OrganizationId;
  readonly participantOrganizationId: OrganizationId;
  readonly teamParticipationId: string;
  readonly sectionId: string;
  readonly sectionTitleSnapshot: string;
  readonly proposedCapacitySnapshot: TeamParticipation["proposedCapacity"];
  readonly responsibilitySummary: string;
  readonly status: "active" | "revoked";
  readonly version: number;
  readonly assignedByUserId: UserId;
  readonly assignedByMembershipId: OrganizationMembershipId;
  readonly assignedAt: string;
  readonly updatedAt: string;
  readonly revokedAt: string | null;
}

export class RfxResponseCollaborationError extends Error {
  readonly code: "invalid" | "forbidden" | "not-found" | "conflict" | "dependency-unavailable";

  constructor(code: RfxResponseCollaborationError["code"], message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RfxResponseCollaborationError";
    this.code = code;
  }
}

function timestamp(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new RfxResponseCollaborationError("invalid", "Timestamp is invalid.");
  return new Date(parsed).toISOString();
}

function stable(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new RfxResponseCollaborationError("invalid", `${label} is invalid.`);
  }
  return normalized;
}

function boundedText(value: string, label: string, maximum: number): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maximum) {
    throw new RfxResponseCollaborationError("invalid", `${label} is required and cannot exceed ${maximum} characters.`);
  }
  return normalized;
}

export function rfxResponseSectionAssignmentId(input: Readonly<{
  responseId: string;
  sectionId: string;
  participantOrganizationId: string;
}>): string {
  return `rfxassign_${createHash("sha256").update([
    stable(input.responseId, "Response identity"),
    stable(input.sectionId, "Response section identity"),
    stable(input.participantOrganizationId, "Participant organization identity"),
  ].join(":"), "utf8").digest("hex").slice(0, 40)}`;
}

export function createRfxResponseSectionAssignment(input: Readonly<{
  response: RfxResponse;
  participation: TeamParticipation;
  sectionId: string;
  responsibilitySummary: string;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxResponseSectionAssignment {
  if (input.response.status !== "draft") {
    throw new RfxResponseCollaborationError("conflict", "Submitted responses cannot receive new collaboration assignments.");
  }
  if (
    input.participation.leadOrganizationId !== input.response.responderOrganizationId ||
    input.participation.opportunityReference !== input.response.opportunityReference
  ) {
    throw new RfxResponseCollaborationError("forbidden", "Team participation does not belong to this response.");
  }
  const sectionId = stable(input.sectionId, "Response section identity");
  const section = input.response.items.find((item) => item.sectionId === sectionId);
  if (!section) throw new RfxResponseCollaborationError("not-found", "Response section was not found.");
  const now = timestamp(input.now);
  return Object.freeze({
    schemaVersion: RFX_RESPONSE_COLLABORATION_SCHEMA_VERSION,
    id: rfxResponseSectionAssignmentId({
      responseId: input.response.id,
      sectionId,
      participantOrganizationId: String(input.participation.participantOrganizationId),
    }),
    responseId: input.response.id,
    opportunityReference: input.response.opportunityReference,
    leadOrganizationId: input.response.responderOrganizationId,
    participantOrganizationId: input.participation.participantOrganizationId,
    teamParticipationId: input.participation.id,
    sectionId,
    sectionTitleSnapshot: section.titleSnapshot,
    proposedCapacitySnapshot: input.participation.proposedCapacity,
    responsibilitySummary: boundedText(input.responsibilitySummary, "Collaboration responsibility", 600),
    status: "active" as const,
    version: 1,
    assignedByUserId: input.actorUserId,
    assignedByMembershipId: input.actorMembershipId,
    assignedAt: now,
    updatedAt: now,
    revokedAt: null,
  });
}

export function reviseRfxResponseSectionAssignment(input: Readonly<{
  current: RfxResponseSectionAssignment;
  expectedVersion: number;
  responsibilitySummary: string;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxResponseSectionAssignment {
  if (input.current.version !== input.expectedVersion || input.current.status !== "active") {
    throw new RfxResponseCollaborationError("conflict", "Collaboration assignment changed before it was updated.");
  }
  return Object.freeze({
    ...input.current,
    responsibilitySummary: boundedText(input.responsibilitySummary, "Collaboration responsibility", 600),
    version: input.current.version + 1,
    assignedByUserId: input.actorUserId,
    assignedByMembershipId: input.actorMembershipId,
    updatedAt: timestamp(input.now),
  });
}

export function revokeRfxResponseSectionAssignment(input: Readonly<{
  current: RfxResponseSectionAssignment;
  expectedVersion: number;
  actorUserId: UserId;
  actorMembershipId: OrganizationMembershipId;
  now: string;
}>): RfxResponseSectionAssignment {
  if (input.current.version !== input.expectedVersion || input.current.status !== "active") {
    throw new RfxResponseCollaborationError("conflict", "Collaboration assignment changed before it was revoked.");
  }
  const now = timestamp(input.now);
  return Object.freeze({
    ...input.current,
    status: "revoked" as const,
    version: input.current.version + 1,
    assignedByUserId: input.actorUserId,
    assignedByMembershipId: input.actorMembershipId,
    updatedAt: now,
    revokedAt: now,
  });
}
