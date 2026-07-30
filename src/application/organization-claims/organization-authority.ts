import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import {
  createScopedAdministrativeActionRequirement,
  assertScopedAdministrativeActionAuthorized,
} from "../../domain/admin-authorization/grants.ts";
import { createPlatformAdministrativeAuditEvent } from "../../domain/admin-authorization/admin-audit.ts";
import type { AdministrativeAuditSecurityEvidence } from "../admin/organization-access-administration.ts";
import { createOrganizationUserAuthorization } from "../../domain/authorization/model.ts";
import { standardOrganizationRolePreset } from "../../domain/authorization/organization-role-presets.ts";
import { geographyId } from "../../domain/geography/model.ts";
import {
  accessJourneyId,
  advanceAccessLifecycle,
  type AccessLifecycleRecord,
} from "../../domain/lifecycle/model.ts";
import { organizationId, type OrganizationAccount } from "../../domain/organizations/model.ts";
import type { OrganizationResolutionRepository } from "../../domain/organization-resolution/repository.ts";
import type { StoredAsset } from "../../domain/storage/model.ts";
import {
  createOrganizationMembership,
  userId,
  type OrganizationMembership,
  type UserIdentity,
} from "../../domain/users/model.ts";
import type { AccessLifecycleRepository } from "../../domain/lifecycle/repository.ts";
import {
  createOrganizationAuthorityClaim,
  createOrganizationAuthorityClaimSubmittedEvent,
  createOrganizationAuthorityDecision,
  matchesOrganizationClaimsConsoleCategory,
  transitionOrganizationAuthorityClaim,
  type OrganizationAuthorityClaim,
  type OrganizationAuthorityEvidence,
  type OrganizationClaimsAdminContext,
  type OrganizationClaimsConsoleCategory,
  type OrganizationClaimsConsoleRecord,
} from "../../domain/organization-claims/model.ts";
import type {
  OrganizationAuthorityClaimRepository,
  OrganizationAuthorityClaimUnitOfWork,
} from "../../domain/organization-claims/repository.ts";

export interface OrganizationClaimCommunicationScheduler {
  schedule(input: Readonly<{
    event:
      | "authority-evidence-requested"
      | "existing-administrator-notified"
      | "authority-approved"
      | "authority-denied";
    claimId: string;
    organizationId: string;
    userId: string;
    correlationId: string;
    idempotencyKey: string;
  }>): Promise<void>;
}

export interface OrganizationAuthorityIdFactory {
  claim(): string;
  event(): string;
  decision(): string;
  membership(): string;
  audit(): string;
}

export interface OrganizationAuthorityDependencies {
  readonly claims: OrganizationAuthorityClaimRepository;
  readonly unitOfWork: OrganizationAuthorityClaimUnitOfWork;
  readonly resolutions: OrganizationResolutionRepository;
  readonly lifecycle: AccessLifecycleRepository;
  readonly ids: OrganizationAuthorityIdFactory;
  readonly now: () => string;
  readonly communications?: OrganizationClaimCommunicationScheduler;
}

export class OrganizationAuthorityError extends Error {
  readonly code:
    | "resolution-required"
    | "resolution-not-owned"
    | "invalid-lifecycle-state"
    | "claim-already-exists"
    | "claim-conflict"
    | "verified-evidence-required"
    | "claim-not-reviewable"
    | "organization-scope-denied"
    | "document-evidence-invalid";

  constructor(
    code:
      | "resolution-required"
      | "resolution-not-owned"
      | "invalid-lifecycle-state"
      | "claim-already-exists"
      | "claim-conflict"
      | "verified-evidence-required"
      | "claim-not-reviewable"
      | "organization-scope-denied"
      | "document-evidence-invalid",
    message: string,
  ) {
    super(message);
    this.name = "OrganizationAuthorityError";
    this.code = code;
  }
}

function ownedResolution(
  resolution: Awaited<ReturnType<OrganizationResolutionRepository["getByAccessJourneyId"]>>,
  context: AuthenticatedServerContext,
) {
  if (!resolution) {
    throw new OrganizationAuthorityError("resolution-required", "Organization resolution is required.");
  }
  if (resolution.userId !== context.user.id) {
    throw new OrganizationAuthorityError("resolution-not-owned", "Organization resolution belongs to another user.");
  }
  return resolution;
}

function resolvedJourney(
  journey: AccessLifecycleRecord | null,
  context: AuthenticatedServerContext,
): AccessLifecycleRecord {
  if (!journey || journey.userId !== context.user.id || journey.state !== "organization-resolved") {
    throw new OrganizationAuthorityError(
      "invalid-lifecycle-state",
      "Authority establishment requires the owned organization-resolved journey.",
    );
  }
  return journey;
}

