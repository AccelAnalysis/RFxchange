import { MapboxLocalityCanvas } from "@/src/components/map/MapboxLocalityCanvas";
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
        <MapboxLocalityCanvas
          model={model}
          initialZoom="nearby"
          mobileControlPosition="bottom"
        />
        <MapOverlaySurface position="top-left">
          <div className={styles.overlayStack}>
            <SearchFilterOverlay />
            <LocalityStatusOverlay
              locality={`${model.selectedGeography.name}, Virginia`}
              state="Released locality"
              supportingText="Authoritative Census boundary · active operating geography"
            />
          </div>
        </MapOverlaySurface>
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
