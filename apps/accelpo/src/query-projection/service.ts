import type {
  AccelPOCapability,
  AccelPOProjectionCollection,
  AccelPOProjectionName,
  BudgetSummaryProjection,
  EvidenceMetadataProjection,
  FulfillmentSummaryProjection,
  InvitationProjection,
  NotificationSummaryProjection,
  OfferSummaryProjection,
  OrganizationContextProjection,
  PeopleInvitationsProjection,
  PersonProjection,
  ProjectionAccessResolution,
  ProjectionAccessResolver,
  ProjectionFilter,
  ProjectionItemMap,
  ProjectionRecord,
  ProjectionSource,
  ProviderSummaryProjection,
  PurchaseCaseDetailProjection,
  PurchaseCaseSummaryProjection,
  QueryProjectionInput,
  QueryProjectionResult,
  QueryProjectionPortImplementation,
  TaskSummaryProjection,
  TrustedProjectionActor,
} from "./contracts.ts";
import { ACCELPO_PROJECTION_NAMES } from "./contracts.ts";
import type { QueryProjectionPort } from "../chassis/ports.ts";

type VisibilityRule =
  | "organization"
  | "people-management"
  | "case"
  | "task-assignee"
  | "notification-recipient"
  | "budget"
  | "evidence"
  | "provider";

interface ProjectionDefinition {
  readonly collection: AccelPOProjectionCollection;
  readonly requiredCapability: AccelPOCapability | null;
  readonly sortField: string;
  readonly allowedFilterFields: readonly string[];
  readonly visibility: VisibilityRule;
}

const PROJECTION_DEFINITIONS: Readonly<Record<AccelPOProjectionName, ProjectionDefinition>> =
  Object.freeze({
    "organization-context": Object.freeze({
      collection: "accelpoOrganizationContexts",
      requiredCapability: null,
      sortField: "updatedAt",
      allowedFilterFields: Object.freeze([]),
      visibility: "organization",
    }),
    "people-invitations": Object.freeze({
      collection: "accelpoPeopleInvitations",
      requiredCapability: "purchase.people.manage",
      sortField: "createdAt",
      allowedFilterFields: Object.freeze(["status", "kind"]),
      visibility: "people-management",
    }),
    "purchase-case-summary": Object.freeze({
      collection: "accelpoPurchaseCases",
      requiredCapability: "purchase.request",
      sortField: "updatedAt",
      allowedFilterFields: Object.freeze(["status", "requesterUserId", "departmentId"]),
      visibility: "case",
    }),
    "purchase-case-detail": Object.freeze({
      collection: "accelpoPurchaseCases",
      requiredCapability: "purchase.request",
      sortField: "updatedAt",
      allowedFilterFields: Object.freeze(["requesterUserId"]),
      visibility: "case",
    }),
    "task-summary": Object.freeze({
      collection: "accelpoTasks",
      requiredCapability: null,
      sortField: "createdAt",
      allowedFilterFields: Object.freeze(["status", "type"]),
      visibility: "task-assignee",
    }),
    "notification-summary": Object.freeze({
      collection: "accelpoNotifications",
      requiredCapability: null,
      sortField: "createdAt",
      allowedFilterFields: Object.freeze(["readAt", "type"]),
      visibility: "notification-recipient",
    }),
    "provider-summary": Object.freeze({
      collection: "accelpoProviders",
      requiredCapability: "purchase.request",
      sortField: "name",
      allowedFilterFields: Object.freeze(["active", "category"]),
      visibility: "provider",
    }),
    "offer-summary": Object.freeze({
      collection: "accelpoOffers",
      requiredCapability: "purchase.offers.view",
      sortField: "createdAt",
      allowedFilterFields: Object.freeze(["purchaseCaseId", "status"]),
      visibility: "case",
    }),
    "budget-summary": Object.freeze({
      collection: "accelpoBudgets",
      requiredCapability: "purchase.budget.view",
      sortField: "updatedAt",
      allowedFilterFields: Object.freeze(["departmentId", "category", "periodStart"]),
      visibility: "budget",
    }),
    "evidence-metadata": Object.freeze({
      collection: "accelpoEvidence",
      requiredCapability: null,
      sortField: "createdAt",
      allowedFilterFields: Object.freeze(["purchaseCaseId", "purpose", "status"]),
      visibility: "evidence",
    }),
    "fulfillment-summary": Object.freeze({
      collection: "accelpoFulfillment",
      requiredCapability: "purchase.request",
      sortField: "updatedAt",
      allowedFilterFields: Object.freeze(["purchaseCaseId", "state"]),
      visibility: "case",
    }),
  });

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 25;
const MAX_FILTERS = 5;
const MAX_IN_VALUES = 20;

