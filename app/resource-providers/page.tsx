import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "For Resource Providers | The RFxchange",
  description: "Become discoverable in context, receive better-matched referrals, and connect business needs to appropriate resources through The RFxchange.",
};

export default function ResourceProvidersPage() {
  return (
    <MarketingStoryPage
      eyebrow="Qualified routing in context"
      title="Become visible when a business actually needs help."
      lede="RFxchange connects resource-provider visibility to the business journey, helping businesses find appropriate services while preserving provider ownership of eligibility, intake and client relationships."
      image="https://images.unsplash.com/photo-1758518729711-1cbacd55efdb?auto=format&fit=crop&w=2200&q=82"
      imageAlt="Professional advisers discussing business needs around a table"
      sections={[
        {
          eyebrow: "Appropriate connections",
          title: "More visibility is useful only if the connection is appropriate.",
          body: "Providers may serve different territories, industries, stages and needs. RFxchange is designed to help businesses understand the right door—and to carry useful context into a referral without replacing the provider’s own intake or CRM.",
          bullets: [
            "Be discoverable — Describe services, territories, eligibility, intake methods, availability and programs in terms a business can use.",
            "Receive context — Structured referrals can identify the business need, the reason for the connection and the relevant opportunity or workflow.",
            "See the gaps — Aggregate activity can help the ecosystem identify unmet service needs, failed handoffs and geographic or capability coverage gaps.",
          ],
        },
        {
          eyebrow: "Provider authority",
          title: "The provider remains the provider.",
          body: "RFxchange does not make lending decisions, certify procurement eligibility, replace professional advice or take ownership of the provider’s client relationship. It strengthens discovery and the connections between independent organizations.",
        },
      ]}
      ctaTitle={null}
      ctaBody={null}
      ctaLabel="Join as a Resource Provider"
    />
  );
}
