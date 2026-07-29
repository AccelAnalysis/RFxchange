import type { Firestore } from "firebase-admin/firestore";

import {
  ADMIN_PERMISSION_CATALOG,
  type AdminPermissionDefinition,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
  type PlatformAdministratorId,
} from "../../domain/admin-authorization/model";
import type {
  AdminAuthorizationRepositories,
  AdminPermissionCatalogRepository,
  AdminPermissionGrantRepository,
  PlatformAdministratorAuthorityContextRepository,
} from "../../domain/admin-authorization/repository";
import type {
  AdminPermissionGrant,
  AdminPermissionGrantId,
} from "../../domain/admin-authorization/grants";
import type { OrganizationActionAuditEvent, OrganizationAuditEventId } from "../../domain/audit/model";
import type { AuditRepositories, OrganizationAuditRepository } from "../../domain/audit/repository";
import type { OrganizationUserAuthorization } from "../../domain/authorization/model";
import type { OrganizationUserAuthorizationRepository } from "../../domain/authorization/repository";
import type {
  OrganizationAuthorityRepresentation,
  OrganizationAuthorityRepresentationId,
  PlatformActorId,
  PlatformChangeDirective,
  PlatformChangeDirectiveId,
  PlatformChangeTargetKind,
} from "../../domain/governance/model";
import type {
  GovernanceRepositories,
  OrganizationAuthorityRepresentationRepository,
  PlatformChangeDirectiveRepository,
} from "../../domain/governance/repository";
import type {
  LegalAcknowledgement,
  LegalAcknowledgementId,
  LegalDocumentKind,
  LegalDocumentVersion,
  LegalDocumentVersionId,
  LegalVersion,
} from "../../domain/legal/model";
import type {
  LegalAcknowledgementRepository,
  LegalDocumentVersionRepository,
  LegalRepositories,
} from "../../domain/legal/repository";
import type {
  AccessJourneyId,
  AccessLifecycleRecord,
  AccessRestrictionId,
  AccessRestrictionRecord,
} from "../../domain/lifecycle/model";
import type {
  AccessLifecycleRepositories,
  AccessLifecycleRepository,
  AccessRestrictionRepository,
} from "../../domain/lifecycle/repository";
import type {
  OrganizationAccount,
  OrganizationId,
  OrganizationProfile,
  OrganizationProfileId,
} from "../../domain/organizations/model";
import type {
  OrganizationAccountRepository,
  OrganizationProfileRepository,
  OrganizationRepositories,
} from "../../domain/organizations/repository";
import type {
  RecordRetentionAssignment,
  RetentionAssignmentId,
  RetentionPolicyClassification,
  RetentionPolicyId,
  RetentionPolicyKey,
  RetentionRecordId,
} from "../../domain/retention/model";
import type {
  RecordRetentionAssignmentRepository,
  RetentionPolicyRepository,
  RetentionRepositories,
} from "../../domain/retention/repository";
import type {
  LoginSubject,
  OrganizationMembership,
  OrganizationMembershipId,
  UserId,
  UserIdentity,
} from "../../domain/users/model";
import type {
  OrganizationMembershipRepository,
  UserIdentityRepository,
  UserRepositories,
} from "../../domain/users/repository";
import { firestoreCollectionName } from "./schema";
import {
  appendFirestoreRecord,
  createMutableFirestoreRecord,
  getFirstFirestoreRecord,
  getFirestoreRecordById,
  listFirestoreRecords,
  saveMutableFirestoreRecord,
} from "./support";

export class FirestoreOrganizationAccountRepository implements OrganizationAccountRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: OrganizationId): Promise<OrganizationAccount | null> {
    return getFirestoreRecordById<OrganizationAccount>(this.db, "organizations", id);
  }

  create(account: OrganizationAccount): Promise<void> {
    return createMutableFirestoreRecord(this.db, "organizations", account.id, account);
  }
}

