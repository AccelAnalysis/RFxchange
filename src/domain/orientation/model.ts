import type { GeographyId } from "../geography/model.ts";
import type { AccessJourneyId } from "../lifecycle/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { UserId } from "../users/model.ts";

export const ORIENTATION_SCENARIO_ID = "exchange-network-basics" as const;
export const ORIENTATION_SCENARIO_VERSION = 1 as const;

export const ORIENTATION_STEP_SEQUENCE = Object.freeze([
  Object.freeze({ order: 1, key: "three-organization-scenario", title: "Meet the local network" }),
  Object.freeze({ order: 2, key: "opportunity-issuance", title: "Demand becomes visible" }),
  Object.freeze({ order: 3, key: "capability-match", title: "Capability creates a potential fit" }),
  Object.freeze({ order: 4, key: "gap-and-teammate-discovery", title: "A gap reveals a teammate" }),
  Object.freeze({ order: 5, key: "teammate-invitation", title: "The teammate reviews an invitation" }),
  Object.freeze({ order: 6, key: "joint-response", title: "The team structures a response" }),
  Object.freeze({ order: 7, key: "human-evaluation", title: "The issuer makes a human selection" }),
  Object.freeze({ order: 8, key: "network-effect", title: "The complete network effect" }),
] as const);

export type OrientationStepKey = (typeof ORIENTATION_STEP_SEQUENCE)[number]["key"];
export const SLICE_2_10_MAX_ORIENTATION_STEP = 4 as const;

export interface OrientationJourney {
  readonly id: string;
  readonly version: 1;
  readonly scenarioId: typeof ORIENTATION_SCENARIO_ID;
  readonly scenarioVersion: typeof ORIENTATION_SCENARIO_VERSION;
  readonly userId: UserId;
  readonly accessJourneyId: AccessJourneyId;
  readonly organizationId: OrganizationId;
  readonly geographyId: GeographyId;
  readonly status: "in-progress" | "completed";
  readonly completedThroughStep: number;
  readonly revision: number;
  readonly restartCount: number;
  readonly startedAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
}

export type OrientationJourneyEventKind = "started" | "step-completed" | "restarted" | "completed";

export interface OrientationJourneyEvent {
  readonly id: string;
  readonly orientationJourneyId: string;
  readonly kind: OrientationJourneyEventKind;
  readonly stepKey: OrientationStepKey | null;
  readonly completedThroughStep: number;
  readonly revision: number;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly geographyId: GeographyId;
  readonly occurredAt: string;
}

