import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import { participantLifecycleDestination } from "../../application/auth/participant-lifecycle-destination.ts";
import type {
  AcquisitionIntentKind,
  AcquisitionSourceChannel,
} from "../../domain/acquisition/model.ts";
import { accessJourneyId, type AccessLifecycleRecord } from "../../domain/lifecycle/model.ts";
import { orientationJourneyIdForAccessJourney } from "../../domain/orientation/model.ts";
import type { OrganizationMembership } from "../../domain/users/model.ts";
import { FirestoreActivationJourneyContextRepository } from "../firestore/activation-journey.ts";
import { FirestoreOrientationJourneyRepository } from "../firestore/orientation-journey.ts";
import { createServerFirestoreFoundationRepositories, getServerFirestore } from "../firestore/runtime.ts";
import { measureServerOperation } from "../observability/server-timing.ts";

export interface ParticipantWorkspaceState {
  readonly accessJourneyId: string;
  readonly lifecycleState: AccessLifecycleRecord["state"];
  readonly organization: Readonly<{ readonly id: string }> | null;
  readonly membershipId: string | null;
  readonly controlledPlatformUrl: string | null;
  readonly acquisitionContext: Readonly<{
    readonly id: string;
    readonly kind: AcquisitionIntentKind;
    readonly subjectReference: string | null;
    readonly sourceChannel: AcquisitionSourceChannel;
    readonly status: "preserved";
  }> | null;
}

export interface ParticipantWorkspaceProjection {
  readonly state: ParticipantWorkspaceState;
  /** Active memberships are required to distinguish governed account repair from dependency loss. */
  readonly activeMemberships: readonly OrganizationMembership[];
  /** The exact persisted activation membership, including inactive records, when one was bound. */
  readonly boundMembership: OrganizationMembership | null;
  /** Active membership currently bound to the activation organization, when that binding is valid. */
  readonly membership: OrganizationMembership | null;
}

export type ParticipantWorkspaceProjectionErrorCode =
  | "lifecycle-missing"
  | "lifecycle-owner-mismatch";

/**
 * A persisted activation context exists, but the minimum lifecycle state needed to interpret it
 * does not. This is not the same as a participant who has never started activation and therefore
 * must never be translated into a fresh /join journey.
 */
export class ParticipantWorkspaceProjectionError extends Error {
  readonly code: ParticipantWorkspaceProjectionErrorCode;

  constructor(code: ParticipantWorkspaceProjectionErrorCode) {
    super("The persisted participant workspace state is temporarily unavailable.");
    this.name = "ParticipantWorkspaceProjectionError";
    this.code = code;
  }
}

export { participantLifecycleDestination } from "../../application/auth/participant-lifecycle-destination.ts";

/**
 * Minimal participant projection for protected navigation.
 *
 * This intentionally does not hydrate geography, profile, marker, location, capability, account
 * security, or other activation UI state. Those belong to their specific screens. The protected
 * route boundary needs lifecycle, the exact persisted activation membership (including inactive
 * records), and the complete active-membership set so it can distinguish a deliberate membership
 * repair from a missing/cross-owned binding or unavailable persisted state.
 *
 * A null result has one meaning only: there is no activation context for this authenticated user.
 * Once an activation context exists, missing or cross-owned lifecycle state is classified as a
 * recoverable workspace-state failure rather than being mistaken for a new participant.
 */
export async function loadParticipantWorkspaceProjection(
  context: AuthenticatedServerContext,
): Promise<ParticipantWorkspaceProjection | null> {
  const db = getServerFirestore();
  const contexts = new FirestoreActivationJourneyContextRepository(db);
  const orientations = new FirestoreOrientationJourneyRepository(db);
  const foundation = createServerFirestoreFoundationRepositories(db);

  const [activation, memberships] = await measureServerOperation(
    "workspace-state.firestore-context-membership",
    () => Promise.all([
      contexts.getByUserId(context.user.id),
      foundation.users.memberships.listActiveByUserId(context.user.id),
    ]),
    "activation context + active memberships",
  );
  if (!activation) return null;

  const [lifecycle, boundMembership] = await measureServerOperation(
    "workspace-state.firestore-lifecycle-binding",
    () => Promise.all([
      foundation.lifecycle.lifecycle.getById(accessJourneyId(activation.accessJourneyId)),
      activation.membershipId
        ? foundation.users.memberships.getById(activation.membershipId)
        : Promise.resolve(null),
    ]),
    "access lifecycle + persisted activation membership",
  );
  if (!lifecycle) {
    throw new ParticipantWorkspaceProjectionError("lifecycle-missing");
  }
  if (lifecycle.userId !== context.user.id) {
    throw new ParticipantWorkspaceProjectionError("lifecycle-owner-mismatch");
  }

  const organizationId = activation.organizationId ? String(activation.organizationId) : null;
  const membership = activation.membershipId
    ? memberships.find((candidate) => candidate.id === activation.membershipId) ?? null
    : organizationId
      ? memberships.find((candidate) => String(candidate.organizationId) === organizationId) ?? null
      : null;
  const resolvedOrganizationId = organizationId ?? (membership ? String(membership.organizationId) : null);
  // Preserve the persisted binding identity even when it is no longer active. The classifier uses
  // boundMembership + the active-membership set to prove whether repair is governed or inconsistent.
  const resolvedMembershipId = activation.membershipId
    ? String(activation.membershipId)
    : membership
      ? String(membership.id)
      : null;
  const acquisitionContext = activation.acquisitionContext
    ? Object.freeze({
        id: activation.acquisitionContext.id,
        kind: activation.acquisitionContext.intent.kind,
        subjectReference: activation.acquisitionContext.intent.subjectReference,
        sourceChannel: activation.acquisitionContext.source.channel,
        status: "preserved" as const,
      })
    : null;
  const orientation = lifecycle.state === "controlled-platform"
    ? await measureServerOperation(
        "workspace-state.firestore-controlled-release-stage",
        () => orientations.getById(
          orientationJourneyIdForAccessJourney(accessJourneyId(activation.accessJourneyId)),
        ),
        "controlled participant orientation stage",
      )
    : null;
  const orientationComplete = Boolean(
    orientation?.status === "completed" &&
    orientation.completedThroughStep === 8 &&
    orientation.userId === context.user.id &&
    String(orientation.accessJourneyId) === String(activation.accessJourneyId) &&
    (!resolvedOrganizationId || String(orientation.organizationId) === resolvedOrganizationId),
  );

  return Object.freeze({
    state: Object.freeze({
      accessJourneyId: String(activation.accessJourneyId),
      lifecycleState: lifecycle.state,
      organization: resolvedOrganizationId ? Object.freeze({ id: resolvedOrganizationId }) : null,
      membershipId: resolvedMembershipId,
      controlledPlatformUrl: participantLifecycleDestination(
        lifecycle.state,
        resolvedOrganizationId,
        orientationComplete,
      ),
      acquisitionContext,
    }),
    activeMemberships: Object.freeze([...memberships]),
    boundMembership,
    membership,
  });
}
