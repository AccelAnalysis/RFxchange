import { NextRequest, NextResponse } from "next/server";

import { firstValueIntent } from "@/src/domain/first-value/model";
import {
  createServerFirstValueAndOpenReleaseService,
  openReleaseScopeFromAccess,
} from "@/src/infrastructure/activation-release/runtime";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";

export async function POST(request: NextRequest) {
  const access = await resolveParticipantRoute({
    sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (access.kind !== "authorized") return NextResponse.json({ error: "Current participant authority is required." }, { status: 403 });
  try {
    const body = await request.json() as Readonly<{ selectedIntent?: unknown }>;
    if (typeof body.selectedIntent !== "string") {
      return NextResponse.json({ error: "Select a first-value path." }, { status: 400 });
    }
    const selectedIntent = firstValueIntent(body.selectedIntent);
    const result = await createServerFirstValueAndOpenReleaseService(access).selectAndRelease({
      scope: openReleaseScopeFromAccess(access),
      selectedIntent,
      acquisitionIntentKind: access.state.acquisitionContext?.kind ?? null,
    });
    return NextResponse.json({
      selection: { selectedIntent: result.selection.selectedIntent },
      gate: result.gate,
      lifecycleState: result.lifecycleState,
      nextUrl: result.lifecycleState === "open-platform" ? "/exchange" : result.gate.kind === "blocked" ? result.gate.remediation : "/first-value",
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "First value could not be saved.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
