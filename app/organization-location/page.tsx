import { OrganizationLocationPanel } from "@/src/components/organization-location/OrganizationLocationPanel";
import { createPortsmouthControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";
import Link from "next/link";

import styles from "./page.module.css";

export default async function OrganizationLocationPage() {
  const mapModel = await createPortsmouthControlledLocalityPreview();
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.wordmark} aria-label="RFxchange home">
          <span>RF</span>xchange<sup>™</sup>
        </Link>
        <span>Home location · public precision · service geography</span>
      </header>
      <OrganizationLocationPanel mapModel={mapModel} />
    </main>
  );
}
