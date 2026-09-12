/** Reported campaign metadata only; never an invitation, referral credit or permission. */
export const MARKETING_LAST_CAMPAIGN_COOKIE = "rfx_marketing_last_campaign";
export const MARKETING_CAMPAIGN_COOKIE = "rfx_marketing_campaign";

export function marketingCampaignReference(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  return candidate && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(candidate) ? candidate : null;
}

export function marketingReturnPath(value: string | null | undefined): string | null {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return null;
  const url = new URL(value, "https://exchange.invalid");
  if (url.origin !== "https://exchange.invalid" || /^\/(?:admin|signin|acquisition)(?:\/|$)/.test(url.pathname)) return null;
  return `${url.pathname}${url.search}`;
}
