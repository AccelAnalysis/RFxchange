import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "Founding Membership | The RFxchange",
  description: "Learn what early Founding participation means for organizations helping establish The RFxchange network.",
};

export default function FoundingPage() {
  return (
    <MarketingStoryPage
      eyebrow="Founding RFxchange"
      title="Help build the network you want to use."
      lede="Founding Organizations participate early, establish real capability inventory, test the workflows that matter, and help shape a network built around business action rather than passive listings."
      image="https://images.unsplash.com/photo-1777026321659-64941fb943dd?auto=format&fit=crop&w=2000&q=82"
      imageAlt="Large warehouse and supply operation"
      sections={[
        {
          eyebrow: "Why early participation matters",
          title: "Network usefulness begins with credible organizations and real activity.",
          body: "Founding participants help establish capability categories, search language, referral norms, partner discovery, opportunity demand, resource connections, and practical feedback on how the Exchange should operate.",
        },
        {
          eyebrow: "Founding identity",
          title: "Recognition marks participation in the network's origin—not preferential qualification.",
          body: "Founding recognition is historical participation. It does not make an organization more verified, trusted, qualified, or entitled to preferential RFx treatment.",
        },
        {
          eyebrow: "Commercial boundaries",
          title: "Paid membership and credibility remain separate.",
          body: "Membership can provide approved premium value, but it cannot purchase substantive credibility. Current price, benefits, entitlements, cancellation rules, and any price-protection terms must be presented clearly before paid enrollment.",
        },
        {
          eyebrow: "Participation",
          title: "The strongest Founding members actively use the network.",
          body: "Complete the organization profile, respond to relevant activity, maintain accurate information, participate thoughtfully in referrals and teaming, use resources when needed, and provide actionable product feedback.",
        },
      ]}
      ctaTitle="Start with the free organization account."
      ctaBody="Establish your organization first. Founding conversion should occur only through the approved commercial flow with current terms visible at the point of purchase."
      ctaLabel="Join Free"
    />
  );
}
