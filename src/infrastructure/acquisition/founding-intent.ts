export const RFXCHANGE_FOUNDING_ACQUISITION_COOKIE_NAME = "rfxchange_founding_intent";
export const RFXCHANGE_FOUNDING_ACQUISITION_INTENT = "founding";

export type FoundingAcquisitionIntent = typeof RFXCHANGE_FOUNDING_ACQUISITION_INTENT;

export function appendFoundingAcquisitionIntent(path: string): string {
  const url = new URL(path, "https://rfxchange.local");
  url.searchParams.set("acquisition", RFXCHANGE_FOUNDING_ACQUISITION_INTENT);
  return `${url.pathname}${url.search}${url.hash}`;
}
