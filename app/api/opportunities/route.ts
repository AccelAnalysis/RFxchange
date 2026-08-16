import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { OpportunityDiscoveryError } from "@/src/application/rfx/opportunity-discovery-service";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import { createServerOpportunityDiscoveryService } from "@/src/infrastructure/rfx/opportunity-discovery-runtime";
import { getRequestLocale } from "@/src/i18n/server";

export const runtime = "nodejs";

async function scope() {
  const access = await resolveParticipantRoute({
    sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind !== "authorized" || access.state.lifecycleState !== "open-platform") {
    return NextResponse.json(
      { error: "Opportunity discovery is unavailable." },
      { status: access.kind === "unauthenticated" ? 401 : 403 },
    );
  }
  return Object.freeze({
    organizationId: access.membership.organizationId,
    userId: access.context.user.id,
    membershipId: access.membership.id,
  });
}

function list(searchParams: URLSearchParams, key: string): readonly string[] {
  return Object.freeze(searchParams.getAll(key).flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean));
}

function status(error: unknown): number {
  if (!(error instanceof OpportunityDiscoveryError)) return 500;
  if (error.code === "forbidden") return 403;
  if (error.code === "not-found") return 404;
  if (error.code === "conflict") return 409;
  if (error.code === "dependency-unavailable") return 503;
  return 400;
}

function problem(request: NextRequest, error: unknown) {
  const responseStatus = status(error);
  return apiProblem(request, {
    status: responseStatus,
    participantMessage: responseStatus === 409
      ? "This opportunity view changed. Refresh and try again."
      : responseStatus === 404
        ? "The requested opportunity is unavailable."
        : responseStatus === 403
          ? "Opportunity discovery is unavailable for this organization."
          : responseStatus === 400
            ? "The opportunity request contains unsupported information."
            : "Opportunity discovery is temporarily unavailable. Retry the request.",
    code: error instanceof OpportunityDiscoveryError ? error.code : "dependency-unavailable",
    cause: error,
  });
}

export async function GET(request: NextRequest) {
  try {
    const participant = await scope();
    if (participant instanceof NextResponse) return participant;
    const params = request.nextUrl.searchParams;
    const result = await createServerOpportunityDiscoveryService().discover(participant, {
      text: params.get("q"),
      requestFamilyKeys: list(params, "requestFamily"),
      capabilityIds: list(params, "capability"),
      localityIds: list(params, "locality"),
      deadlineWindow: params.get("deadline"),
      watched: params.get("watched") === "true" ? true : params.get("watched") === "false" ? false : null,
      cursor: params.get("cursor"),
    });
    return NextResponse.json(result, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return problem(request, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const requestHost = request.headers.get("host");
    let originHost: string | null = null;
    try { originHost = origin ? new URL(origin).host : null; } catch { originHost = null; }
    if (!origin || (origin !== request.nextUrl.origin && (!requestHost || originHost !== requestHost))) {
      return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
    }
    if (Number(request.headers.get("content-length") ?? "0") > 65_536) {
      return NextResponse.json({ error: "Opportunity request body is too large." }, { status: 413 });
    }
    const participant = await scope();
    if (participant instanceof NextResponse) return participant;
    const body = (await request.json()) as Record<string, unknown>;
    const locale = await getRequestLocale();
    const service = createServerOpportunityDiscoveryService(undefined, locale);
    if (body.action === "save-search") {
      const result = await service.saveSearch(participant, {
        commandId: String(body.commandId ?? ""),
        savedSearchId: body.savedSearchId ? String(body.savedSearchId) : null,
        expectedVersion: body.expectedVersion === null || body.expectedVersion === undefined ? null : Number(body.expectedVersion),
        label: String(body.label ?? ""),
        alertPolicy: String(body.alertPolicy ?? "off"),
        status: body.status ? String(body.status) : null,
        query: body.query && typeof body.query === "object" && !Array.isArray(body.query)
          ? body.query as never
          : {},
      });
      return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
    }
    if (body.action === "set-watch") {
      const result = await service.setWatch(participant, {
        commandId: String(body.commandId ?? ""),
        reference: String(body.reference ?? ""),
        watching: body.watching === true,
      });
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "Opportunity action is unsupported." }, { status: 400 });
  } catch (error) {
    return problem(request, error);
  }
}
