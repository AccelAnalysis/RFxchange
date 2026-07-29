import type { OrganizationAccount, OrganizationId } from "../organizations/model";
import type {
  OrganizationMembership,
  OrganizationMembershipId,
  UserId,
  UserIdentity,
} from "../users/model";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type LegalDocumentVersionId = Brand<string, "LegalDocumentVersionId">;
export type LegalAcknowledgementId = Brand<string, "LegalAcknowledgementId">;
export type LegalTimestamp = Brand<string, "LegalTimestamp">;
export type LegalVersion = Brand<string, "LegalVersion">;

export const REQUIRED_LEGAL_DOCUMENT_KINDS = [
  "terms-of-service",
  "platform-rules",
  "privacy-policy",
] as const;

export type LegalDocumentKind = (typeof REQUIRED_LEGAL_DOCUMENT_KINDS)[number];
export type LegalAcknowledgementStatus = "accepted" | "acknowledged";

export const REQUIRED_ACKNOWLEDGEMENT_STATUS: Readonly<
  Record<LegalDocumentKind, LegalAcknowledgementStatus>
> = Object.freeze({
  "terms-of-service": "accepted",
  "platform-rules": "accepted",
  "privacy-policy": "acknowledged",
});

export interface LegalDocumentVersion {
  readonly id: LegalDocumentVersionId;
  readonly kind: LegalDocumentKind;
  readonly version: LegalVersion;
  readonly effectiveAt: LegalTimestamp;
  readonly createdAt: LegalTimestamp;
}

export interface LegalAcknowledgementEvidence {
  readonly source: "explicit-user-action";
  readonly capturedAt: LegalTimestamp;
}

export interface LegalAcknowledgement {
  readonly id: LegalAcknowledgementId;
  readonly userId: UserId;
  readonly membershipId: OrganizationMembershipId;
  readonly organizationId: OrganizationId;
  readonly documentVersionId: LegalDocumentVersionId;
  readonly documentKind: LegalDocumentKind;
  readonly documentVersion: LegalVersion;
  readonly status: LegalAcknowledgementStatus;
  readonly recordedAt: LegalTimestamp;
  readonly evidence: LegalAcknowledgementEvidence;
}

export interface CreateLegalDocumentVersionInput {
  readonly id: string;
  readonly kind: LegalDocumentKind;
  readonly version: string;
  readonly effectiveAt: string;
  readonly now: string;
}

export interface CreateLegalAcknowledgementInput {
  readonly id: string;
  readonly status: LegalAcknowledgementStatus;
  readonly now: string;
}

