import type { Metadata } from "next";

import { PublicPolicyPage } from "@/src/components/legal/PublicPolicyPage";
import { termsOfService } from "@/src/content/legal";

export const metadata: Metadata = {
  title: "Terms of Service | RFxchange",
  description: "Current RFxchange Terms of Service.",
};

export default function TermsPage() {
  return <PublicPolicyPage policy={termsOfService} />;
}
