import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "How It Works | The RFxchange",
  description: "See how capability, RFx activity, matching, teaming, resources, and outcomes connect inside The RFxchange.",
};

export default function HowItWorksPage() {
  return (
    <MarketingStoryPage
      eyebrow="The connected business journey"
      title="From capability to connection to outcome."
      lede="RFxchange is designed around a connected business journey: establish the organization, discover demand, resolve gaps, act, connect and learn from the outcome."
      image="https://images.unsplash.com/photo-1742112125567-3e8967bad60f?auto=format&fit=crop&w=2200&q=82"
      imageAlt="Project professionals reviewing plans at an active site"
      sections={[
        {
          eyebrow: "The journey",
          title: "A working network, not a passive directory.",
          body: "Organizations establish their identity and capabilities, then use the Exchange to discover opportunities, buyers, partners, referrals and resources. The same environment supports issuers bringing needs to market and providers becoming visible when a business needs help.",
          bullets: [
            "1. Establish — Create or claim the organization and describe what it does, where it operates and the roles it plays.",
            "2. Discover — Find relevant RFx, organizations, resources, referrals and partner possibilities through capability and geography.",
            "3. Act — Decide what to pursue, resolve gaps, form the right connections and move the work into an accountable workflow.",
          ],
        },
        {
          eyebrow: "RFx",
          title: "The RFx cycle",
          body: "The RFx is the structured center of the transaction. Requirements created by the issuer can drive responder readiness, team formation and later evaluation without splitting the process into unrelated tools.",
        },
        {
          eyebrow: "The network",
          title: "The network around the transaction",
          body: "Not every gap is solved by the issuer and responder alone. A business may need another company, financing, workforce support, procurement assistance, certification guidance or technical help. RFxchange is designed so those relationships can appear in context rather than as a separate directory.",
        },
      ]}
      ctaTitle={null}
      ctaBody={null}
      ctaLabel="Join Free"
      ctaSecondaryHref="/businesses"
      ctaSecondaryLabel="See the Business Journey"
    />
  );
}
