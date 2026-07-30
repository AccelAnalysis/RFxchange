import { ControlledLocalityCanvas } from "@/src/components/map/ControlledLocalityCanvas";
import {
  LocalityStatusOverlay,
  MapOverlaySurface,
  ParticipantShell,
  SearchFilterOverlay,
  SpatialWorkspace,
} from "@/src/components/participant/ParticipantWorkspace";
import { createPortsmouthControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";

import styles from "./page.module.css";

export default async function GeographyCanvasPage() {
  const model = await createPortsmouthControlledLocalityPreview();

  return (
    <ParticipantShell activeItem="Intelligence">
      <SpatialWorkspace ariaLabel="RFxchange Intelligence geographic workspace">
        <ControlledLocalityCanvas
          model={model}
          mobileControlPosition="bottom"
        />
        <MapOverlaySurface position="top-left">
          <div className={styles.overlayStack}>
            <SearchFilterOverlay />
            <LocalityStatusOverlay
              locality="Portsmouth, Virginia"
              state="Released locality"
              supportingText="Authoritative city boundary · active territory"
            />
          </div>
        </MapOverlaySurface>
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
