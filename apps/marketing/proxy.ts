import { NextRequest, NextResponse } from "next/server";
import { MARKETING_LAST_CAMPAIGN_COOKIE, MARKETING_CAMPAIGN_COOKIE, marketingCampaignReference } from "@/src/application/acquisition/marketing-entry";
import { applicationOrigins } from "@/src/application/platform/application-origins";

import { isLocale, localeCookieName, localeCookieMaxAge } from "@/src/i18n/config";

export function proxy(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale");
  const destination = request.nextUrl.clone();
  destination.searchParams.delete("locale");
  // Next.js proxy redirects require an absolute URL. Bind it to the published
  // Marketing origin rather than App Hosting's internal request listener.
  const response = isLocale(locale)
    ? NextResponse.redirect(new URL(destination.pathname + destination.search, applicationOrigins.marketing), 307)
    : NextResponse.next();
  if (isLocale(locale)) {
    response.cookies.set(localeCookieName, locale, { path: "/", maxAge: localeCookieMaxAge, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    response.headers.set("Cache-Control", "private, no-store");
  }
  const campaign = marketingCampaignReference(request.nextUrl.searchParams.get("utm_campaign"));
  if (campaign && !marketingCampaignReference(request.cookies.get(MARKETING_CAMPAIGN_COOKIE)?.value)) {
    response.cookies.set(MARKETING_CAMPAIGN_COOKIE, campaign, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400,
    });
  }
  if (campaign) response.cookies.set(MARKETING_LAST_CAMPAIGN_COOKIE, campaign, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400 });
  return response;
}

export const config = { matcher: ["/((?!_next|favicon.ico|api).*)"] };
