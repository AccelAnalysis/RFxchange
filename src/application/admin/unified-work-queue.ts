import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";

export const ADMINISTRATIVE_WORK_DOMAINS = [
  "claims",
  "verification",
  "provider",
  "rfx",
  "trust",
  "commerce",
  "data",
  "support",
  "system",
] as const;

export type AdministrativeWorkDomain = (typeof ADMINISTRATIVE_WORK_DOMAINS)[number];
export type AdministrativeWorkSeverity = "low" | "normal" | "high" | "critical";
export type AdministrativeWorkStatus = "open" | "assigned" | "waiting" | "blocked";

export interface AdministrativeWorkObjectReference {
  readonly kind: string;
  readonly id: string;
}

export interface AdministrativeWorkItem {
  readonly id: string;
  readonly domain: AdministrativeWorkDomain;
  readonly type: string;
  readonly title: string;
  readonly severity: AdministrativeWorkSeverity;
  readonly status: AdministrativeWorkStatus;
  readonly source: string;
  readonly object: AdministrativeWorkObjectReference;
  readonly organizationId: string | null;
  readonly userId: string | null;
  readonly geographyId: string | null;
  readonly assignedAdministratorId: string | null;
  readonly createdAt: string;
  readonly dueAt: string | null;
}

export interface AdministrativeWorkQueueFilters {
  readonly domains?: readonly AdministrativeWorkDomain[];
  readonly severities?: readonly AdministrativeWorkSeverity[];
  readonly statuses?: readonly AdministrativeWorkStatus[];
  readonly assignedAdministratorId?: string | null;
  readonly organizationId?: string | null;
  readonly geographyId?: string | null;
}

export interface AdministrativeWorkSource {
  readonly domain: AdministrativeWorkDomain;
  readonly readPermission: AdminPermissionKey;
  readonly assignmentPermission: AdminPermissionKey | null;
  listOpenWork(): Promise<readonly AdministrativeWorkItem[]>;
}

export interface AdministrativeWorkAssignmentRepository {
  getAssignedAdministratorId(workItemId: string): Promise<string | null>;
  assign(workItemId: string, administratorId: string | null): Promise<void>;
}

export interface AdministrativeWorkQueueSnapshot {
  readonly generatedAt: string;
  readonly total: number;
  readonly items: readonly AdministrativeWorkItem[];
  readonly countsByDomain: Readonly<Record<AdministrativeWorkDomain, number>>;
}

const DOMAIN_READ_PERMISSIONS: Readonly<Record<AdministrativeWorkDomain, AdminPermissionKey>> = Object.freeze({
  claims: requireCataloguedAdminPermission("organization.profile.read"),
  verification: requireCataloguedAdminPermission("credibility.organization.verify"),
  provider: requireCataloguedAdminPermission("provider.application.read"),
  rfx: requireCataloguedAdminPermission("rfx.record.read"),
  trust: requireCataloguedAdminPermission("trust.report.read"),
  commerce: requireCataloguedAdminPermission("commerce.account.read"),
  data: requireCataloguedAdminPermission("audit.event.read"),
  support: requireCataloguedAdminPermission("support.case.read"),
  system: requireCataloguedAdminPermission("system.health.read"),
});

