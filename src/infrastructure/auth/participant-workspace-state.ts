import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import type {
  AcquisitionIntentKind,
  AcquisitionSourceChannel,
} from "../../domain/acquisition/model.ts";
import { accessJourneyId, type AccessLifecycleRecord } from "../../domain/lifecycle/model.ts";
import type { OrganizationMembership } from "../../domain/users/model.ts";
import { FirestoreActivationJourneyContextRepository } from "../firestore/activation-journey.ts";
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

function controlledPlatformUrl(
  lifecycleState: AccessLifecycleRecord["state"],
  organizationId: string | null,
  hasAcquisitionContinuation: boolean,
): string | null {
  if (!organizationId) return null;
  if (lifecycleState === "open-platform") return "/exchange";
  if (lifecycleState !== "controlled-platform") return null;
  return hasAcquisitionContinuation ? "/acquisition/continue" : "/orientation";
}

/**
 * Minimal participant projection for protected navigation.
 *
 * This intentionally does not hydrate geography, profile, marker, location, capability, account
 * security, or other activation UI state. Those belong to their specific screens. The protected
 * route boundary only needs lifecycle + active membership identity before restriction checks.
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

  const lifecycle = await measureServerOperation(
    "workspace-state.firestore-lifecycle",
    () => foundation.lifecycle.lifecycle.getById(accessJourneyId(activation.accessJourneyId)),
    "access lifecycle",
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
  const resolvedMembershipId = membership ? String(membership.id) : null;
  const acquisitionContext = activation.acquisitionContext
    ? Object.freeze({
        id: activation.acquisitionContext.id,
        kind: activation.acquisitionContext.intent.kind,
        subjectReference: activation.acquisitionContext.intent.subjectReference,
        sourceChannel: activation.acquisitionContext.source.channel,
        status: "preserved" as const,
      })
    : null;
  const hasAcquisitionContinuation = Boolean(acquisitionContext && acquisitionContext.kind !== "direct");

  return Object.freeze({
    state: Object.freeze({
      accessJourneyId: String(activation.accessJourneyId),
      lifecycleState: lifecycle.state,
      organization: resolvedOrganizationId ? Object.freeze({ id: resolvedOrganizationId }) : null,
      membershipId: resolvedMembershipId,
      controlledPlatformUrl: controlledPlatformUrl(
        lifecycle.state,
        resolvedOrganizationId,
        hasAcquisitionContinuation,
      ),
      acquisitionContext,
    }),
    membership,
  });
}
