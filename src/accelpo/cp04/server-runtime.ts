import type { Firestore } from "firebase-admin/firestore";

import { loadServerIdentityProjection } from "../cp01/server-runtime.ts";
import type {
  ProjectionAccessResolver,
  ProjectionAccessResolution,
  TrustedProjectionActor,
} from "../../../apps/accelpo/src/query-projection/contracts.ts";
import {
  QueryProjectionService,
} from "../../../apps/accelpo/src/query-projection/index.ts";
import { FirestoreQueryProjectionSource } from "../../../apps/accelpo/src/query-projection/firestore-source.ts";
import type { AuthenticatedServerContext } from "../../application/auth/server-session.ts";
import { getServerFirestore } from "../../infrastructure/firestore/runtime.ts";

/**
 * Adapts the existing CP-01 server identity projection to CP-04's access resolver. The query
 * request carries only an organization selection hint; this adapter re-resolves membership and
 * capabilities from the authenticated server context before every read.
 */
class IdentityProjectionAccessResolver implements ProjectionAccessResolver {
  private readonly context: AuthenticatedServerContext;

  constructor(context: AuthenticatedServerContext) {
    this.context = context;
  }

  async resolve(input: Readonly<{
    requestedOrganizationId?: string | null;
  }>): Promise<ProjectionAccessResolution> {
    const identity = await loadServerIdentityProjection({
      context: this.context,
      requestedOrganizationId: input.requestedOrganizationId ?? null,
    });

    if (identity.kind !== "ready") {
      return Object.freeze({
        kind: "forbidden" as const,
        reason: identity.kind,
      });
    }

    const projection = identity.projection;
    const actor: TrustedProjectionActor = Object.freeze({
      userId: projection.user.userId,
      organizationId: projection.activeOrganization.organizationId,
      membershipId: projection.membership.membershipId,
      permissions: Object.freeze([...projection.permissions]),
      organizationDisplayName: projection.activeOrganization.displayName,
      planName: projection.plan.plan,
      billingPeriod: projection.plan.billingPeriodEndsAt,
      activeSeats: projection.seat.activeSeats,
      reservedSeats: projection.seat.reservedSeats,
      availableSeats: projection.seat.availableSeats,
    });
    return Object.freeze({ kind: "authorized" as const, actor });
  }
}

export function createServerAccelPoQueryProjection(
  context: AuthenticatedServerContext,
  db: Firestore = getServerFirestore(),
): QueryProjectionService {
  return new QueryProjectionService({
    source: new FirestoreQueryProjectionSource(db),
    access: new IdentityProjectionAccessResolver(context),
  });
}
