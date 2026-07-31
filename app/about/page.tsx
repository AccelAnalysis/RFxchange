import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "About | The RFxchange",
  description: "Learn how The RFxchange is designed to make local business capability, opportunity, resources, and connections more visible and actionable.",
};

export default function AboutPage() {
  return (
    <MarketingStoryPage
      eyebrow="Visible · Connected · Actionable"
      title="Connect the assets already present in the business ecosystem."
      lede="The RFxchange is a map-based local business growth network designed to make business capabilities, opportunities, resources, referrals and relationships easier to discover and act on."
      image="https://images.unsplash.com/photo-1633536584998-2d71cbd95d37?auto=format&fit=crop&w=2200&q=82"
      imageAlt="Aerial view of a city, businesses, and waterways"
      sections={[
        {
          eyebrow: "The role",
          title: "Connective economic infrastructure.",
          body: "Communities already contain businesses, buyers, opportunities, institutions, resource providers and expertise. What is often missing is a common environment through which those assets can reliably find one another.",
          bullets: [
            "Visible — Make organizations, capabilities, service territories and market needs easier to understand.",
            "Connected — Bring opportunities, referrals, teaming and resources into one business-centered operating environment.",
            "Actionable — Organize activity into journeys that can progress toward responses, relationships, services and outcomes.",
          ],
        },
        {
          eyebrow: "Boundaries",
          title: "What it does not replace.",
          body: "RFxchange is not a substitute for public procurement systems, economic-development organizations, chambers, lenders, workforce providers, CRMs, universities or professional advisers. It is designed to improve discovery and interaction between them and the businesses they serve.",
        },
      ]}
      ctaTitle={null}
      ctaBody={null}
      ctaLabel="Join the Exchange"
    />
  );
}