const FAILURE_MESSAGES = Object.freeze({
  unauthenticated: "Sign in to view this information.",
  forbidden: "You do not have access to this information.",
  "not-found": "That information is not available.",
  "validation-failure": "The request could not be understood.",
  "unavailable-service": "This information is temporarily unavailable. Try again.",
} as const);

function failure(
  projection: string,
  code: "unauthenticated" | "forbidden" | "not-found" | "validation-failure" | "unavailable-service",
): QueryProjectionResult {
  return Object.freeze({
    outcome: "failure" as const,
    projection,
    code,
    message: FAILURE_MESSAGES[code],
  });
}

function isProjectionName(value: string): value is AccelPOProjectionName {
  return (ACCELPO_PROJECTION_NAMES as readonly string[]).includes(value);
}

function normalizedText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanValue(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function isoValue(value: unknown): string | null {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }

  if (value && typeof value === "object") {
    const candidate = value as {
      readonly toDate?: unknown;
      readonly toMillis?: unknown;
      readonly _seconds?: unknown;
      readonly seconds?: unknown;
    };
    if (typeof candidate.toDate === "function") {
      return isoValue(candidate.toDate());
    }
    if (typeof candidate.toMillis === "function") {
      return isoValue(new Date(candidate.toMillis()));
    }
    const seconds = numberValue(candidate._seconds ?? candidate.seconds);
    if (seconds !== null) return isoValue(new Date(seconds * 1000));
  }

  return value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : null;
}

function stringList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(value.flatMap((entry) => {
    const normalized = normalizedText(entry);
    return normalized ? [normalized] : [];
  }));
}

function recordString(record: ProjectionRecord, field: string): string | null {
  return normalizedText(record.data[field]);
}

function recordNumber(record: ProjectionRecord, field: string): number | null {
  return numberValue(record.data[field]);
}

function recordBoolean(record: ProjectionRecord, field: string): boolean | null {
  return booleanValue(record.data[field]);
}

function recordIso(record: ProjectionRecord, field: string): string | null {
  return isoValue(record.data[field]);
}

function nestedRecord(record: ProjectionRecord, field: string): Readonly<Record<string, unknown>> {
  const value = record.data[field];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : Object.freeze({});
}

function nestedString(record: ProjectionRecord, parent: string, field: string): string | null {
  return normalizedText(nestedRecord(record, parent)[field]);
}

function trackStatus(record: ProjectionRecord, track: string): string | null {
  return nestedString(record, "tracks", track) ?? recordString(record, `${track}Status`);
}

function safeDeepLink(value: unknown): string | null {
  const link = normalizedText(value);
  if (!link || !link.startsWith("/") || link.startsWith("//")) return null;
  return link;
}

/**
 * CP-01 exposes the shared RFxchange authorization catalog. Support the current `purchase.*`
 * vocabulary and the earlier `purchasing.*` spelling at this boundary so neither side needs a
 * second authorization model while the shared contract converges.
 */
const CAPABILITY_ALIASES: Readonly<Record<AccelPOCapability, readonly string[]>> = Object.freeze({
  "purchase.people.manage": Object.freeze(["purchase.people.manage", "organization.people.manage"]),
  "purchase.request": Object.freeze(["purchase.request", "purchasing.request"]),
  "purchase.case.view-all": Object.freeze(["purchase.case.view-all", "purchasing.case.view-all"]),
  "purchase.approve": Object.freeze(["purchase.approve", "purchasing.approve"]),
  "purchase.budget.view": Object.freeze(["purchase.budget.view", "purchasing.budget.view"]),
  "purchase.budget.manage": Object.freeze(["purchase.budget.manage", "purchasing.budget.manage"]),
  "purchase.sourcing.publish": Object.freeze(["purchase.sourcing.publish", "purchasing.sourcing.publish"]),
  "purchase.offers.view": Object.freeze(["purchase.offers.view", "purchasing.sourcing.view"]),
  "purchase.award": Object.freeze(["purchase.award", "purchasing.award"]),
  "purchase.order": Object.freeze(["purchase.order", "purchasing.order"]),
  "purchase.documentation.review": Object.freeze(["purchase.documentation.review", "purchasing.documentation.review"]),
  "purchase.configure": Object.freeze(["purchase.configure", "purchasing.configure"]),
});

