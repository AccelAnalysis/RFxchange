import type { AcquisitionIntentKind } from "../acquisition/model.ts";
import type { AccessJourneyId, AccessLifecycleRecord } from "../lifecycle/model.ts";
import type { OrganizationId } from "../organizations/model.ts";
import type { UserId } from "../users/model.ts";

export const FIRST_VALUE_CATALOG_VERSION = 1 as const;

export class FirstValueStateError extends Error {
  readonly code: "conflict" | "forbidden";

  constructor(code: FirstValueStateError["code"], message: string) {
    super(message);
    this.name = "FirstValueStateError";
    this.code = code;
  }
}

export const FIRST_VALUE_INTENTS = [
  "find-opportunities",
  "issue-opportunity",
  "find-customers-suppliers",
  "find-teammate",
  "send-receive-referral",
  "find-resources-support",
  "explore-network",
] as const;

export type FirstValueIntent = (typeof FIRST_VALUE_INTENTS)[number];

export interface FirstValueDestinationContract {
  readonly intent: FirstValueIntent;
  readonly label: string;
  readonly summary: string;
  readonly workspace: "opportunities" | "network" | "referrals" | "resources" | "intelligence";
  readonly availability: "available" | "upcoming";
  readonly route: "/geography/canvas" | "/referrals" | null;
  readonly availabilityMessage: string;
}

export const FIRST_VALUE_DESTINATIONS: Readonly<Record<FirstValueIntent, FirstValueDestinationContract>> = Object.freeze({
  "find-opportunities": Object.freeze({
    intent: "find-opportunities", label: "Find an opportunity", summary: "Discover demand that matches what your organization can contribute.",
    workspace: "opportunities", availability: "upcoming", route: null,
    availabilityMessage: "Your intent is saved. Live participant opportunity discovery arrives in its approved RFx slice; public opportunity context remains available where it was preserved.",
  }),
  "issue-opportunity": Object.freeze({
    intent: "issue-opportunity", label: "Issue an opportunity", summary: "Make a business need visible to capable organizations.",
    workspace: "opportunities", availability: "upcoming", route: null,
    availabilityMessage: "Your intent is saved. Live opportunity authoring and publication are not yet enabled.",
  }),
  "find-customers-suppliers": Object.freeze({
    intent: "find-customers-suppliers", label: "Find customers or suppliers", summary: "Explore organizations through capabilities and local market context.",
    workspace: "network", availability: "upcoming", route: null,
    availabilityMessage: "Your intent is saved. Rich organization and capability discovery follows in the Network wave.",
  }),
  "find-teammate": Object.freeze({
    intent: "find-teammate", label: "Find a teammate", summary: "Look for complementary capability when one organization cannot cover the whole need.",
    workspace: "network", availability: "upcoming", route: null,
    availabilityMessage: "Your intent is saved. Live teammate search and invitations are not yet enabled.",
  }),
  "send-receive-referral": Object.freeze({
    intent: "send-receive-referral", label: "Send or receive a referral", summary: "Connect a trusted business need to an appropriate organization.",
    workspace: "referrals", availability: "available", route: "/referrals",
    availabilityMessage: "Open the referral workspace to send or respond to an organization-owned referral.",
  }),
  "find-resources-support": Object.freeze({
    intent: "find-resources-support", label: "Find resources or support", summary: "Locate relevant programs and approved support providers.",
    workspace: "resources", availability: "upcoming", route: null,
    availabilityMessage: "Your intent is saved. Official Resource Provider discovery follows the separate application and approval foundation.",
  }),
  "explore-network": Object.freeze({
    intent: "explore-network", label: "Explore the network", summary: "Return to your locality map and build geographic understanding.",
    workspace: "intelligence", availability: "available", route: "/geography/canvas",
    availabilityMessage: "Your controlled locality map is available now. Future layers will appear only as their approved feature slices complete.",
  }),
});

