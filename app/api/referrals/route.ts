import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import type { CreateAndSendReferralInput } from "@/src/application/referrals/referral-create-and-send";
import { referralInvitationDeliveryPermitted } from "@/src/application/referrals/referral-invitation-delivery";
import {
  ReferralNetworkError,
  type ReferralCommandScope,
} from "@/src/application/referrals/referral-network";
import { organizationId } from "@/src/domain/organizations/model";
import type {
  ProviderReferralContext,
  ReferralContactMethod,
  ReferralNeed,
  ReferralPurpose,
  ReferralRecipient,
  ReferralSharedField,
  ReferralUrgency,
} from "@/src/domain/referrals/model";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import {
  attemptReferralCommunication,
  createServerReferralCreateAndSendService,
  createServerReferralNetworkService,
} from "@/src/infrastructure/referrals/runtime";
import { FirestoreReferralRepository } from "@/src/infrastructure/firestore/referrals";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { apiProblem } from "@/src/infrastructure/http/api-problem";

export const runtime = "nodejs";

async function accessScope(commandId: string = randomUUID()): Promise<ReferralCommandScope | NextResponse> {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind !== "authorized") {
    return NextResponse.json(
      { error: "Referral workspace access is unavailable." },
      { status: access.kind === "unauthenticated" ? 401 : 403 },
    );
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(commandId)) {
    return NextResponse.json({ error: "Command identity is invalid." }, { status: 400 });
  }
  return Object.freeze({
    context: access.context,
    organizationId: String(access.membership.organizationId),
    membershipId: String(access.membership.id),
    commandId,
  });
}

function responseStatus(error: unknown): number {
  if (!(error instanceof ReferralNetworkError)) return 500;
  if (error.code === "forbidden") return 403;
  if (error.code === "not-found") return 404;
  if (error.code === "conflict") return 409;
  if (error.code === "education-required") return 428;
  return 400;
}

function problem(request: NextRequest, error: unknown, operation: "load" | "change") {
  const status = responseStatus(error);
  const participantMessage = error instanceof ReferralNetworkError
    ? status === 403
      ? "Referral workspace access is unavailable for this organization."
      : status === 404
        ? "The requested referral is unavailable."
        : status === 428
          ? "Complete the required referral education before continuing."
          : status === 409
            ? "The referral changed before this request could be completed."
            : "The referral request contains unsupported information."
    : `The referral workspace is temporarily unavailable. ${operation === "load" ? "Retry the request." : "Your change was not confirmed; retry the request."}`;
  return apiProblem(request, {
    status,
    participantMessage,
    code: error instanceof ReferralNetworkError ? error.code : "dependency-unavailable",
    cause: error,
  });
}

function sharedFields(body: Record<string, unknown>): readonly ReferralSharedField[] {
  return Array.isArray(body.sharedFields)
    ? body.sharedFields.map(String) as ReferralSharedField[]
    : [];
}

function parsedOrganizationId(value: unknown, label: string) {
  try {
    return organizationId(String(value ?? ""));
  } catch {
    throw new ReferralNetworkError("invalid", `${label} is invalid.`);
  }
}

function recipientFromBody(body: Record<string, unknown>): ReferralRecipient {
  if (body.recipientKind === "external") {
    return Object.freeze({
      kind: "external" as const,
      displayName: String(body.recipientLabel ?? ""),
      email: String(body.recipientEmail ?? ""),
    });
  }
  return Object.freeze({
    kind: "organization" as const,
    organizationId: parsedOrganizationId(body.recipientOrganizationId, "Recipient organization"),
    displayName: String(body.recipientLabel ?? ""),
    notificationEmail: null,
  });
}

function providerContextFromBody(body: Record<string, unknown>): ProviderReferralContext | null {
  if (body.purpose !== "provider-connection") return null;
  return Object.freeze({
    providerOrganizationId: parsedOrganizationId(
      body.providerOrganizationId ?? body.recipientOrganizationId,
      "Provider organization",
    ),
    serviceId: String(body.serviceId ?? ""),
    publicationVersion: Number(body.publicationVersion),
  });
}

