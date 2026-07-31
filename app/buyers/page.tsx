import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "For Buyers & Issuers | The RFxchange",
  description: "Bring needs to market, discover capable organizations, and structure RFx activity through The RFxchange.",
};

export default function BuyersPage() {
  return (
    <MarketingStoryPage
      eyebrow="For Buyers & Issuers"
      title="Bring a need to the market with more context."
      lede="RFxchange helps buyers, institutions, primes, and opportunity issuers describe what they need, discover relevant capability, and move into structured market activity without replacing the formal authority of their procurement process."
      image="https://images.unsplash.com/photo-1742112125567-3e8967bad60f?auto=format&fit=crop&w=2000&q=82"
      imageAlt="Project team reviewing requirements and plans"
      sections={[
        {
          eyebrow: "Define",
          title: "Start with the need, not the document format.",
          body: "An issuer can describe a product, service, supplier, subcontractor, partner, or information need and select the RFx structure appropriate to the transaction.",
        },
        {
          eyebrow: "Understand the market",
          title: "Use capability and geography to see who may be relevant.",
          body: "Structured organization profiles can help a buyer identify potentially relevant organizations before and after publication. Discovery is informational and does not substitute for buyer qualification, due diligence, or procurement rules.",
        },
        {
          eyebrow: "Publish",
          title: "Turn the need into discoverable market activity.",
          body: "A published RFx can become searchable, geographically contextual, matchable to capabilities, and available to participants through appropriate discovery and notification paths.",
        },
        {
          eyebrow: "Evaluate",
          title: "Keep evaluation aligned with the issuer's own authority.",
          body: "RFxchange can organize requirements, responses, criteria, and workflow. The platform does not choose the winner, create procurement authority, or replace a buyer's governing process.",
        },
        {
          eyebrow: "Connect",
          title: "Let the transaction produce a useful next step.",
          body: "Different RFx types can end in information learned, a supplier selected, a team conversation, an award recorded, or another business connection. The outcome can then contribute appropriately to future network intelligence.",
        },
      ]}
      ctaTitle="Bring your organization into the Exchange."
      ctaBody="Establish organizational authority first, then use the network as approved buyer and RFx capabilities become available through the build plan."
    />
  );
}
