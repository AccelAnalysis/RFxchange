import type { AcquisitionIntentKind } from "../../domain/acquisition/model.ts";
import {
  createActivationReleaseEvent,
  createFirstValueSelection,
  FirstValueStateError,
  recommendFirstValueIntent,
  updateFirstValueSelection,
  type FirstValueIntent,
  type FirstValueSelection,
} from "../../domain/first-value/model.ts";
import type { FirstValueSelectionRepository } from "../../domain/first-value/repository.ts";
import {
  advanceAccessLifecycle,
  type AccessJourneyId,
  type AccessLifecycleRecord,
  type AccessRestrictionState,
} from "../../domain/lifecycle/model.ts";
import type { OrganizationId } from "../../domain/organizations/model.ts";
import type { UserId } from "../../domain/users/model.ts";

export const OPEN_RELEASE_REQUIREMENTS = [
  "controlled-platform-state",
  "usable-account",
  "current-authentication",
  "active-membership",
  "no-blocking-restriction",
  "current-policies",
  "organization-authority",
  "profile-complete",
  "active-marker-in-allowed-geography",
  "orientation-complete",
  "first-value-selected-and-presented",
] as const;

export type OpenReleaseRequirement = (typeof OPEN_RELEASE_REQUIREMENTS)[number];

export const OPEN_RELEASE_REMEDIATION: Readonly<Record<OpenReleaseRequirement, string>> = Object.freeze({
  "controlled-platform-state": "/join",
  "usable-account": "/signin",
  "current-authentication": "/signin",
  "active-membership": "/organization-authority",
  "no-blocking-restriction": "/join",
  "current-policies": "/join?step=legal",
  "organization-authority": "/organization-authority",
  "profile-complete": "/organization-profile",
  "active-marker-in-allowed-geography": "/organization-location",
  "orientation-complete": "/orientation",
  "first-value-selected-and-presented": "/first-value",
});

export interface OpenReleaseScope {
  readonly accessJourneyId: AccessJourneyId;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
}

export interface OpenReleaseSnapshot {
  readonly scope: OpenReleaseScope;
  readonly lifecycle: AccessLifecycleRecord;
  readonly accountUsable: boolean;
  readonly authenticationCurrent: boolean;
  readonly membershipActive: boolean;
  readonly restrictionState: AccessRestrictionState;
  readonly policiesCurrent: boolean;
  readonly organizationAuthorityEstablished: boolean;
  readonly profileComplete: boolean;
  readonly markerActiveInAllowedGeography: boolean;
  readonly orientationComplete: boolean;
  readonly selection: FirstValueSelection | null;
}

export type OpenReleaseGateResolution =
  | Readonly<{
      kind: "ready";
      lifecycleState: "controlled-platform" | "open-platform";
      satisfied: readonly OpenReleaseRequirement[];
    }>
  | Readonly<{
      kind: "blocked";
      lifecycleState: AccessLifecycleRecord["state"];
      failed: readonly OpenReleaseRequirement[];
      remediation: string;
    }>;

export function evaluateOpenReleaseGate(snapshot: OpenReleaseSnapshot): OpenReleaseGateResolution {
  const failed: OpenReleaseRequirement[] = [];
  if (snapshot.lifecycle.state !== "controlled-platform" && snapshot.lifecycle.state !== "open-platform") {
    failed.push("controlled-platform-state");
  }
  if (!snapshot.accountUsable) failed.push("usable-account");
  if (!snapshot.authenticationCurrent) failed.push("current-authentication");
  if (!snapshot.membershipActive) failed.push("active-membership");
  if (snapshot.restrictionState !== "none") failed.push("no-blocking-restriction");
  if (!snapshot.policiesCurrent) failed.push("current-policies");
  if (!snapshot.organizationAuthorityEstablished) failed.push("organization-authority");
  if (!snapshot.profileComplete) failed.push("profile-complete");
  if (!snapshot.markerActiveInAllowedGeography) failed.push("active-marker-in-allowed-geography");
  if (!snapshot.orientationComplete) failed.push("orientation-complete");
  if (
    !snapshot.selection ||
    snapshot.selection.userId !== snapshot.scope.userId ||
    snapshot.selection.organizationId !== snapshot.scope.organizationId ||
    snapshot.selection.accessJourneyId !== snapshot.scope.accessJourneyId ||
    snapshot.selection.presentationSource !== "post-orientation-first-value" ||
    snapshot.selection.presentedIntents.length === 0
  ) failed.push("first-value-selected-and-presented");
  if (failed.length) {
    return Object.freeze({
      kind: "blocked" as const,
      lifecycleState: snapshot.lifecycle.state,
      failed: Object.freeze(failed),
      remediation: OPEN_RELEASE_REMEDIATION[failed[0]],
    });
  }
  return Object.freeze({
    kind: "ready" as const,
    lifecycleState: snapshot.lifecycle.state as "controlled-platform" | "open-platform",
    satisfied: Object.freeze([...OPEN_RELEASE_REQUIREMENTS]),
  });
}

