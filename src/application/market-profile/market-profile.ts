import { createHash, randomUUID } from "node:crypto";

import type { AmacsCatalogPort } from "../amacs/catalog.ts";
import type { NaicsCatalogPort } from "../naics/catalog.ts";
import {
  authorizeOrganizationOperation,
  type OrganizationOperationAuthorizationDependencies,
} from "../auth/authorize-organization-operation.ts";
import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import { createOrganizationActionAuditEvent } from "../../domain/audit/model.ts";
import type { AiInterpretationRepository } from "../../domain/ai-interpretation/repository.ts";
import type { OrganizationServiceGeographyRepository } from "../../domain/organization-location/repository.ts";
import {
  createIndustryProfile,
  createMarketPreferences,
  createOrganizationCapabilityClaim,
  createPastPerformance,
  createProvisionalTerm,
  type CapabilityClaimSource,
  type OrganizationMarketProfileCommandReceipt,
  type OrganizationMarketProfileEvent,
} from "../../domain/market-profile/model.ts";
import {
  MarketProfilePersistenceConflictError,
  type OrganizationMarketProfileRepository,
} from "../../domain/market-profile/repository.ts";
import { organizationId, type OrganizationId } from "../../domain/organizations/model.ts";
import { organizationMembershipId } from "../../domain/users/model.ts";

export class MarketProfileError extends Error {
  readonly code: "forbidden" | "invalid" | "not-found" | "conflict";
  constructor(code: MarketProfileError["code"], message: string) {
    super(message);
    this.name = "MarketProfileError";
    this.code = code;
  }
}

function marketProfileInput<T>(operation: () => T, fallbackMessage: string): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof MarketProfileError) throw error;
    throw new MarketProfileError(
      "invalid",
      error instanceof Error ? error.message : fallbackMessage,
    );
  }
}

export interface MarketProfileServiceDependencies {
  readonly authorization: OrganizationOperationAuthorizationDependencies;
  readonly catalog: AmacsCatalogPort;
  readonly naicsCatalog: NaicsCatalogPort;
  readonly interpretations: AiInterpretationRepository;
  readonly serviceGeographies: OrganizationServiceGeographyRepository;
  readonly repository: OrganizationMarketProfileRepository;
  readonly now?: () => string;
  readonly id?: () => string;
}

export interface MarketProfileCommandScope {
  readonly context: AuthenticatedServerContext | null;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly commandId: string;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function event(input: Readonly<{
  id: string;
  organizationId: OrganizationId;
  userId: Parameters<typeof createOrganizationCapabilityClaim>[0]["userId"];
  membershipId: Parameters<typeof createOrganizationCapabilityClaim>[0]["membershipId"];
  kind: OrganizationMarketProfileEvent["kind"];
  subjectId: string;
  commandId: string;
  now: string;
}>): OrganizationMarketProfileEvent {
  return Object.freeze({
    id: input.id,
    organizationId: input.organizationId,
    actorUserId: input.userId,
    actorMembershipId: input.membershipId,
    kind: input.kind,
    subjectId: input.subjectId,
    commandId: input.commandId,
    occurredAt: input.now,
  });
}

export class MarketProfileService {
  private readonly dependencies: MarketProfileServiceDependencies;
  private readonly now: () => string;
  private readonly id: () => string;

  constructor(dependencies: MarketProfileServiceDependencies) {
    this.dependencies = dependencies;
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.id = dependencies.id ?? randomUUID;
  }

  private async authorize(scope: MarketProfileCommandScope) {
    const organizationIdValue = organizationId(scope.organizationId);
    const membershipIdValue = organizationMembershipId(scope.membershipId);
    const decision = await authorizeOrganizationOperation({
      context: scope.context,
      organizationId: organizationIdValue,
      membershipId: membershipIdValue,
      permission: "organization.profile.manage",
    }, this.dependencies.authorization);
    if (!decision.allowed) {
      throw new MarketProfileError("forbidden", `Market profile update denied: ${decision.reason}.`);
    }
    return decision;
  }

