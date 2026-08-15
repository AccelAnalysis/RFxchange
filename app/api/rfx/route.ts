import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  RfxDraftError,
  type RfxCommandScope,
  type RfxDefinitionSelectionInput,
} from "@/src/application/rfx/rfx-draft-service";
import type { RfxPackageInput } from "@/src/domain/rfx/model";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";
import {
  queueOpportunityDiscoveryEvaluation,
} from "@/src/infrastructure/rfx/opportunity-discovery-reliability";
import { createServerOpportunityDiscoveryService } from "@/src/infrastructure/rfx/opportunity-discovery-runtime";
import {
  createServerRfxDraftService,
  createServerRfxPublicationService,
} from "@/src/infrastructure/rfx/runtime";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const scope = await commandScope();
    if (scope instanceof NextResponse) return scope;
    if (request.nextUrl.searchParams.get("action") === "publication-readiness") {
      const result = await createServerRfxPublicationService().readinessAndPreview(scope, {
        rfxId: request.nextUrl.searchParams.get("rfxId") ?? "",
        audience: request.nextUrl.searchParams.get("audience") ?? "public",
      });
      return NextResponse.json(result, {
        headers: { "cache-control": "private, no-store" },
      });
    }
    if (request.nextUrl.searchParams.get("action") === "publication") {
      const result = await createServerRfxPublicationService().currentPublication(scope, {
        rfxId: request.nextUrl.searchParams.get("rfxId") ?? "",
      });
      return NextResponse.json(result, {
        headers: { "cache-control": "private, no-store" },
      });
    }
    const query = request.nextUrl.searchParams.get("q") ?? "";
    const domainId = request.nextUrl.searchParams.get("domain");
    const familyId = request.nextUrl.searchParams.get("family");
    const capabilities = await (
      await createServerRfxDraftService()
    ).searchCapabilities(scope, { query, domainId, familyId });
    return NextResponse.json(
      { capabilities },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch (error) {
    return problem(request, error);
  }
}

