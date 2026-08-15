import { NextRequest, NextResponse } from "next/server";

import { serializeAcquisitionContextToken } from "@/src/application/acquisition/acquisition-context";
import {
  acquisitionCookieOptions,
  createServerAcquisitionContextService,
  resolveOpportunityPublicationAudience,
  RFXCHANGE_ACQUISITION_COOKIE_NAME,
} from "@/src/infrastructure/acquisition/runtime";

function withAcquisitionCookie(
  response: NextResponse,
  token: Parameters<typeof serializeAcquisitionContextToken>[0],
): NextResponse {
  response.cookies.set(
    RFXCHANGE_ACQUISITION_COOKIE_NAME,
    serializeAcquisitionContextToken(token),
    acquisitionCookieOptions(),
  );
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("opportunityReference")?.trim() ?? "";
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(reference)) {
      throw new Error("Opportunity reference is invalid.");
    }
    const audience = await resolveOpportunityPublicationAudience(reference);
    if (audience !== "authenticated-participants") {
      throw new Error("Authenticated-participant opportunity is unavailable.");
    }
    const token = await createServerAcquisitionContextService().issueValidatedOpportunity({
      reference,
      referrer: request.headers.get("referer"),
    });
    const returnTo = `/opportunities/${encodeURIComponent(reference)}`;
    return withAcquisitionCookie(
      NextResponse.redirect(
        new URL(`/signin?returnTo=${encodeURIComponent(returnTo)}`, request.url),
        303,
      ),
      token,
    );
  } catch {
    return NextResponse.json(
      { error: "This authenticated opportunity is unavailable." },
      { status: 404 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const reference = typeof form.get("opportunityReference") === "string"
      ? String(form.get("opportunityReference"))
      : "";
    const issued = await createServerAcquisitionContextService().issuePublicOpportunity({
      reference,
      referrer: request.headers.get("referer"),
    });
    return withAcquisitionCookie(
      NextResponse.redirect(new URL("/join?entry=opportunity", request.url), 303),
      issued.token,
    );
  } catch {
    return NextResponse.json({ error: "This public opportunity is unavailable." }, { status: 404 });
  }
}