export interface FirstValueSelection {
  /** Stable singleton identity equals the bound access journey id. */
  readonly id: string;
  readonly catalogVersion: typeof FIRST_VALUE_CATALOG_VERSION;
  readonly accessJourneyId: AccessJourneyId;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly presentedIntents: readonly FirstValueIntent[];
  readonly presentationSource: "post-orientation-first-value";
  readonly presentedAt: string;
  readonly selectedIntent: FirstValueIntent;
  readonly acquisitionRecommendation: FirstValueIntent | null;
  readonly selectedAt: string;
  readonly updatedAt: string;
}

export interface ActivationReleaseEvent {
  readonly id: string;
  readonly accessJourneyId: AccessJourneyId;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly kind: "first-value-selected" | "first-value-updated" | "open-released";
  readonly selectedIntent: FirstValueIntent;
  readonly priorLifecycleState: AccessLifecycleRecord["state"];
  readonly newLifecycleState: AccessLifecycleRecord["state"];
  readonly occurredAt: string;
}

function timestamp(value: string, label: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) throw new Error(`${label} must be a valid timestamp.`);
  return parsed.toISOString();
}

export function firstValueIntent(value: string): FirstValueIntent {
  if (!FIRST_VALUE_INTENTS.includes(value as FirstValueIntent)) {
    throw new Error(`Unsupported first-value intent: ${value}.`);
  }
  return value as FirstValueIntent;
}

export function recommendFirstValueIntent(kind: AcquisitionIntentKind | null): FirstValueIntent | null {
  if (!kind || kind === "direct") return null;
  return Object.freeze({
    opportunity: "find-opportunities",
    "organization-claim": "explore-network",
    referral: "send-receive-referral",
    "team-invitation": "find-teammate",
    provider: "find-resources-support",
    "buyer-need": "find-customers-suppliers",
  } satisfies Record<Exclude<AcquisitionIntentKind, "direct">, FirstValueIntent>)[kind];
}

export function createFirstValueSelection(input: Readonly<{
  accessJourneyId: AccessJourneyId;
  userId: UserId;
  organizationId: OrganizationId;
  selectedIntent: string;
  acquisitionRecommendation?: FirstValueIntent | null;
  now: string;
}>): FirstValueSelection {
  const now = timestamp(input.now, "First-value selection time");
  return Object.freeze({
    id: String(input.accessJourneyId),
    catalogVersion: FIRST_VALUE_CATALOG_VERSION,
    accessJourneyId: input.accessJourneyId,
    userId: input.userId,
    organizationId: input.organizationId,
    presentedIntents: Object.freeze([...FIRST_VALUE_INTENTS]),
    presentationSource: "post-orientation-first-value" as const,
    presentedAt: now,
    selectedIntent: firstValueIntent(input.selectedIntent),
    acquisitionRecommendation: input.acquisitionRecommendation ?? null,
    selectedAt: now,
    updatedAt: now,
  });
}

export function updateFirstValueSelection(
  current: FirstValueSelection,
  selectedIntent: string,
  now: string,
): FirstValueSelection {
  return Object.freeze({
    ...current,
    selectedIntent: firstValueIntent(selectedIntent),
    selectedAt: timestamp(now, "First-value selection time"),
    updatedAt: timestamp(now, "First-value update time"),
  });
}

export function createActivationReleaseEvent(input: Readonly<{
  id: string;
  selection: FirstValueSelection;
  kind: ActivationReleaseEvent["kind"];
  priorLifecycleState: AccessLifecycleRecord["state"];
  newLifecycleState: AccessLifecycleRecord["state"];
  now: string;
}>): ActivationReleaseEvent {
  if (!input.id.trim()) throw new Error("Activation release event id is required.");
  return Object.freeze({
    id: input.id.trim(),
    accessJourneyId: input.selection.accessJourneyId,
    userId: input.selection.userId,
    organizationId: input.selection.organizationId,
    kind: input.kind,
    selectedIntent: input.selection.selectedIntent,
    priorLifecycleState: input.priorLifecycleState,
    newLifecycleState: input.newLifecycleState,
    occurredAt: timestamp(input.now, "Activation release event time"),
  });
}
