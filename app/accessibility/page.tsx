import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "Accessibility | The RFxchange",
  description: "Accessibility principles and feedback path for The RFxchange public and account surfaces.",
};

export default function AccessibilityPage() {
  return (
    <MarketingStoryPage
      eyebrow="Access for every participant"
      title="Accessibility"
      lede="RFxchange should be usable by people with different abilities, devices and ways of navigating digital services."
      image="https://images.unsplash.com/photo-1633536584998-2d71cbd95d37?auto=format&fit=crop&w=2200&q=82"
      imageAlt="Aerial view of a city, region, and waterways"
      sections={[
        {
          eyebrow: "Design intent",
          title: "Design intent",
          body: "This static build uses semantic landmarks, keyboard-focusable links and controls, text alternatives for imagery, responsive layouts and contrast-aware brand colors.",
        },
        {
          eyebrow: "Production commitments",
          title: "Production commitments",
          body: "Accessibility issues should have a defined contact and remediation path before launch.",
          bullets: [
            "Keyboard-accessible navigation and workflows",
            "Visible focus treatment",
            "Meaningful labels and error messages",
            "Text alternatives for nondecorative images",
            "Color-independent states",
            "Responsive layouts and zoom support",
            "Ongoing accessibility testing of authenticated workflows",
          ],
        },
      ]}
      showCta={false}
    />
  );
}
