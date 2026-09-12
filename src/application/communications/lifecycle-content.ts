import type { LifecycleJourney } from "../../domain/communications/lifecycle.ts";

/** Versioned public-only content: no private record details in email or SMS. */
export function lifecycleContent(journey: LifecycleJourney, exchangeOrigin: string) {
  const origin = new URL(exchangeOrigin);
  if (origin.protocol !== "https:" || origin.username || origin.password || origin.pathname !== "/") throw new Error("A configured Exchange origin is required.");
  const setup = journey === "finish-setup";
  const subject = setup ? "Continue setting up your organization" : journey === "retention" ? "Your next business connection starts here" : "Reconnect with your business community";
  const actionUrl = new URL(setup ? "/join" : "/opportunities", origin).href;
  const preferencesUrl = new URL("/account/communications", origin).href;
  const text = `${setup ? "Continue setting up your organization on RFxchange when you are ready." : "Visit RFxchange to explore opportunities, resources and business capabilities."}\n\n${actionUrl}\n\nManage preferences or unsubscribe: ${preferencesUrl}`;
  return { subject, text, sms: `RFxchange: ${setup ? "Continue your organization setup" : "Explore your business community"}: ${actionUrl} Reply STOP to opt out.` };
}
