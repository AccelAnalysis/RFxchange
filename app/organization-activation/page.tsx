import { MarkerActivationPanel } from "@/src/components/organization-marker/MarkerActivationPanel";
import { ParticipantShell } from "@/src/components/participant/ParticipantWorkspace";
import { createPortsmouthActivatedOrganizationPreview } from "@/src/data/geography/portsmouth-activated-organization-preview";
import { createPortsmouthControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";

export default async function OrganizationActivationPage() {
  const [mapModel, preview] = await Promise.all([
    createPortsmouthControlledLocalityPreview(),
    Promise.resolve(createPortsmouthActivatedOrganizationPreview()),
  ]);
  return (
    <ParticipantShell activeItem="Intelligence">
      <MarkerActivationPanel mapModel={mapModel} marker={preview.marker} />
    </ParticipantShell>
  );
}