export interface OpenReleaseSnapshotReader {
  read(scope: OpenReleaseScope): Promise<OpenReleaseSnapshot>;
}

export class FirstValueAndOpenReleaseService {
  private readonly dependencies: Readonly<{
    selections: FirstValueSelectionRepository;
    snapshots: OpenReleaseSnapshotReader;
    ids: Readonly<{ event(): string }>;
    now: () => string;
  }>;

  constructor(dependencies: Readonly<{
    selections: FirstValueSelectionRepository;
    snapshots: OpenReleaseSnapshotReader;
    ids: Readonly<{ event(): string }>;
    now: () => string;
  }>) {
    this.dependencies = dependencies;
  }

  get(scope: OpenReleaseScope): Promise<FirstValueSelection | null> {
    return this.dependencies.selections.getByAccessJourneyId(String(scope.accessJourneyId));
  }

  async evaluate(scope: OpenReleaseScope): Promise<OpenReleaseGateResolution> {
    return evaluateOpenReleaseGate(await this.dependencies.snapshots.read(scope));
  }

  async selectAndRelease(input: Readonly<{
    scope: OpenReleaseScope;
    selectedIntent: string;
    acquisitionIntentKind: AcquisitionIntentKind | null;
  }>): Promise<Readonly<{
    selection: FirstValueSelection;
    gate: OpenReleaseGateResolution;
    lifecycleState: AccessLifecycleRecord["state"];
  }>> {
    const before = await this.dependencies.snapshots.read(input.scope);
    if (!before.orientationComplete) {
      throw new FirstValueStateError(
        "conflict",
        "Complete orientation before selecting first value.",
      );
    }
    if (before.lifecycle.state !== "controlled-platform" && before.lifecycle.state !== "open-platform") {
      throw new FirstValueStateError(
        "conflict",
        "Controlled-platform access is required before selecting first value.",
      );
    }
    if (before.lifecycle.state === "open-platform") {
      if (!before.selection || before.selection.selectedIntent !== input.selectedIntent) {
        throw new FirstValueStateError(
          "conflict",
          "The OPEN first-value selection cannot be changed through activation.",
        );
      }
      const gate = evaluateOpenReleaseGate(before);
      return Object.freeze({ selection: before.selection, gate, lifecycleState: "open-platform" as const });
    }

    const recommendation = recommendFirstValueIntent(input.acquisitionIntentKind);
    const now = this.dependencies.now();
    const selection = before.selection
      ? updateFirstValueSelection(before.selection, input.selectedIntent, now)
      : createFirstValueSelection({
          ...input.scope,
          selectedIntent: input.selectedIntent,
          acquisitionRecommendation: recommendation,
          now,
        });
    if (
      selection.userId !== input.scope.userId ||
      selection.organizationId !== input.scope.organizationId ||
      selection.accessJourneyId !== input.scope.accessJourneyId
    ) {
      throw new FirstValueStateError(
        "forbidden",
        "First-value selection belongs to another participant journey.",
      );
    }
    await this.dependencies.selections.saveSelection({
      expectedUpdatedAt: before.selection?.updatedAt ?? null,
      selection,
      event: createActivationReleaseEvent({
        id: this.dependencies.ids.event(),
        selection,
        kind: before.selection ? "first-value-updated" : "first-value-selected",
        priorLifecycleState: before.lifecycle.state,
        newLifecycleState: before.lifecycle.state,
        now,
      }),
    });

    // Re-read every gate after persistence. The browser selection is never treated as OPEN authority.
    const fresh = await this.dependencies.snapshots.read(input.scope);
    const gate = evaluateOpenReleaseGate(fresh);
    if (gate.kind === "blocked") {
      return Object.freeze({ selection, gate, lifecycleState: fresh.lifecycle.state });
    }
    if (fresh.lifecycle.state === "open-platform") {
      return Object.freeze({ selection, gate, lifecycleState: "open-platform" as const });
    }
    const opened = advanceAccessLifecycle(fresh.lifecycle, "open-platform", this.dependencies.now());
    await this.dependencies.selections.releaseOpen({
      lifecycle: opened,
      selection,
      event: createActivationReleaseEvent({
        id: `open-release-${String(input.scope.accessJourneyId)}`,
        selection,
        kind: "open-released",
        priorLifecycleState: fresh.lifecycle.state,
        newLifecycleState: opened.state,
        now: opened.updatedAt,
      }),
    });
    return Object.freeze({ selection, gate, lifecycleState: "open-platform" as const });
  }

  recommendation(kind: AcquisitionIntentKind | null): FirstValueIntent | null {
    return recommendFirstValueIntent(kind);
  }
}
