/** SAD service-owned extension. Every collection stays denied to direct browser access. */
export const SAD_RUNTIME_COLLECTIONS = Object.freeze({
  publicEnrichmentRuns: { scope: "organization", mutable: true },
  publicEnrichmentEvents: { scope: "organization", mutable: false },
  publicEnrichmentLimits: { scope: "organization", mutable: true },
  communicationPreferences: { scope: "user", mutable: true },
  communicationConsentEvents: { scope: "user", mutable: false },
  communicationSuppressions: { scope: "platform", mutable: true },
  communicationWebhookEvents: { scope: "platform", mutable: true },
  communicationProviderReferences: { scope: "platform", mutable: true },
  lifecycleEnrollments: { scope: "user", mutable: true },
  lifecycleCommunicationJobs: { scope: "platform", mutable: true },
  lifecycleCommunicationEvents: { scope: "platform", mutable: false },
  lifecycleConfiguration: { scope: "platform", mutable: true },
  publicHelpConfiguration: { scope: "platform", mutable: true },
});
/** Real consumer: GET /api/organization-enrichment/public-data, newest runs for one tenant. */
export const SAD_RUNTIME_MANUAL_INDEXES = Object.freeze([{
  collectionGroup: "publicEnrichmentRuns", queryScope: "COLLECTION",
  fields: [{ fieldPath: "organizationId", order: "ASCENDING" }, { fieldPath: "startedAt", order: "DESCENDING" }],
}]);