function actorHas(actor: TrustedProjectionActor, capability: AccelPOCapability): boolean {
  return CAPABILITY_ALIASES[capability].some((alias) => actor.permissions.includes(alias));
}

function actorIdMentioned(actor: TrustedProjectionActor, data: Readonly<Record<string, unknown>>): boolean {
  const scalarFields = [
    "requesterUserId",
    "ownerUserId",
    "assigneeUserId",
    "assignedToUserId",
    "uploaderUserId",
  ];
  if (scalarFields.some((field) => data[field] === actor.userId)) return true;

  const listFields = [
    "visibleToUserIds",
    "approverUserIds",
    "buyerUserIds",
    "financeUserIds",
    "administratorUserIds",
    "recipientUserIds",
  ];
  return listFields.some((field) => stringList(data[field]).includes(actor.userId));
}

function caseIdForRecord(record: ProjectionRecord): string | null {
  return recordString(record, "purchaseCaseId") ?? recordString(record, "caseId");
}

function canSeeRecord(
  definition: ProjectionDefinition,
  actor: TrustedProjectionActor,
  record: ProjectionRecord,
): boolean {
  switch (definition.visibility) {
    case "organization":
    case "people-management":
    case "provider":
    case "budget":
      return true;
    case "task-assignee":
      return actorIdMentioned(actor, record.data);
    case "notification-recipient":
      return actorIdMentioned(actor, record.data);
    case "evidence":
      return actorHas(actor, "purchase.documentation.review") || actorIdMentioned(actor, record.data);
    case "case":
      return actorHas(actor, "purchase.case.view-all") || actorHas(actor, "purchase.configure") || actorIdMentioned(actor, record.data);
  }
}

function canSeeFinancialFields(actor: TrustedProjectionActor, record: ProjectionRecord): boolean {
  return (
    actorHas(actor, "purchase.budget.view") ||
    actorHas(actor, "purchase.approve") ||
    actorHas(actor, "purchase.award") ||
    actorIdMentioned(actor, record.data)
  );
}

function projectOrganizationContext(
  actor: TrustedProjectionActor,
  record: ProjectionRecord,
): OrganizationContextProjection {
  const addOnPriceMinor = actor.addOnSeatPriceMinor ?? recordNumber(record, "addOnSeatPriceMinor");
  const addOnCurrency = actor.addOnSeatCurrency ?? recordString(record, "addOnSeatCurrency");
  return Object.freeze({
    organizationId: actor.organizationId,
    displayName: actor.organizationDisplayName ?? recordString(record, "displayName") ?? "Organization",
    membershipId: actor.membershipId,
    membershipStatus: "active" as const,
    permissions: Object.freeze([...new Set(actor.permissions)]),
    plan: Object.freeze({
      name: actor.planName ?? recordString(record, "planName") ?? recordString(record, "plan"),
      billingPeriod: actor.billingPeriod ?? recordString(record, "billingPeriod"),
    }),
    seats: Object.freeze({
      included: actor.includedSeats ?? recordNumber(record, "includedSeats"),
      active: actor.activeSeats ?? recordNumber(record, "activeSeats"),
      reserved: actor.reservedSeats ?? recordNumber(record, "reservedSeats"),
      available: actor.availableSeats ?? recordNumber(record, "availableSeats"),
      addOnAllowance: actor.addOnSeatAllowance ?? recordNumber(record, "addOnSeatAllowance"),
      addOnPricing: addOnPriceMinor !== null && addOnCurrency !== null
        ? Object.freeze({ amountMinor: addOnPriceMinor, currency: addOnCurrency })
        : null,
      addSeatActionAllowed:
        actor.addSeatActionAllowed ?? recordBoolean(record, "addSeatActionAllowed") ?? false,
      entitlementVersion: actor.entitlementVersion ?? recordString(record, "entitlementVersion"),
      ownerCountsAsSeat: true,
    }),
  });
}

