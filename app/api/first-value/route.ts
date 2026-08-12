import { NextRequest, NextResponse } from "next/server";

import { FirstValueStateError, firstValueIntent } from "@/src/domain/first-value/model";
import {
  createServerFirstValueAndOpenReleaseService,
  openReleaseScopeFromAccess,
} from "@/src/infrastructure/activation-release/runtime";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";

export async function POST(request: NextRequest) {
  try {
    const access = await resolveParticipantRoute({
      sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    });
    if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (access.kind !== "authorized") return NextResponse.json({ error: "Current participant authority is required." }, { status: 403 });
    const body = await request.json() as Readonly<{ selectedIntent?: unknown }>;
    if (typeof body.selectedIntent !== "string") {
      return NextResponse.json({ error: "Select a first-value path." }, { status: 400 });
    }
    let selectedIntent;
    try {
      selectedIntent = firstValueIntent(body.selectedIntent);
    } catch (cause) {
      return apiProblem(request, {
        status: 400,
        participantMessage: "Select an available first-value path.",
        code: "request-invalid",
        cause,
      });
    }
    const result = await createServerFirstValueAndOpenReleaseService(access).selectAndRelease({
      scope: openReleaseScopeFromAccess(access),
      selectedIntent,
      acquisitionIntentKind: access.state.acquisitionContext?.kind ?? null,
    });
    return NextResponse.json({
      selection: { selectedIntent: result.selection.selectedIntent },
      gate: result.gate,
      lifecycleState: result.lifecycleState,
      nextUrl: "/exchange",
    });
  } catch (cause) {
    const stateError = cause instanceof FirstValueStateError ? cause : null;
    const status = cause instanceof SyntaxError
      ? 400
      : stateError?.code === "forbidden"
        ? 403
        : stateError?.code === "conflict"
          ? 409
          : 500;
    return apiProblem(request, {
      status,
      participantMessage: cause instanceof SyntaxError
        ? "The first-value request could not be read."
        : stateError?.code === "forbidden"
          ? "First-value selection is unavailable for this participant context."
          : stateError?.code === "conflict"
            ? "First-value state changed before this selection could be completed. Refresh and try again."
        : "First-value selection is temporarily unavailable. Retry the request.",
      code: cause instanceof SyntaxError
        ? "request-invalid"
        : stateError?.code === "forbidden"
          ? "first-value-unavailable"
          : stateError?.code === "conflict"
            ? "first-value-conflict"
            : "dependency-unavailable",
      cause,
    });
  }
}
