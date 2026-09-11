import { NextRequest, NextResponse } from "next/server";
import { MARKETING_CAMPAIGN_COOKIE, marketingCampaignReference } from "@/src/application/acquisition/marketing-entry";

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const campaign = marketingCampaignReference(request.nextUrl.searchParams.get("utm_campaign"));
  if (campaign && !marketingCampaignReference(request.cookies.get(MARKETING_CAMPAIGN_COOKIE)?.value)) {
    response.cookies.set(MARKETING_CAMPAIGN_COOKIE, campaign, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400,
    });
  }
  return response;
}

export const config = { matcher: ["/((?!_next|favicon.ico|api).*)"] };
