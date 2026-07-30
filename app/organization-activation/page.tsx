import Link from "next/link";

import { MarkerActivationPanel } from "@/src/components/organization-marker/MarkerActivationPanel";
import { createPortsmouthActivatedOrganizationPreview } from "@/src/data/geography/portsmouth-activated-organization-preview";
import { createPortsmouthControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";

import styles from "./page.module.css";

export default async function OrganizationActivationPage() {
  const [mapModel, preview] = await Promise.all([
    createPortsmouthControlledLocalityPreview(),
    Promise.resolve(createPortsmouthActivatedOrganizationPreview()),
  ]);
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.wordmark} aria-label="RFxchange home">
          <span>RF</span>xchange<sup>™</sup>
        </Link>
        <span>Controlled activation · real geography · privacy-safe presence</span>
      </header>
      <MarkerActivationPanel mapModel={mapModel} marker={preview.marker} />
    </main>
  );
}
