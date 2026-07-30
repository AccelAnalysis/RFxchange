import Link from "next/link";

import { Organization360 } from "@/src/components/admin/Organization360";
import { createPortsmouthOrganization360Preview } from "@/src/data/admin/portsmouth-organization-360-preview";

import styles from "./page.module.css";

export default async function Organization360Page({
  params,
}: {
  readonly params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  const projection = createPortsmouthOrganization360Preview(organizationId);
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.wordmark} aria-label="RFxchange home">
          <span>RF</span>xchange<sup>™</sup>
        </Link>
        <strong>Platform administration</strong>
        <span>Organization 360 · scoped context</span>
      </header>
      <Organization360 projection={projection} />
    </main>
  );
}