function required(value: string, label: string, maximum = 191): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} exceeds ${maximum} characters.`);
  return normalized;
}

function stableId(value: string, label: string): string {
  const normalized = required(value, label);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(normalized)) {
    throw new Error(`${label} must be a stable identifier.`);
  }
  return normalized;
}

function timestamp(value: string, label: string): string {
  const parsed = new Date(required(value, label, 64));
  if (Number.isNaN(parsed.valueOf())) throw new Error(`${label} must be a valid timestamp.`);
  return parsed.toISOString();
}

function stepForKey(key: OrientationStepKey) {
  const step = ORIENTATION_STEP_SEQUENCE.find((candidate) => candidate.key === key);
  if (!step) throw new Error("Orientation step is not part of the canonical sequence.");
  return step;
}

function validateBinding(input: Readonly<{
  userId: UserId;
  accessJourneyId: AccessJourneyId;
  organizationId: OrganizationId;
  geographyId: GeographyId;
}>): void {
  required(String(input.userId), "Orientation user id");
  required(String(input.accessJourneyId), "Orientation access journey id");
  required(String(input.organizationId), "Orientation organization id");
  required(String(input.geographyId), "Orientation geography id");
}

export function orientationJourneyIdForAccessJourney(accessJourneyId: AccessJourneyId): string {
  return stableId(`orientation-${String(accessJourneyId)}`, "Orientation journey id");
}

export function createOrientationJourney(input: Readonly<{
  id: string;
  userId: UserId;
  accessJourneyId: AccessJourneyId;
  organizationId: OrganizationId;
  geographyId: GeographyId;
  now: string;
}>): OrientationJourney {
  validateBinding(input);
  const now = timestamp(input.now, "Orientation start time");
  return Object.freeze({
    id: stableId(input.id, "Orientation journey id"),
    version: 1 as const,
    scenarioId: ORIENTATION_SCENARIO_ID,
    scenarioVersion: ORIENTATION_SCENARIO_VERSION,
    userId: input.userId,
    accessJourneyId: input.accessJourneyId,
    organizationId: input.organizationId,
    geographyId: input.geographyId,
    status: "in-progress" as const,
    completedThroughStep: 0,
    revision: 1,
    restartCount: 0,
    startedAt: now,
    updatedAt: now,
    completedAt: null,
  });
}

export function assertOrientationJourneyBinding(
  journey: OrientationJourney,
  expected: Readonly<{
    userId: UserId;
    accessJourneyId: AccessJourneyId;
    organizationId: OrganizationId;
    geographyId: GeographyId;
  }>,
): void {
  validateBinding(expected);
  if (
    journey.userId !== expected.userId ||
    journey.accessJourneyId !== expected.accessJourneyId ||
    journey.organizationId !== expected.organizationId ||
    journey.geographyId !== expected.geographyId
  ) {
    throw new Error("Orientation journey belongs to another participant scope.");
  }
}

export function completeOrientationStep(input: Readonly<{
  journey: OrientationJourney;
  stepKey: OrientationStepKey;
  maximumAllowedStep: number;
  now: string;
}>): OrientationJourney {
  const step = stepForKey(input.stepKey);
  if (!Number.isInteger(input.maximumAllowedStep) || input.maximumAllowedStep < 1 || input.maximumAllowedStep > 8) {
    throw new Error("Orientation phase limit is invalid.");
  }
  if (step.order > input.maximumAllowedStep) {
    throw new Error("This orientation step is not enabled in the current approved slice.");
  }
  if (step.order <= input.journey.completedThroughStep) return input.journey;
  if (step.order !== input.journey.completedThroughStep + 1) {
    throw new Error("Orientation steps must be completed in canonical order.");
  }
  const now = timestamp(input.now, "Orientation step completion time");
  const completesJourney = step.order === ORIENTATION_STEP_SEQUENCE.length;
  return Object.freeze({
    ...input.journey,
    status: completesJourney ? "completed" as const : "in-progress" as const,
    completedThroughStep: step.order,
    revision: input.journey.revision + 1,
    updatedAt: now,
    completedAt: completesJourney ? now : null,
  });
}

export function restartOrientationJourney(
  journey: OrientationJourney,
  nowValue: string,
): OrientationJourney {
  const now = timestamp(nowValue, "Orientation restart time");
  return Object.freeze({
    ...journey,
    status: "in-progress" as const,
    completedThroughStep: 0,
    revision: journey.revision + 1,
    restartCount: journey.restartCount + 1,
    startedAt: now,
    updatedAt: now,
    completedAt: null,
  });
}

export function createOrientationJourneyEvent(input: Readonly<{
  id: string;
  journey: OrientationJourney;
  kind: OrientationJourneyEventKind;
  stepKey?: OrientationStepKey | null;
  occurredAt: string;
}>): OrientationJourneyEvent {
  const stepKey = input.stepKey ?? null;
  if ((input.kind === "step-completed" || input.kind === "completed") && !stepKey) {
    throw new Error("Orientation completion evidence requires a step key.");
  }
  if ((input.kind === "started" || input.kind === "restarted") && stepKey) {
    throw new Error("Orientation start/restart evidence cannot claim a completed step.");
  }
  if (stepKey && stepForKey(stepKey).order !== input.journey.completedThroughStep) {
    throw new Error("Orientation event step does not match current journey progress.");
  }
  if (input.kind === "completed" && input.journey.status !== "completed") {
    throw new Error("Orientation completion evidence requires a completed journey.");
  }
  return Object.freeze({
    id: stableId(input.id, "Orientation event id"),
    orientationJourneyId: input.journey.id,
    kind: input.kind,
    stepKey,
    completedThroughStep: input.journey.completedThroughStep,
    revision: input.journey.revision,
    userId: input.journey.userId,
    organizationId: input.journey.organizationId,
    geographyId: input.journey.geographyId,
    occurredAt: timestamp(input.occurredAt, "Orientation event time"),
  });
}

export function orientationCurrentStep(journey: OrientationJourney | null): (typeof ORIENTATION_STEP_SEQUENCE)[number] {
  const index = journey ? Math.min(journey.completedThroughStep, ORIENTATION_STEP_SEQUENCE.length - 1) : 0;
  return ORIENTATION_STEP_SEQUENCE[index] ?? ORIENTATION_STEP_SEQUENCE[0];
}
