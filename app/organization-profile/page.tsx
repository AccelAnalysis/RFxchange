import { EssentialProfilePanel } from "@/src/components/organization-profile/EssentialProfilePanel";
import {
  OperationalWorkspace,
  ParticipantShell,
} from "@/src/components/participant/ParticipantWorkspace";
import { createPortsmouthControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";

export default async function OrganizationProfilePage() {
  const mapModel = await createPortsmouthControlledLocalityPreview();
  return (
    <ParticipantShell activeItem="Account">
      <OperationalWorkspace ariaLabel="Essential organization profile workspace">
        <EssentialProfilePanel mapModel={mapModel} />
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
