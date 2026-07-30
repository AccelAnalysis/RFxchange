import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";

export const ADMIN_COMMAND_CENTER_QUEUE_KEYS = [
  "claims",
  "verification",
  "provider-applications",
  "flagged-rfx",
  "trust-reports",
  "integrity-holds",
  "billing-exceptions",
  "data-corrections",
  "support-cases",
  "integration-failures",
] as const;

export type AdminCommandCenterQueueKey = (typeof ADMIN_COMMAND_CENTER_QUEUE_KEYS)[number];

export const ADMIN_HEALTH_DOMAIN_KEYS = [
  "organizations",
  "marketplace",
  "connections",
  "network",
  "commerce",
  "trust",
  "systems",
] as const;

export type AdminHealthDomainKey = (typeof ADMIN_HEALTH_DOMAIN_KEYS)[number];

export interface AdminCommandCenterQueueCard {
  readonly key: AdminCommandCenterQueueKey;
  readonly label: string;
  readonly count: number;
  readonly href: `/admin/work-queues?${string}`;
  readonly requiredPermission: AdminPermissionKey;
}

export interface AdminHealthMetric {
  readonly key: string;
  readonly label: string;
  readonly value: number | string | null;
  readonly unit: string | null;
  readonly state: "normal" | "attention" | "critical" | "unknown";
}

export interface AdminHealthPanel {
  readonly domain: AdminHealthDomainKey;
  readonly label: string;
  readonly requiredPermission: AdminPermissionKey;
  readonly metrics: readonly AdminHealthMetric[];
}

export interface AdminCommandCenterSnapshot {
  readonly generatedAt: string;
  readonly attentionTotal: number;
  readonly queueCards: readonly AdminCommandCenterQueueCard[];
  readonly healthPanels: readonly AdminHealthPanel[];
}

const QUEUE_DEFINITIONS: Readonly<Record<AdminCommandCenterQueueKey, Readonly<{
  label: string;
  permission: AdminPermissionKey;
  href: `/admin/work-queues?${string}`;
}>>> = Object.freeze({
  claims: Object.freeze({ label: "Claims awaiting review", permission: requireCataloguedAdminPermission("organization.profile.read"), href: "/admin/work-queues?domain=claims&status=open" }),
  verification: Object.freeze({ label: "Verification reviews", permission: requireCataloguedAdminPermission("credibility.organization.verify"), href: "/admin/work-queues?domain=verification&status=open" }),
  "provider-applications": Object.freeze({ label: "Resource-provider applications", permission: requireCataloguedAdminPermission("provider.application.read"), href: "/admin/work-queues?domain=provider&status=open" }),
  "flagged-rfx": Object.freeze({ label: "RFxs flagged", permission: requireCataloguedAdminPermission("rfx.record.read"), href: "/admin/work-queues?domain=rfx&status=open" }),
  "trust-reports": Object.freeze({ label: "Trust reports", permission: requireCataloguedAdminPermission("trust.report.read"), href: "/admin/work-queues?domain=trust&status=open" }),
  "integrity-holds": Object.freeze({ label: "Integrity holds", permission: requireCataloguedAdminPermission("trust.report.read"), href: "/admin/work-queues?domain=trust&type=integrity-hold&status=open" }),
  "billing-exceptions": Object.freeze({ label: "Billing exceptions", permission: requireCataloguedAdminPermission("commerce.account.read"), href: "/admin/work-queues?domain=commerce&status=open" }),
  "data-corrections": Object.freeze({ label: "Data corrections", permission: requireCataloguedAdminPermission("audit.event.read"), href: "/admin/work-queues?domain=data&status=open" }),
  "support-cases": Object.freeze({ label: "Support cases", permission: requireCataloguedAdminPermission("support.case.read"), href: "/admin/work-queues?domain=support&status=open" }),
  "integration-failures": Object.freeze({ label: "Failed integrations", permission: requireCataloguedAdminPermission("system.health.read"), href: "/admin/work-queues?domain=system&status=open" }),
});

