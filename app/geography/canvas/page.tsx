import { ControlledLocalityCanvas } from "@/src/components/map/ControlledLocalityCanvas";
import { createPortsmouthControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";

import styles from "./page.module.css";

export default async function GeographyCanvasPage() {
  const model = await createPortsmouthControlledLocalityPreview();

  return (
    <main className={styles.page}>
      <div className={styles.intro}>
        <p>RFxchange geography rendering</p>
        <h2>Authoritative locality focus with legible regional context.</h2>
      </div>
      <ControlledLocalityCanvas model={model} />
    </main>
  );
}
