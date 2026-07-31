import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "For Businesses | The RFxchange",
  description: "Build a discoverable business position, find demand, discover partners, and connect to resources through The RFxchange.",
};

export default function BusinessesPage() {
  return (
    <MarketingStoryPage
      eyebrow="For Businesses"
      title="Turn capability into a business-development position."
      lede="Your business may already have the capability. RFxchange helps the right people find it—and helps you find the opportunities, partners, and resources needed to use it."
      image="https://images.unsplash.com/photo-1770386291809-dfbd371046c9?auto=format&fit=crop&w=2000&q=82"
      imageAlt="People working together in a small business workshop"
      sections={[
        {
          eyebrow: "Be found",
          title: "Describe what your organization can actually do.",
          body: "Build a maintained organization presence around capabilities, service geography, experience, roles, and business interests rather than relying only on a name and industry code.",
        },
        {
          eyebrow: "Find demand",
          title: "Discover opportunities that fit your business position.",
          body: "Public, institutional, commercial, supplier, subcontracting, referral, and partnership demand can become easier to find when opportunity data and organization capability share the same network context.",
        },
        {
          eyebrow: "Build capacity",
          title: "Find complementary organizations when the work requires more.",
          body: "A business may need a prime, subcontractor, specialist, additional capacity, geographic reach, or another complementary capability. RFxchange helps participants discover possibilities; formal agreements remain outside the discovery action itself.",
        },
        {
          eyebrow: "Find support",
          title: "Connect with resources at the moment a need appears.",
          body: "Contracting assistance, capital, workforce support, technical assistance, training, and other resources can be surfaced in the context of what the business is trying to accomplish.",
        },
        {
          eyebrow: "Participate",
          title: "The Exchange is designed for active business development.",
          body: "Free participation establishes the organization and provides a path into the network. Long-term value comes from maintaining credible information, responding to relevant activity, and using the connections that fit the business.",
        },
      ]}
    />
  );
}