export class FirestoreOrganizationProfileRepository implements OrganizationProfileRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: OrganizationProfileId): Promise<OrganizationProfile | null> {
    return getFirestoreRecordById<OrganizationProfile>(this.db, "organizationProfiles", id);
  }

  getByOrganizationId(organizationId: OrganizationId): Promise<OrganizationProfile | null> {
    return getFirstFirestoreRecord<OrganizationProfile>(
      this.db
        .collection(firestoreCollectionName("organizationProfiles"))
        .where("organizationId", "==", organizationId),
      "organizationProfiles",
    );
  }

  create(profile: OrganizationProfile): Promise<void> {
    return createMutableFirestoreRecord(this.db, "organizationProfiles", profile.id, profile);
  }
}

export class FirestoreUserIdentityRepository implements UserIdentityRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: UserId): Promise<UserIdentity | null> {
    return getFirestoreRecordById<UserIdentity>(this.db, "users", id);
  }

  getByPrimaryEmail(primaryEmail: string): Promise<UserIdentity | null> {
    return getFirstFirestoreRecord<UserIdentity>(
      this.db
        .collection(firestoreCollectionName("users"))
        .where("primaryEmail", "==", primaryEmail.trim().toLowerCase()),
      "users",
    );
  }

  getByLogin(provider: string, subject: LoginSubject): Promise<UserIdentity | null> {
    return getFirstFirestoreRecord<UserIdentity>(
      this.db
        .collection(firestoreCollectionName("users"))
        .where("login.provider", "==", provider.trim())
        .where("login.subject", "==", subject),
      "users",
    );
  }

  create(user: UserIdentity): Promise<void> {
    return createMutableFirestoreRecord(this.db, "users", user.id, user);
  }
}

export class FirestoreOrganizationMembershipRepository implements OrganizationMembershipRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: OrganizationMembershipId): Promise<OrganizationMembership | null> {
    return getFirestoreRecordById<OrganizationMembership>(this.db, "organizationMemberships", id);
  }

  listByUserId(userId: UserId): Promise<readonly OrganizationMembership[]> {
    return listFirestoreRecords<OrganizationMembership>(
      this.db
        .collection(firestoreCollectionName("organizationMemberships"))
        .where("userId", "==", userId),
      "organizationMemberships",
    );
  }

  listActiveByUserId(userId: UserId): Promise<readonly OrganizationMembership[]> {
    return listFirestoreRecords<OrganizationMembership>(
      this.db
        .collection(firestoreCollectionName("organizationMemberships"))
        .where("userId", "==", userId)
        .where("status", "==", "active"),
      "organizationMemberships",
    );
  }

  listByOrganizationId(organizationId: OrganizationId): Promise<readonly OrganizationMembership[]> {
    return listFirestoreRecords<OrganizationMembership>(
      this.db
        .collection(firestoreCollectionName("organizationMemberships"))
        .where("organizationId", "==", organizationId),
      "organizationMemberships",
    );
  }

  create(membership: OrganizationMembership): Promise<void> {
    return createMutableFirestoreRecord(
      this.db,
      "organizationMemberships",
      membership.id,
      membership,
    );
  }
}

export class FirestoreOrganizationUserAuthorizationRepository
  implements OrganizationUserAuthorizationRepository
{
  constructor(private readonly db: Firestore) {}

  getByMembershipId(
    membershipId: OrganizationMembershipId,
  ): Promise<OrganizationUserAuthorization | null> {
    return getFirestoreRecordById<OrganizationUserAuthorization>(
      this.db,
      "organizationAuthorizations",
      membershipId,
    );
  }

  listByUserId(userId: UserId): Promise<readonly OrganizationUserAuthorization[]> {
    return listFirestoreRecords<OrganizationUserAuthorization>(
      this.db
        .collection(firestoreCollectionName("organizationAuthorizations"))
        .where("userId", "==", userId),
      "organizationAuthorizations",
    );
  }

  listByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<readonly OrganizationUserAuthorization[]> {
    return listFirestoreRecords<OrganizationUserAuthorization>(
      this.db
        .collection(firestoreCollectionName("organizationAuthorizations"))
        .where("organizationId", "==", organizationId),
      "organizationAuthorizations",
    );
  }

  save(authorization: OrganizationUserAuthorization): Promise<void> {
    return saveMutableFirestoreRecord(
      this.db,
      "organizationAuthorizations",
      authorization.membershipId,
      authorization,
    );
  }
}

