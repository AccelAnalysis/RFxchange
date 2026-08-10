import { NextRequest, NextResponse } from "next/server";

import { ORIENTATION_STEP_SEQUENCE, type OrientationStepKey } from "@/src/domain/orientation/model";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import {
  createServerOrientationJourneyService,
  resolveAuthorizedOrientationScope,
} from "@/src/infrastructure/orientation/runtime";

function isStepKey(value: unknown): value is OrientationStepKey {
  return typeof value === "string" && ORIENTATION_STEP_SEQUENCE.some((step) => step.key === value);
}

export async function POST(request: NextRequest) {
  try {
    const access = await resolveParticipantRoute({
      sessionCookie: request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
    });
    if (access.kind === "unauthenticated") return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    if (access.kind !== "authorized") return NextResponse.json({ error: "Controlled-platform access required." }, { status: 403 });
    if (access.state.lifecycleState !== "controlled-platform") {
      return NextResponse.json({ error: "Completed OPEN orientation cannot be mutated." }, { status: 409 });
    }
    const scope = await resolveAuthorizedOrientationScope(access);
    if (!scope) return NextResponse.json({ error: "An active controlled-locality marker is required." }, { status: 409 });
    const body = await request.json() as Readonly<{ action?: unknown; stepKey?: unknown }>;
    const service = createServerOrientationJourneyService();
    const journey = body.action === "start"
      ? await service.start(scope)
      : body.action === "restart"
        ? await service.restart(scope)
        : body.action === "complete-step" && isStepKey(body.stepKey)
          ? await service.completeStep(scope, body.stepKey)
          : null;
    if (!journey) return NextResponse.json({ error: "Invalid orientation action." }, { status: 400 });
    return NextResponse.json({ journey });
  } catch (cause) {
    return apiProblem(request, {
      status: cause instanceof SyntaxError ? 400 : 500,
      participantMessage: cause instanceof SyntaxError
        ? "The orientation request could not be read."
        : "Orientation is temporarily unavailable. Retry the request.",
      code: cause instanceof SyntaxError ? "request-invalid" : "dependency-unavailable",
      cause,
    });
  }
}
