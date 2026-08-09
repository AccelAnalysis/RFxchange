import Link from "next/link";

import { getRequestDictionary } from "@/src/i18n/server";

import styles from "./FoundingAcquisitionContinuation.module.css";

export async function FoundingAcquisitionContinuation() {
  const { dictionary } = await getRequestDictionary();
  const content = dictionary.marketingPages.founding.cta;

  return (
    <aside className={styles.continuation} aria-labelledby="founding-continuation-title">
      <div>
        <strong id="founding-continuation-title">{content.title}</strong>
        <p>{content.description}</p>
      </div>
      <Link href="/founding">{content.primary}</Link>
    </aside>
  );
}