function projectPerson(record: ProjectionRecord): PersonProjection {
  return Object.freeze({
    kind: "person" as const,
    id: record.id,
    displayName: recordString(record, "displayName") ?? "Team member",
    email: recordString(record, "email"),
    status: recordString(record, "status") ?? "active",
    accessSummary: recordString(record, "accessSummary"),
  });
}

function projectInvitation(record: ProjectionRecord): InvitationProjection {
  return Object.freeze({
    kind: "invitation" as const,
    id: record.id,
    email: recordString(record, "email") ?? "",
    status: recordString(record, "status") ?? "pending",
    accessSummary: recordString(record, "accessSummary"),
    expiresAt: recordIso(record, "expiresAt"),
  });
}

function projectPeopleInvitation(record: ProjectionRecord): PeopleInvitationsProjection {
  return recordString(record, "kind") === "invitation"
    ? projectInvitation(record)
    : projectPerson(record);
}

function projectPurchaseCaseSummary(
  actor: TrustedProjectionActor,
  record: ProjectionRecord,
): PurchaseCaseSummaryProjection {
  const financialVisible = canSeeFinancialFields(actor, record);
  return Object.freeze({
    id: record.id,
    title: recordString(record, "title") ?? "Purchase case",
    description: recordString(record, "description"),
    quantity: recordNumber(record, "quantity"),
    neededBy: recordIso(record, "neededBy"),
    fulfillmentMethod: recordString(record, "fulfillmentMethod"),
    departmentName: recordString(record, "departmentName"),
    providerName: recordString(record, "providerName"),
    estimatedAmount: financialVisible ? recordNumber(record, "estimatedAmount") : null,
    currency: financialVisible ? recordString(record, "currency") : null,
    authorizationStatus: trackStatus(record, "authorization"),
    sourcingStatus: trackStatus(record, "sourcing"),
    awardStatus: trackStatus(record, "award"),
    fulfillmentStatus: trackStatus(record, "fulfillment"),
    documentationStatus: trackStatus(record, "documentation"),
    nextAction: recordString(record, "nextAction"),
    createdAt: recordIso(record, "createdAt"),
    updatedAt: recordIso(record, "updatedAt"),
  });
}

function projectPurchaseCaseDetail(
  actor: TrustedProjectionActor,
  record: ProjectionRecord,
): PurchaseCaseDetailProjection {
  const summary = projectPurchaseCaseSummary(actor, record);
  const decisionVisible = actorIdMentioned(actor, record.data) || actorHas(actor, "purchase.approve");
  return Object.freeze({
    ...summary,
    purpose: recordString(record, "purpose"),
    requesterDisplayName: recordString(record, "requesterDisplayName"),
    authorizationRound: recordNumber(record, "authorizationRound"),
    decisionReasonCode: decisionVisible ? recordString(record, "decisionReasonCode") : null,
    canonicalOpportunityId: actorHas(actor, "purchase.offers.view")
      ? recordString(record, "canonicalOpportunityId")
      : null,
  });
}

function projectTask(record: ProjectionRecord): TaskSummaryProjection {
  return Object.freeze({
    id: record.id,
    purchaseCaseId: caseIdForRecord(record),
    type: recordString(record, "type") ?? "task",
    title: recordString(record, "title") ?? "Task",
    summary: recordString(record, "summary"),
    status: recordString(record, "status") ?? "open",
    dueAt: recordIso(record, "dueAt"),
    permittedAction: recordString(record, "permittedAction"),
    deepLink: safeDeepLink(record.data.deepLink),
    createdAt: recordIso(record, "createdAt"),
  });
}

function projectNotification(record: ProjectionRecord): NotificationSummaryProjection {
  return Object.freeze({
    id: record.id,
    purchaseCaseId: caseIdForRecord(record),
    type: recordString(record, "type") ?? "update",
    title: recordString(record, "title") ?? "Update",
    body: recordString(record, "body"),
    readAt: recordIso(record, "readAt"),
    permittedAction: recordString(record, "permittedAction"),
    deepLink: safeDeepLink(record.data.deepLink),
    createdAt: recordIso(record, "createdAt"),
  });
}

