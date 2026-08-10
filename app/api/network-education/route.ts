import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  NetworkEducationError,
  type NetworkEducationMutation,
} from "@/src/application/network-education/network-education";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import { createServerNetworkEducationService, isOfficialResourceProvider } from "@/src/infrastructure/network-education/runtime";

export const runtime = "nodejs";

async function access() {
  const resolution = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (resolution.kind !== "authorized" || resolution.state.lifecycleState !== "open-platform") {
    return NextResponse.json({ error: "Persistent Network education is available after your organization reaches OPEN." }, { status: resolution.kind === "unauthenticated" ? 401 : 403 });
  }
  return resolution;
}

function status(error: unknown): number {
  if (!(error instanceof NetworkEducationError)) return 500;
  return error.code === "forbidden" ? 403 : error.code === "conflict" ? 409 : 400;
}

function problem(request: NextRequest, error: unknown, operation: "load" | "save") {
  const responseStatus = status(error);
  const participantMessage = error instanceof NetworkEducationError
    ? responseStatus === 403
      ? "Network education access is unavailable for this organization."
      : responseStatus === 409
        ? "Network education changed before this request could be completed."
        : "The network education request contains unsupported information."
    : `Network education is temporarily unavailable. ${operation === "load" ? "Retry the request." : "Your progress was not confirmed; retry the request."}`;
  return apiProblem(request, {
    status: responseStatus,
    participantMessage,
    code: error instanceof NetworkEducationError ? error.code : "dependency-unavailable",
    cause: error,
  });
}

export async function GET(request: NextRequest) {
  try {
    const resolution = await access();
    if (resolution instanceof NextResponse) return resolution;
    const organizationId = String(resolution.membership.organizationId);
    const snapshot = await createServerNetworkEducationService().snapshot({ context: resolution.context, organizationId, membershipId: String(resolution.membership.id) }, await isOfficialResourceProvider(organizationId));
    return NextResponse.json(snapshot);
  } catch (error) {
    return problem(request, error, "load");
  }
}

export async function POST(request: NextRequest) {
  try {
    const resolution = await access();
    if (resolution instanceof NextResponse) return resolution;
    if (Number(request.headers.get("content-length") ?? 0) > 16_000) {
      return NextResponse.json({ error: "Education request is too large." }, { status: 413 });
    }
    const body = await request.json() as Record<string, unknown>;
    const organizationId = String(resolution.membership.organizationId);
    const result = await createServerNetworkEducationService().mutate({
      context: resolution.context,
      organizationId,
      membershipId: String(resolution.membership.id),
      commandId: String(body.commandId ?? ""),
    }, {
      action: String(body.action ?? "") as NetworkEducationMutation["action"],
      expectedVersion: body.expectedVersion === null || body.expectedVersion === undefined ? null : Number(body.expectedVersion),
      pathKey: typeof body.pathKey === "string" ? body.pathKey : null,
      itemKey: typeof body.itemKey === "string" ? body.itemKey : null,
      explainerKey: typeof body.explainerKey === "string" ? body.explainerKey : null,
    }, await isOfficialResourceProvider(organizationId));
    return NextResponse.json(result);
  } catch (error) {
    return problem(request, error, "save");
  }
}