  private async replay(scope: MarketProfileCommandScope, action: OrganizationMarketProfileEvent["kind"], requestFingerprint: string) {
    const prior = await this.dependencies.repository.getCommand(scope.commandId);
    if (!prior) return null;
    if (String(prior.organizationId) !== scope.organizationId || prior.action !== action || prior.requestFingerprint !== requestFingerprint) {
      throw new MarketProfileError("conflict", "The command identity was already used for a different market profile update.");
    }
    return prior;
  }

  private async persist(input: Readonly<{
    scope: MarketProfileCommandScope;
    authorization: Awaited<ReturnType<MarketProfileService["authorize"]>>;
    action: OrganizationMarketProfileEvent["kind"];
    subjectId: string;
    requestFingerprint: string;
    record: Parameters<OrganizationMarketProfileRepository["save"]>[0]["record"];
    now: string;
  }>) {
    const command: OrganizationMarketProfileCommandReceipt = Object.freeze({
      id: input.scope.commandId,
      organizationId: input.authorization.organization.id,
      action: input.action,
      resultId: input.subjectId,
      requestFingerprint: input.requestFingerprint,
      actorUserId: input.authorization.context.user.id,
      recordedAt: input.now,
    });
    try {
      await this.dependencies.repository.save({
        command,
        event: event({
          id: `mpevent_${this.id()}`,
          organizationId: input.authorization.organization.id,
          userId: input.authorization.context.user.id,
          membershipId: input.authorization.membership.id,
          kind: input.action,
          subjectId: input.subjectId,
          commandId: input.scope.commandId,
          now: input.now,
        }),
        auditEvent: createOrganizationActionAuditEvent(
          input.authorization.context.user,
          input.authorization.membership,
          input.authorization.organization,
          { id: `audit_${this.id()}`, action: `organization.market-profile.${input.action}`, occurredAt: input.now },
        ),
        record: input.record,
      });
    } catch (error) {
      if (error instanceof MarketProfilePersistenceConflictError) {
        throw new MarketProfileError(
          "conflict",
          "Market profile changed before persistence.",
        );
      }
      throw error;
    }
    return command;
  }

  async snapshot(rawOrganizationId: string) {
    const organizationIdValue = organizationId(rawOrganizationId);
    const [claims, industry, pastPerformance, preferences, provisionalTerms] = await Promise.all([
      this.dependencies.repository.claims.listByOrganizationId(organizationIdValue),
      this.dependencies.repository.getIndustryProfile(organizationIdValue),
      this.dependencies.repository.listPastPerformance(organizationIdValue),
      this.dependencies.repository.getPreferences(organizationIdValue),
      this.dependencies.repository.listProvisionalTerms(organizationIdValue),
    ]);
    return Object.freeze({ claims, industry, pastPerformance, preferences, provisionalTerms });
  }

  async claimCapability(scope: MarketProfileCommandScope, input: Readonly<{
    claimId?: string;
    capabilityId: string;
    entityScope: string;
    marketRoleIds: readonly string[];
    deliveryRoles: readonly string[];
    serviceGeographyIds: readonly string[];
    specialties: readonly string[];
    capacity?: Readonly<{ value: number; unitId: string; period: string; note?: string | null }> | null;
    evidenceIds?: readonly string[];
    visibility: string;
    source: CapabilityClaimSource;
  }>) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const prior = await this.replay(scope, "capability-claimed", requestFingerprint);
    if (prior) return Object.freeze({ replayed: true as const, receipt: prior });

    const [release, capability, marketRoles, geographies] = await Promise.all([
      this.dependencies.catalog.getRelease(),
      this.dependencies.catalog.getCapability(input.capabilityId),
      this.dependencies.catalog.listMarketRoles(),
      this.dependencies.serviceGeographies.getByOrganizationId(authorization.organization.id),
    ]);
    if (!capability || capability.status !== "active" || capability.releaseVersion !== release.version) {
      throw new MarketProfileError("invalid", "Select an active capability from the current AMACS release.");
    }
    const validMarketRoleIds = new Set(marketRoles.flatMap((record) => typeof record.market_role_id === "string" ? [record.market_role_id] : []));
    if (!input.marketRoleIds.length || input.marketRoleIds.some((id) => !validMarketRoleIds.has(id))) {
      throw new MarketProfileError("invalid", "Select at least one current AMACS market role.");
    }
    const allowedGeographies = new Set((geographies?.serviceGeographyIds ?? []).map(String));
    if (!input.serviceGeographyIds.length || input.serviceGeographyIds.some((id) => !allowedGeographies.has(id))) {
      throw new MarketProfileError("invalid", "Capability geography must be part of the organization service geography.");
    }

