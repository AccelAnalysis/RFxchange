import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "For Buyers & Issuers | The RFxchange",
  description: "Bring needs to market, discover capable organizations, and structure RFx activity through The RFxchange.",
};

export default function BuyersPage() {
  return (
    <MarketingStoryPage
      eyebrow="For issuers and organizations with demand"
      title="Bring a need to the market—and make capability easier to discover."
      lede="RFxchange helps buyers and issuers structure needs, publish RFx, discover potentially relevant organizations and manage a connected response and evaluation pathway."
      image="https://images.unsplash.com/photo-1742112125567-3e8967bad60f?auto=format&fit=crop&w=2200&q=82"
      imageAlt="Project team reviewing requirements and plans"
      sections={[
        {
          eyebrow: "The need",
          title: "Start with what you need.",
          body: "An issuer should not have to begin with a giant procurement form. The RFx journey begins with the business need, then structures scope, requirements, geography, response expectations and evaluation appropriate to the request.",
          bullets: [
            "Structure demand — Use RFx types and templates suited to information gathering, quotes, proposals, supplier discovery, subcontractor needs and other market requests.",
            "See the market — Use capability, geography and explicit criteria to understand whether potentially relevant organizations are represented before and after publication.",
            "Evaluate consistently — Keep the response connected to the requirements and criteria established for the RFx while preserving the issuer’s actual authority and rules.",
          ],
        },
        {
          eyebrow: "Selection authority",
          title: "Capability-based discovery, not automatic selection.",
          body: "RFxchange can surface potentially relevant organizations, but it does not choose the winner or guarantee qualification. Formal procurement requirements, legal authority and external systems remain in force where applicable.",
        },
      ]}
      ctaTitle={null}
      ctaBody={null}
      ctaLabel="Create an Organization"
      ctaSecondaryHref="/how-it-works"
      ctaSecondaryLabel="See the RFx Journey"
    />
  );
}