const HEALTH_DEFINITIONS: Readonly<Record<AdminHealthDomainKey, Readonly<{
  label: string;
  permission: AdminPermissionKey;
  expectedMetrics: readonly string[];
}>>> = Object.freeze({
  organizations: Object.freeze({ label: "Organizations", permission: requireCataloguedAdminPermission("analytics.dashboard.read"), expectedMetrics: Object.freeze(["registered", "claimed", "verified", "active"]) }),
  marketplace: Object.freeze({ label: "Marketplace", permission: requireCataloguedAdminPermission("rfx.record.read"), expectedMetrics: Object.freeze(["open-rfx", "responses", "approaching-deadlines", "teams"]) }),
  connections: Object.freeze({ label: "Connections", permission: requireCataloguedAdminPermission("referral.record.read"), expectedMetrics: Object.freeze(["referrals", "accepted-referrals", "resource-handoffs"]) }),
  network: Object.freeze({ label: "Network", permission: requireCataloguedAdminPermission("analytics.dashboard.read"), expectedMetrics: Object.freeze(["active-localities", "density", "providers", "issuers"]) }),
  commerce: Object.freeze({ label: "Commerce", permission: requireCataloguedAdminPermission("commerce.account.read"), expectedMetrics: Object.freeze(["founding-organizations", "mrr", "churn", "payment-exceptions"]) }),
  trust: Object.freeze({ label: "Trust", permission: requireCataloguedAdminPermission("trust.report.read"), expectedMetrics: Object.freeze(["reports", "holds", "suspensions", "verification-turnaround-hours"]) }),
  systems: Object.freeze({ label: "Systems", permission: requireCataloguedAdminPermission("system.health.read"), expectedMetrics: Object.freeze(["overall", "error-rate", "webhook-failures", "function-failures", "deployment-status"]) }),
});

function timestamp(value: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("Admin command center generatedAt must be a valid date-time.");
  return new Date(parsed).toISOString();
}

function nonnegativeCount(value: number | undefined, key: string): number {
  if (value === undefined) return 0;
  if (!Number.isInteger(value) || value < 0) throw new Error(`Command center queue count must be a nonnegative integer: ${key}.`);
  return value;
}

function authorized(authority: PlatformAdministratorAuthorityContext, permission: AdminPermissionKey): boolean {
  return authorizeAdministrativeAction(
    authority,
    createAdministrativeActionRequirement({ permission }),
  ).kind === "allow";
}

function normalizeMetric(metric: AdminHealthMetric): AdminHealthMetric {
  const key = metric.key.trim();
  const label = metric.label.trim();
  if (!key || !label) throw new Error("Admin health metrics require key and label.");
  if (typeof metric.value === "number" && !Number.isFinite(metric.value)) {
    throw new Error(`Admin health metric ${key} must contain a finite number.`);
  }
  return Object.freeze({ ...metric, key, label, unit: metric.unit?.trim() || null });
}

export function buildAdminCommandCenterSnapshot(
  authority: PlatformAdministratorAuthorityContext,
  generatedAt: string,
  queueCounts: Readonly<Partial<Record<AdminCommandCenterQueueKey, number>>>,
  health: Readonly<Partial<Record<AdminHealthDomainKey, readonly AdminHealthMetric[]>>>,
): AdminCommandCenterSnapshot {
  const queueCards = ADMIN_COMMAND_CENTER_QUEUE_KEYS.flatMap((key) => {
    const definition = QUEUE_DEFINITIONS[key];
    if (!authorized(authority, definition.permission)) return [];
    return [Object.freeze({
      key,
      label: definition.label,
      count: nonnegativeCount(queueCounts[key], key),
      href: definition.href,
      requiredPermission: definition.permission,
    })];
  });

  const healthPanels = ADMIN_HEALTH_DOMAIN_KEYS.flatMap((domain) => {
    const definition = HEALTH_DEFINITIONS[domain];
    if (!authorized(authority, definition.permission)) return [];
    const metrics = (health[domain] ?? []).map(normalizeMetric);
    const byKey = new Map(metrics.map((metric) => [metric.key, metric]));
    const normalized = definition.expectedMetrics.map((key) => byKey.get(key) ?? Object.freeze({
      key,
      label: key.replaceAll("-", " "),
      value: null,
      unit: null,
      state: "unknown" as const,
    }));
    return [Object.freeze({
      domain,
      label: definition.label,
      requiredPermission: definition.permission,
      metrics: Object.freeze(normalized),
    })];
  });

  return Object.freeze({
    generatedAt: timestamp(generatedAt),
    attentionTotal: queueCards.reduce((sum, card) => sum + card.count, 0),
    queueCards: Object.freeze(queueCards),
    healthPanels: Object.freeze(healthPanels),
  });
}
