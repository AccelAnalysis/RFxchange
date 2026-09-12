import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { publicEnrichmentAdapters } from "./runtime/public-enrichment-adapters.js";
import { getFunctionsFirestore } from "./runtime/firebase-admin.js";
import { runPersistedPublicEnrichment } from "./runtime/public-enrichment-store.js";
import { RFXCHANGE_FUNCTIONS_REGION } from "./runtime/environment.js";

/** Optional public data enrichment cannot delay or authorize organization activation. */
export const organizationPublicEnrichment = onDocumentCreated({
  document: "organizationProfiles/{profileId}", region: RFXCHANGE_FUNCTIONS_REGION,
  timeoutSeconds: 60, retry: true, secrets: ["SAM_API_KEY"],
}, async (event) => {
  if (process.env.RFXCHANGE_PUBLIC_ENRICHMENT_MODE !== "enabled") return;
  const profile = event.data?.data();
  if (typeof profile?.organizationId !== "string" || typeof profile.displayName !== "string") return;
  await runPersistedPublicEnrichment(getFunctionsFirestore(), {
    organizationId: profile.organizationId, displayName: profile.displayName, uei: null,
  }, `profile-created:${event.id}`, publicEnrichmentAdapters(process.env.SAM_API_KEY));
});
