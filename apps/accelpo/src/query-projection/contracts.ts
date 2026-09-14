/**
 * CP-04 QueryProjection contracts.
 *
 * These types are deliberately independent of a particular UI or Firestore document shape.
 * CP-01 supplies the trusted actor context and CP-04 turns server-held records into the small,
 * role-safe responses consumed by AccelPO parts.
 */

export const ACCELPO_PROJECTION_NAMES = Object.freeze([
  "organization-context",
  "people-invitations",
  "purchase-case-summary",
  "purchase-case-detail",
  "task-summary",
  "notification-summary",
  "provider-summary",
  "offer-summary",
  "budget-summary",
  "evidence-metadata",
  "fulfillment-summary",
] as const);

export type AccelPOProjectionName = (typeof ACCELPO_PROJECTION_NAMES)[number];

/** Capabilities are inputs from the shared identity/authorization model, not UI roles. */
export const ACCELPO_CAPABILITIES = Object.freeze([
  "purchase.people.manage",
  "purchase.request",
  "purchase.case.view-all",
  "purchase.approve",
  "purchase.budget.view",
  "purchase.budget.manage",
  "purchase.sourcing.publish",
  "purchase.offers.view",
  "purchase.award",
  "purchase.order",
  "purchase.documentation.review",
  "purchase.configure",
] as const);

export type AccelPOCapability = (typeof ACCELPO_CAPABILITIES)[number];

export const ACCELPO_PROJECTION_COLLECTIONS = Object.freeze([
  "accelpoOrganizationContexts",
  "accelpoPeopleInvitations",
  "accelpoPurchaseCases",
  "accelpoTasks",
  "accelpoNotifications",
  "accelpoProviders",
  "accelpoOffers",
  "accelpoBudgets",
  "accelpoEvidence",
  "accelpoFulfillment",
] as const);

export type AccelPOProjectionCollection = (typeof ACCELPO_PROJECTION_COLLECTIONS)[number];

export type ProjectionFilterValue =
  | string
  | number
  | boolean
  | readonly (string | number | boolean)[];

export interface ProjectionFilter {
  readonly field: string;
  readonly operator: "==" | "in";
  readonly value: ProjectionFilterValue;
}

export interface QueryProjectionInput {
  readonly projection: string;
  readonly scope: "list" | "record";
  /** Record IDs are only used for record-scoped queries; organization ID is never accepted here. */
  readonly recordId?: string | null;
  readonly filters?: readonly ProjectionFilter[];
  readonly cursor?: string | null;
  readonly limit?: number | null;
}

/** CP-01 or a server session adapter must create this object; clients must not construct it. */
export interface TrustedProjectionActor {
  readonly userId: string;
  readonly organizationId: string;
  readonly membershipId: string;
  readonly permissions: readonly string[];
  /** Optional role-safe context already resolved by CP-01; never client-supplied. */
  readonly organizationDisplayName?: string | null;
  readonly planName?: string | null;
  readonly billingPeriod?: string | null;
  readonly activeSeats?: number | null;
  readonly reservedSeats?: number | null;
  readonly availableSeats?: number | null;
}

export type ProjectionAccessResolution =
  | Readonly<{ kind: "unauthenticated" }>
  | Readonly<{ kind: "forbidden"; reason?: string }>
  | Readonly<{ kind: "authorized"; actor: TrustedProjectionActor }>;

/**
 * This resolver is the CP-01 integration boundary. It must bind the request to a verified server
 * session and active organization membership before CP-04 reads anything.
 */
export interface ProjectionAccessResolver {
  resolve(input: Readonly<{
    requestedOrganizationId?: string | null;
  }>): Promise<ProjectionAccessResolution>;
}

export interface ProjectionRecord {
  readonly id: string;
  readonly organizationId: string;
  /** Raw data stays on the server and is never returned directly to a caller. */
  readonly data: Readonly<Record<string, unknown>>;
}

export interface ProjectionSourceQuery {
  readonly collection: AccelPOProjectionCollection;
  readonly organizationId: string;
  readonly filters: readonly ProjectionFilter[];
  readonly sortField: string;
  readonly cursor: string | null;
  readonly limit: number;
}

export interface ProjectionPage<T> {
  readonly records: readonly T[];
  readonly nextCursor: string | null;
}

/**
 * A source is intentionally organization-scoped. Implementations must apply the organization
 * constraint at query time, not retrieve a broad collection for UI-side filtering.
 */
export interface ProjectionSource {
  getOne(input: Readonly<{
    collection: AccelPOProjectionCollection;
    organizationId: string;
    recordId: string;
  }>): Promise<ProjectionRecord | null>;
  list(input: ProjectionSourceQuery): Promise<ProjectionPage<ProjectionRecord>>;
}

export interface OrganizationContextProjection {
  readonly organizationId: string;
  readonly displayName: string;
  readonly membershipId: string;
  readonly membershipStatus: "active";
  readonly permissions: readonly string[];
  readonly plan: Readonly<{
    readonly name: string | null;
    readonly billingPeriod: string | null;
  }>;
  readonly seats: Readonly<{
    readonly active: number | null;
    readonly reserved: number | null;
    readonly available: number | null;
  }>;
}

export interface PersonProjection {
  readonly kind: "person";
  readonly id: string;
  readonly displayName: string;
  readonly email: string | null;
  readonly status: string;
  readonly accessSummary: string | null;
}

