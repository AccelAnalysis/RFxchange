import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ResourceProviderFoundationError, type ProviderAdminScope } from "@/src/application/resource-providers/provider-foundation";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/firebase-server-session";
import { resolveAdminRoute } from "@/src/infrastructure/auth/admin-route-runtime";
import { createServerResourceProviderFoundationService } from "@/src/infrastructure/resource-providers/runtime";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 32_000;

function responseStatus(error: unknown): number {
  if (!(error instanceof ResourceProviderFoundationError)) return 500;
  if (error.code === "forbidden") return 403;
  if (error.code === "not-found") return 404;
  if (error.code === "conflict") return 409;
  return 400;
}

async function adminScope(permission: ProviderAdminScope["permission"], scope: string, commandId: string = randomUUID()): Promise<ProviderAdminScope | NextResponse> {
  const cookieStore = await cookies();
  const access = await resolveAdminRoute({ sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value, permission, scope, access: permission === "provider.application.review" ? "write" : "read" });
  if (access.kind !== "authorized") return NextResponse.json({ error: "Resource Provider administrative access is unavailable." }, { status: access.kind === "unauthenticated" ? 401 : 403 });
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(commandId)) return NextResponse.json({ error: "Command identity is invalid." }, { status: 400 });
  return Object.freeze({ context: access.context, authority: access.authority, administratorId: String(access.account.administratorId), permission, scope: access.scope, commandId });
}

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId")?.trim();
  const scope = await adminScope("provider.application.read", organizationId ? `ORGANIZATION:${organizationId}` : "GLOBAL"); if (scope instanceof NextResponse) return scope;
  try { return NextResponse.json(organizationId ? await createServerResourceProviderFoundationService().adminDetail(scope, organizationId) : { applications: await createServerResourceProviderFoundationService().adminQueue(scope) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Provider review data failed." }, { status: responseStatus(error) }); }
}

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return NextResponse.json({ error: "Provider review request is too large." }, { status: 413 });
  try {
    const body = await request.json() as Record<string, unknown>; const organizationId = String(body.organizationId ?? "");
    const scope = await adminScope("provider.application.review", `ORGANIZATION:${organizationId}`, String(body.commandId ?? "")); if (scope instanceof NextResponse) return scope;
    const action = String(body.action ?? "");
    if (!["review-started", "information-requested", "approved", "denied"].includes(action)) return NextResponse.json({ error: "Provider review action is unsupported." }, { status: 400 });
    return NextResponse.json(await createServerResourceProviderFoundationService().adminTransition(scope, { organizationId, action: action as "approved", expectedVersion: Number(body.expectedVersion), note: typeof body.note === "string" ? body.note : null }));
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Provider review action failed." }, { status: responseStatus(error) }); }
}