function assertDocumentEvidence(evidence: readonly OrganizationAuthorityEvidence[], assets: readonly StoredAsset[]): void {
  const byId = new Map(assets.map((asset) => [asset.id, asset]));
  for (const item of evidence.filter((candidate) => candidate.kind === "organization-document")) {
    const asset = item.storedAssetId ? byId.get(item.storedAssetId) : null;
    if (
      !asset ||
      asset.category !== "authority-evidence" ||
      asset.sensitivity !== "sensitive-evidence" ||
      asset.visibility !== "private" ||
      asset.status !== "active"
    ) {
      throw new OrganizationAuthorityError(
        "document-evidence-invalid",
        "Authority document evidence must reference an active private authority-evidence asset.",
      );
    }
  }
}

function hasVerifiedAuthorityEvidence(claim: OrganizationAuthorityClaim): boolean {
  return claim.evidence.some(
    (evidence) =>
      evidence.status === "verified" &&
      [
        "domain-email",
        "existing-administrator-invitation",
        "administrative-review",
        "organization-document",
        "authoritative-record",
      ].includes(evidence.kind),
  );
}

function membershipAndAuthorization(input: Readonly<{
  user: UserIdentity;
  organization: OrganizationAccount;
  membershipId: string;
  now: string;
}>) {
  const membership = createOrganizationMembership(input.user, input.organization, {
    id: input.membershipId,
    now: input.now,
  });
  const preset = standardOrganizationRolePreset("primary-administrator");
  const authorization = createOrganizationUserAuthorization(membership, input.organization, {
    roleKey: preset.key,
    permissions: preset.permissions,
    now: input.now,
  });
  return Object.freeze({ membership, authorization });
}

export class OrganizationAuthorityService {
  private readonly dependencies: OrganizationAuthorityDependencies;

  constructor(dependencies: OrganizationAuthorityDependencies) {
    this.dependencies = dependencies;
  }

  async submit(input: Readonly<{
    context: AuthenticatedServerContext;
    accessJourneyId: string;
    geographyId: string;
    evidence: readonly OrganizationAuthorityEvidence[];
    storedAssets?: readonly StoredAsset[];
    reason: string;
  }>): Promise<OrganizationAuthorityClaim> {
    const journeyId = accessJourneyId(input.accessJourneyId);
    const [resolution, journey] = await Promise.all([
      this.dependencies.resolutions.getByAccessJourneyId(journeyId),
      this.dependencies.lifecycle.getById(journeyId),
    ]);
    const owned = ownedResolution(resolution, input.context);
    resolvedJourney(journey, input.context);
    assertDocumentEvidence(input.evidence, input.storedAssets ?? []);
    const previous = await this.dependencies.claims.listByUserId(input.context.user.id);
    if (previous.some((claim) => claim.accessJourneyId === journeyId)) {
      throw new OrganizationAuthorityError("claim-already-exists", "This journey already submitted an authority claim.");
    }
    const competing = (await this.dependencies.claims.listByOrganizationId(owned.organizationId))
      .filter((claim) => claim.userId !== owned.userId && claim.status !== "denied");
    const now = this.dependencies.now();
    const claim = createOrganizationAuthorityClaim({
      id: this.dependencies.ids.claim(),
      resolution: owned,
      geographyId: geographyId(input.geographyId),
      evidence: input.evidence,
      conflictingClaimIds: competing.map((candidate) => candidate.id),
      now,
    });
    const event = createOrganizationAuthorityClaimSubmittedEvent({
      id: this.dependencies.ids.event(),
      claim,
      reason: input.reason,
      now,
    });
    await this.dependencies.claims.create(claim, event);
    return claim;
  }

