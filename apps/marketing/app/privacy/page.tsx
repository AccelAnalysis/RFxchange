import type { Metadata } from "next";

import { PublicPolicyPage } from "@/src/components/legal/PublicPolicyPage";
import { privacyPolicy } from "@/src/content/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | RFxchange",
  description: "Current RFxchange Privacy Policy.",
};

export default function PrivacyPolicyPage() {
  return <PublicPolicyPage policy={privacyPolicy} />;
}
