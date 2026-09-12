import { notFound } from "next/navigation";
import { PublicPolicyPage } from "@/src/components/legal/PublicPolicyPage";
import { termsOfService, privacyPolicy, platformRules } from "@/src/content/legal-2026-07-31";

const documents = { terms: termsOfService, privacy: privacyPolicy, "platform-rules": platformRules };
export const metadata = { title: "Archived policies", robots: { index: false, follow: true } };
export function generateStaticParams() { return Object.keys(documents).map(document => ({ document })); }
export default async function ArchivedPolicyPage({ params }: { params: Promise<{ document: string }> }) {
  const { document } = await params;
  if (!Object.hasOwn(documents, document)) notFound();
  return <PublicPolicyPage policy={documents[document as keyof typeof documents]} />;
}
