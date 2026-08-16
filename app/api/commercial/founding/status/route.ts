import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/participant-route-runtime";
import {
  FoundingCommerceError,
  getFoundingCapacitySnapshot,
  publicFoundingOffer,
  resolveFoundingCheckoutReleaseDecision,
  resolveFoundingOrganizationContext,
  safeCommercialStatus,
} from "@/src/infrastructure/commercial/founding-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failure(error: unknown): NextResponse {
  if (error instanceof FoundingCommerceError) {
    return NextResponse.json({ error: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "commercial-status-unavailable" }, { status: 503 });
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const context = await resolveFoundingOrganizationContext({
      sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    });
    const organizationId = String(context.organization.id);
    const [capacity] = await Promise.all([
      getFoundingCapacitySnapshot(context.db, organizationId),
    ]);
    const release = resolveFoundingCheckoutReleaseDecision(organizationId);
    return NextResponse.json({
      offer: publicFoundingOffer(),
      capacity,
      status: safeCommercialStatus(context.commercialAccount),
      canManageBilling: context.canManageBilling,
      checkoutRelease: { allowed: release.allowed, reason: release.reason },
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return failure(error);
  }
}
