import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { loadServerRfxQualifierAuthority } from "@/src/infrastructure/rfx/runtime";

export async function GET() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }
  if (access.kind !== "authorized") {
    return NextResponse.json({ error: "RFx qualifier authority is unavailable." }, { status: 403 });
  }

  return NextResponse.json(await loadServerRfxQualifierAuthority());
}
