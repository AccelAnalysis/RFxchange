import type { OrganizationActionAuditEvent } from "../audit/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { OrganizationMembershipId, UserId } from "../users/model.ts";
import type {
  OrganizationIntroductionMedia,
  PublicMediaProjection,
  RfxAttachmentReference,
} from "./model.ts";

export const GOVERNED_MEDIA_MUTATION_ACTIONS = [
  "create-public-media-draft",
  "publish-public-media",
  "create-introduction-media",
  "publish-introduction-media",
  "attach-rfx-document",
  "remove-rfx-attachment",
] as const;

export type GovernedMediaMutationAction =
  (typeof GOVERNED_MEDIA_MUTATION_ACTIONS)[number];

export interface GovernedMediaMutationCommand {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly action: GovernedMediaMutationAction;
  readonly targetId: string;
  readonly requestFingerprint: string;
  readonly actorUserId: UserId;
  readonly actorMembershipId: OrganizationMembershipId;
  readonly recordedAt: string;
}

export interface GovernedMediaMutationEvent {
  readonly id: string;
  readonly organizationId: OrganizationId;
  readonly action: GovernedMediaMutationAction;
  readonly targetId: string;
  readonly commandId: string;
  readonly actorUserId: UserId;
  readonly actorMembershipId: OrganizationMembershipId;
  readonly occurredAt: string;
}

export type GovernedMediaMutationRecord =
  | Readonly<{
      readonly kind: "public-media";
      readonly mode: "create" | "save";
      readonly value: PublicMediaProjection;
    }>
  | Readonly<{
      readonly kind: "introduction";
      readonly mode: "create" | "save";
      readonly value: OrganizationIntroductionMedia;
    }>
  | Readonly<{
      readonly kind: "rfx-attachment";
      readonly mode: "create" | "save";
      readonly value: RfxAttachmentReference;
    }>;

export interface GovernedMediaMutationBundle {
  readonly record: GovernedMediaMutationRecord;
  readonly command: GovernedMediaMutationCommand;
  readonly event: GovernedMediaMutationEvent;
  readonly audit: OrganizationActionAuditEvent;
}

export function governedMediaCommandId(
  action: GovernedMediaMutationAction,
  targetId: string,
): string {
  return `media:${action}:${targetId}`;
}

export function governedMediaEventId(commandId: string): string {
  return `${commandId}:event`;
}

export function governedMediaAuditId(commandId: string): string {
  return `${commandId}:audit`;
}