    if (input.source.kind === "interpretation") {
      const [record, candidate] = await Promise.all([
        this.dependencies.interpretations.getRecord(input.source.interpretationRecordId),
        this.dependencies.interpretations.getCandidate(input.source.interpretationCandidateId),
      ]);
      if (!record || !candidate || record.organizationId !== scope.organizationId || candidate.organizationId !== scope.organizationId || candidate.interpretationRecordId !== record.id) {
        throw new MarketProfileError("not-found", "The accepted interpretation candidate is unavailable for this organization.");
      }
      if (record.record.amacs_release !== release.version || candidate.candidate.amacs_release !== release.version) {
        throw new MarketProfileError("conflict", "The accepted suggestion uses a stale AMACS release. Review the current catalog before saving.");
      }
      if (candidate.updatedAt !== input.source.candidateUpdatedAt) {
        throw new MarketProfileError("conflict", "The accepted suggestion changed. Review it again before saving.");
      }
      if (!["accepted", "edited"].includes(candidate.candidate.disposition)) {
        throw new MarketProfileError("conflict", "Confirm the suggestion before creating a capability claim.");
      }
      const value = candidate.candidate.candidate_value;
      if (!("amacs_id" in value) || value.amacs_id !== capability.conceptId) {
        throw new MarketProfileError("conflict", "The accepted suggestion does not match the selected AMACS capability.");
      }
    }

    const now = this.now();
    const claim = marketProfileInput(() => createOrganizationCapabilityClaim({
      id: input.claimId ?? `capclaim_${fingerprint(scope.commandId).slice(0, 40)}`,
      organizationId: authorization.organization.id,
      capability,
      entityScope: input.entityScope,
      marketRoleIds: input.marketRoleIds,
      deliveryRoles: input.deliveryRoles,
      serviceGeographyIds: input.serviceGeographyIds,
      specialties: input.specialties,
      capacity: input.capacity,
      evidenceIds: input.evidenceIds,
      visibility: input.visibility,
      source: input.source,
      userId: authorization.context.user.id,
      membershipId: authorization.membership.id,
      now,
    }), "Capability claim is invalid.");
    const receipt = await this.persist({ scope, authorization, action: "capability-claimed", subjectId: claim.id, requestFingerprint, record: { kind: "capability", value: claim }, now });
    return Object.freeze({ replayed: false as const, receipt, claim });
  }

  async updateIndustry(scope: MarketProfileCommandScope, input: Readonly<{
    industries: readonly Readonly<{ id: string; label: string; visibility: string }>[];
    naics: readonly Readonly<{ code: string; version: string; visibility: string }>[];
  }>) {
    const authorization = await this.authorize(scope);
    if (
      !Array.isArray(input.industries) ||
      !Array.isArray(input.naics) ||
      input.industries.length > 20 ||
      input.naics.length > 30
    ) {
      throw new MarketProfileError("invalid", "Industry context exceeds supported limits.");
    }
    const release = await this.dependencies.naicsCatalog.getRelease();
    const naics = await Promise.all(input.naics.map(async (selection) => {
      if (
        !selection ||
        typeof selection.code !== "string" ||
        typeof selection.version !== "string" ||
        typeof selection.visibility !== "string"
      ) {
        throw new MarketProfileError("invalid", "Select a governed NAICS industry.");
      }
      const industry = await this.dependencies.naicsCatalog.getIndustry(
        selection.code,
        selection.version,
      );
      if (!industry) {
        throw new MarketProfileError(
          "invalid",
          "Select a current industry from the governed NAICS release.",
        );
      }
      return Object.freeze({
        id: `naics-${industry.code}`,
        code: industry.code,
        title: industry.title,
        version: release.version,
        source: "participant_selected",
        provenance: `Participant selected from ${release.sourceName} ${release.version} NAICS`,
        visibility: selection.visibility,
      });
    }));
    if (new Set(naics.map((industry) => industry.code)).size !== naics.length) {
      throw new MarketProfileError("invalid", "Select each governed NAICS industry only once.");
    }
    const canonicalInput = Object.freeze({ industries: input.industries, naics });
    const requestFingerprint = fingerprint(canonicalInput);
    const prior = await this.replay(scope, "industry-context-updated", requestFingerprint);
    if (prior) return Object.freeze({ replayed: true as const, receipt: prior });
    const now = this.now();
    const profile = marketProfileInput(
      () => createIndustryProfile({ organizationId: authorization.organization.id, ...canonicalInput, userId: authorization.context.user.id, membershipId: authorization.membership.id, now }),
      "Industry context is invalid.",
    );
    const receipt = await this.persist({ scope, authorization, action: "industry-context-updated", subjectId: profile.id, requestFingerprint, record: { kind: "industry", value: profile }, now });
    return Object.freeze({ replayed: false as const, receipt, profile });
  }

