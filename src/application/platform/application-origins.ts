import { marketingCampaignReference } from "../acquisition/marketing-entry.ts";
import { isLocale } from "../../i18n/config.ts";

/** Deployed, project-owned application destinations. Never selected by request input. */
export const applicationOrigins = Object.freeze({
  exchange: "https://rfxchange--rfxchange.us-east4.hosted.app",
  admin: "https://rfxchange-admin--rfxchange.us-east4.hosted.app",
  marketing: "https://rfxchange-marketing--rfxchange.us-east4.hosted.app",
});

const publicPaths = new Set([
  "/", "/how-it-works", "/businesses", "/buyers", "/resource-providers",
  "/membership", "/pricing", "/founding", "/founders", "/about",
  "/terms", "/privacy", "/platform-rules", "/accessibility", "/image-credits",
]);

export function legacyApplicationDestination(pathname: string, campaign?: string | null, locale?: string | null): URL | null {
  if (!pathname.startsWith("/") || /[\\?#\u0000-\u001f\u007f]/.test(pathname)) return null;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return new URL(pathname, applicationOrigins.admin);
  }
  if (!publicPaths.has(pathname)) return null;
  const destination = new URL(pathname, applicationOrigins.marketing);
  const attribution = marketingCampaignReference(campaign);
  if (attribution) destination.searchParams.set("utm_campaign", attribution);
  if (isLocale(locale)) destination.searchParams.set("locale", locale);
  return destination;
}
