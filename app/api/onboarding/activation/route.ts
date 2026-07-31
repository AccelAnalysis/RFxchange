import { NextRequest, NextResponse } from "next/server";

import type { AuthenticatedServerContext } from "@/src/application/auth/server-session";
import { ActivationJourneyError } from "@/src/application/onboarding/activation-journey";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
} from "@/src/infrastructure/auth/firebase-server-session";
import { createServerAuthenticationBoundary } from "@/src/infrastructure/auth/firebase-session-runtime";
import { createServerActivationJourneyService } from "@/src/infrastructure/onboarding/runtime";

async function authenticatedContext(request: NextRequest): Promise<AuthenticatedServerContext> {
  const sessionCookie = request.cookies.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) throw new Error("RFxchange session is required.");
  return createServerAuthenticationBoundary().authenticateSessionCookie({
    sessionCookie,
    now: new Date().toISOString(),
  });
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Activation request failed.";
  if (error instanceof ActivationJourneyError) {
    return NextResponse.json({ error: message, code: error.code }, { status: 409 });
  }
  if (/session|credential|authentication/i.test(message)) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    const context = await authenticatedContext(request);
    const state = await createServerActivationJourneyService().state(context);
    return NextResponse.json({ state });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await authenticatedContext(request);
    const service = createServerActivationJourneyService();
    const body = (await request.json()) as Readonly<Record<string, unknown>>;
    const action = typeof body.action === "string" ? body.action : "";

    switch (action) {
      case "accept-legal": {
        return NextResponse.json({ state: await service.acceptLegal(context) });
      }
      case "select-geography": {
        const geographyId = typeof body.geographyId === "string" ? body.geographyId : "";
        return NextResponse.json({ state: await service.selectGeography(context, geographyId) });
      }
      case "acknowledge-orientation-position": {
        return NextResponse.json({ state: await service.acknowledgeOrientationPosition(context) });
      }
      case "search-organizations": {
        const displayName = typeof body.displayName === "string" ? body.displayName : "";
        const result = await service.searchOrganizations(context, {
          displayName,
          ...(typeof body.domain === "string" && body.domain.trim() ? { domain: body.domain } : {}),
          ...(typeof body.phone === "string" && body.phone.trim() ? { phone: body.phone } : {}),
        });
        return NextResponse.json({
          provisionalIdentity: result.provisionalIdentity,
          candidates: result.candidates,
          creationSafety: result.creationSafety,
        });
      }
      case "create-organization": {
        const current = await service.state(context);
        if (!current.emailVerified) {
          return NextResponse.json(
            { error: "Verify your email before creating or claiming an organization.", code: "email-verification-required" },
            { status: 409 },
          );
        }
        const displayName = typeof body.displayName === "string" ? body.displayName : "";
        const reviewedCandidateOrganizationIds = Array.isArray(body.reviewedCandidateOrganizationIds)
          ? body.reviewedCandidateOrganizationIds.filter((value): value is string => typeof value === "string")
          : [];
        const state = await service.createOrganization(context, {
          displayName,
          reviewedCandidateOrganizationIds,
          ...(typeof body.domain === "string" && body.domain.trim() ? { domain: body.domain } : {}),
          ...(typeof body.phone === "string" && body.phone.trim() ? { phone: body.phone } : {}),
        });
        return NextResponse.json({ state });
      }
      case "select-existing-organization": {
        const current = await service.state(context);
        if (!current.emailVerified) {
          return NextResponse.json(
            { error: "Verify your email before creating or claiming an organization.", code: "email-verification-required" },
            { status: 409 },
          );
        }
        const displayName = typeof body.displayName === "string" ? body.displayName : "";
        const organizationId = typeof body.organizationId === "string" ? body.organizationId : "";
        const state = await service.selectExistingOrganization(context, {
          displayName,
          organizationId,
          ...(typeof body.domainEmailReference === "string" && body.domainEmailReference.trim()
            ? { domainEmailReference: body.domainEmailReference }
            : {}),
        });
        return NextResponse.json({ state });
      }
      case "begin-location": {
        const result = await service.beginLocation(context, {
          addressLine1: typeof body.addressLine1 === "string" ? body.addressLine1 : "",
          ...(typeof body.addressLine2 === "string" && body.addressLine2.trim()
            ? { addressLine2: body.addressLine2 }
            : {}),
          locality: typeof body.locality === "string" ? body.locality : "",
          regionCode: typeof body.regionCode === "string" ? body.regionCode : "",
          postalCode: typeof body.postalCode === "string" ? body.postalCode : "",
          isHomeOrPrivate: body.isHomeOrPrivate === true,
          visibility: typeof body.visibility === "string" ? body.visibility : "locality-only",
        });
        return NextResponse.json({
          state: result.state,
          draft: {
            id: String(result.draft.id),
            candidates: result.draft.candidates.map((candidate) => ({
              id: candidate.id,
              coordinate: candidate.coordinate,
              matchedAddress: candidate.matchedAddress,
              quality: candidate.quality,
              provider: candidate.provenance.provider,
            })),
          },
        });
      }
      case "confirm-location": {
        const candidateId = typeof body.candidateId === "string" ? body.candidateId : "";
        return NextResponse.json({ state: await service.confirmLocation(context, candidateId) });
      }
      case "save-profile": {
        const participationRoles = Array.isArray(body.participationRoles)
          ? body.participationRoles.filter((value): value is string => typeof value === "string")
          : [];
        const businessObjectives = Array.isArray(body.businessObjectives)
          ? body.businessObjectives.filter((value): value is string => typeof value === "string")
          : [];
        const state = await service.saveProfile(context, {
          displayName: typeof body.displayName === "string" ? body.displayName : "",
          organizationType: typeof body.organizationType === "string" ? body.organizationType : "",
          ...(typeof body.website === "string" && body.website.trim() ? { website: body.website } : {}),
          websiteNotApplicable: body.websiteNotApplicable === true,
          contactName: typeof body.contactName === "string" ? body.contactName : "",
          contactRole: typeof body.contactRole === "string" ? body.contactRole : "",
          contactEmail: typeof body.contactEmail === "string" ? body.contactEmail : "",
          ...(typeof body.contactPhone === "string" && body.contactPhone.trim()
            ? { contactPhone: body.contactPhone }
            : {}),
          contactPubliclyVisible: body.contactPubliclyVisible === true,
          capabilityKind: typeof body.capabilityKind === "string" ? body.capabilityKind : "service",
          capabilityName: typeof body.capabilityName === "string" ? body.capabilityName : "",
          capabilityDescription:
            typeof body.capabilityDescription === "string" ? body.capabilityDescription : "",
          participationRoles,
          businessObjectives,
        });
        return NextResponse.json({ state });
      }
      case "refresh": {
        return NextResponse.json({ state: await service.state(context) });
      }
      default:
        return NextResponse.json({ error: "Unsupported activation action." }, { status: 400 });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
