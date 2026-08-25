import { FieldPath, type Firestore } from "firebase-admin/firestore";

import {
  adminDomainSurface,
  type AdminDomainSurfaceKey,
  type AdminDomainSurfaceDefinition,
} from "../../application/admin/domain-operations.ts";
import type { AdminGrantScope } from "../../domain/admin-authorization/grants.ts";

export interface AdminDomainFact {
  readonly label: string;
  readonly value: string;
}

export interface AdminDomainRecord {
  readonly id: string;
  readonly kind: string;
  readonly kindLabel: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly status: string | null;
  readonly facts: readonly AdminDomainFact[];
  readonly attention: boolean;
  readonly href: string | null;
  readonly searchText: string;
}

export interface AdminDomainMetric {
  readonly label: string;
  readonly value: number;
  readonly href: string | null;
}

export interface AdminDomainSurfaceData {
  readonly definition: AdminDomainSurfaceDefinition;
  readonly records: readonly AdminDomainRecord[];
  readonly metrics: readonly AdminDomainMetric[];
  readonly nextCursor: string | null;
}

type FirestoreRecord = Readonly<Record<string, unknown> & { id: string }>;

function record(document: FirebaseFirestore.QueryDocumentSnapshot): FirestoreRecord {
  return Object.freeze({ ...document.data(), id: document.id });
}

function text(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    try { return value.toDate().toISOString(); } catch { return null; }
  }
  return null;
}