export class FirestoreOrganizationAuditRepository implements OrganizationAuditRepository {
  constructor(private readonly db: Firestore) {}

  append(event: OrganizationActionAuditEvent): Promise<void> {
    return appendFirestoreRecord(this.db, "organizationAuditEvents", event.id, event);
  }

  getById(id: OrganizationAuditEventId): Promise<OrganizationActionAuditEvent | null> {
    return getFirestoreRecordById<OrganizationActionAuditEvent>(
      this.db,
      "organizationAuditEvents",
      id,
    );
  }

  listByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<readonly OrganizationActionAuditEvent[]> {
    return listFirestoreRecords<OrganizationActionAuditEvent>(
      this.db
        .collection(firestoreCollectionName("organizationAuditEvents"))
        .where("organizationId", "==", organizationId),
      "organizationAuditEvents",
    );
  }

  listByActorUserId(userId: UserId): Promise<readonly OrganizationActionAuditEvent[]> {
    return listFirestoreRecords<OrganizationActionAuditEvent>(
      this.db
        .collection(firestoreCollectionName("organizationAuditEvents"))
        .where("actor.userId", "==", userId),
      "organizationAuditEvents",
    );
  }

  listByMembershipId(
    membershipId: OrganizationMembershipId,
  ): Promise<readonly OrganizationActionAuditEvent[]> {
    return listFirestoreRecords<OrganizationActionAuditEvent>(
      this.db
        .collection(firestoreCollectionName("organizationAuditEvents"))
        .where("actor.membershipId", "==", membershipId),
      "organizationAuditEvents",
    );
  }
}

export class FirestoreAccessLifecycleRepository implements AccessLifecycleRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: AccessJourneyId): Promise<AccessLifecycleRecord | null> {
    return getFirestoreRecordById<AccessLifecycleRecord>(this.db, "accessJourneys", id);
  }

  save(record: AccessLifecycleRecord): Promise<void> {
    return saveMutableFirestoreRecord(this.db, "accessJourneys", record.id, record);
  }
}

export class FirestoreAccessRestrictionRepository implements AccessRestrictionRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: AccessRestrictionId): Promise<AccessRestrictionRecord | null> {
    return getFirestoreRecordById<AccessRestrictionRecord>(this.db, "accessRestrictions", id);
  }

  getForOrganization(organizationId: OrganizationId): Promise<AccessRestrictionRecord | null> {
    return getFirstFirestoreRecord<AccessRestrictionRecord>(
      this.db
        .collection(firestoreCollectionName("accessRestrictions"))
        .where("target.kind", "==", "organization")
        .where("target.organizationId", "==", organizationId),
      "accessRestrictions",
    );
  }

  getForMembership(
    membershipId: OrganizationMembershipId,
  ): Promise<AccessRestrictionRecord | null> {
    return getFirstFirestoreRecord<AccessRestrictionRecord>(
      this.db
        .collection(firestoreCollectionName("accessRestrictions"))
        .where("target.kind", "==", "membership")
        .where("target.membershipId", "==", membershipId),
      "accessRestrictions",
    );
  }

  save(record: AccessRestrictionRecord): Promise<void> {
    return saveMutableFirestoreRecord(this.db, "accessRestrictions", record.id, record);
  }
}

export class FirestoreLegalDocumentVersionRepository implements LegalDocumentVersionRepository {
  constructor(private readonly db: Firestore) {}

  append(version: LegalDocumentVersion): Promise<void> {
    return appendFirestoreRecord(this.db, "legalDocumentVersions", version.id, version);
  }

