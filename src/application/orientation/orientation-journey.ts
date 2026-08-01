import type { AccessJourneyId } from "../../domain/lifecycle/model.ts";
import {
  SLICE_2_11_MAX_ORIENTATION_STEP,
  assertOrientationJourneyBinding,
  completeOrientationStep,
  createOrientationJourney,
  createOrientationJourneyEvent,
  orientationJourneyIdForAccessJourney,
  restartOrientationJourney,
  type OrientationJourney,
  type OrientationStepKey,
} from "../../domain/orientation/model.ts";
import type { OrientationJourneyRepository } from "../../domain/orientation/repository.ts";
import type { GeographyId } from "../../domain/geography/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type { UserId } from "../../domain/users/model.ts";

export interface OrientationJourneyScope {
  readonly userId: UserId;
  readonly accessJourneyId: AccessJourneyId;
  readonly organizationId: OrganizationId;
  readonly geographyId: GeographyId;
}

export interface OrientationJourneyServiceDependencies {
  readonly journeys: OrientationJourneyRepository;
  readonly ids: Readonly<{ event(): string }>;
  readonly now: () => string;
}

export class OrientationJourneyService {
  private readonly dependencies: OrientationJourneyServiceDependencies;

  constructor(dependencies: OrientationJourneyServiceDependencies) {
    this.dependencies = dependencies;
  }

  private id(scope: OrientationJourneyScope): string {
    return orientationJourneyIdForAccessJourney(scope.accessJourneyId);
  }

  async get(scope: OrientationJourneyScope): Promise<OrientationJourney | null> {
    const journey = await this.dependencies.journeys.getById(this.id(scope));
    if (journey) assertOrientationJourneyBinding(journey, scope);
    return journey;
  }

  async start(scope: OrientationJourneyScope): Promise<OrientationJourney> {
    const existing = await this.get(scope);
    if (existing) return existing;
    const now = this.dependencies.now();
    const journey = createOrientationJourney({ id: this.id(scope), ...scope, now });
    await this.dependencies.journeys.saveTransition({
      expectedRevision: null,
      journey,
      event: createOrientationJourneyEvent({
        id: this.dependencies.ids.event(), journey, kind: "started", occurredAt: now,
      }),
    });
    return journey;
  }

  async completeStep(
    scope: OrientationJourneyScope,
    stepKey: OrientationStepKey,
  ): Promise<OrientationJourney> {
    const current = await this.get(scope);
    if (!current) throw new Error("Orientation must be started before a step can be completed.");
    const now = this.dependencies.now();
    const next = completeOrientationStep({
      journey: current,
      stepKey,
      maximumAllowedStep: SLICE_2_11_MAX_ORIENTATION_STEP,
      now,
    });
    if (next === current) return current;
    await this.dependencies.journeys.saveTransition({
      expectedRevision: current.revision,
      journey: next,
      event: createOrientationJourneyEvent({
        id: this.dependencies.ids.event(),
        journey: next,
        kind: next.status === "completed" ? "completed" : "step-completed",
        stepKey,
        occurredAt: now,
      }),
    });
    return next;
  }

  async restart(scope: OrientationJourneyScope): Promise<OrientationJourney> {
    const current = await this.get(scope);
    if (!current) return this.start(scope);
    const now = this.dependencies.now();
    const next = restartOrientationJourney(current, now);
    await this.dependencies.journeys.saveTransition({
      expectedRevision: current.revision,
      journey: next,
      event: createOrientationJourneyEvent({
        id: this.dependencies.ids.event(), journey: next, kind: "restarted", occurredAt: now,
      }),
    });
    return next;
  }
}
