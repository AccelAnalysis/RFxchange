import { randomUUID } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";

import {
  FirstValueAndOpenReleaseService,
  type OpenReleaseScope,
  type OpenReleaseSnapshot,
  type OpenReleaseSnapshotReader,
} from "../../application/activation/open-release.ts";
import {
  authenticationAccountState,
  authenticationCredentialState,
} from "../../application/auth/account-security.ts";
import { isCurrentActivationLegalAcceptance } from "../../domain/onboarding/model.ts";
import { accessJourneyId } from "../../domain/lifecycle/model.ts";
import type { AccessRestrictionRecord, AccessRestrictionState } from "../../domain/lifecycle/model.ts";
import { orientationJourneyIdForAccessJourney } from "../../domain/orientation/model.ts";
import type { ParticipantRouteResolution } from "../auth/participant-route-runtime.ts";
import { FirebaseAccountSecurityService } from "../auth/firebase-account-security.ts";
import { getServerFirebaseAuth } from "../auth/firebase-server.ts";
import { FirestoreActivationJourneyContextRepository } from "../firestore/activation-journey.ts";
import { FirestoreFirstValueSelectionRepository } from "../firestore/first-value.ts";
import { createFirestoreGeographyRepositories } from "../firestore/geography-repositories.ts";
import { createFirestoreOrganizationLocationRepositories } from "../firestore/organization-location.ts";
import { createFirestoreOrganizationMarkerRepositories } from "../firestore/organization-marker.ts";
import { createFirestoreEssentialOrganizationProfileRepositories } from "../firestore/organization-profile.ts";
import { FirestoreOrientationJourneyRepository } from "../firestore/orientation-journey.ts";
import { createFirestoreFoundationRepositories } from "../firestore/repositories.ts";
import { getServerFirestore } from "../firestore/runtime.ts";

type AuthorizedParticipant = Extract<ParticipantRouteResolution, { readonly kind: "authorized" }>;

function restrictionState(
  organization: AccessRestrictionRecord | null,
  membership: AccessRestrictionRecord | null,
): AccessRestrictionState {
  if (membership?.state && membership.state !== "none") return membership.state;
  if (organization?.state && organization.state !== "none") return organization.state;
  return "none" as const;
}

export function openReleaseScopeFromAccess(access: AuthorizedParticipant): OpenReleaseScope {
  if (!access.state.organization || !access.state.membershipId) {
    throw new Error("An active organization relationship is required for OPEN evaluation.");
  }
  return Object.freeze({
    accessJourneyId: accessJourneyId(access.state.accessJourneyId),
    userId: access.context.user.id,
    organizationId: access.membership.organizationId,
  });
}

class FirestoreOpenReleaseSnapshotReader implements OpenReleaseSnapshotReader {
  private readonly db: Firestore;
  private readonly access: AuthorizedParticipant;

  constructor(
    db: Firestore,
    access: AuthorizedParticipant,
  ) {
    this.db = db;
    this.access = access;
  }

