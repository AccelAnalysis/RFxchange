import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ReferralNetworkError, type ReferralCommandScope } from "@/src/application/referrals/referral-network";
import { organizationId } from "@/src/domain/organizations/model";
import type { ReferralRecipient, ReferralSharedField } from "@/src/domain/referrals/model";
import { RFXCHANGE_SESSION_COOKIE_NAME, resolveParticipantRoute } from "@/src/infrastructure/auth/participant-route-runtime";
import { attemptReferralCommunication, createServerReferralNetworkService } from "@/src/infrastructure/referrals/runtime";
import { FirestoreReferralRepository } from "@/src/infrastructure/firestore/referrals";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";

export const runtime = "nodejs";

async function accessScope(commandId: string = randomUUID()): Promise<ReferralCommandScope | NextResponse> {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({ sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value });
  if (access.kind !== "authorized") return NextResponse.json({ error: "Referral workspace access is unavailable." }, { status: access.kind === "unauthenticated" ? 401 : 403 });
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(commandId)) return NextResponse.json({ error: "Command identity is invalid." }, { status: 400 });
  return Object.freeze({ context: access.context, organizationId: String(access.membership.organizationId), membershipId: String(access.membership.id), commandId });
}

function responseStatus(error: unknown): number {
  if (!(error instanceof ReferralNetworkError)) return 500;
  if (error.code === "forbidden") return 403;
  if (error.code === "not-found") return 404;
  if (error.code === "conflict") return 409;
  if (error.code === "education-required") return 428;
  return 400;
}

export async function GET() {
  const scope = await accessScope();
  if (scope instanceof NextResponse) return scope;
  try {
    const referrals = await createServerReferralNetworkService().snapshot(scope);
    return NextResponse.json({ referrals });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Referral workspace failed." }, { status: responseStatus(error) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "");
    const scope = await accessScope(String(body.commandId ?? ""));
    if (scope instanceof NextResponse) return scope;
    const service = createServerReferralNetworkService();

    if (action === "education") {
      const result = await service.acknowledgeEducation(scope, {
        recipientLabel: String(body.recipientLabel ?? ""),
        sharedFields: Array.isArray(body.sharedFields) ? body.sharedFields.map(String) as ReferralSharedField[] : [],
      });
      return NextResponse.json(result);
    }
    if (action === "create") {
      const recipientKind = body.recipientKind === "external" ? "external" : "organization";
      const recipient: ReferralRecipient = recipientKind === "external"
        ? Object.freeze({ kind: "external", displayName: String(body.recipientLabel ?? ""), email: String(body.recipientEmail ?? "") })
        : Object.freeze({ kind: "organization", organizationId: organizationId(String(body.recipientOrganizationId ?? "")), displayName: String(body.recipientLabel ?? ""), notificationEmail: null });
      const result = await service.createDraft(scope, {
        recipient,
        need: String(body.need ?? "") as "capability",
        summary: String(body.summary ?? ""),
        urgency: String(body.urgency ?? "") as "standard",
        preferredContactMethod: String(body.preferredContactMethod ?? "") as "email",
        purpose: String(body.purpose ?? "") as "business-introduction",
        opportunityReference: typeof body.opportunityReference === "string" ? body.opportunityReference : null,
        sharedFields: Array.isArray(body.sharedFields) ? body.sharedFields.map(String) as ReferralSharedField[] : [],
        consentAcknowledged: body.consentAcknowledged === true,
      });
      return NextResponse.json(result, { status: 201 });
    }
    if (action === "send") {
      const result = await service.send(scope, { referralId: String(body.referralId ?? ""), expectedVersion: Number(body.expectedVersion) });
      const pendingCommunication = "communication" in result ? result.communication : await new FirestoreReferralRepository(getServerFirestore()).getCommunication(String(result.referral.communicationMessageId ?? ""));
      const communication = pendingCommunication ? await attemptReferralCommunication(pendingCommunication) : null;
      return NextResponse.json({ ...result, communication });
    }
    if (action === "retry-communication") {
      const repository = new FirestoreReferralRepository(getServerFirestore());
      const referral = await repository.getById(String(body.referralId ?? ""));
      const referrals = await service.snapshot(scope);
      if (!referral?.communicationMessageId || !referrals.some((projection) => projection.id === referral.id)) return NextResponse.json({ error: "Communication recovery is unavailable." }, { status: 404 });
      const intent = await repository.getCommunication(referral.communicationMessageId);
      if (!intent) return NextResponse.json({ error: "Communication recovery is unavailable." }, { status: 404 });
      return NextResponse.json({ communication: await attemptReferralCommunication(intent) });
    }
    if (["accepted", "declined", "contacted", "closed", "expired"].includes(action)) {
      const result = await service.transition(scope, { referralId: String(body.referralId ?? ""), expectedVersion: Number(body.expectedVersion), action: action as "accepted", outcome: typeof body.outcome === "string" ? body.outcome as "other" : null });
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "Referral action is unsupported." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Referral action failed." }, { status: responseStatus(error) });
  }
}
