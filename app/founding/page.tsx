import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "Founding Membership | The RFxchange",
  description: "Learn what early Founding participation means for organizations helping establish The RFxchange network.",
};

export default function FoundingPage() {
  return (
    <MarketingStoryPage
      eyebrow="The founding cohort"
      title="Help build the network you want to use."
      lede="Founding Organizations participate early, help shape practical workflows and form the initial business cohort as the RFxchange network grows."
      image="https://images.unsplash.com/photo-1777026321659-64941fb943dd?auto=format&fit=crop&w=2200&q=82"
      imageAlt="Large warehouse and supply operation"
      sections={[
        {
          eyebrow: "Purpose",
          title: "Early participation with a purpose.",
          body: "The Founding cohort is intended for organizations that want to actively use the network while contributing feedback on capability profiles, RFx workflows, referrals, teaming, resources and business intelligence.",
          bullets: [
            "Founding identity — Recognition as part of the launch cohort without implying preferential qualification, verification or search ranking.",
            "Early participation — Structured opportunities to use new workflows, provide feedback and help refine the network around real business activity.",
            "Recurring value — The paid offer should only launch with clearly defined benefits that exceed useful free participation.",
          ],
        },
        {
          eyebrow: "Free entry",
          title: "Free remains the entry point.",
          body: "A useful free organization account is central to network density. Founding membership is a deeper participation layer—not a tollbooth in front of basic discovery and legitimate network activity.",
        },
      ]}
      ctaTitle={null}
      ctaBody={null}
      ctaLabel="Join Free First"
    />
  );
}
