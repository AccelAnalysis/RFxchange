import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";

export const ADMIN_SEARCH_CATEGORIES = [
  "organization",
  "user",
  "email",
  "organization-id",
  "rfx",
  "response",
  "referral",
  "transaction",
  "support-case",
  "geography",
  "uei",
  "cage",
  "provider",
  "stripe-customer",
  "audit-event",
] as const;

export type AdminSearchCategory = (typeof ADMIN_SEARCH_CATEGORIES)[number];

export interface AdminSearchResult {
  readonly category: AdminSearchCategory;
  readonly id: string;
  readonly title: string;
  readonly secondaryText: string | null;
  readonly route: string;
  readonly requiredPermission: AdminPermissionKey;
}

export interface AdminSearchProvider {
  readonly key: string;
  search(query: string, limit: number): Promise<readonly Readonly<{
    category: AdminSearchCategory;
    id: string;
    title: string;
    secondaryText?: string | null;
    route: string;
    requiredPermission: string;
  }>[]>;
}

function normalizedQuery(value: string): string {
  const query = value.trim();
  if (query.length < 2) throw new Error("Administrative search query must contain at least two characters.");
  if (query.length > 160) throw new Error("Administrative search query cannot exceed 160 characters.");
  return query;
}

function can(
  authority: PlatformAdministratorAuthorityContext,
  permission: AdminPermissionKey,
): boolean {
  return (
    authorizeAdministrativeAction(
      authority,
      createAdministrativeActionRequirement({ permission }),
    ).kind === "allow"
  );
}

export async function universalAdminSearch(input: Readonly<{
  authority: PlatformAdministratorAuthorityContext;
  query: string;
  providers: readonly AdminSearchProvider[];
  limit?: number;
}>): Promise<readonly AdminSearchResult[]> {
  const query = normalizedQuery(input.query);
  const limit = input.limit ?? 25;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Administrative search limit must be an integer between 1 and 100.");
  }
  const keys = input.providers.map((provider) => provider.key.trim());
  if (keys.some((key) => !key) || new Set(keys).size !== keys.length) {
    throw new Error("Administrative search providers require unique nonblank keys.");
  }

  const raw = (await Promise.all(input.providers.map((provider) => provider.search(query, limit)))).flat();
  const seen = new Set<string>();
  const results: AdminSearchResult[] = [];
  for (const candidate of raw) {
    if (!ADMIN_SEARCH_CATEGORIES.includes(candidate.category)) {
      throw new Error(`Unsupported administrative search category: ${candidate.category}.`);
    }
    const requiredPermission = requireCataloguedAdminPermission(candidate.requiredPermission);
    if (!can(input.authority, requiredPermission)) continue;
    const id = candidate.id.trim();
    const title = candidate.title.trim();
    const route = candidate.route.trim();
    if (!id || !title || !route || !route.startsWith("/")) {
      throw new Error("Administrative search results require id, title and an internal route.");
    }
    const dedupeKey = `${candidate.category}:${id}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    results.push(
      Object.freeze({
        category: candidate.category,
        id,
        title,
        secondaryText: candidate.secondaryText?.trim() || null,
        route,
        requiredPermission,
      }),
    );
    if (results.length >= limit) break;
  }
  return Object.freeze(results);
}