  async establishFromVerifiedEvidence(input: Readonly<{
    context: AuthenticatedServerContext;
    claim: OrganizationAuthorityClaim;
    organization: OrganizationAccount;
    user: UserIdentity;
    lifecycle: AccessLifecycleRecord;
    decisionMaker: "system" | "existing-administrator";
    decisionMakerId: string;
    reason: string;
  }>): Promise<Readonly<{ claim: OrganizationAuthorityClaim; membership: OrganizationMembership }>> {
    if (
      input.claim.userId !== input.context.user.id ||
      input.user.id !== input.context.user.id ||
      input.claim.organizationId !== input.organization.id
    ) {
      throw new OrganizationAuthorityError("resolution-not-owned", "Authority inputs do not share one user and organization.");
    }
    if (input.claim.conflictingClaimIds.length > 0) {
      throw new OrganizationAuthorityError("claim-conflict", "Conflicting claims require administrative adjudication.");
    }
    if (!hasVerifiedAuthorityEvidence(input.claim)) {
      throw new OrganizationAuthorityError("verified-evidence-required", "Authority requires verified evidence.");
    }
    const now = this.dependencies.now();
    const access = membershipAndAuthorization({
      user: input.user,
      organization: input.organization,
      membershipId: this.dependencies.ids.membership(),
      now,
    });
    const transition = transitionOrganizationAuthorityClaim({
      claim: input.claim,
      eventId: this.dependencies.ids.event(),
      actor: input.decisionMaker === "system"
        ? { kind: "system", id: input.decisionMakerId }
        : { kind: "existing-administrator", id: userId(input.decisionMakerId) },
      toStatus: "approved",
      action: "organization.authority-claim.approved",
      reason: input.reason,
      membershipId: access.membership.id,
      now,
    });
    const decision = createOrganizationAuthorityDecision({
      id: this.dependencies.ids.decision(),
      claim: transition.claim,
      outcome: "approved",
      decisionMaker: input.decisionMaker,
      decisionMakerId: input.decisionMakerId,
      reason: input.reason,
      now,
    });
    const lifecycle = advanceAccessLifecycle(
      resolvedJourney(input.lifecycle, input.context),
      "organization-registered",
      now,
    );
    await this.dependencies.unitOfWork.approve({
      ...transition,
      decision,
      ...access,
      lifecycle,
    });
    await this.dependencies.communications?.schedule({
      event: "authority-approved",
      claimId: transition.claim.id,
      organizationId: transition.claim.organizationId,
      userId: transition.claim.userId,
      correlationId: decision.id,
      idempotencyKey: `authority-approved:${decision.id}`,
    });
    return Object.freeze({ claim: transition.claim, membership: access.membership });
  }
}

type OrganizationClaimAdministrativeScope =
  | `ORGANIZATION:${string}`
  | `GEOGRAPHY:${string}`
  | `CASE:${string}`;

function authorizeClaimScopes(
  context: OrganizationClaimsAdminContext,
  permission: "organization.claim.read" | "organization.claim.adjudicate",
  scopes: readonly OrganizationClaimAdministrativeScope[],
  access: "read" | "write",
): void {
  for (const scope of scopes) {
    try {
      assertScopedAdministrativeActionAuthorized(
        context.authority,
        context.grants,
        createScopedAdministrativeActionRequirement({ permission, access, scope }),
        {
          now: context.now,
          satisfiedConditionKeys: context.satisfiedConditionKeys,
        },
      );
      return;
    } catch {
      // A grant matching any one of the claim's applicable scopes is sufficient.
    }
  }
  throw new OrganizationAuthorityError("organization-scope-denied", "Organization claim administration is outside the administrator scope.");
}

export class OrganizationClaimsAdministrationService {
  private readonly dependencies: OrganizationAuthorityDependencies;

  constructor(dependencies: OrganizationAuthorityDependencies) {
    this.dependencies = dependencies;
  }

  filterConsole(input: Readonly<{
    context: OrganizationClaimsAdminContext;
    records: readonly OrganizationClaimsConsoleRecord[];
    category: OrganizationClaimsConsoleCategory;
    geographyId?: string;
  }>): readonly OrganizationClaimsConsoleRecord[] {
    const requestedGeography = input.geographyId ? geographyId(input.geographyId) : undefined;
    return Object.freeze(input.records.filter((record) => {
      try {
        authorizeClaimScopes(
          input.context,
          "organization.claim.read",
          [
            `ORGANIZATION:${record.organizationId}`,
            `GEOGRAPHY:${record.geographyId}`,
          ],
          "read",
        );
        return matchesOrganizationClaimsConsoleCategory(record, input.category, requestedGeography);
      } catch {
        return false;
      }
    }));
  }

