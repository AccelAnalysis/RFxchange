import type { AuthenticatedServerContext } from "../auth/server-session.ts";
import {
  ACCESS_LIFECYCLE_STATES,
  accessJourneyId,
  advanceAccessLifecycle,
  type AccessJourneyId,
  type AccessLifecycleRecord,
} from "../../domain/lifecycle/model.ts";
import type { AccessLifecycleRepository } from "../../domain/lifecycle/repository.ts";
import {
  createPrimaryOperatingGeographySelection,
  geographyId,
  resolveGeographyCameraPlan,
  type GeographyCameraPlan,
  type GeographyDefinition,
  type PrimaryOperatingGeographySelection,
} from "../../domain/geography/model.ts";
import {
  evaluateGeographyParticipation,
  type GeographyParticipationDecision,
} from "../../domain/geography/policy.ts";
import type {
  GeographyDefinitionRepository,
  GeographyParticipationAuthorizationRepository,
  PrimaryGeographySelectionUnitOfWork,
  PrimaryOperatingGeographySelectionRepository,
} from "../../domain/geography/repository.ts";

export type GeographySelectionErrorCode =
  | "access-journey-not-found"
  | "access-journey-not-owned"
  | "geography-selection-not-current"
  | "invalid-lifecycle-state"
  | "unknown-geography"
  | "geography-participation-denied"
  | "primary-geography-required";

export class GeographySelectionError extends Error {
  readonly code: GeographySelectionErrorCode;

  constructor(code: GeographySelectionErrorCode, message: string) {
    super(message);
    this.name = "GeographySelectionError";
    this.code = code;
  }
}

export interface GeographySelectionResult {
  readonly selection: PrimaryOperatingGeographySelection;
  readonly geography: GeographyDefinition;
  readonly camera: GeographyCameraPlan;
  readonly participation: Extract<GeographyParticipationDecision, { readonly allowed: true }>;
  readonly lifecycle: AccessLifecycleRecord;
}

export interface PrimaryOperatingGeographyServiceDependencies {
  readonly definitions: GeographyDefinitionRepository;
  readonly selections: PrimaryOperatingGeographySelectionRepository;
  readonly authorizations: GeographyParticipationAuthorizationRepository;
  readonly lifecycle: AccessLifecycleRepository;
  readonly unitOfWork: PrimaryGeographySelectionUnitOfWork;
  readonly now: () => string;
}

function requireOwnedJourney(
  journey: AccessLifecycleRecord | null,
  context: AuthenticatedServerContext,
): AccessLifecycleRecord {
  if (!journey) {
    throw new GeographySelectionError(
      "access-journey-not-found",
      "Access journey was not found.",
    );
  }
  if (!journey.userId || journey.userId !== context.user.id) {
    throw new GeographySelectionError(
      "access-journey-not-owned",
      "Access journey is not bound to the authenticated RFxchange user.",
    );
  }
  return journey;
}

function lifecycleHasReachedGeography(journey: AccessLifecycleRecord): boolean {
  return (
    ACCESS_LIFECYCLE_STATES.indexOf(journey.state) >=
    ACCESS_LIFECYCLE_STATES.indexOf("geography-selected")
  );
}

export class PrimaryOperatingGeographyService {
  private readonly dependencies: PrimaryOperatingGeographyServiceDependencies;

  constructor(dependencies: PrimaryOperatingGeographyServiceDependencies) {
    this.dependencies = dependencies;
  }

  async select(input: Readonly<{
    context: AuthenticatedServerContext;
    accessJourneyId: string;
    geographyId: string;
  }>): Promise<GeographySelectionResult> {
    const journeyId = accessJourneyId(input.accessJourneyId);
    const journey = requireOwnedJourney(
      await this.dependencies.lifecycle.getById(journeyId),
      input.context,
    );
    if (journey.state !== "account-activated" && journey.state !== "geography-selected") {
      throw new GeographySelectionError(
        "invalid-lifecycle-state",
        "Primary geography may only be selected after account activation and before later onboarding stages.",
      );
    }

    const selectedGeographyId = geographyId(input.geographyId);
    const geography = await this.dependencies.definitions.getById(selectedGeographyId);
    if (!geography) {
      throw new GeographySelectionError(
        "unknown-geography",
        "Selected geography is not a canonical RFxchange geography.",
      );
    }

    const now = this.dependencies.now();
    const authorizations = await this.dependencies.authorizations.listByUserAndGeography(
      input.context.user.id,
      geography.id,
    );
    const participation = evaluateGeographyParticipation(
      geography,
      input.context.user.id,
      "primary-geography-selection",
      authorizations,
      now,
    );
    if (!participation.allowed) {
      throw new GeographySelectionError(
        "geography-participation-denied",
        `Primary geography selection denied: ${participation.reason}.`,
      );
    }

    const existing = await this.dependencies.selections.getByUserId(input.context.user.id);
    const selection = createPrimaryOperatingGeographySelection(
      input.context.user.id,
      journeyId,
      geography.id,
      now,
      existing,
    );
    const nextLifecycle =
      journey.state === "account-activated"
        ? advanceAccessLifecycle(journey, "geography-selected", now)
        : journey;

    await this.dependencies.unitOfWork.commit(selection, nextLifecycle);

    return Object.freeze({
      selection,
      geography,
      camera: resolveGeographyCameraPlan(geography),
      participation,
      lifecycle: nextLifecycle,
    });
  }

  async requireForOrientation(input: Readonly<{
    context: AuthenticatedServerContext;
    accessJourneyId: string;
  }>): Promise<GeographySelectionResult> {
    const journeyId: AccessJourneyId = accessJourneyId(input.accessJourneyId);
    const journey = requireOwnedJourney(
      await this.dependencies.lifecycle.getById(journeyId),
      input.context,
    );
    if (!lifecycleHasReachedGeography(journey)) {
      throw new GeographySelectionError(
        "primary-geography-required",
        "A server-authorized primary geography is required before orientation.",
      );
    }

    const selection = await this.dependencies.selections.getByUserId(input.context.user.id);
    if (!selection) {
      throw new GeographySelectionError(
        "primary-geography-required",
        "A persisted primary geography selection is required before orientation.",
      );
    }
    if (selection.accessJourneyId !== journeyId) {
      throw new GeographySelectionError(
        "geography-selection-not-current",
        "Persisted primary geography belongs to a different access journey.",
      );
    }

    const geography = await this.dependencies.definitions.getById(selection.geographyId);
    if (!geography) {
      throw new GeographySelectionError(
        "unknown-geography",
        "Persisted primary geography no longer resolves to canonical metadata.",
      );
    }

    const now = this.dependencies.now();
    const authorizations = await this.dependencies.authorizations.listByUserAndGeography(
      input.context.user.id,
      geography.id,
    );
    const participation = evaluateGeographyParticipation(
      geography,
      input.context.user.id,
      "orientation",
      authorizations,
      now,
    );
    if (!participation.allowed) {
      throw new GeographySelectionError(
        "geography-participation-denied",
        `Orientation geography authorization denied: ${participation.reason}.`,
      );
    }

    return Object.freeze({
      selection,
      geography,
      camera: resolveGeographyCameraPlan(geography),
      participation,
      lifecycle: journey,
    });
  }
}