function projectProvider(record: ProjectionRecord): ProviderSummaryProjection {
  return Object.freeze({
    id: record.id,
    name: recordString(record, "name") ?? "Provider",
    category: recordString(record, "category"),
    fulfillmentMethod: recordString(record, "fulfillmentMethod"),
    active: recordBoolean(record, "active") ?? false,
  });
}

function projectOffer(record: ProjectionRecord): OfferSummaryProjection {
  return Object.freeze({
    id: record.id,
    purchaseCaseId: caseIdForRecord(record),
    canonicalOfferId: recordString(record, "canonicalOfferId"),
    providerName: recordString(record, "providerName"),
    quantity: recordNumber(record, "quantity"),
    allInAmount: recordNumber(record, "allInAmount"),
    currency: recordString(record, "currency"),
    fulfillmentTiming: recordString(record, "fulfillmentTiming"),
    validUntil: recordIso(record, "validUntil"),
    terms: recordString(record, "terms"),
    deviations: recordString(record, "deviations"),
    quoteEvidenceStatus: recordString(record, "quoteEvidenceStatus"),
    status: recordString(record, "status"),
  });
}

function projectBudget(record: ProjectionRecord): BudgetSummaryProjection {
  return Object.freeze({
    id: record.id,
    departmentName: recordString(record, "departmentName"),
    category: recordString(record, "category"),
    periodStart: recordIso(record, "periodStart"),
    periodEnd: recordIso(record, "periodEnd"),
    currency: recordString(record, "currency"),
    budgetAmount: recordNumber(record, "budgetAmount"),
    committedAmount: recordNumber(record, "committedAmount"),
    actualAmount: recordNumber(record, "actualAmount"),
    remainingAmount: recordNumber(record, "remainingAmount"),
    sourceType: recordString(record, "sourceType"),
    sourceAt: recordIso(record, "sourceAt"),
    updatedAt: recordIso(record, "updatedAt"),
  });
}

function projectEvidence(record: ProjectionRecord): EvidenceMetadataProjection {
  return Object.freeze({
    id: record.id,
    purchaseCaseId: caseIdForRecord(record),
    purpose: recordString(record, "purpose") ?? "evidence",
    originalFilename: recordString(record, "originalFilename") ?? "Attachment",
    contentType: recordString(record, "contentType") ?? "application/octet-stream",
    size: recordNumber(record, "size"),
    createdAt: recordIso(record, "createdAt"),
    status: recordString(record, "status") ?? "uploaded",
    releaseStatus: recordString(record, "releaseStatus") === "released" ? "released" : "private",
  });
}

function projectFulfillment(record: ProjectionRecord): FulfillmentSummaryProjection {
  return Object.freeze({
    id: record.id,
    purchaseCaseId: caseIdForRecord(record),
    state: recordString(record, "state") ?? "not-ordered",
    orderReference: recordString(record, "orderReference"),
    confirmationAt: recordIso(record, "confirmationAt"),
    neededBy: recordIso(record, "neededBy"),
    deliveredAt: recordIso(record, "deliveredAt"),
    receivedAt: recordIso(record, "receivedAt"),
    exceptionCode: recordString(record, "exceptionCode"),
    exceptionSummary: recordString(record, "exceptionSummary"),
    actualAmount: recordNumber(record, "actualAmount"),
    currency: recordString(record, "currency"),
  });
}

function projectRecord<Name extends AccelPOProjectionName>(
  name: Name,
  actor: TrustedProjectionActor,
  record: ProjectionRecord,
): ProjectionItemMap[Name] {
  switch (name) {
    case "organization-context":
      return projectOrganizationContext(actor, record) as ProjectionItemMap[Name];
    case "people-invitations":
      return projectPeopleInvitation(record) as ProjectionItemMap[Name];
    case "purchase-case-summary":
      return projectPurchaseCaseSummary(actor, record) as ProjectionItemMap[Name];
    case "purchase-case-detail":
      return projectPurchaseCaseDetail(actor, record) as ProjectionItemMap[Name];
    case "task-summary":
      return projectTask(record) as ProjectionItemMap[Name];
    case "notification-summary":
      return projectNotification(record) as ProjectionItemMap[Name];
    case "provider-summary":
      return projectProvider(record) as ProjectionItemMap[Name];
    case "offer-summary":
      return projectOffer(record) as ProjectionItemMap[Name];
    case "budget-summary":
      return projectBudget(record) as ProjectionItemMap[Name];
    case "evidence-metadata":
      return projectEvidence(record) as ProjectionItemMap[Name];
    case "fulfillment-summary":
      return projectFulfillment(record) as ProjectionItemMap[Name];
  }
}

