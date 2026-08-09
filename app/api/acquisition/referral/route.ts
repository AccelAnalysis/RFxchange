import { NextRequest, NextResponse } from "next/server";

import { parseAcquisitionContextToken } from "@/src/application/acquisition/acquisition-context";
import { acquisitionCookieOptions, RFXCHANGE_ACQUISITION_COOKIE_NAME } from "@/src/infrastructure/acquisition/runtime";

export async function GET(request: NextRequest) {
  const serializedToken = request.nextUrl.searchParams.get("token");
  if (!parseAcquisitionContextToken(serializedToken)) {
    return NextResponse.redirect(new URL("/join?entry=referral&status=unavailable", request.url), 303);
  }
  const response = NextResponse.redirect(new URL("/join?entry=referral", request.url), 303);
  response.cookies.set(RFXCHANGE_ACQUISITION_COOKIE_NAME, serializedToken!, acquisitionCookieOptions());
  return response;
}
