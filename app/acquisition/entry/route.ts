import { NextRequest, NextResponse } from "next/server";
import { MARKETING_CAMPAIGN_COOKIE, marketingCampaignReference, marketingReturnPath } from "@/src/application/acquisition/marketing-entry";
import { acquisitionCookieOptions } from "@/src/infrastructure/acquisition/runtime";
import { RFXCHANGE_FOUNDING_ACQUISITION_COOKIE_NAME, RFXCHANGE_FOUNDING_ACQUISITION_INTENT } from "@/src/infrastructure/acquisition/founding-intent";
import { isLocale, localeCookieName, localeCookieMaxAge } from "@/src/i18n/config";

/** Receive non-authorizing Marketing context on the Exchange origin before sign-in/registration. */
export function GET(request: NextRequest) {
  const intent = request.nextUrl.searchParams.get("intent");
  const target = new URL(intent === "signin" ? "/signin" : "/join", request.url);
  const returnTo = marketingReturnPath(request.nextUrl.searchParams.get("returnTo"));
  if (intent === "signin" && returnTo) target.searchParams.set("returnTo", returnTo);
  // App Hosting may expose its internal listener in request.url. A relative Location
  // keeps this fixed, validated path on the browser’s public Exchange origin.
  const response = new NextResponse(null, { status: 303, headers: { Location: target.pathname + target.search } });
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  const campaign = marketingCampaignReference(request.nextUrl.searchParams.get("campaign"));
  if (campaign && !marketingCampaignReference(request.cookies.get(MARKETING_CAMPAIGN_COOKIE)?.value)) {
    response.cookies.set(MARKETING_CAMPAIGN_COOKIE, campaign, acquisitionCookieOptions());
  }
  if (intent === "founding") {
    response.cookies.set(RFXCHANGE_FOUNDING_ACQUISITION_COOKIE_NAME, RFXCHANGE_FOUNDING_ACQUISITION_INTENT, acquisitionCookieOptions());
  }
  const locale = request.nextUrl.searchParams.get("locale");
  if (isLocale(locale)) response.cookies.set(localeCookieName, locale, {
    sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: localeCookieMaxAge,
  });
  return response;
}