function normalizedRecordId(value: unknown): string | null {
  const normalized = normalizedText(value);
  return normalized && normalized.length <= 200 ? normalized : null;
}

function normalizeQuery(input: QueryProjectionInput):
  | Readonly<{
      readonly projection: AccelPOProjectionName;
      readonly scope: "list" | "record";
      readonly recordId: string | null;
      readonly filters: readonly ProjectionFilter[];
      readonly cursor: string | null;
      readonly limit: number;
    }>
  | null {
  const projection = normalizedText(input.projection);
  if (!projection || !isProjectionName(projection)) return null;

  const definition = PROJECTION_DEFINITIONS[projection];
  const scope = input.scope;
  if (scope !== "list" && scope !== "record") return null;

  const recordId = normalizedRecordId(input.recordId);
  if (scope === "record" && !recordId && projection !== "organization-context") return null;
  if (scope === "list" && recordId) return null;

  const filters = input.filters ?? [];
  if (!Array.isArray(filters) || filters.length > MAX_FILTERS) return null;

  const normalizedFilters: ProjectionFilter[] = [];
  for (const filter of filters) {
    if (!filter || typeof filter !== "object") return null;
    const field = normalizedText(filter.field);
    if (!field || !definition.allowedFilterFields.includes(field)) return null;
    if (filter.operator !== "==" && filter.operator !== "in") return null;

    if (filter.operator === "in") {
      if (!Array.isArray(filter.value) || filter.value.length === 0 || filter.value.length > MAX_IN_VALUES) {
        return null;
      }
      if (filter.value.some((value: unknown) => !["string", "number", "boolean"].includes(typeof value))) {
        return null;
      }
    } else if (["string", "number", "boolean"].includes(typeof filter.value) === false) {
      return null;
    }

    normalizedFilters.push(Object.freeze({
      field,
      operator: filter.operator,
      value: Array.isArray(filter.value) ? Object.freeze([...filter.value]) : filter.value,
    }));
  }

  const cursor = input.cursor == null ? null : normalizedText(input.cursor);
  if (cursor !== null && cursor.length > 2048) return null;

  const limit = input.limit == null ? DEFAULT_PAGE_SIZE : input.limit;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) return null;

  return Object.freeze({
    projection,
    scope,
    recordId,
    filters: Object.freeze(normalizedFilters),
    cursor,
    limit,
  });
}

function safeRecord(record: ProjectionRecord, organizationId: string): boolean {
  return (
    normalizedText(record.id) !== null &&
    normalizedText(record.organizationId) === organizationId &&
    record.data !== null &&
    typeof record.data === "object" &&
    !Array.isArray(record.data)
  );
}

function accessFailure(access: ProjectionAccessResolution, projection: string): QueryProjectionResult | null {
  if (access.kind === "unauthenticated") return failure(projection, "unauthenticated");
  if (access.kind === "forbidden") return failure(projection, "forbidden");
  return null;
}

/**
 * CP-04's server-authorized query service.
 *
 * The caller supplies only a requested organization hint and query shape. The resolver supplies
 * the verified user, active organization, membership, and capabilities. All source calls receive
 * that resolved organization ID; organization/user scope is never taken from query filters.
 */
export class QueryProjectionService implements QueryProjectionPortImplementation {
  private readonly source: ProjectionSource;
  private readonly access: ProjectionAccessResolver;

  constructor(input: Readonly<{
    source: ProjectionSource;
    access: ProjectionAccessResolver;
  }>) {
    this.source = input.source;
    this.access = input.access;
  }

