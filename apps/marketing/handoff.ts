import { NextRequest, NextResponse } from "next/server";
import { exchangeOrigin } from "@/src/application/platform/exchange-origin";
import { MARKETING_CAMPAIGN_COOKIE, marketingCampaignReference, marketingReturnPath } from "@/src/application/acquisition/marketing-entry";
import { isLocale, localeCookieName } from "@/src/i18n/config";

export function handoffToExchange(request: NextRequest, intent: "join" | "signin" | "founding") {
  const origin = exchangeOrigin(process.env.NEXT_PUBLIC_RFXCHANGE_EXCHANGE_ORIGIN);
  if (!origin) throw new Error("Marketing requires a configured Exchange origin.");
  const target = new URL("/acquisition/entry", origin);
  target.searchParams.set("intent", intent);
  const campaign = marketingCampaignReference(request.cookies.get(MARKETING_CAMPAIGN_COOKIE)?.value)
    ?? marketingCampaignReference(request.nextUrl.searchParams.get("utm_campaign"));
  if (campaign) target.searchParams.set("campaign", campaign);
  const locale = request.cookies.get(localeCookieName)?.value;
  if (isLocale(locale)) target.searchParams.set("locale", locale);
  const returnTo = marketingReturnPath(request.nextUrl.searchParams.get("returnTo"));
  if (returnTo) target.searchParams.set("returnTo", returnTo);
  const response = NextResponse.redirect(target, 303);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
