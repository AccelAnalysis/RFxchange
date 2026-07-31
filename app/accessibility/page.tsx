import type { Metadata } from "next";

import { MarketingStoryPage } from "@/src/components/marketing/MarketingStoryPage";

export const metadata: Metadata = {
  title: "Accessibility | The RFxchange",
  description: "Accessibility principles and feedback path for The RFxchange public and account surfaces.",
};

export default function AccessibilityPage() {
  return (
    <MarketingStoryPage
      eyebrow="Accessibility"
      title="Build the Exchange so more people can use it."
      lede="Accessibility is a product requirement across the public marketing surface and the account-based Exchange. The platform should support clear navigation, readable content, keyboard interaction, meaningful labels, and reduced-motion preferences as features are delivered."
      image="https://images.unsplash.com/photo-1758518729711-1cbacd55efdb?auto=format&fit=crop&w=2000&q=82"
      imageAlt="Professionals collaborating around a table"
      sections={[
        {
          eyebrow: "Structure",
          title: "Use clear hierarchy and semantic page structure.",
          body: "Pages should provide meaningful headings, landmarks, link text, labels, and reading order so content remains understandable beyond its visual presentation.",
        },
        {
          eyebrow: "Interaction",
          title: "Core actions should not depend on a mouse alone.",
          body: "Navigation, forms, dialogs, maps, and other controls should be designed with keyboard access and visible focus behavior where the interaction permits it.",
        },
        {
          eyebrow: "Visual access",
          title: "Maintain legibility as the visual system becomes richer.",
          body: "The black, gold, ivory, graphite, blue, and green system should be applied with sufficient contrast, readable type sizes, non-color-only signals, and responsive layouts.",
        },
        {
          eyebrow: "Motion + feedback",
          title: "Respect user motion preferences and make system state understandable.",
          body: "Decorative animation should respect reduced-motion settings. Important actions should provide perceivable status, errors, and next steps rather than depending on transient visual effects.",
        },
      ]}
      ctaTitle="Need to report an accessibility issue?"
      ctaBody="Use the platform support path when available and include the page, action, device, browser, and assistive technology involved so the problem can be reproduced and corrected."
      ctaHref="/about"
      ctaLabel="About RFxchange"
    />
  );
}
