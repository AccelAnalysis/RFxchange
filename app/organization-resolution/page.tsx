import { ControlledLocalityCanvas } from "@/src/components/map/ControlledLocalityCanvas";
import { OrganizationResolutionPanel } from "@/src/components/organization-resolution/OrganizationResolutionPanel";
import {
  ParticipantShell,
  ResponsiveEdgeSheet,
  SpatialWorkspace,
} from "@/src/components/participant/ParticipantWorkspace";
import { createPortsmouthControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";
import { createPortsmouthOrganizationResolutionPreview } from "@/src/data/organization-resolution/portsmouth-resolution-preview";

export default async function OrganizationResolutionPage() {
  const [map, resolution] = await Promise.all([
    createPortsmouthControlledLocalityPreview(),
    Promise.resolve(createPortsmouthOrganizationResolutionPreview()),
  ]);

  return (
    <ParticipantShell activeItem="Account">
      <SpatialWorkspace ariaLabel="Organization resolution geographic workspace">
        <ControlledLocalityCanvas
          model={map}
          initialZoom="nearby"
          overlaySide="right"
        />
        <ResponsiveEdgeSheet
          ariaLabelledBy="organization-resolution-title"
          side="left"
          width="wide"
        >
          <OrganizationResolutionPanel model={resolution} />
        </ResponsiveEdgeSheet>
      </SpatialWorkspace>
    </ParticipantShell>
  );
}
