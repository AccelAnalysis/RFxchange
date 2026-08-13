import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerFirestoreFoundationRepositories } from "@/src/infrastructure/firestore/runtime";

export async function GET() {
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind !== "qualified" || access.state.lifecycleState !== "open-platform") {
    return NextResponse.json({ openPlatform: false, rfxCreate: false, referralManage: false, resourceManage: false }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const authorization = await createServerFirestoreFoundationRepositories().organizationAuthorization.getByMembershipId(access.membership.id);
  const permissions = authorization?.permissions ?? [];
  return NextResponse.json({
    openPlatform: true,
    rfxCreate: permissions.includes("rfx.create"),
    referralManage: permissions.includes("referral.manage"),
    resourceManage: permissions.includes("resource.manage"),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