  getById(id: LegalDocumentVersionId): Promise<LegalDocumentVersion | null> {
    return getFirestoreRecordById<LegalDocumentVersion>(this.db, "legalDocumentVersions", id);
  }

  getByKindAndVersion(
    kind: LegalDocumentKind,
    version: LegalVersion,
  ): Promise<LegalDocumentVersion | null> {
    return getFirstFirestoreRecord<LegalDocumentVersion>(
      this.db
        .collection(firestoreCollectionName("legalDocumentVersions"))
        .where("kind", "==", kind)
        .where("version", "==", version),
      "legalDocumentVersions",
    );
  }

  listByKind(kind: LegalDocumentKind): Promise<readonly LegalDocumentVersion[]> {
    return listFirestoreRecords<LegalDocumentVersion>(
      this.db
        .collection(firestoreCollectionName("legalDocumentVersions"))
        .where("kind", "==", kind),
      "legalDocumentVersions",
    );
  }
}

export class FirestoreLegalAcknowledgementRepository implements LegalAcknowledgementRepository {
  constructor(private readonly db: Firestore) {}

  append(record: LegalAcknowledgement): Promise<void> {
    return appendFirestoreRecord(this.db, "legalAcknowledgements", record.id, record);
  }

  getById(id: LegalAcknowledgementId): Promise<LegalAcknowledgement | null> {
    return getFirestoreRecordById<LegalAcknowledgement>(this.db, "legalAcknowledgements", id);
  }

  listByUserId(userId: UserId): Promise<readonly LegalAcknowledgement[]> {
    return listFirestoreRecords<LegalAcknowledgement>(
      this.db
        .collection(firestoreCollectionName("legalAcknowledgements"))
        .where("userId", "==", userId),
      "legalAcknowledgements",
    );
  }

  listByMembershipId(
    membershipId: OrganizationMembershipId,
  ): Promise<readonly LegalAcknowledgement[]> {
    return listFirestoreRecords<LegalAcknowledgement>(
      this.db
        .collection(firestoreCollectionName("legalAcknowledgements"))
        .where("membershipId", "==", membershipId),
      "legalAcknowledgements",
    );
  }

  listByOrganizationId(organizationId: OrganizationId): Promise<readonly LegalAcknowledgement[]> {
    return listFirestoreRecords<LegalAcknowledgement>(
      this.db
        .collection(firestoreCollectionName("legalAcknowledgements"))
        .where("organizationId", "==", organizationId),
      "legalAcknowledgements",
    );
  }

  listByDocumentVersionId(
    documentVersionId: LegalDocumentVersionId,
  ): Promise<readonly LegalAcknowledgement[]> {
    return listFirestoreRecords<LegalAcknowledgement>(
      this.db
        .collection(firestoreCollectionName("legalAcknowledgements"))
        .where("documentVersionId", "==", documentVersionId),
      "legalAcknowledgements",
    );
  }
}

export class FirestoreOrganizationAuthorityRepresentationRepository
  implements OrganizationAuthorityRepresentationRepository
{
  constructor(private readonly db: Firestore) {}

  append(record: OrganizationAuthorityRepresentation): Promise<void> {
    return appendFirestoreRecord(
      this.db,
      "organizationAuthorityRepresentations",
      record.id,
      record,
    );
  }

  findById(
    id: OrganizationAuthorityRepresentationId,
  ): Promise<OrganizationAuthorityRepresentation | null> {
    return getFirestoreRecordById<OrganizationAuthorityRepresentation>(
      this.db,
      "organizationAuthorityRepresentations",
      id,
    );
  }

  listByOrganizationId(
    organizationId: OrganizationId,
  ): Promise<readonly OrganizationAuthorityRepresentation[]> {
    return listFirestoreRecords<OrganizationAuthorityRepresentation>(
      this.db
        .collection(firestoreCollectionName("organizationAuthorityRepresentations"))
        .where("organizationId", "==", organizationId),
      "organizationAuthorityRepresentations",
    );
  }

  listByUserId(userId: UserId): Promise<readonly OrganizationAuthorityRepresentation[]> {
    return listFirestoreRecords<OrganizationAuthorityRepresentation>(
      this.db
        .collection(firestoreCollectionName("organizationAuthorityRepresentations"))
        .where("userId", "==", userId),
      "organizationAuthorityRepresentations",
    );
  }

  listByMembershipId(
    membershipId: OrganizationMembershipId,
  ): Promise<readonly OrganizationAuthorityRepresentation[]> {
    return listFirestoreRecords<OrganizationAuthorityRepresentation>(
      this.db
        .collection(firestoreCollectionName("organizationAuthorityRepresentations"))
        .where("membershipId", "==", membershipId),
      "organizationAuthorityRepresentations",
    );
  }
}