function nested(value: unknown, path: string): unknown {
  let current = value;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function firstField(source: FirestoreRecord, fields: readonly string[]): string | null {
  for (const field of fields) {
    const value = text(nested(source, field));
    if (value) return value;
  }
  return null;
}

function normalized(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function isAttention(status: string | null): boolean {
  const value = normalized(status);
  return [
    "submitted", "conflict", "evidence-requested", "information-requested", "needs-review",
    "action-required", "overdue", "failed", "retryable-failure", "terminal-failure", "restricted",
    "suspended", "integrity-hold", "degraded", "critical", "unknown",
  ].some((candidate) => value.includes(candidate));
}

function recordMatchesScope(source: FirestoreRecord, scope: AdminGrantScope): boolean {
  if (scope.kind === "GLOBAL") return true;
  const target = String(scope.targetId ?? "");
  if (!target) return false;
  const candidates = scope.kind === "ORGANIZATION"
    ? ["organizationId", "issuerOrganizationId", "senderOrganizationId", "recipientOrganizationId", "target.organizationId"]
    : scope.kind === "GEOGRAPHY"
      ? ["geographyId", "primaryGeographyId", "performanceGeographyId", "target.geographyId"]
      : ["caseId", "relatedCaseId", "target.caseId", "id"];
  return candidates.some((field) => text(nested(source, field)) === target);
}

function detailHref(key: AdminDomainSurfaceKey, source: FirestoreRecord, id: string): string | null {
  if (key === "organizations") {
    const organizationId = firstField(source, ["organizationId", "id"]);
    return organizationId ? `/admin/organizations/${encodeURIComponent(organizationId)}` : null;
  }
  if (key === "users-access") {
    const userId = firstField(source, ["userId", "id"]);
    return userId ? `/admin/users/${encodeURIComponent(userId)}` : null;
  }
  if (key === "support-feedback") return `/admin/cases/${encodeURIComponent(id)}`;
  return null;
}

function projectRecord(
  key: AdminDomainSurfaceKey,
  definition: AdminDomainSurfaceDefinition,
  source: FirestoreRecord,
  kind: string,
  kindLabel: string,
  appendedFacts: readonly AdminDomainFact[] = [],
): AdminDomainRecord {
  const title = firstField(source, definition.titleFields) ?? `${kindLabel} ${source.id}`;
  const subtitle = firstField(source, definition.subtitleFields);
  const status = firstField(source, definition.statusFields);
  const facts = definition.facts.flatMap((fact) => {
    const value = firstField(source, fact.fields);
    return value ? [Object.freeze({ label: fact.label, value })] : [];
  });
  const searchText = [source.id, title, subtitle, status, ...definition.searchFields.map((field) => text(nested(source, field)))]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
  return Object.freeze({
    id: source.id,
    kind,
    kindLabel,
    title,
    subtitle,
    status,
    facts: Object.freeze([...facts, ...appendedFacts]),
    attention: isAttention(status),
    href: detailHref(key, source, source.id),
    searchText,
  });
}

async function collectionPage(
  db: Firestore,
  collection: string,
  limit: number,
  cursor: string | null,
): Promise<Readonly<{ rows: readonly FirestoreRecord[]; nextCursor: string | null }>> {
  const bounded = Math.max(1, Math.min(limit, 50));
  let query: FirebaseFirestore.Query = db.collection(collection)
    .orderBy(FieldPath.documentId())
    .limit(bounded + 1);
  if (cursor) query = query.startAfter(cursor);
  const snapshot = await query.get();
  const rows = snapshot.docs.slice(0, bounded).map(record);
  return Object.freeze({
    rows: Object.freeze(rows),
    nextCursor: snapshot.docs.length > bounded ? snapshot.docs[bounded - 1]?.id ?? null : null,
  });
}

async function boundedRecords(db: Firestore, collection: string, limit = 200): Promise<readonly FirestoreRecord[]> {
  const snapshot = await db.collection(collection).limit(Math.max(1, Math.min(limit, 200))).get();
  return Object.freeze(snapshot.docs.map(record));
}

function countByOrganization(rows: readonly FirestoreRecord[], organizationId: string): number {
  return rows.filter((row) => firstField(row, ["organizationId", "target.organizationId"]) === organizationId).length;
}

async function organizationContext(db: Firestore, organizationIds: readonly string[]) {
  if (!organizationIds.length) return new Map<string, readonly AdminDomainFact[]>();
  const [claims, credentials, providers, commercial, cases, memberships, restrictions] = await Promise.all([
    boundedRecords(db, "organizationAuthorityClaims"), boundedRecords(db, "organizationCredentials"),
    boundedRecords(db, "providerApplications"), boundedRecords(db, "organizationCommercialAccounts"),
    boundedRecords(db, "administrativeCases"), boundedRecords(db, "organizationMemberships"), boundedRecords(db, "accessRestrictions"),
  ]);
  return new Map(organizationIds.map((organizationId) => {
    const activeRestrictions = restrictions.filter((row) =>
      firstField(row, ["organizationId", "target.organizationId"]) === organizationId &&
      !["cleared", "resolved"].includes(normalized(firstField(row, ["state", "status"]))),
    ).length;
    return [organizationId, Object.freeze([
      Object.freeze({ label: "Members", value: String(countByOrganization(memberships, organizationId)) }),
      Object.freeze({ label: "Authority claims", value: String(countByOrganization(claims, organizationId)) }),
      Object.freeze({ label: "Verification", value: String(countByOrganization(credentials, organizationId)) }),
      Object.freeze({ label: "Provider records", value: String(countByOrganization(providers, organizationId)) }),
      Object.freeze({ label: "Commercial", value: countByOrganization(commercial, organizationId) ? "Present" : "None" }),
      Object.freeze({ label: "Open cases", value: String(countByOrganization(cases, organizationId)) }),
      Object.freeze({ label: "Restrictions", value: String(activeRestrictions) }),
    ])] as const;
  }));
}

async function userContext(db: Firestore, userIds: readonly string[]) {
  if (!userIds.length) return new Map<string, readonly AdminDomainFact[]>();
  const [memberships, invitations, restrictions] = await Promise.all([
    boundedRecords(db, "organizationMemberships"), boundedRecords(db, "organizationUserInvitations"), boundedRecords(db, "accessRestrictions"),
  ]);
  return new Map(userIds.map((userId) => {
    const memberRows = memberships.filter((row) => firstField(row, ["userId"]) === userId);
    const active = memberRows.filter((row) => normalized(firstField(row, ["status"])) === "active").length;
    const inviteCount = invitations.filter((row) => firstField(row, ["userId", "acceptedByUserId"]) === userId).length;
    const restrictionCount = restrictions.filter((row) => firstField(row, ["userId", "target.userId"]) === userId).length;
    return [userId, Object.freeze([
      Object.freeze({ label: "Memberships", value: String(memberRows.length) }),
      Object.freeze({ label: "Active memberships", value: String(active) }),
      Object.freeze({ label: "Invitations", value: String(inviteCount) }),
      Object.freeze({ label: "Restrictions", value: String(restrictionCount) }),
      Object.freeze({ label: "Account resolution", value: active === 0 ? "Required" : "Not required" }),
    ])] as const;
  }));
}

async function analyticsMetrics(db: Firestore): Promise<readonly AdminDomainMetric[]> {
  const definitions = [
    ["Organizations", "organizationProfiles", "/admin/organizations"],
    ["RFx records", "rfxAggregates", "/admin/rfx"],
    ["Resource Providers", "officialResourceProviderStatuses", "/admin/resource-providers"],
    ["Referrals", "businessReferrals", "/admin/referrals-teaming"],
    ["Commercial accounts", "organizationCommercialAccounts", "/admin/commerce"],
    ["Support cases", "administrativeCases", "/admin/support"],
    ["Active restrictions", "accessRestrictions", "/admin/trust-safety"],
  ] as const;
  const counts = await Promise.all(definitions.map(async ([label, collection, href]) => {
    const aggregate = await db.collection(collection).count().get();
    return Object.freeze({ label, value: aggregate.data().count, href });
  }));
  return Object.freeze(counts);
}

async function dataPromotionPackages(db: Firestore, scope: AdminGrantScope): Promise<readonly AdminDomainRecord[]> {
  const definition = adminDomainSurface("data-promotion");
  const [sources, candidates, comparisons, approvals, receipts] = await Promise.all([
    boundedRecords(db, "providerSeedSourceRecords"), boundedRecords(db, "providerSeedPromotionCandidates"),
    boundedRecords(db, "providerSeedCanonicalComparisons"), boundedRecords(db, "providerSeedPromotionApprovals"), boundedRecords(db, "providerSeedPromotionReceipts"),
  ]);
  const scoped = sources.filter((row) => recordMatchesScope(row, scope));
  const markets = new Map<string, FirestoreRecord[]>();
  for (const source of scoped) {
    const market = firstField(source, ["marketKey"]) ?? "unassigned-source-package";
    markets.set(market, [...(markets.get(market) ?? []), source]);
  }
  return Object.freeze([...markets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([marketKey, rows]) => {
    const synthetic: FirestoreRecord = Object.freeze({ id: marketKey, marketKey, displayName: marketKey });
    return projectRecord("data-promotion", definition, synthetic, "source-package", "Source package", Object.freeze([
      Object.freeze({ label: "Source records", value: String(rows.length) }),
      Object.freeze({ label: "Candidates", value: String(candidates.filter((row) => firstField(row, ["marketKey"]) === marketKey).length) }),
      Object.freeze({ label: "Comparisons", value: String(comparisons.filter((row) => firstField(row, ["marketKey"]) === marketKey).length) }),
      Object.freeze({ label: "Approvals", value: String(approvals.filter((row) => firstField(row, ["marketKey"]) === marketKey).length) }),
      Object.freeze({ label: "Committed receipts", value: String(receipts.filter((row) => firstField(row, ["marketKey"]) === marketKey).length) }),
      Object.freeze({ label: "Publication", value: "Separate from promotion" }),
    ]));
  }));
}

export async function loadAdminDomainSurface(input: Readonly<{
  db: Firestore;
  key: AdminDomainSurfaceKey;
  scope: AdminGrantScope;
  query?: string | null;
  status?: string | null;
  cursor?: string | null;
  limit?: number;
}>): Promise<AdminDomainSurfaceData> {
  const definition = adminDomainSurface(input.key);
  if (input.key === "analytics") {
    return Object.freeze({ definition, records: Object.freeze([]), metrics: await analyticsMetrics(input.db), nextCursor: null });
  }
  if (input.key === "data-promotion") {
    let records = await dataPromotionPackages(input.db, input.scope);
    const needle = normalized(input.query ?? null);
    if (needle) records = Object.freeze(records.filter((row) => row.searchText.includes(needle)));
    return Object.freeze({ definition, records, metrics: Object.freeze([]), nextCursor: null });
  }

  const limit = input.query ? 50 : input.limit ?? 30;
  const projected: AdminDomainRecord[] = [];
  let nextCursor: string | null = null;
  for (const sourceDefinition of definition.collections) {
    const page = await collectionPage(input.db, sourceDefinition.collection, input.query ? 50 : limit, input.cursor ?? null);
    if (!nextCursor) nextCursor = page.nextCursor;
    const scopedRows = page.rows.filter((row) => recordMatchesScope(row, input.scope));
    let context = new Map<string, readonly AdminDomainFact[]>();
    if (input.key === "organizations") {
      const ids = scopedRows.map((row) => firstField(row, ["organizationId", "id"])).filter((value): value is string => Boolean(value));
      context = await organizationContext(input.db, ids);
    } else if (input.key === "users-access") {
      const ids = scopedRows.map((row) => firstField(row, ["userId", "id"])).filter((value): value is string => Boolean(value));
      context = await userContext(input.db, ids);
    }
    for (const source of scopedRows) {
      const contextId = input.key === "organizations"
        ? firstField(source, ["organizationId", "id"])
        : input.key === "users-access" ? firstField(source, ["userId", "id"]) : null;
      projected.push(projectRecord(input.key, definition, source, sourceDefinition.kind, sourceDefinition.kindLabel, contextId ? context.get(contextId) ?? [] : []));
    }
  }
  const needle = normalized(input.query ?? null);
  const requestedStatus = normalized(input.status ?? null);
  const records = projected
    .filter((row) => !needle || row.searchText.includes(needle))
    .filter((row) => !requestedStatus || normalized(row.status).includes(requestedStatus))
    .sort((a, b) => Number(b.attention) - Number(a.attention) || a.title.localeCompare(b.title));
  return Object.freeze({ definition, records: Object.freeze(records), metrics: Object.freeze([]), nextCursor });
}