function required(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function timestamp(value: string, field: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString();
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

function normalizedItem(item: AdministrativeWorkItem): AdministrativeWorkItem {
  if (!ADMINISTRATIVE_WORK_DOMAINS.includes(item.domain)) {
    throw new Error(`Unsupported administrative work domain: ${String(item.domain)}.`);
  }
  const dueAt = item.dueAt ? timestamp(item.dueAt, "Administrative work dueAt") : null;
  const createdAt = timestamp(item.createdAt, "Administrative work createdAt");
  if (dueAt && Date.parse(dueAt) < Date.parse(createdAt)) {
    throw new Error(`Administrative work item ${item.id} cannot be due before creation.`);
  }
  return Object.freeze({
    ...item,
    id: required(item.id, "Administrative work item id"),
    type: required(item.type, "Administrative work item type"),
    title: required(item.title, "Administrative work item title"),
    source: required(item.source, "Administrative work item source"),
    object: Object.freeze({
      kind: required(item.object.kind, "Administrative work object kind"),
      id: required(item.object.id, "Administrative work object id"),
    }),
    organizationId: item.organizationId?.trim() || null,
    userId: item.userId?.trim() || null,
    geographyId: item.geographyId?.trim() || null,
    assignedAdministratorId: item.assignedAdministratorId?.trim() || null,
    createdAt,
    dueAt,
  });
}

function severityWeight(value: AdministrativeWorkSeverity): number {
  return value === "critical" ? 4 : value === "high" ? 3 : value === "normal" ? 2 : 1;
}

function matches(filters: AdministrativeWorkQueueFilters, item: AdministrativeWorkItem): boolean {
  if (filters.domains?.length && !filters.domains.includes(item.domain)) return false;
  if (filters.severities?.length && !filters.severities.includes(item.severity)) return false;
  if (filters.statuses?.length && !filters.statuses.includes(item.status)) return false;
  if (filters.assignedAdministratorId !== undefined && item.assignedAdministratorId !== filters.assignedAdministratorId) return false;
  if (filters.organizationId !== undefined && item.organizationId !== filters.organizationId) return false;
  if (filters.geographyId !== undefined && item.geographyId !== filters.geographyId) return false;
  return true;
}

function emptyDomainCounts(): Record<AdministrativeWorkDomain, number> {
  return {
    claims: 0,
    verification: 0,
    provider: 0,
    rfx: 0,
    trust: 0,
    commerce: 0,
    data: 0,
    support: 0,
    system: 0,
  };
}

export function administrativeWorkReadPermission(domain: AdministrativeWorkDomain): AdminPermissionKey {
  return DOMAIN_READ_PERMISSIONS[domain];
}

export class UnifiedAdministrativeWorkQueueService {
  private readonly sources: readonly AdministrativeWorkSource[];
  private readonly assignments: AdministrativeWorkAssignmentRepository;

  constructor(
    sources: readonly AdministrativeWorkSource[],
    assignments: AdministrativeWorkAssignmentRepository,
  ) {
    const duplicates = sources.filter(
      (source, index) => sources.findIndex((candidate) => candidate.domain === source.domain) !== index,
    );
    if (duplicates.length > 0) {
      throw new Error(`Duplicate administrative work source registered for ${duplicates[0].domain}.`);
    }
    for (const source of sources) {
      if (source.readPermission !== DOMAIN_READ_PERMISSIONS[source.domain]) {
        throw new Error(`Administrative work source ${source.domain} uses the wrong read permission.`);
      }
    }
    this.sources = Object.freeze([...sources]);
    this.assignments = assignments;
  }

  async list(
    authority: PlatformAdministratorAuthorityContext,
    generatedAt: string,
    filters: AdministrativeWorkQueueFilters = {},
  ): Promise<AdministrativeWorkQueueSnapshot> {
    const authorizedSources = this.sources.filter((source) => can(authority, source.readPermission));
    const fromSources = (await Promise.all(authorizedSources.map((source) => source.listOpenWork()))).flat();
    const normalized = await Promise.all(fromSources.map(async (raw) => {
      const item = normalizedItem(raw);
      if (!authorizedSources.some((source) => source.domain === item.domain)) {
        throw new Error(`Administrative work item ${item.id} escaped its authorized source domain.`);
      }
      const assignedAdministratorId = await this.assignments.getAssignedAdministratorId(item.id);
      return Object.freeze({
        ...item,
        assignedAdministratorId: assignedAdministratorId ?? item.assignedAdministratorId,
        status: (assignedAdministratorId ?? item.assignedAdministratorId) && item.status === "open"
          ? "assigned" as const
          : item.status,
      });
    }));

    const visible = normalized.filter((item) => matches(filters, item));
    visible.sort((left, right) => {
      const severity = severityWeight(right.severity) - severityWeight(left.severity);
      if (severity !== 0) return severity;
      if (left.dueAt && right.dueAt) return Date.parse(left.dueAt) - Date.parse(right.dueAt);
      if (left.dueAt) return -1;
      if (right.dueAt) return 1;
      return Date.parse(left.createdAt) - Date.parse(right.createdAt);
    });

    const counts = emptyDomainCounts();
    for (const item of visible) counts[item.domain] += 1;

    return Object.freeze({
      generatedAt: timestamp(generatedAt, "Administrative work queue generatedAt"),
      total: visible.length,
      items: Object.freeze(visible),
      countsByDomain: Object.freeze(counts),
    });
  }

  async assign(
    authority: PlatformAdministratorAuthorityContext,
    domain: AdministrativeWorkDomain,
    workItemId: string,
    administratorId: string | null,
  ): Promise<void> {
    const source = this.sources.find((candidate) => candidate.domain === domain);
    if (!source) throw new Error(`Administrative work source is not registered: ${domain}.`);
    if (!source.assignmentPermission || !can(authority, source.assignmentPermission)) {
      throw new Error(`Administrative work assignment denied for domain ${domain}.`);
    }
    const items = await source.listOpenWork();
    if (!items.some((item) => item.id === workItemId)) {
      throw new Error(`Administrative work item not found in ${domain}: ${workItemId}.`);
    }
    await this.assignments.assign(required(workItemId, "Administrative work item id"), administratorId?.trim() || null);
  }
}