export class FirestorePlatformChangeDirectiveRepository
  implements PlatformChangeDirectiveRepository
{
  constructor(private readonly db: Firestore) {}

  append(directive: PlatformChangeDirective): Promise<void> {
    return appendFirestoreRecord(this.db, "platformChangeDirectives", directive.id, directive);
  }

  findById(id: PlatformChangeDirectiveId): Promise<PlatformChangeDirective | null> {
    return getFirestoreRecordById<PlatformChangeDirective>(
      this.db,
      "platformChangeDirectives",
      id,
    );
  }

  listByActorId(actorId: PlatformActorId): Promise<readonly PlatformChangeDirective[]> {
    return listFirestoreRecords<PlatformChangeDirective>(
      this.db
        .collection(firestoreCollectionName("platformChangeDirectives"))
        .where("actorId", "==", actorId),
      "platformChangeDirectives",
    );
  }

  listByTargetKind(
    targetKind: PlatformChangeTargetKind,
  ): Promise<readonly PlatformChangeDirective[]> {
    return listFirestoreRecords<PlatformChangeDirective>(
      this.db
        .collection(firestoreCollectionName("platformChangeDirectives"))
        .where("targetKind", "==", targetKind),
      "platformChangeDirectives",
    );
  }
}

export class FirestoreRetentionPolicyRepository implements RetentionPolicyRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: RetentionPolicyId): Promise<RetentionPolicyClassification | null> {
    return getFirestoreRecordById<RetentionPolicyClassification>(this.db, "retentionPolicies", id);
  }

  listByPolicyKey(
    policyKey: RetentionPolicyKey,
  ): Promise<readonly RetentionPolicyClassification[]> {
    return listFirestoreRecords<RetentionPolicyClassification>(
      this.db
        .collection(firestoreCollectionName("retentionPolicies"))
        .where("policyKey", "==", policyKey),
      "retentionPolicies",
    );
  }

  append(policy: RetentionPolicyClassification): Promise<void> {
    return appendFirestoreRecord(this.db, "retentionPolicies", policy.id, policy);
  }
}

export class FirestoreRecordRetentionAssignmentRepository
  implements RecordRetentionAssignmentRepository
{
  constructor(private readonly db: Firestore) {}

  getById(id: RetentionAssignmentId): Promise<RecordRetentionAssignment | null> {
    return getFirestoreRecordById<RecordRetentionAssignment>(this.db, "retentionAssignments", id);
  }

  listByRecordId(recordId: RetentionRecordId): Promise<readonly RecordRetentionAssignment[]> {
    return listFirestoreRecords<RecordRetentionAssignment>(
      this.db
        .collection(firestoreCollectionName("retentionAssignments"))
        .where("record.recordId", "==", recordId),
      "retentionAssignments",
    );
  }

  append(assignment: RecordRetentionAssignment): Promise<void> {
    return appendFirestoreRecord(this.db, "retentionAssignments", assignment.id, assignment);
  }
}

export class StaticAdminPermissionCatalogRepository implements AdminPermissionCatalogRepository {
  getByKey(key: AdminPermissionKey): Promise<AdminPermissionDefinition | null> {
    return Promise.resolve(ADMIN_PERMISSION_CATALOG.find((definition) => definition.key === key) ?? null);
  }