export interface InvitationProjection {
  readonly kind: "invitation";
  readonly id: string;
  readonly email: string;
  readonly status: string;
  readonly accessSummary: string | null;
  readonly expiresAt: string | null;
}

export type PeopleInvitationsProjection = PersonProjection | InvitationProjection;

export interface PurchaseCaseSummaryProjection {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly quantity: number | null;
  readonly neededBy: string | null;
  readonly fulfillmentMethod: string | null;
  readonly departmentName: string | null;
  readonly providerName: string | null;
  readonly estimatedAmount: number | null;
  readonly currency: string | null;
  readonly authorizationStatus: string | null;
  readonly sourcingStatus: string | null;
  readonly awardStatus: string | null;
  readonly fulfillmentStatus: string | null;
  readonly documentationStatus: string | null;
  readonly nextAction: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}

export interface PurchaseCaseDetailProjection extends PurchaseCaseSummaryProjection {
  readonly purpose: string | null;
  readonly requesterDisplayName: string | null;
  readonly authorizationRound: number | null;
  readonly decisionReasonCode: string | null;
  readonly canonicalOpportunityId: string | null;
}

export interface TaskSummaryProjection {
  readonly id: string;
  readonly purchaseCaseId: string | null;
  readonly type: string;
  readonly title: string;
  readonly summary: string | null;
  readonly status: string;
  readonly dueAt: string | null;
  readonly permittedAction: string | null;
  readonly deepLink: string | null;
  readonly createdAt: string | null;
}

export interface NotificationSummaryProjection {
  readonly id: string;
  readonly purchaseCaseId: string | null;
  readonly type: string;
  readonly title: string;
  readonly body: string | null;
  readonly readAt: string | null;
  readonly permittedAction: string | null;
  readonly deepLink: string | null;
  readonly createdAt: string | null;
}

export interface ProviderSummaryProjection {
  readonly id: string;
  readonly name: string;
  readonly category: string | null;
  readonly fulfillmentMethod: string | null;
  readonly active: boolean;
}

export interface OfferSummaryProjection {
  readonly id: string;
  readonly purchaseCaseId: string | null;
  readonly canonicalOfferId: string | null;
  readonly providerName: string | null;
  readonly quantity: number | null;
  readonly allInAmount: number | null;
  readonly currency: string | null;
  readonly fulfillmentTiming: string | null;
  readonly validUntil: string | null;
  readonly terms: string | null;
  readonly deviations: string | null;
  readonly quoteEvidenceStatus: string | null;
  readonly status: string | null;
}

export interface BudgetSummaryProjection {
  readonly id: string;
  readonly departmentName: string | null;
  readonly category: string | null;
  readonly periodStart: string | null;
  readonly periodEnd: string | null;
  readonly currency: string | null;
  readonly budgetAmount: number | null;
  readonly committedAmount: number | null;
  readonly actualAmount: number | null;
  readonly remainingAmount: number | null;
  readonly sourceType: string | null;
  readonly sourceAt: string | null;
  readonly updatedAt: string | null;
}

export interface EvidenceMetadataProjection {
  readonly id: string;
  readonly purchaseCaseId: string | null;
  readonly purpose: string;
  readonly originalFilename: string;
  readonly contentType: string;
  readonly size: number | null;
  readonly createdAt: string | null;
  readonly status: string;
  readonly releaseStatus: "private" | "released";
}

export interface FulfillmentSummaryProjection {
  readonly id: string;
  readonly purchaseCaseId: string | null;
  readonly state: string;
  readonly orderReference: string | null;
  readonly confirmationAt: string | null;
  readonly neededBy: string | null;
  readonly deliveredAt: string | null;
  readonly receivedAt: string | null;
  readonly exceptionCode: string | null;
  readonly exceptionSummary: string | null;
  readonly actualAmount: number | null;
  readonly currency: string | null;
}

export interface ProjectionItemMap {
  readonly "organization-context": OrganizationContextProjection;
  readonly "people-invitations": PeopleInvitationsProjection;
  readonly "purchase-case-summary": PurchaseCaseSummaryProjection;
  readonly "purchase-case-detail": PurchaseCaseDetailProjection;
  readonly "task-summary": TaskSummaryProjection;
  readonly "notification-summary": NotificationSummaryProjection;
  readonly "provider-summary": ProviderSummaryProjection;
  readonly "offer-summary": OfferSummaryProjection;
  readonly "budget-summary": BudgetSummaryProjection;
  readonly "evidence-metadata": EvidenceMetadataProjection;
  readonly "fulfillment-summary": FulfillmentSummaryProjection;
}

export type ProjectionSuccess<Name extends AccelPOProjectionName = AccelPOProjectionName> = Readonly<{
  outcome: "success";
  projection: Name;
  items: readonly ProjectionItemMap[Name][];
  nextCursor: string | null;
}>;

export type ProjectionEmpty<Name extends AccelPOProjectionName = AccelPOProjectionName> = Readonly<{
  outcome: "empty";
  projection: Name;
  items: readonly [];
  nextCursor: string | null;
}>;

export type ProjectionFailure = Readonly<{
  outcome: "failure";
  projection: string;
  code: "unauthenticated" | "forbidden" | "not-found" | "validation-failure" | "unavailable-service";
  message: string;
}>;

export type QueryProjectionResult = ProjectionSuccess | ProjectionEmpty | ProjectionFailure;

export interface QueryProjectionPortImplementation {
  read(input: Readonly<{
    requestedOrganizationId?: string | null;
    query: QueryProjectionInput;
  }>): Promise<QueryProjectionResult>;
}