export type LegalAcknowledgementGateResolution =
  | {
      readonly kind: "complete";
      readonly userId: UserId;
      readonly membershipId: OrganizationMembershipId;
      readonly organizationId: OrganizationId;
      readonly satisfied: readonly LegalDocumentKind[];
    }
  | {
      readonly kind: "pending";
      readonly userId: UserId;
      readonly membershipId: OrganizationMembershipId;
      readonly organizationId: OrganizationId;
      readonly pending: readonly {
        readonly documentKind: LegalDocumentKind;
        readonly documentVersionId: LegalDocumentVersionId;
        readonly documentVersion: LegalVersion;
        readonly requiredStatus: LegalAcknowledgementStatus;
      }[];
    };

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} is required.`);
  }

  return normalized;
}

function legalTimestamp(value: string): LegalTimestamp {
  const normalized = requiredValue(value, "Legal timestamp");
  const parsed = Date.parse(normalized);

  if (Number.isNaN(parsed)) {
    throw new Error("Legal timestamp must be a valid ISO-compatible date-time value.");
  }

  return new Date(parsed).toISOString() as LegalTimestamp;
}

export function legalDocumentVersionId(value: string): LegalDocumentVersionId {
  return requiredValue(value, "Legal document version id") as LegalDocumentVersionId;
}

export function legalAcknowledgementId(value: string): LegalAcknowledgementId {
  return requiredValue(value, "Legal acknowledgement id") as LegalAcknowledgementId;
}

export function legalVersion(value: string): LegalVersion {
  const normalized = requiredValue(value, "Legal document version");

  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(normalized)) {
    throw new Error(
      "Legal document version must be a stable identifier using letters, numbers, dots, underscores or hyphens.",
    );
  }

  return normalized as LegalVersion;
}

export function createLegalDocumentVersion(
  input: CreateLegalDocumentVersionInput,
): LegalDocumentVersion {
  if (!REQUIRED_LEGAL_DOCUMENT_KINDS.includes(input.kind)) {
    throw new Error(`Unsupported legal document kind: ${input.kind}.`);
  }

  return Object.freeze({
    id: legalDocumentVersionId(input.id),
    kind: input.kind,
    version: legalVersion(input.version),
    effectiveAt: legalTimestamp(input.effectiveAt),
    createdAt: legalTimestamp(input.now),
  });
}

function assertActiveMembershipContext(
  user: UserIdentity,
  membership: OrganizationMembership,
  organization: OrganizationAccount,
): void {
  if (membership.status !== "active") {
    throw new Error("Inactive organization membership cannot record legal acknowledgement.");
  }

  if (membership.userId !== user.id) {
    throw new Error("Organization membership belongs to a different user identity.");
  }

  if (membership.organizationId !== organization.id) {
    throw new Error("Organization membership belongs to a different organization tenant.");
  }
}

export function createLegalAcknowledgement(
  user: UserIdentity,
  membership: OrganizationMembership,
  organization: OrganizationAccount,
  documentVersion: LegalDocumentVersion,
  input: CreateLegalAcknowledgementInput,
): LegalAcknowledgement {
  assertActiveMembershipContext(user, membership, organization);

  const requiredStatus = REQUIRED_ACKNOWLEDGEMENT_STATUS[documentVersion.kind];
  if (input.status !== requiredStatus) {
    throw new Error(
      `${documentVersion.kind} requires status ${requiredStatus}; received ${input.status}.`,
    );
  }

  const now = legalTimestamp(input.now);

  return Object.freeze({
    id: legalAcknowledgementId(input.id),
    userId: user.id,
    membershipId: membership.id,
    organizationId: organization.id,
    documentVersionId: documentVersion.id,
    documentKind: documentVersion.kind,
    documentVersion: documentVersion.version,
    status: input.status,
    recordedAt: now,
    evidence: Object.freeze({
      source: "explicit-user-action" as const,
      capturedAt: now,
    }),
  });
}

function requiredVersionsByKind(
  versions: readonly LegalDocumentVersion[],
): Readonly<Record<LegalDocumentKind, LegalDocumentVersion>> {
  if (versions.length !== REQUIRED_LEGAL_DOCUMENT_KINDS.length) {
    throw new Error("Exactly one current version for each required legal document is required.");
  }

  const map = new Map<LegalDocumentKind, LegalDocumentVersion>();
  for (const version of versions) {
    if (map.has(version.kind)) {
      throw new Error(`Duplicate current legal document version for ${version.kind}.`);
    }
    map.set(version.kind, version);
  }

  for (const kind of REQUIRED_LEGAL_DOCUMENT_KINDS) {
    if (!map.has(kind)) {
      throw new Error(`Missing current legal document version for ${kind}.`);
    }
  }

  return Object.freeze({
    "terms-of-service": map.get("terms-of-service")!,
    "platform-rules": map.get("platform-rules")!,
    "privacy-policy": map.get("privacy-policy")!,
  });
}

export function resolveLegalAcknowledgementGate(
  user: UserIdentity,
  membership: OrganizationMembership,
  organization: OrganizationAccount,
  requiredVersions: readonly LegalDocumentVersion[],
  acknowledgements: readonly LegalAcknowledgement[],
): LegalAcknowledgementGateResolution {
  assertActiveMembershipContext(user, membership, organization);
  const current = requiredVersionsByKind(requiredVersions);

  const relevant = acknowledgements.filter(
    (record) =>
      record.userId === user.id &&
      record.membershipId === membership.id &&
      record.organizationId === organization.id,
  );

  const pending = REQUIRED_LEGAL_DOCUMENT_KINDS.flatMap((kind) => {
    const version = current[kind];
    const requiredStatus = REQUIRED_ACKNOWLEDGEMENT_STATUS[kind];
    const satisfied = relevant.some(
      (record) =>
        record.documentVersionId === version.id &&
        record.documentKind === kind &&
        record.documentVersion === version.version &&
        record.status === requiredStatus,
    );

    return satisfied
      ? []
      : [
          Object.freeze({
            documentKind: kind,
            documentVersionId: version.id,
            documentVersion: version.version,
            requiredStatus,
          }),
        ];
  });

  if (pending.length === 0) {
    return Object.freeze({
      kind: "complete" as const,
      userId: user.id,
      membershipId: membership.id,
      organizationId: organization.id,
      satisfied: Object.freeze([...REQUIRED_LEGAL_DOCUMENT_KINDS]),
    });
  }

  return Object.freeze({
    kind: "pending" as const,
    userId: user.id,
    membershipId: membership.id,
    organizationId: organization.id,
    pending: Object.freeze(pending),
  });
}
