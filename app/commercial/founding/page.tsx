import type { Metadata } from "next";

import { FoundingMembershipCard } from "@/src/components/commercial/FoundingMembershipCard";
import { getRequestDictionary } from "@/src/i18n/server";

import styles from "./founding.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();
  const copy = dictionary.marketReadyFoundingCommerce;
  return { title: copy.metadataTitle, description: copy.metadataDescription };
}

export default async function CommercialFoundingPage() {
  const { dictionary } = await getRequestDictionary();
  return (
    <main className={styles.shell}>
      <FoundingMembershipCard copy={dictionary.marketReadyFoundingCommerce} />
    </main>
  );
}
