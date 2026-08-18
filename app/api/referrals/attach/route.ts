import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { FirestoreReferralRepository } from "@/src/infrastructure/firestore/referrals";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import { createServerReferralNetworkService } from "@/src/infrastructure/referrals/runtime";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const access = await resolveParticipantRoute({ sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
    if (access.kind === "access-resolution-required") {
      return NextResponse.redirect(new URL("/access/resolve", request.url), 303);
    }
    if (access.kind === "unauthenticated" || access.kind === "activation-required") {
      return NextResponse.redirect(new URL("/join?entry=referral&status=activation-required", request.url), 303);
    }
    if (access.kind !== "authorized" || access.state.lifecycleState !== "open-platform") {
      return NextResponse.redirect(new URL("/acquisition/continue?status=access-unavailable", request.url), 303);
    }
    const acquisition = access.state.acquisitionContext;
    if (!acquisition || acquisition.kind !== "referral" || !acquisition.subjectReference) {
      return NextResponse.redirect(new URL("/referrals?intent=manage&status=invitation-unavailable", request.url), 303);
    }
    const repository = new FirestoreReferralRepository(getServerFirestore());
    const referral = await repository.getById(acquisition.subjectReference);
    if (!referral) throw new Error("Referral is unavailable.");
    await createServerReferralNetworkService().attachExternalRecipient({
      context: access.context,
      organizationId: String(access.membership.organizationId),
      membershipId: String(access.membership.id),
      commandId: `attach-${acquisition.id}-${access.membership.organizationId}`,
    }, {
      referralId: referral.id,
      acquisitionContextId: acquisition.id,
      expectedVersion: referral.version,
    });
    return NextResponse.redirect(new URL(`/referrals?referral=${encodeURIComponent(referral.id)}&status=attached`, request.url), 303);
  } catch (error) {
    const problem = apiProblem(request, {
      status: 500,
      participantMessage: "Referral attachment is temporarily unavailable. Retry the request.",
      code: "dependency-unavailable",
      cause: error,
    });
    const destination = new URL("/acquisition/continue", request.url);
    destination.searchParams.set("status", "attachment-failed");
    const supportId = problem.headers.get("x-rfxchange-support-id");
    if (supportId) destination.searchParams.set("support", supportId);
    const response = NextResponse.redirect(destination, 303);
    response.headers.set("cache-control", "no-store");
    const correlationId = problem.headers.get("x-rfxchange-correlation-id");
    if (correlationId) response.headers.set("x-rfxchange-correlation-id", correlationId);
    if (supportId) response.headers.set("x-rfxchange-support-id", supportId);
    return response;
  }
}
