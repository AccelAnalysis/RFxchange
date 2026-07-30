import { ControlledLocalityCanvas } from "@/src/components/map/ControlledLocalityCanvas";
import { OrganizationResolutionPanel } from "@/src/components/organization-resolution/OrganizationResolutionPanel";
import { createPortsmouthControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";
import { createPortsmouthOrganizationResolutionPreview } from "@/src/data/organization-resolution/portsmouth-resolution-preview";

import styles from "./page.module.css";

export default async function OrganizationResolutionPage() {
  const [map, resolution] = await Promise.all([
    createPortsmouthControlledLocalityPreview(),
    Promise.resolve(createPortsmouthOrganizationResolutionPreview()),
  ]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p>RFxchange activation · organization resolution</p>
        <h2>One market entity. One explainable path to it.</h2>
      </header>
      <div className={styles.workspace}>
        <OrganizationResolutionPanel model={resolution} />
        <aside className={styles.mapContext} aria-label="Controlled locality context">
          <p>
            Geography narrows the search. It never proves organization authority.
          </p>
          <ControlledLocalityCanvas
            model={map}
            initialZoom="nearby"
            headingLevel="h2"
          />
        </aside>
      </div>
    </main>
  );
}
