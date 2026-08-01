import {
  createPublicOpportunityProjection,
  type PublicOpportunityProjection,
  type PublicOpportunityProjectionRepository,
} from "../../domain/acquisition/public-opportunity.ts";

const SEEDED_PUBLIC_OPPORTUNITIES = Object.freeze([
  createPublicOpportunityProjection({
    reference: "portsmouth-facilities-partner-search",
    title: "Facilities modernization partner search",
    issuerDisplayName: "Portsmouth Launch Network",
    summary:
      "A local facilities team is seeking organizations with building-systems, skilled-trades, and project-coordination capabilities for an upcoming modernization effort.",
    capabilityCategories: Object.freeze([
      "Construction and skilled trades",
      "Facilities and real estate",
      "Professional and business services",
    ]),
    localityLabel: "Portsmouth, Virginia",
    availabilityLabel: "Accepting capability introductions",
    publicationState: "published",
    visibility: "public",
    provenanceLabel: "Seeded RFxchange launch opportunity projection",
  }),
  createPublicOpportunityProjection({
    reference: "restricted-procurement-review",
    title: "Restricted procurement review",
    issuerDisplayName: "Protected issuer",
    summary: "This record exists only to prove that non-public projections fail closed.",
    capabilityCategories: Object.freeze(["Professional and business services"]),
    localityLabel: "Virginia",
    availabilityLabel: "Restricted",
    publicationState: "restricted",
    visibility: "participant-only",
    provenanceLabel: "Non-public acceptance fixture",
  }),
] satisfies readonly PublicOpportunityProjection[]);

export class SeededPublicOpportunityProjectionRepository
  implements PublicOpportunityProjectionRepository {
  async getByReference(reference: string): Promise<PublicOpportunityProjection | null> {
    return SEEDED_PUBLIC_OPPORTUNITIES.find(
      (projection) => projection.reference === reference.trim(),
    ) ?? null;
  }
}
