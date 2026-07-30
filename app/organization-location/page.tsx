import { OrganizationLocationPanel } from "@/src/components/organization-location/OrganizationLocationPanel";
import { ParticipantShell } from "@/src/components/participant/ParticipantWorkspace";
import { createPortsmouthControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";

export default async function OrganizationLocationPage() {
  const mapModel = await createPortsmouthControlledLocalityPreview();
  return (
    <ParticipantShell activeItem="Account">
      <OrganizationLocationPanel mapModel={mapModel} />
    </ParticipantShell>
  );
}
