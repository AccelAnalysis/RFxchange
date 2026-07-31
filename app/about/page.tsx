import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "About | The RFxchange",
  description: "Learn how The RFxchange is designed to make local business capability, opportunity, resources, and connections more visible and actionable.",
};

export default function AboutPage() {
  return (
    <MarketingStoryPage
      eyebrow="About The RFxchange"
      title="Make the economic network easier to see and use."
      lede="The RFxchange is a Hi-Coworking initiative designed as connective business infrastructure: a shared environment where organizations, opportunities, partners, referrals, resources, and measured activity can become easier to discover and act on."
      image="https://images.unsplash.com/photo-1633536584998-2d71cbd95d37?auto=format&fit=crop&w=2200&q=82"
      imageAlt="Aerial view of a city, businesses, and waterways"
      sections={[
        {
          eyebrow: "The idea",
          title: "The community may contain more capability than any one institution can see.",
          body: "Businesses, buyers, governments, chambers, universities, workforce organizations, lenders, advisers, and other providers often operate through different systems. RFxchange creates a shared layer for discovery and interaction across those institutional boundaries.",
        },
        {
          eyebrow: "The role",
          title: "Connect existing assets instead of pretending to replace them.",
          body: "RFxchange is not intended to replace procurement systems, provider CRMs, chambers, economic-development organizations, lenders, advisers, or the professional judgment those institutions provide.",
        },
        {
          eyebrow: "The network",
          title: "Visible. Connected. Actionable.",
          body: "Visibility means capabilities and needs can be found. Connection means participants can identify a relevant next step. Actionable means the platform supports movement into RFx, referrals, teaming, resources, and other real workflows.",
        },
        {
          eyebrow: "The boundary",
          title: "Public marketing outside. Account-based participation inside.",
          body: "Public visitors receive the marketing and authentication surface. The working Exchange is account-based so organization authority, permissions, geography, private activity, and transactional workflows can remain governed rather than becoming anonymous public browsing infrastructure.",
        },
      ]}
    />
  );
}
