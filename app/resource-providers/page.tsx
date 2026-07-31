import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "For Resource Providers | The RFxchange",
  description: "Become discoverable in context, receive better-matched referrals, and connect business needs to appropriate resources through The RFxchange.",
};

export default function ResourceProvidersPage() {
  return (
    <MarketingStoryPage
      eyebrow="For Resource Providers"
      title="Become discoverable when the business actually needs help."
      lede="RFxchange is designed to connect business activity to the providers that can help—without asking providers to surrender their programs, eligibility decisions, client relationships, or systems of record."
      image="https://images.unsplash.com/photo-1758518729711-1cbacd55efdb?auto=format&fit=crop&w=2000&q=82"
      imageAlt="Professional advisers discussing business needs around a table"
      sections={[
        {
          eyebrow: "Visibility",
          title: "Show where and how your organization serves businesses.",
          body: "Provider discovery should reflect services, eligibility, intake, delivery method, and service territory—not merely the location of an office.",
        },
        {
          eyebrow: "Context",
          title: "Appear inside the business journey instead of beside it.",
          body: "A business pursuing an RFx, financing, certification, workforce need, partnership, or growth objective can encounter relevant assistance without having to understand the entire institutional support landscape first.",
        },
        {
          eyebrow: "Routing",
          title: "Prioritize appropriate engagement over raw lead volume.",
          body: "Clear service descriptions, eligibility, territory, and referral context can help reduce misdirected inquiries and improve how limited provider capacity is used.",
        },
        {
          eyebrow: "Handoffs",
          title: "Make the space between organizations easier to see.",
          body: "Structured referrals can preserve purpose, consent, and status so participants can identify whether a handoff was accepted, redirected, completed, or lost without exposing unnecessary confidential information.",
        },
        {
          eyebrow: "Intelligence",
          title: "Learn from recurring needs and service gaps.",
          body: "Aggregate platform activity can help participating providers recognize repeated searches, routing failures, geographic gaps, and emerging business needs. Exchange activity is a signal from participating users, not a census of the economy.",
        },
      ]}
      ctaTitle="Establish your provider organization."
      ctaBody="Create the organization account now; provider verification, service profiles, and advanced referral workflows follow the approved platform build sequence."
    />
  );
}