  async read(scope: OpenReleaseScope): Promise<OpenReleaseSnapshot> {
    if (
      scope.userId !== this.access.context.user.id ||
      scope.organizationId !== this.access.membership.organizationId ||
      String(scope.accessJourneyId) !== this.access.state.accessJourneyId
    ) throw new Error("OPEN release scope belongs to another participant.");

    const foundation = createFirestoreFoundationRepositories(this.db);
    const geography = createFirestoreGeographyRepositories(this.db);
    const locations = createFirestoreOrganizationLocationRepositories(this.db);
    const profiles = createFirestoreEssentialOrganizationProfileRepositories(this.db);
    const markers = createFirestoreOrganizationMarkerRepositories(this.db);
    const orientations = new FirestoreOrientationJourneyRepository(this.db);
    const firstValue = new FirestoreFirstValueSelectionRepository(this.db);
    const activationContexts = new FirestoreActivationJourneyContextRepository(this.db);
    const accountSecurity = new FirebaseAccountSecurityService(getServerFirebaseAuth());

    const [
      lifecycle, account, membership, organization, authorization,
      organizationRestriction, membershipRestriction, activation,
      profileCompletion, marker, orientation, selection, geographySelection, location,
    ] = await Promise.all([
      foundation.lifecycle.lifecycle.getById(scope.accessJourneyId),
      accountSecurity.inspect(this.access.context.authentication.subject),
      foundation.users.memberships.getById(this.access.membership.id),
      foundation.organizations.accounts.getById(scope.organizationId),
      foundation.organizationAuthorization.getByMembershipId(this.access.membership.id),
      foundation.lifecycle.restrictions.getForOrganization(scope.organizationId),
      foundation.lifecycle.restrictions.getForMembership(this.access.membership.id),
      activationContexts.getByUserId(scope.userId),
      profiles.completions.getByOrganizationId(scope.organizationId),
      markers.activations.getByOrganizationId(scope.organizationId),
      orientations.getById(orientationJourneyIdForAccessJourney(scope.accessJourneyId)),
      firstValue.getByAccessJourneyId(String(scope.accessJourneyId)),
      geography.selections.getByUserId(scope.userId),
      locations.locations.getByOrganizationId(scope.organizationId),
    ]);
    if (!lifecycle || lifecycle.userId !== scope.userId) {
      throw new Error("OPEN release lifecycle is missing or bound to another user.");
    }
    const geographyDefinition = marker ? await geography.definitions.getById(marker.geographyId) : null;
    const restriction = restrictionState(organizationRestriction, membershipRestriction);
    const accountMatches =
      account.provider === this.access.context.authentication.provider &&
      account.subject === this.access.context.authentication.subject;
    const membershipActive = Boolean(
      membership && membership.status === "active" &&
      membership.userId === scope.userId && membership.organizationId === scope.organizationId,
    );
    const authorityEstablished = Boolean(
      organization && authorization && membershipActive &&
      authorization.membershipId === membership?.id &&
      authorization.userId === scope.userId &&
      authorization.organizationId === scope.organizationId &&
      authorization.permissions.includes("organization.profile.manage"),
    );
    const markerActiveInAllowedGeography = Boolean(
      marker?.status === "active" &&
      geographyDefinition?.releaseState === "released" &&
      geographySelection?.geographyId === marker.geographyId &&
      location?.geographyId === marker.geographyId,
    );
    const orientationComplete = Boolean(
      orientation?.status === "completed" && orientation.completedThroughStep === 8 &&
      orientation.userId === scope.userId &&
      orientation.organizationId === scope.organizationId &&
      orientation.accessJourneyId === scope.accessJourneyId,
    );
    return Object.freeze({
      scope,
      lifecycle,
      accountUsable: accountMatches && authenticationAccountState(account) === "active",
      authenticationCurrent: accountMatches && authenticationCredentialState(
        account,
        this.access.context.authentication.authenticatedAt,
      ) === "current",
      membershipActive,
      restrictionState: restriction,
      policiesCurrent: Boolean(
        activation && activation.userId === scope.userId &&
        activation.organizationId === scope.organizationId &&
        activation.membershipId === membership?.id &&
        isCurrentActivationLegalAcceptance(activation.legalAcceptance),
      ),
      organizationAuthorityEstablished: authorityEstablished,
      profileComplete: profileCompletion?.status === "active",
      markerActiveInAllowedGeography,
      orientationComplete,
      selection,
    });
  }
}

export function createServerFirstValueAndOpenReleaseService(
  access: AuthorizedParticipant,
  db: Firestore = getServerFirestore(),
  now: () => string = () => new Date().toISOString(),
): FirstValueAndOpenReleaseService {
  return new FirstValueAndOpenReleaseService({
    selections: new FirestoreFirstValueSelectionRepository(db),
    snapshots: new FirestoreOpenReleaseSnapshotReader(db, access),
    ids: { event: () => `activation-release-event-${randomUUID()}` },
    now,
  });
}