function creationInput(body: Record<string, unknown>): CreateAndSendReferralInput {
  return Object.freeze({
    recipient: recipientFromBody(body),
    need: String(body.need ?? "") as ReferralNeed,
    summary: String(body.summary ?? ""),
    urgency: String(body.urgency ?? "") as ReferralUrgency,
    preferredContactMethod: String(body.preferredContactMethod ?? "") as ReferralContactMethod,
    purpose: String(body.purpose ?? "") as ReferralPurpose,
    providerContext: providerContextFromBody(body),
    opportunityReference: typeof body.opportunityReference === "string"
      ? body.opportunityReference
      : null,
    sharedFields: sharedFields(body),
    consentAcknowledged: body.consentAcknowledged === true,
  });
}

export async function GET(request: NextRequest) {
  try {
    const scope = await accessScope();
    if (scope instanceof NextResponse) return scope;
    const referrals = await createServerReferralNetworkService().snapshot(scope);
    return NextResponse.json({ referrals });
  } catch (error) {
    return problem(request, error, "load");
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 32_768) {
      return NextResponse.json({ error: "Referral request body is too large." }, { status: 413 });
    }
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "");
    const scope = await accessScope(String(body.commandId ?? ""));
    if (scope instanceof NextResponse) return scope;

    if (action === "create-and-send") {
      const result = await createServerReferralCreateAndSendService().createAndSend(
        scope,
        creationInput(body),
      );
      const delivery = referralInvitationDeliveryPermitted(result.referral, result.communication)
        ? await attemptReferralCommunication(result.communication)
        : null;
      return NextResponse.json(
        { ...result, communication: delivery?.communication ?? result.communication },
        { status: result.replayed ? 200 : 201 },
      );
    }

    const service = createServerReferralNetworkService();
    if (action === "education") {
      const result = await service.acknowledgeEducation(scope, {
        recipientLabel: String(body.recipientLabel ?? ""),
        sharedFields: sharedFields(body),
      });
      return NextResponse.json(result);
    }
    if (action === "create") {
      const result = await service.createDraft(scope, creationInput(body));
      return NextResponse.json(result, { status: 201 });
    }
    if (action === "send") {
      const result = await service.send(scope, {
        referralId: String(body.referralId ?? ""),
        expectedVersion: Number(body.expectedVersion),
      });
      const pendingCommunication = "communication" in result
        ? result.communication
        : await new FirestoreReferralRepository(getServerFirestore()).getCommunication(
          String(result.referral.communicationMessageId ?? ""),
        );
      const delivery = referralInvitationDeliveryPermitted(result.referral, pendingCommunication)
        ? await attemptReferralCommunication(pendingCommunication)
        : null;
      return NextResponse.json({
        ...result,
        communication: delivery?.communication ?? pendingCommunication,
      });
    }
    if (action === "retry-communication") {
      const repository = new FirestoreReferralRepository(getServerFirestore());
      const referral = await repository.getById(String(body.referralId ?? ""));
      const referrals = await service.snapshot(scope);
      if (
        !referral?.communicationMessageId ||
        !referrals.some((projection) => projection.id === referral.id)
      ) {
        return NextResponse.json(
          { error: "Communication recovery is unavailable." },
          { status: 404 },
        );
      }
      const intent = await repository.getCommunication(referral.communicationMessageId);
      if (!referralInvitationDeliveryPermitted(referral, intent)) {
        return NextResponse.json(
          { error: "This referral no longer permits invitation delivery." },
          { status: 409 },
        );
      }
      const delivery = await attemptReferralCommunication(intent);
      if (delivery.blocked) {
        return NextResponse.json(
          { error: "This referral no longer permits invitation delivery." },
          { status: 409 },
        );
      }
      return NextResponse.json({ communication: delivery.communication });
    }
    if (["accepted", "declined", "redirected", "contacted", "closed", "expired"].includes(action)) {
      const result = await service.transition(scope, {
        referralId: String(body.referralId ?? ""),
        expectedVersion: Number(body.expectedVersion),
        action: action as "accepted",
        outcome: typeof body.outcome === "string" ? body.outcome as "other" : null,
        suggestedProviderOrganizationId: typeof body.suggestedProviderOrganizationId === "string"
          ? body.suggestedProviderOrganizationId
          : null,
        redirectReason: typeof body.redirectReason === "string" ? body.redirectReason : null,
      });
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: "Referral action is unsupported." }, { status: 400 });
  } catch (error) {
    return problem(request, error, "change");
  }
}
