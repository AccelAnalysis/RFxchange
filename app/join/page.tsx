import { ActivationJourneyClient } from "@/src/components/onboarding/ActivationJourneyClient";
import { createControlledLocalityPreview } from "@/src/data/geography/portsmouth-controlled-locality-preview";

export default async function JoinPage() {
  const mapModel = await createControlledLocalityPreview();
  return <ActivationJourneyClient mapModel={mapModel} />;
}
