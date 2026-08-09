import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ResourceNetworkError, type ResourceNetworkScope } from "@/src/application/resource-network/resource-network";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { attemptProviderInvitation, createServerResourceNetworkService } from "@/src/infrastructure/resource-network/runtime";

export const runtime = "nodejs";

async function scope(commandId: string = randomUUID()): Promise<ResourceNetworkScope | NextResponse> {
  const access = await resolveParticipantRoute({ sessionCookie: (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind !== "authorized") return NextResponse.json({ error: "Resource Network access is unavailable." }, { status: access.kind === "unauthenticated" ? 401 : 403 });
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(commandId)) return NextResponse.json({ error: "Command identity is invalid." }, { status: 400 });
  return Object.freeze({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id), commandId });
}

function status(error: unknown): number {
  if (!(error instanceof ResourceNetworkError)) return 500;
  return error.code === "forbidden" ? 403 : error.code === "not-found" ? 404 : error.code === "conflict" ? 409 : 400;
}

export async function GET(request: NextRequest) {
  const access = await scope();
  if (access instanceof NextResponse) return access;
  try {
    const referralId = request.nextUrl.searchParams.get("referralId");
    const service = createServerResourceNetworkService();
    if (referralId) return NextResponse.json({ messages: await service.messages(access, referralId) });
    return NextResponse.json({ owner: await service.ownerSnapshot(access) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Resource Network failed." }, { status: status(error) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 48_000) return NextResponse.json({ error: "Resource Network request body is too large." }, { status: 413 });
    const body = await request.json() as Record<string, unknown>;
    const access = await scope(String(body.commandId ?? ""));
    if (access instanceof NextResponse) return access;
    const service = createServerResourceNetworkService();
    const action = String(body.action ?? "");
    if (["publication-save", "publication-publish", "publication-withdraw"].includes(action)) {
      return NextResponse.json(await service.mutatePublication(access, { expectedVersion: body.expectedVersion === null ? null : Number(body.expectedVersion), visibleServiceIds: Array.isArray(body.visibleServiceIds) ? body.visibleServiceIds.map(String) : [], action: action === "publication-publish" ? "publish" : action === "publication-withdraw" ? "withdraw" : "save" }));
    }
    if (action === "resource-create") {
      const result = await service.createResource(access, { kind: String(body.kind ?? "resource") as "resource", title: String(body.title ?? ""), summary: String(body.summary ?? ""), description: String(body.description ?? ""), serviceIds: Array.isArray(body.serviceIds) ? body.serviceIds.map(String) : [], geographyIds: Array.isArray(body.geographyIds) ? body.geographyIds.map(String) : [], modalities: Array.isArray(body.modalities) ? body.modalities.map(String) : [], eligibility: String(body.eligibility ?? ""), intakeUrl: typeof body.intakeUrl === "string" ? body.intakeUrl : null, startsAt: typeof body.startsAt === "string" ? body.startsAt : null, endsAt: typeof body.endsAt === "string" ? body.endsAt : null, visibility: body.visibility === "public" ? "public" : "network" });
      return NextResponse.json(result, { status: 201 });
    }
    if (["resource-publish", "resource-withdraw"].includes(action)) return NextResponse.json(await service.transitionResource(access, { resourceId: String(body.resourceId ?? ""), expectedVersion: Number(body.expectedVersion), action: action === "resource-publish" ? "publish" : "withdraw" }));
    if (action === "message-add") return NextResponse.json(await service.addMessage(access, { referralId: String(body.referralId ?? ""), body: String(body.message ?? "") }), { status: 201 });
    if (action === "provider-invite") {
      const result = await service.invite(access, { recipientLabel: String(body.recipientLabel ?? ""), recipientEmail: String(body.recipientEmail ?? ""), subjectKind: body.subjectKind === "public-opportunity" ? "public-opportunity" : "profile-completion", subjectReference: typeof body.subjectReference === "string" ? body.subjectReference : null, invitationContext: String(body.invitationContext ?? "") });
      const invitation = "invitation" in result ? await attemptProviderInvitation(result.invitation) : null;
      return NextResponse.json({ ...result, invitation }, { status: 201 });
    }
    return NextResponse.json({ error: "Resource Network action is unsupported." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Resource Network action failed." }, { status: status(error) });
  }
}
