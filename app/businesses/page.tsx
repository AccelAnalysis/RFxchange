import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "For Businesses | The RFxchange",
  description: "Build a discoverable business position, find demand, discover partners, and connect to resources through The RFxchange.",
};

export default function BusinessesPage() {
  return (
    <MarketingStoryPage
      eyebrow="For growth-minded organizations"
      title="Be found. Find demand. Build the connection."
      lede="RFxchange gives businesses a reusable business-development position for capability visibility, opportunity discovery, referrals, teaming, resources and activity intelligence."
      image="https://images.unsplash.com/photo-1770386291809-dfbd371046c9?auto=format&fit=crop&w=2200&q=82"
      imageAlt="People working together in a small business workshop"
      sections={[
        {
          eyebrow: "Visibility",
          title: "Your business may already have the capability.",
          body: "The harder part is often becoming visible to the buyer, partner, issuer or resource that matters at the right moment. RFxchange is built around repeat business-development activity rather than a one-time listing.",
          bullets: [
            "Be found — Maintain a capability-rich organization presence that communicates more than a name, address and industry code.",
            "Find demand — Explore RFx, supplier needs, referrals and other opportunities with capability and geography as context.",
            "Build capacity — Find complementary businesses and relevant resource providers when an opportunity exposes a gap.",
          ],
        },
        {
          eyebrow: "Participation",
          title: "Designed for active participation.",
          body: "The Exchange is most useful to organizations that maintain accurate capabilities, respond to legitimate activity, evaluate opportunities thoughtfully and contribute to a healthy network.",
        },
      ]}
      ctaTitle={null}
      ctaBody={null}
      ctaLabel="Create a Free Organization Account"
    />
  );
}
