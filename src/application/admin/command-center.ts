import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  requireCataloguedAdminPermission,
  type AdminPermissionKey,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";

export const ADMIN_ATTENTION_QUEUE_KEYS = [
  "claims-awaiting-review",
  "verification-reviews",
  "resource-provider-applications",
  "rfx-flagged",
  "trust-reports",
  "integrity-holds",
  "billing-exceptions",
  "data-corrections",
  "support-cases",
  "failed-integrations",
] as const;

export type AdminAttentionQueueKey = (typeof ADMIN_ATTENTION_QUEUE_KEYS)[number];

export const ADMIN_HEALTH_PANEL_KEYS = [
  "organizations",
  "marketplace",
  "connections",
  "network",
  "commerce",
  "trust",
  "systems",
] as const;

export type AdminHealthPanelKey = (typeof ADMIN_HEALTH_PANEL_KEYS)[number];

export interface AdminAttentionQueueSummary {
  readonly key: AdminAttentionQueueKey;
  readonly label: string;
  readonly count: number;
  readonly requiredPermission: AdminPermissionKey;
}

export interface AdminHealthMetric {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly unit: "count" | "percent" | "currency-usd" | "milliseconds";
}

export interface AdminHealthPanel {
  readonly key: AdminHealthPanelKey;
  readonly label: string;
  readonly status: "healthy" | "attention" | "critical" | "unknown";
  readonly metrics: readonly AdminHealthMetric[];
  readonly requiredPermission: AdminPermissionKey;
}

export interface AdminAttentionQueueProvider {
  readonly key: AdminAttentionQueueKey;
  readonly label: string;
  readonly requiredPermission: string;
  count(): Promise<number>;
}

export interface AdminHealthPanelProvider {
  readonly key: AdminHealthPanelKey;
  readonly label: string;
  readonly requiredPermission: string;
  load(): Promise<Readonly<{
    status: AdminHealthPanel["status"];
    metrics: readonly AdminHealthMetric[];
  }>>;
}

export interface AdministrativeCommandCenter {
  readonly attentionQueues: readonly AdminAttentionQueueSummary[];
  readonly healthPanels: readonly AdminHealthPanel[];
  readonly totalAttentionCount: number;
}

function can(
  authority: PlatformAdministratorAuthorityContext,
  permission: string,
): AdminPermissionKey | null {
  const requiredPermission = requireCataloguedAdminPermission(permission);
  const decision = authorizeAdministrativeAction(
    authority,
    createAdministrativeActionRequirement({ permission: requiredPermission }),
  );
  return decision.kind === "allow" ? requiredPermission : null;
}

function nonnegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer.`);
  return value;
}

function metric(input: AdminHealthMetric): AdminHealthMetric {
  if (!input.key.trim() || !input.label.trim()) throw new Error("Health metric key and label are required.");
  if (!Number.isFinite(input.value)) throw new Error(`Health metric ${input.key} value must be finite.`);
  return Object.freeze({ ...input });
}

function assertExactCoverage<T extends string>(
  actual: readonly T[],
  required: readonly T[],
  label: string,
): void {
  if (new Set(actual).size !== actual.length) throw new Error(`${label} keys must be unique.`);
  const missing = required.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !required.includes(key));
  if (missing.length || extra.length) {
    throw new Error(`${label} coverage mismatch; missing=${missing.join(",") || "none"}; extra=${extra.join(",") || "none"}.`);
  }
}

export async function buildAdministrativeCommandCenter(
  authority: PlatformAdministratorAuthorityContext,
  queueProviders: readonly AdminAttentionQueueProvider[],
  healthProviders: readonly AdminHealthPanelProvider[],
): Promise<AdministrativeCommandCenter> {
  assertExactCoverage(
    queueProviders.map((provider) => provider.key),
    ADMIN_ATTENTION_QUEUE_KEYS,
    "Command-center attention queue",
  );
  assertExactCoverage(
    healthProviders.map((provider) => provider.key),
    ADMIN_HEALTH_PANEL_KEYS,
    "Command-center health panel",
  );

  const visibleQueues = await Promise.all(
    queueProviders.map(async (provider) => {
      const requiredPermission = can(authority, provider.requiredPermission);
      if (!requiredPermission) return null;
      return Object.freeze({
        key: provider.key,
        label: provider.label.trim(),
        count: nonnegativeInteger(await provider.count(), `${provider.label} count`),
        requiredPermission,
      });
    }),
  );

  const visiblePanels = await Promise.all(
    healthProviders.map(async (provider) => {
      const requiredPermission = can(authority, provider.requiredPermission);
      if (!requiredPermission) return null;
      const loaded = await provider.load();
      return Object.freeze({
        key: provider.key,
        label: provider.label.trim(),
        status: loaded.status,
        metrics: Object.freeze(loaded.metrics.map(metric)),
        requiredPermission,
      });
    }),
  );

  const attentionQueues = Object.freeze(
    visibleQueues.filter((queue): queue is AdminAttentionQueueSummary => queue !== null),
  );
  const healthPanels = Object.freeze(
    visiblePanels.filter((panel): panel is AdminHealthPanel => panel !== null),
  );

  return Object.freeze({
    attentionQueues,
    healthPanels,
    totalAttentionCount: attentionQueues.reduce((sum, queue) => sum + queue.count, 0),
  });
}