  async read(input: Readonly<{
    requestedOrganizationId?: string | null;
    query: QueryProjectionInput;
  }>): Promise<QueryProjectionResult> {
    if (!input || typeof input !== "object" || !input.query || typeof input.query !== "object") {
      return failure("unknown", "validation-failure");
    }

    const requestedProjection = typeof input?.query?.projection === "string"
      ? input.query.projection
      : "unknown";

    let access: ProjectionAccessResolution;
    try {
      access = await this.access.resolve({
        requestedOrganizationId: input.requestedOrganizationId ?? null,
      });
    } catch {
      return failure(requestedProjection, "unavailable-service");
    }

    const accessResult = accessFailure(access, requestedProjection);
    if (accessResult) return accessResult;

    if (access.kind !== "authorized") return failure(requestedProjection, "forbidden");

    const actor = access.actor;
    const query = normalizeQuery(input.query);
    if (!query) return failure(requestedProjection, "validation-failure");

    if (
      input.requestedOrganizationId != null &&
      normalizedText(input.requestedOrganizationId) !== actor.organizationId
    ) {
      return failure(query.projection, "forbidden");
    }

    const definition = PROJECTION_DEFINITIONS[query.projection];
    if (
      definition.requiredCapability !== null &&
      !actorHas(actor, definition.requiredCapability)
    ) {
      return failure(query.projection, "forbidden");
    }

    // CP-01 has already resolved this organization context from the trusted server session. Keep
    // the context read on CP-04 without requiring a duplicate AccelPO context collection.
    if (query.projection === "organization-context") {
      if (query.recordId && query.recordId !== actor.organizationId) {
        return failure(query.projection, "not-found");
      }
      const context = projectOrganizationContext(actor, Object.freeze({
        id: actor.organizationId,
        organizationId: actor.organizationId,
        data: Object.freeze({}),
      }));
      return Object.freeze({
        outcome: "success" as const,
        projection: query.projection,
        items: Object.freeze([context]),
        nextCursor: null,
      });
    }

    try {
      if (query.scope === "record") {
        const recordId = query.recordId ?? actor.organizationId;
        const record = await this.source.getOne({
          collection: definition.collection,
          organizationId: actor.organizationId,
          recordId,
        });
        if (!record || !safeRecord(record, actor.organizationId) || !canSeeRecord(definition, actor, record)) {
          return failure(query.projection, "not-found");
        }
        return Object.freeze({
          outcome: "success" as const,
          projection: query.projection,
          items: Object.freeze([projectRecord(query.projection, actor, record)]),
          nextCursor: null,
        });
      }

      const page = await this.source.list({
        collection: definition.collection,
        organizationId: actor.organizationId,
        filters: query.filters,
        sortField: definition.sortField,
        cursor: query.cursor,
        limit: query.limit,
      });
      const records = page.records.filter(
        (record) => safeRecord(record, actor.organizationId) && canSeeRecord(definition, actor, record),
      );
      const items = Object.freeze(records.map((record) => projectRecord(query.projection, actor, record)));
      if (items.length === 0) {
        return Object.freeze({
          outcome: "empty" as const,
          projection: query.projection,
          items: Object.freeze([]) as readonly [],
          nextCursor: page.nextCursor,
        });
      }
      return Object.freeze({
        outcome: "success" as const,
        projection: query.projection,
        items,
        nextCursor: page.nextCursor,
      });
    } catch {
      return failure(query.projection, "unavailable-service");
    }
  }
}

export function projectionDefinition(name: AccelPOProjectionName): ProjectionDefinition {
  return PROJECTION_DEFINITIONS[name];
}

export function allProjectionDefinitions(): Readonly<Record<AccelPOProjectionName, ProjectionDefinition>> {
  return PROJECTION_DEFINITIONS;
}

/**
 * Adapts CP-04 to the chassis port shape. The organization value is only a hint from CP-01; the
 * service still resolves and checks the active organization on every request.
 */
export function createQueryProjectionPort(
  service: QueryProjectionService,
  requestedOrganizationId: () => string | null,
): QueryProjectionPort<QueryProjectionInput, QueryProjectionResult> {
  return Object.freeze({
    read: (query: QueryProjectionInput) => service.read({
      requestedOrganizationId: requestedOrganizationId(),
      query,
    }),
  });
}

export type { ProjectionDefinition };
