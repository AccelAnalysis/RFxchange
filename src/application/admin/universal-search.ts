import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";

export const ADMIN_UNIVERSAL_SEARCH_KINDS = [
  "organization",
  "user",
  "rfx",
  "response",
  "referral",
  "transaction",
  "support-case",
  "geography",
  "provider",
  "audit-event",
] as const;

export type AdminUniversalSearchKind = (typeof ADMIN_UNIVERSAL_SEARCH_KINDS)[number];

export interface AdminUniversalSearchResult {
  readonly kind: AdminUniversalSearchKind;
  readonly id: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly href: `/admin/${string}`;
  readonly organizationId: string | null;
  readonly matchedBy: readonly string[];
  readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
}

export interface AdminUniversalSearchSource {
  readonly kind: AdminUniversalSearchKind;
  readonly readPermission: AdminPermissionKey;
  search(query: string, limit: number): Promise<readonly AdminUniversalSearchResult[]>;
}

export interface AdminUniversalSearchResponse {
  readonly query: string;
  readonly total: number;
  readonly results: readonly AdminUniversalSearchResult[];
  readonly searchedKinds: readonly AdminUniversalSearchKind[];
}

const SEARCH_READ_PERMISSIONS: Readonly<Record<AdminUniversalSearchKind, AdminPermissionKey>> = Object.freeze({
  organization: requireCataloguedAdminPermission("organization.profile.read"),
  user: requireCataloguedAdminPermission("user.profile.read"),
  rfx: requireCataloguedAdminPermission("rfx.record.read"),
  response: requireCataloguedAdminPermission("rfx.record.read"),
  referral: requireCataloguedAdminPermission("referral.record.read"),
  transaction: requireCataloguedAdminPermission("commerce.account.read"),
  "support-case": requireCataloguedAdminPermission("support.case.read"),
  geography: requireCataloguedAdminPermission("geography.definition.read"),
  provider: requireCataloguedAdminPermission("provider.application.read"),
  "audit-event": requireCataloguedAdminPermission("audit.event.read"),
});

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function normalizeQuery(value: string): string {
  const normalized = required(value, "Administrative search query");
  if (normalized.length > 256) throw new Error("Administrative search query cannot exceed 256 characters.");
  return normalized;
}

function can(
  authority: PlatformAdministratorAuthorityContext,
  permission: AdminPermissionKey,
): boolean {
  return authorizeAdministrativeAction(
    authority,
    createAdministrativeActionRequirement({ permission }),
  ).kind === "allow";
}

function normalizeResult(
  expectedKind: AdminUniversalSearchKind,
  result: AdminUniversalSearchResult,
): AdminUniversalSearchResult {
  if (result.kind !== expectedKind) {
    throw new Error(`Administrative search source ${expectedKind} returned result kind ${result.kind}.`);
  }
  if (!ADMIN_UNIVERSAL_SEARCH_KINDS.includes(result.kind)) {
    throw new Error(`Unsupported administrative search result kind: ${String(result.kind)}.`);
  }
  const matchedBy = Object.freeze([
    ...new Set(result.matchedBy.map((value) => required(value, "Administrative search matchedBy"))),
  ]);
  if (matchedBy.length === 0) throw new Error("Administrative search result requires at least one match field.");
  return Object.freeze({
    ...result,
    id: required(result.id, "Administrative search result id"),
    title: required(result.title, "Administrative search result title"),
    subtitle: result.subtitle?.trim() || null,
    organizationId: result.organizationId?.trim() || null,
    matchedBy,
    metadata: Object.freeze({ ...result.metadata }),
  });
}

function resultRank(query: string, result: AdminUniversalSearchResult): number {
  const normalized = query.toLowerCase();
  if (result.id.toLowerCase() === normalized) return 0;
  if (Object.values(result.metadata).some((value) => typeof value === "string" && value.toLowerCase() === normalized)) return 1;
  if (result.title.toLowerCase().startsWith(normalized)) return 2;
  if (result.title.toLowerCase().includes(normalized)) return 3;
  return 4;
}

export function adminUniversalSearchReadPermission(kind: AdminUniversalSearchKind): AdminPermissionKey {
  return SEARCH_READ_PERMISSIONS[kind];
}

/**
 * Permission-aware global search coordinator. Each domain owns its lookup semantics (name/email,
 * org ID, UEI/CAGE, RFx/response ID, referral/transaction/support IDs, geography, provider,
 * Stripe customer ID, or audit ID). This coordinator never fans a query into a domain the
 * administrator is not allowed to inspect.
 */
export class AdminUniversalSearchService {
  private readonly sources: readonly AdminUniversalSearchSource[];

  constructor(sources: readonly AdminUniversalSearchSource[]) {
    const duplicates = sources.filter(
      (source, index) => sources.findIndex((candidate) => candidate.kind === source.kind) !== index,
    );
    if (duplicates.length > 0) {
      throw new Error(`Duplicate administrative search source registered for ${duplicates[0].kind}.`);
    }
    for (const source of sources) {
      if (source.readPermission !== SEARCH_READ_PERMISSIONS[source.kind]) {
        throw new Error(`Administrative search source ${source.kind} uses the wrong read permission.`);
      }
    }
    this.sources = Object.freeze([...sources]);
  }

  async search(
    authority: PlatformAdministratorAuthorityContext,
    rawQuery: string,
    options: Readonly<{ readonly kinds?: readonly AdminUniversalSearchKind[]; readonly limit?: number }> = {},
  ): Promise<AdminUniversalSearchResponse> {
    const query = normalizeQuery(rawQuery);
    const limit = options.limit ?? 25;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("Administrative search limit must be an integer between 1 and 100.");
    }
    const requestedKinds = options.kinds?.length
      ? Object.freeze([...new Set(options.kinds)])
      : ADMIN_UNIVERSAL_SEARCH_KINDS;
    const authorizedSources = this.sources.filter(
      (source) => requestedKinds.includes(source.kind) && can(authority, source.readPermission),
    );
    const perSourceLimit = Math.min(limit, 25);
    const batches = await Promise.all(
      authorizedSources.map(async (source) =>
        (await source.search(query, perSourceLimit)).map((result) => normalizeResult(source.kind, result)),
      ),
    );
    const deduped = new Map<string, AdminUniversalSearchResult>();
    for (const result of batches.flat()) {
      const key = `${result.kind}:${result.id}`;
      if (!deduped.has(key)) deduped.set(key, result);
    }
    const results = [...deduped.values()];
    results.sort((left, right) => {
      const rank = resultRank(query, left) - resultRank(query, right);
      if (rank !== 0) return rank;
      return left.title.localeCompare(right.title);
    });
    return Object.freeze({
      query,
      total: Math.min(results.length, limit),
      results: Object.freeze(results.slice(0, limit)),
      searchedKinds: Object.freeze(authorizedSources.map((source) => source.kind)),
    });
  }
}
