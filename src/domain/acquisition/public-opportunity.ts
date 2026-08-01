export type PublicOpportunityPublicationState =
  | "published"
  | "draft"
  | "restricted"
  | "unreleased"
  | "expired";

export interface PublicOpportunityProjection {
  readonly reference: string;
  readonly title: string;
  readonly issuerDisplayName: string;
  readonly summary: string;
  readonly capabilityCategories: readonly string[];
  readonly localityLabel: string;
  readonly availabilityLabel: string;
  readonly publicationState: PublicOpportunityPublicationState;
  readonly visibility: "public" | "participant-only" | "private";
  readonly provenanceLabel: string;
}

export interface PublicOpportunityProjectionRepository {
  getByReference(reference: string): Promise<PublicOpportunityProjection | null>;
}

function required(value: string, label: string, maximum = 600): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maximum) throw new Error(`${label} exceeds ${maximum} characters.`);
  return normalized;
}

export function createPublicOpportunityProjection(input: PublicOpportunityProjection): PublicOpportunityProjection {
  const categories = [...new Set(input.capabilityCategories.map((value) => required(value, "Capability category", 100)))];
  if (!categories.length) throw new Error("Public opportunity requires at least one capability category.");
  return Object.freeze({
    reference: required(input.reference, "Public opportunity reference", 191),
    title: required(input.title, "Public opportunity title", 180),
    issuerDisplayName: required(input.issuerDisplayName, "Public issuer name", 160),
    summary: required(input.summary, "Public opportunity summary", 600),
    capabilityCategories: Object.freeze(categories),
    localityLabel: required(input.localityLabel, "Public opportunity locality", 160),
    availabilityLabel: required(input.availabilityLabel, "Public opportunity availability", 120),
    publicationState: input.publicationState,
    visibility: input.visibility,
    provenanceLabel: required(input.provenanceLabel, "Public opportunity provenance", 160),
  });
}

export function projectPermittedPublicOpportunity(
  projection: PublicOpportunityProjection | null,
): PublicOpportunityProjection | null {
  if (
    !projection ||
    projection.publicationState !== "published" ||
    projection.visibility !== "public"
  ) return null;
  return createPublicOpportunityProjection(projection);
}
