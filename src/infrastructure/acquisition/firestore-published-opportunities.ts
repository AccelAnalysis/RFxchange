import type { Firestore } from "firebase-admin/firestore";

import {
  createPublicOpportunityProjection,
  type PublicOpportunityProjection,
  type PublicOpportunityProjectionRepository,
} from "../../domain/acquisition/public-opportunity.ts";
import type { ResponderOpportunityProjection } from "../../domain/rfx/publication.ts";
import { getFirestoreRecordById } from "../firestore/support.ts";

const COLLECTION = "rfxOpportunityProjections";

function permitted(
  projection: ResponderOpportunityProjection | null,
  participantAuthorized: boolean,
): ResponderOpportunityProjection | null {
  if (!projection || projection.mode !== "published" || !projection.publishedAt)
    return null;
  if (
    projection.audience === "authenticated-participants" &&
    !participantAuthorized
  ) return null;
  return projection;
}

export class FirestorePublishedOpportunityRepository
  implements PublicOpportunityProjectionRepository {
  constructor(private readonly db: Firestore) {}

  async getResponderProjection(
    reference: string,
    participantAuthorized = false,
  ): Promise<ResponderOpportunityProjection | null> {
    const projection = await getFirestoreRecordById<ResponderOpportunityProjection>(
      this.db,
      COLLECTION,
      reference.trim(),
    );
    return permitted(projection, participantAuthorized);
  }

  async getByReference(reference: string): Promise<PublicOpportunityProjection | null> {
    const projection = await this.getResponderProjection(reference, false);
    if (!projection || projection.audience !== "public") return null;
    return createPublicOpportunityProjection({
      reference: projection.reference,
      title: projection.payload.title,
      issuerDisplayName: projection.payload.issuerDisplayName,
      summary: projection.payload.summary,
      capabilityCategories: (() => {
        const labels = projection.payload.requirements.flatMap((item) =>
          item.capabilityLabel ? [item.capabilityLabel] : [],
        );
        return labels.length ? labels : [projection.payload.requestFamilyLabel];
      })(),
      localityLabel: projection.payload.localities.map((item) => item.label).join(", "),
      availabilityLabel: "Published RFx",
      publicationState: "published",
      visibility: "public",
      provenanceLabel: "Authoritative RFxchange publication",
    });
  }
}
