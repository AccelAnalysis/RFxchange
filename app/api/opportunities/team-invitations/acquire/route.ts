import { NextRequest, NextResponse } from "next/server";

import { parseAcquisitionContextToken } from "@/src/application/acquisition/acquisition-context";
import { acquisitionCookieOptions, RFXCHANGE_ACQUISITION_COOKIE_NAME } from "@/src/infrastructure/acquisition/runtime";

export const runtime = "nodejs";

function invitationReference(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return /^teaminv_[a-f0-9]{40}$/.test(normalized) ? normalized : null;
}

export async function GET(request: NextRequest) {
  const serializedToken = request.nextUrl.searchParams.get("token");
  const token = parseAcquisitionContextToken(serializedToken);
  const invitation = invitationReference(request.nextUrl.searchParams.get("invitation"));
  if (!token || !invitation) return NextResponse.redirect(new URL("/join?entry=team-invitation&status=unavailable", request.url), 303);
  const reviewHref = `/opportunities/team-invitations/${encodeURIComponent(invitation)}`;
  const response = NextResponse.redirect(new URL(`/signin?returnTo=${encodeURIComponent(reviewHref)}`, request.url), 303);
  response.cookies.set(RFXCHANGE_ACQUISITION_COOKIE_NAME, serializedToken!, acquisitionCookieOptions());
  return response;
}