async function commandScope(
  commandId: string = randomUUID(),
): Promise<RfxCommandScope | NextResponse> {
  const access = await resolveParticipantRoute({
    sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (
    access.kind !== "authorized" ||
    access.state.lifecycleState !== "open-platform"
  ) {
    return NextResponse.json(
      { error: "RFx workspace access is unavailable." },
      { status: access.kind === "unauthenticated" ? 401 : 403 },
    );
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(commandId)) {
    return NextResponse.json(
      { error: "Command identity is invalid." },
      { status: 400 },
    );
  }
  return Object.freeze({
    context: access.context,
    organizationId: String(access.membership.organizationId),
    membershipId: String(access.membership.id),
    commandId,
  });
}

function status(error: unknown): number {
  if (!(error instanceof RfxDraftError)) return 500;
  if (error.code === "forbidden") return 403;
  if (error.code === "not-found") return 404;
  if (error.code === "conflict") return 409;
  if (error.code === "dependency-unavailable") return 503;
  return 400;
}

function problem(request: NextRequest, error: unknown) {
  const responseStatus = status(error);
  const participantMessage =
    responseStatus === 403
      ? "RFx workspace access is unavailable for this organization."
      : responseStatus === 404
        ? "The requested RFx draft is unavailable."
        : responseStatus === 409
          ? "The RFx draft changed before this request could be completed. Refresh and try again."
          : responseStatus === 400
            ? "The RFx request contains unsupported information."
            : "The RFx workspace is temporarily unavailable. Your change was not confirmed; retry the request.";
  return apiProblem(request, {
    status: responseStatus,
    participantMessage,
    code:
      error instanceof RfxDraftError ? error.code : "dependency-unavailable",
    cause: error,
  });
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const requestHost = request.headers.get("host");
    let originHost: string | null = null;
    try {
      originHost = origin ? new URL(origin).host : null;
    } catch {
      originHost = null;
    }
    if (
      !origin ||
      (origin !== request.nextUrl.origin &&
        (!requestHost || originHost !== requestHost))
    ) {
      return NextResponse.json(
        { error: "Same-origin request required." },
        { status: 403 },
      );
    }
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 131_072) {
      return NextResponse.json(
        { error: "RFx request body is too large." },
        { status: 413 },
      );
    }
    const body = (await request.json()) as Record<string, unknown>;
    const scope = await commandScope(String(body.commandId ?? ""));
    if (scope instanceof NextResponse) return scope;
    const service = await createServerRfxDraftService();
    const action = String(body.action ?? "");
    if (action === "create-draft") {
      const result = await service.createDraft(scope, {
        requestFamilyId: String(body.requestFamilyId ?? ""),
      });
      return NextResponse.json(result, { status: result.replayed ? 200 : 201 });
    }
    if (action === "change-request-family") {
      const result = await service.changeRequestFamily(scope, {
        rfxId: String(body.rfxId ?? ""),
        expectedVersion: Number(body.expectedVersion),
        requestFamilyId: String(body.requestFamilyId ?? ""),
      });
      return NextResponse.json(result);
    }
    if (action === "save-package") {
      if (
        !body.package ||
        typeof body.package !== "object" ||
        Array.isArray(body.package)
      ) {
        return NextResponse.json(
          { error: "RFx package is required." },
          { status: 400 },
        );
      }
      const result = await service.savePackage(scope, {
        rfxId: String(body.rfxId ?? ""),
        expectedVersion: Number(body.expectedVersion),
        package: body.package as RfxPackageInput,
      });
      return NextResponse.json(result);
    }
    if (action === "save-definition") {
      if (
        !body.definition ||
        typeof body.definition !== "object" ||
        Array.isArray(body.definition)
      ) {
        return NextResponse.json(
          { error: "RFx definition is required." },
          { status: 400 },
        );
      }
      const result = await service.saveDefinition(scope, {
        rfxId: String(body.rfxId ?? ""),
        expectedVersion: Number(body.expectedVersion),
        definition: body.definition as RfxDefinitionSelectionInput,
      });
      return NextResponse.json(result);
    }
    if (action === "publish") {
      const result = await createServerRfxPublicationService().publish(scope, {
        rfxId: String(body.rfxId ?? ""),
        expectedVersion: Number(body.expectedVersion),
        previewDigest: String(body.previewDigest ?? ""),
        audience: String(body.audience ?? ""),
      });
      let discoveryEvaluation: Readonly<{
        status: "completed" | "pending";
        matches: number;
        alerts: number;
      }>;

      // Persist the exact publication identity before the synchronous attempt so
      // a process failure can never turn discovery evaluation into a log-only loss.
      // The synchronous pass is a first-value optimization only: it is intentionally
      // left queued because the durable worker owns exhaustive pagination of every
      // active saved search before the evaluation can be marked complete.
      await queueOpportunityDiscoveryEvaluation(result.projection);
      try {
        const evaluated = await createServerOpportunityDiscoveryService()
          .evaluatePublishedProjection(result.projection);
        discoveryEvaluation = Object.freeze({ status: "pending", ...evaluated });
      } catch (error) {
        await queueOpportunityDiscoveryEvaluation(result.projection, error);
        console.error(JSON.stringify({
          type: "rfx.opportunity-discovery-evaluation-pending",
          reference: result.projection.reference,
          projectionVersion: result.projection.aggregateVersion,
          durable: true,
          error: error instanceof Error ? error.name : "unknown",
        }));
        discoveryEvaluation = Object.freeze({ status: "pending", matches: 0, alerts: 0 });
      }
      return NextResponse.json({ ...result, discoveryEvaluation });
    }
    return NextResponse.json(
      { error: "RFx action is unsupported." },
      { status: 400 },
    );
  } catch (error) {
    return problem(request, error);
  }
}
