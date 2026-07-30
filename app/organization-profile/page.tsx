import Link from "next/link";

import { EssentialProfilePanel } from "@/src/components/organization-profile/EssentialProfilePanel";
import { createPortsmouthControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";

import styles from "./page.module.css";

export default async function OrganizationProfilePage() {
  const mapModel = await createPortsmouthControlledLocalityPreview();
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.wordmark} aria-label="RFxchange home">
          <span>RF</span>xchange<sup>™</sup>
        </Link>
        <span>Identity · capability · roles · objectives · automatic completion</span>
      </header>
      <EssentialProfilePanel mapModel={mapModel} />
    </main>
  );
}
