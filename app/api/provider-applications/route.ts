import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ResourceProviderFoundationError, type ProviderParticipantScope } from "@/src/application/resource-providers/provider-foundation";
import type { ProviderApplicationContent, ProviderAvailability, ProviderCategory, ProviderModality } from "@/src/domain/resource-providers/model";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { createServerResourceProviderFoundationService } from "@/src/infrastructure/resource-providers/runtime";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 96_000;

async function participantScope(commandId: string = randomUUID()): Promise<ProviderParticipantScope | NextResponse> {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({ sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind !== "authorized") return NextResponse.json({ error: "Resource Provider workspace access is unavailable." }, { status: access.kind === "unauthenticated" ? 401 : 403 });
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(commandId)) return NextResponse.json({ error: "Command identity is invalid." }, { status: 400 });
  return Object.freeze({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id), commandId });
}

function status(error: unknown): number {
  if (!(error instanceof ResourceProviderFoundationError)) return 500;
  if (error.code === "forbidden") return 403;
  if (error.code === "not-found") return 404;
  if (error.code === "conflict") return 409;
  if (error.code === "profile-incomplete") return 428;
  return 400;
}

function array(value: unknown): readonly string[] { return Array.isArray(value) ? value.map(String) : []; }
function content(body: Record<string, unknown>): ProviderApplicationContent {
  const services = Array.isArray(body.services) ? body.services.map((value, index) => {
    const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
    return Object.freeze({ id: String(item.id ?? `service-${index + 1}`), name: String(item.name ?? ""), description: String(item.description ?? ""), availability: String(item.availability ?? "unknown") as ProviderAvailability, capacityNote: typeof item.capacityNote === "string" ? item.capacityNote : null });
  }) : [];
  const officialContact = body.officialContact && typeof body.officialContact === "object" ? body.officialContact as Record<string, unknown> : {};
  return Object.freeze({ categories: array(body.categories) as readonly ProviderCategory[], otherCategoryDescription: typeof body.otherCategoryDescription === "string" ? body.otherCategoryDescription : null, services, populationsServed: String(body.populationsServed ?? ""), eligibility: String(body.eligibility ?? ""), intakeMethod: String(body.intakeMethod ?? ""), modalities: array(body.modalities) as readonly ProviderModality[], languages: array(body.languages), officialContact: Object.freeze({ displayName: String(officialContact.displayName ?? ""), roleTitle: String(officialContact.roleTitle ?? ""), email: String(officialContact.email ?? ""), phone: typeof officialContact.phone === "string" ? officialContact.phone : null }), evidenceAssetIds: array(body.evidenceAssetIds), authorityAttested: body.authorityAttested === true });
}

export async function GET() {
  const scope = await participantScope(); if (scope instanceof NextResponse) return scope;
  try { return NextResponse.json(await createServerResourceProviderFoundationService().participantSnapshot(scope)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Resource Provider workspace failed." }, { status: status(error) }); }
}

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return NextResponse.json({ error: "Provider request is too large." }, { status: 413 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const scope = await participantScope(String(body.commandId ?? "")); if (scope instanceof NextResponse) return scope;
    const service = createServerResourceProviderFoundationService(); const action = String(body.action ?? "");
    if (action === "save-draft") return NextResponse.json(await service.saveDraft(scope, { expectedVersion: body.expectedVersion == null ? null : Number(body.expectedVersion), content: content(body), response: typeof body.response === "string" ? body.response : null }));
    if (action === "submitted" || action === "resubmitted") return NextResponse.json(await service.participantTransition(scope, { action, expectedVersion: Number(body.expectedVersion) }));
    if (action === "update-profile") return NextResponse.json(await service.updateServiceProfile(scope, { expectedVersion: Number(body.expectedVersion), categories: array(body.categories) as readonly ProviderCategory[], otherCategoryDescription: typeof body.otherCategoryDescription === "string" ? body.otherCategoryDescription : null, services: content({ ...body, authorityAttested: true }).services, populationsServed: String(body.populationsServed ?? ""), eligibility: String(body.eligibility ?? ""), intakeMethod: String(body.intakeMethod ?? ""), modalities: array(body.modalities) as readonly ProviderModality[], languages: array(body.languages), officialContact: content({ ...body, authorityAttested: true }).officialContact, availability: String(body.availability ?? "unknown") as ProviderAvailability }));
    return NextResponse.json({ error: "Provider action is unsupported." }, { status: 400 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Resource Provider action failed." }, { status: status(error) }); }
}