  async addPastPerformance(scope: MarketProfileCommandScope, input: Omit<Parameters<typeof createPastPerformance>[0], "organizationId" | "userId" | "membershipId" | "now">) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const prior = await this.replay(scope, "past-performance-added", requestFingerprint);
    if (prior) return Object.freeze({ replayed: true as const, receipt: prior });
    const claims = await this.dependencies.repository.claims.listByOrganizationId(authorization.organization.id);
    const claimIds = new Set(claims.map((claim) => claim.id));
    if ((input.supportingCapabilityClaimIds ?? []).some((id) => !claimIds.has(id))) {
      throw new MarketProfileError("invalid", "Past performance can reference only this organization’s capability claims.");
    }
    const now = this.now();
    const record = marketProfileInput(
      () => createPastPerformance({ ...input, organizationId: authorization.organization.id, userId: authorization.context.user.id, membershipId: authorization.membership.id, now }),
      "Past performance is invalid.",
    );
    const receipt = await this.persist({ scope, authorization, action: "past-performance-added", subjectId: record.id, requestFingerprint, record: { kind: "past-performance", value: record }, now });
    return Object.freeze({ replayed: false as const, receipt, record });
  }

  async updatePreferences(scope: MarketProfileCommandScope, input: Omit<Parameters<typeof createMarketPreferences>[0], "organizationId" | "userId" | "membershipId" | "now">) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const prior = await this.replay(scope, "preferences-updated", requestFingerprint);
    if (prior) return Object.freeze({ replayed: true as const, receipt: prior });
    const now = this.now();
    const preferences = marketProfileInput(
      () => createMarketPreferences({ ...input, organizationId: authorization.organization.id, userId: authorization.context.user.id, membershipId: authorization.membership.id, now }),
      "Market preferences are invalid.",
    );
    const receipt = await this.persist({ scope, authorization, action: "preferences-updated", subjectId: preferences.id, requestFingerprint, record: { kind: "preferences", value: preferences }, now });
    return Object.freeze({ replayed: false as const, receipt, preferences });
  }

  async submitProvisionalTerm(scope: MarketProfileCommandScope, input: Omit<Parameters<typeof createProvisionalTerm>[0], "organizationId" | "userId" | "membershipId" | "now">) {
    const requestFingerprint = fingerprint(input);
    const authorization = await this.authorize(scope);
    const prior = await this.replay(scope, "provisional-term-submitted", requestFingerprint);
    if (prior) return Object.freeze({ replayed: true as const, receipt: prior });
    if (input.suggestedDomainId) {
      const domains = await this.dependencies.catalog.listDomains();
      if (!domains.some((domain) => domain.domainId === input.suggestedDomainId)) throw new MarketProfileError("invalid", "Suggested AMACS domain is unavailable.");
    }
    const now = this.now();
    const proposal = marketProfileInput(
      () => createProvisionalTerm({ ...input, organizationId: authorization.organization.id, userId: authorization.context.user.id, membershipId: authorization.membership.id, now }),
      "Provisional term is invalid.",
    );
    const receipt = await this.persist({ scope, authorization, action: "provisional-term-submitted", subjectId: proposal.id, requestFingerprint, record: { kind: "provisional-term", value: proposal }, now });
    return Object.freeze({ replayed: false as const, receipt, proposal });
  }
}
