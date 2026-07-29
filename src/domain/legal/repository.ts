import type {
  LegalAcknowledgement,
  LegalAcknowledgementId,
  LegalDocumentKind,
  LegalDocumentVersion,
  LegalDocumentVersionId,
  LegalVersion,
} from "./model";
import type { OrganizationId } from "../organizations/model";
import type { OrganizationMembershipId, UserId } from "../users/model";

/**
 * Legal document versions are historical records. Persistence is append/read only here;
 * publication, withdrawal and drafting workflows belong to later governance/admin slices.
 */
export interface LegalDocumentVersionRepository {
  append(version: LegalDocumentVersion): Promise<void>;
  getById(id: LegalDocumentVersionId): Promise<LegalDocumentVersion | null>;
  getByKindAndVersion(
    kind: LegalDocumentKind,
    version: LegalVersion,
  ): Promise<LegalDocumentVersion | null>;
  listByKind(kind: LegalDocumentKind): Promise<readonly LegalDocumentVersion[]>;
}

/**
 * User acknowledgement evidence is append-only. Historic records are never updated to
 * "current" when a newer policy version appears; a new acknowledgement must be appended.
 */
export interface LegalAcknowledgementRepository {
  append(record: LegalAcknowledgement): Promise<void>;
  getById(id: LegalAcknowledgementId): Promise<LegalAcknowledgement | null>;
  listByUserId(userId: UserId): Promise<readonly LegalAcknowledgement[]>;
  listByMembershipId(
    membershipId: OrganizationMembershipId,
  ): Promise<readonly LegalAcknowledgement[]>;
  listByOrganizationId(organizationId: OrganizationId): Promise<readonly LegalAcknowledgement[]>;
  listByDocumentVersionId(
    documentVersionId: LegalDocumentVersionId,
  ): Promise<readonly LegalAcknowledgement[]>;
}

export interface LegalRepositories {
  readonly documentVersions: LegalDocumentVersionRepository;
  readonly acknowledgements: LegalAcknowledgementRepository;
}