  async recordReviewStep(input: Readonly<{
    context: OrganizationClaimsAdminContext;
    claim: OrganizationAuthorityClaim;
    step: "evidence-requested" | "existing-administrator-notified" | "evidence-compared";
    reason: string;
    evidence?: readonly OrganizationAuthorityEvidence[];
  }>): Promise<OrganizationAuthorityClaim> {
    authorizeClaimScopes(
      input.context,
      "organization.claim.adjudicate",
      [
        `ORGANIZATION:${input.claim.organizationId}`,
        `GEOGRAPHY:${input.claim.geographyId}`,
      ],
      "write",
    );
    const transition = transitionOrganizationAuthorityClaim({
      claim: input.claim,
      eventId: this.dependencies.ids.event(),
      actor: { kind: "platform-administrator", id: input.context.authority.administratorId },
      toStatus: input.step,
      action: `organization.authority-claim.${input.step}`,
      reason: input.reason,
      evidence: input.evidence,
      now: this.dependencies.now(),
    });
    await this.dependencies.unitOfWork.update(transition);
    if (input.step !== "evidence-compared") {
      await this.dependencies.communications?.schedule({
        event: input.step === "evidence-requested"
          ? "authority-evidence-requested"
          : "existing-administrator-notified",
        claimId: transition.claim.id,
        organizationId: transition.claim.organizationId,
        userId: transition.claim.userId,
        correlationId: transition.event.id,
        idempotencyKey: `${input.step}:${transition.event.id}`,
      });
    }
    return transition.claim;
  }

  async adjudicate(input: Readonly<{
    context: OrganizationClaimsAdminContext;
    claim: OrganizationAuthorityClaim;
    organization: OrganizationAccount;
    user: UserIdentity;
    lifecycle: AccessLifecycleRecord;
    outcome: "approved" | "denied";
    reason: string;
    relatedCaseId: string;
    security: AdministrativeAuditSecurityEvidence;
  }>): Promise<OrganizationAuthorityClaim> {
    authorizeClaimScopes(
      input.context,
      "organization.claim.adjudicate",
      [
        `ORGANIZATION:${input.claim.organizationId}`,
        `GEOGRAPHY:${input.claim.geographyId}`,
        `CASE:${input.relatedCaseId}`,
      ],
      "write",
    );
    if (input.claim.status !== "evidence-compared") {
      throw new OrganizationAuthorityError("claim-not-reviewable", "Claim evidence must be compared before adjudication.");
    }
    if (input.outcome === "approved" && !hasVerifiedAuthorityEvidence(input.claim)) {
      throw new OrganizationAuthorityError("verified-evidence-required", "Claim approval requires verified evidence.");
    }
    const now = this.dependencies.now();
    const access = membershipAndAuthorization({
      user: input.user,
      organization: input.organization,
      membershipId: this.dependencies.ids.membership(),
      now,
    });
    const transition = transitionOrganizationAuthorityClaim({
      claim: input.claim,
      eventId: this.dependencies.ids.event(),
      actor: { kind: "platform-administrator", id: input.context.authority.administratorId },
      toStatus: input.outcome,
      action: `organization.authority-claim.${input.outcome}`,
      reason: input.reason,
      membershipId: input.outcome === "approved" ? access.membership.id : null,
      now,
    });
    const decision = createOrganizationAuthorityDecision({
      id: this.dependencies.ids.decision(),
      claim: transition.claim,
      outcome: input.outcome,
      decisionMaker: "platform-administrator",
      decisionMakerId: input.context.authority.administratorId,
      reason: input.reason,
      now,
    });
    const auditEvent = createPlatformAdministrativeAuditEvent(input.context.authority, {
      id: this.dependencies.ids.audit(),
      permissionsExercised: ["organization.claim.adjudicate"],
      target: {
        organizationId: input.claim.organizationId,
        userId: input.claim.userId,
        objectType: "organization-authority-claim",
        objectId: input.claim.id,
      },
      action: `organization.authority-claim.${input.outcome}`,
      sensitivity: "sensitive",
      priorState: { status: input.claim.status, authorityEstablished: false },
      newState: {
        status: transition.claim.status,
        authorityEstablished: transition.claim.authorityEstablished,
        verificationState: "not-evaluated",
      },
      reason: input.reason,
      relatedCaseId: input.relatedCaseId,
      occurredAt: now,
      securityContext: input.security,
      evidenceReferences: decision.comparedEvidenceReferences,
    });
    if (input.outcome === "approved") {
      await this.dependencies.unitOfWork.approve({
        ...transition,
        decision,
        ...access,
        lifecycle: advanceAccessLifecycle(input.lifecycle, "organization-registered", now),
        auditEvent,
      });
    } else {
      await this.dependencies.unitOfWork.update({
        ...transition,
        decision,
        auditEvent,
      });
    }
    await this.dependencies.communications?.schedule({
      event: input.outcome === "approved" ? "authority-approved" : "authority-denied",
      claimId: transition.claim.id,
      organizationId: transition.claim.organizationId,
      userId: transition.claim.userId,
      correlationId: decision.id,
      idempotencyKey: `authority-${input.outcome}:${decision.id}`,
    });
    return transition.claim;
  }
}
