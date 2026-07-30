import {
  advanceAccessLifecycle,
  type AccessJourneyId,
  type AccessLifecycleRecord,
} from "../../domain/lifecycle/model.ts";
import type { AccessLifecycleRepository } from "../../domain/lifecycle/repository.ts";
import {
  createPrimaryOperatingGeographySelection,
  revisePrimaryOperatingGeographySelection,
  type PrimaryOperatingGeographySelection,
} from "../../domain/geography/model.ts";
import type { PrimaryOperatingGeographySelectionRepository } from "../../domain/geography/repository.ts";
import type { UserIdentity } from "../../domain/users/model.ts";

export interface PrimaryOperatingGeographySelectionResult {
  readonly selection: PrimaryOperatingGeographySelection;
  readonly lifecycle: AccessLifecycleRecord;
}

export type OnboardingOrientationEligibility =
  | Readonly<{ readonly allowed: true; readonly selection: PrimaryOperatingGeographySelection }>
  | Readonly<{
      readonly allowed: false;
      readonly reason:
        | "access-journey-not-found"
        | "primary-operating-geography-required"
        | "geography-lifecycle-not-reached"
        | "selection-journey-mismatch";
    }>;

const POST_GEOGRAPHY_STATES = new Set([
  "geography-selected",
  "organization-resolved",
  "organization-registered",
  "organization-activated",
  "controlled-platform",
  "open-platform",
]);

/**
 * GEO-001 owns the user's required primary locality choice. It does not decide whether that
 * locality is released, valid for territory access, or authoritative GIS metadata; those checks
 * belong to GEO-002+ and remain server-owned.
 */
export class PrimaryOperatingGeographyService {
  private readonly selections: PrimaryOperatingGeographySelectionRepository;
  private readonly lifecycle: AccessLifecycleRepository;

  constructor(input: Readonly<{
    selections: PrimaryOperatingGeographySelectionRepository;
    lifecycle: AccessLifecycleRepository;
  }>) {
    this.selections = input.selections;
    this.lifecycle = input.lifecycle;
  }

  async select(input: Readonly<{
    user: UserIdentity;
    accessJourneyId: AccessJourneyId;
    localityId: string;
    localityName: string;
    localityKind: string;
    now: string;
  }>): Promise<PrimaryOperatingGeographySelectionResult> {
    const journey = await this.lifecycle.getById(input.accessJourneyId);
    if (!journey) throw new Error(`Access journey not found: ${input.accessJourneyId}.`);

    if (journey.state !== "account-activated" && journey.state !== "geography-selected") {
      throw new Error(
        `Primary operating geography can only be selected during the geography onboarding step; current lifecycle state is ${journey.state}.`,
      );
    }

    const current = await this.selections.getByUserId(input.user.id);
    if (current && current.accessJourneyId !== journey.id) {
      throw new Error("Existing primary operating geography belongs to a different access journey.");
    }

    const selection = current
      ? revisePrimaryOperatingGeographySelection(current, {
          localityId: input.localityId,
          localityName: input.localityName,
          localityKind: input.localityKind,
          now: input.now,
        })
      : createPrimaryOperatingGeographySelection({
          userId: input.user.id,
          accessJourneyId: journey.id,
          localityId: input.localityId,
          localityName: input.localityName,
          localityKind: input.localityKind,
          now: input.now,
        });

    // Persist the required choice first. If lifecycle persistence fails, the user remains blocked
    // before geography-selected and a retry can safely complete the transition.
    await this.selections.save(selection);

    const nextLifecycle = journey.state === "account-activated"
      ? advanceAccessLifecycle(journey, "geography-selected", input.now)
      : journey;
    if (nextLifecycle !== journey) await this.lifecycle.save(nextLifecycle);

    return Object.freeze({ selection, lifecycle: nextLifecycle });
  }

  async orientationEligibility(input: Readonly<{
    user: UserIdentity;
    accessJourneyId: AccessJourneyId;
  }>): Promise<OnboardingOrientationEligibility> {
    const journey = await this.lifecycle.getById(input.accessJourneyId);
    if (!journey) return Object.freeze({ allowed: false as const, reason: "access-journey-not-found" as const });

    const selection = await this.selections.getByUserId(input.user.id);
    if (!selection) {
      return Object.freeze({ allowed: false as const, reason: "primary-operating-geography-required" as const });
    }
    if (selection.accessJourneyId !== journey.id) {
      return Object.freeze({ allowed: false as const, reason: "selection-journey-mismatch" as const });
    }
    if (!POST_GEOGRAPHY_STATES.has(journey.state)) {
      return Object.freeze({ allowed: false as const, reason: "geography-lifecycle-not-reached" as const });
    }

    return Object.freeze({ allowed: true as const, selection });
  }
}