  listAll(): Promise<readonly AdminPermissionDefinition[]> {
    return Promise.resolve(ADMIN_PERMISSION_CATALOG);
  }
}

export class FirestorePlatformAdministratorAuthorityContextRepository
  implements PlatformAdministratorAuthorityContextRepository
{
  constructor(private readonly db: Firestore) {}

  getByAdministratorId(
    administratorId: PlatformAdministratorId,
  ): Promise<PlatformAdministratorAuthorityContext | null> {
    return getFirestoreRecordById<PlatformAdministratorAuthorityContext>(
      this.db,
      "adminAuthorityContexts",
      administratorId,
    );
  }
}

export class FirestoreAdminPermissionGrantRepository implements AdminPermissionGrantRepository {
  constructor(private readonly db: Firestore) {}

  getById(id: AdminPermissionGrantId): Promise<AdminPermissionGrant | null> {
    return getFirestoreRecordById<AdminPermissionGrant>(this.db, "adminPermissionGrants", id);
  }

  listByAdministratorId(
    administratorId: PlatformAdministratorId,
  ): Promise<readonly AdminPermissionGrant[]> {
    return listFirestoreRecords<AdminPermissionGrant>(
      this.db
        .collection(firestoreCollectionName("adminPermissionGrants"))
        .where("administratorId", "==", administratorId),
      "adminPermissionGrants",
    );
  }

  append(grant: AdminPermissionGrant): Promise<void> {
    return appendFirestoreRecord(this.db, "adminPermissionGrants", grant.id, grant);
  }
}

export interface FirestoreFoundationRepositories {
  readonly organizations: OrganizationRepositories;
  readonly users: UserRepositories;
  readonly organizationAuthorization: OrganizationUserAuthorizationRepository;
  readonly audit: AuditRepositories;
  readonly lifecycle: AccessLifecycleRepositories;
  readonly legal: LegalRepositories;
  readonly governance: GovernanceRepositories;
  readonly retention: RetentionRepositories;
  readonly adminAuthorization: AdminAuthorizationRepositories;
}

export function createFirestoreFoundationRepositories(
  db: Firestore,
): FirestoreFoundationRepositories {
  return Object.freeze({
    organizations: Object.freeze({
      accounts: new FirestoreOrganizationAccountRepository(db),
      profiles: new FirestoreOrganizationProfileRepository(db),
    }),
    users: Object.freeze({
      users: new FirestoreUserIdentityRepository(db),
      memberships: new FirestoreOrganizationMembershipRepository(db),
    }),
    organizationAuthorization: new FirestoreOrganizationUserAuthorizationRepository(db),
    audit: Object.freeze({
      organizationAudit: new FirestoreOrganizationAuditRepository(db),
    }),
    lifecycle: Object.freeze({
      lifecycle: new FirestoreAccessLifecycleRepository(db),
      restrictions: new FirestoreAccessRestrictionRepository(db),
    }),
    legal: Object.freeze({
      documentVersions: new FirestoreLegalDocumentVersionRepository(db),
      acknowledgements: new FirestoreLegalAcknowledgementRepository(db),
    }),
    governance: Object.freeze({
      organizationAuthorityRepresentations:
        new FirestoreOrganizationAuthorityRepresentationRepository(db),
      platformChangeDirectives: new FirestorePlatformChangeDirectiveRepository(db),
    }),
    retention: Object.freeze({
      policies: new FirestoreRetentionPolicyRepository(db),
      assignments: new FirestoreRecordRetentionAssignmentRepository(db),
    }),
    adminAuthorization: Object.freeze({
      permissions: new StaticAdminPermissionCatalogRepository(),
      authorityContexts: new FirestorePlatformAdministratorAuthorityContextRepository(db),
      grants: new FirestoreAdminPermissionGrantRepository(db),
    }),
  });
}
