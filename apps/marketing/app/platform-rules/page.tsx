import type { Metadata } from "next";

import { PublicPolicyPage } from "@/src/components/legal/PublicPolicyPage";
import { platformRules } from "@/src/content/legal";

export const metadata: Metadata = {
  title: "Platform Rules | RFxchange",
  description: "Current RFxchange Platform Rules and conduct requirements.",
};

export default function PlatformRulesPage() {
  return <PublicPolicyPage policy={platformRules} />;
}
