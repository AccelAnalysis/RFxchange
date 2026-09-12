import styles from "@/src/components/communications/ServiceSettings.module.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingHeader, MarketingFooter } from "@/apps/marketing/components/MarketingChrome";
import { getServerFirestore } from "@/src/infrastructure/firestore/runtime";
import { validateCampaign } from "@/src/domain/acquisition/campaign";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9][a-z0-9-]{2,79}$/.test(id)) notFound();
  const record = await getServerFirestore().collection("marketingCampaigns").doc(id).get();
  if (!record.exists || record.get("status") !== "published") notFound();
  const campaign = validateCampaign(record.data());
  return <><MarketingHeader/><main className={styles.panel}><article><h1>{campaign.title}</h1><p>{campaign.summary}</p><Link href={`/join?utm_campaign=${encodeURIComponent(campaign.id)}`}>{campaign.actionLabel}</Link></article></main><MarketingFooter/></>;
}
