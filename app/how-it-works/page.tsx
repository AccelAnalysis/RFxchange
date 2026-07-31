import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "How It Works | The RFxchange",
  description: "See how capability, RFx activity, matching, teaming, resources, and outcomes connect inside The RFxchange.",
};

export default function HowItWorksPage() {
  return (
    <MarketingStoryPage
      eyebrow="How It Works"
      title="From business need to useful connection."
      lede="RFxchange connects discovery, opportunity, response, teaming, support, and outcomes so participants can move through one business journey instead of a set of disconnected tools."
      image="https://images.unsplash.com/photo-1742112125567-3e8967bad60f?auto=format&fit=crop&w=2000&q=82"
      imageAlt="Project professionals reviewing plans at an active site"
      sections={[
        {
          eyebrow: "Need",
          title: "Start with what the organization is trying to accomplish.",
          body: "A buyer may need a supplier. A business may need work, a partner, or support. RFxchange begins with the business context instead of forcing every interaction into the same form.",
          bullets: ["Business need", "Capability need", "Supplier need", "Partner or resource need"],
        },
        {
          eyebrow: "RFx + discovery",
          title: "Bring demand into a structured, discoverable environment.",
          body: "RFx can represent information requests, quotes, proposals, supplier searches, subcontractor needs, and other structured market requests. Discovery can also begin through capability search, geography, referrals, or saved interests.",
        },
        {
          eyebrow: "Match",
          title: "Use capability and context to find relevant next steps.",
          body: "Potential alignment can surface organizations, opportunities, teammates, and resources. A match is a discovery signal—not a guarantee of qualification, endorsement, or selection.",
        },
        {
          eyebrow: "Act",
          title: "Move from discovery into response, teaming, referral, or support.",
          body: "The network is designed around action. Participants can pursue an RFx, explore a teammate, accept a referral, or connect with a resource provider when a gap appears.",
        },
        {
          eyebrow: "Outcome",
          title: "Follow activity toward reported outcomes without overclaiming impact.",
          body: "Connections can progress into proposals, selections, engagements, referrals, and completed business activity. RFxchange distinguishes participation, discovery, connection, activity, outcomes, and verified impact.",
        },
      ]}
    />
  );
}
