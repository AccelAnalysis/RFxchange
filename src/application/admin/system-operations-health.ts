import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";

export const SYSTEM_OPERATIONS_HEALTH_SURFACES = [
  "feature-flags",
  "environment",
  "firebase-functions",
  "scheduled-jobs",
  "failed-jobs",
  "webhooks",
  "apis",
  "sam-gov",
  "geocoding",
  "maps",
  "email-delivery",
  "file-storage",
  "search-index",
  "deployment",
  "data-migrations",
  "backups",
  "error-monitoring",
  "rate-limits",
] as const;

export type SystemOperationsHealthSurface = (typeof SYSTEM_OPERATIONS_HEALTH_SURFACES)[number];
export type SystemOperationsHealthState =
  | "operational"
  | "degraded"
  | "outage"
  | "unknown"
  | "not-configured";

export interface SystemOperationsHealthMeasurement {
  readonly surface: SystemOperationsHealthSurface;
  readonly state: SystemOperationsHealthState;
  readonly summary: string;
  readonly checkedAt: string;
  readonly source: string;
  readonly version: string | null;
  readonly metrics: Readonly<Record<string, number | string | boolean | null>>;
  readonly diagnosticReference: string | null;
}

export interface SystemOperationsHealthSnapshot {
  readonly generatedAt: string;
  readonly overall: Exclude<SystemOperationsHealthState, "not-configured">;
  readonly operationalCount: number;
  readonly degradedCount: number;
  readonly outageCount: number;
  readonly unknownCount: number;
  readonly notConfiguredCount: number;
  readonly measurements: readonly SystemOperationsHealthMeasurement[];
}

export interface SystemOperationsHealthProbe {
  readonly surface: SystemOperationsHealthSurface;
  check(): Promise<Omit<SystemOperationsHealthMeasurement, "surface">>;
}

function normalizedTimestamp(value: string, field: string): string {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} must be a valid date-time.`);
  return new Date(parsed).toISOString();
}

function requiredValue(value: string, field: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  return normalized;
}

function assertSystemHealthAuthorized(authority: PlatformAdministratorAuthorityContext): void {
  const decision = authorizeAdministrativeAction(
    authority,
    createAdministrativeActionRequirement({ permission: "system.health.read" }),
  );
  if (decision.kind !== "allow") {
    throw new Error(`System operations health denied: ${decision.reason}.`);
  }
}

function measurement(
  surface: SystemOperationsHealthSurface,
  value: Omit<SystemOperationsHealthMeasurement, "surface">,
): SystemOperationsHealthMeasurement {
  return Object.freeze({
    surface,
    state: value.state,
    summary: requiredValue(value.summary, `${surface} health summary`),
    checkedAt: normalizedTimestamp(value.checkedAt, `${surface} health checkedAt`),
    source: requiredValue(value.source, `${surface} health source`),
    version: value.version?.trim() || null,
    metrics: Object.freeze({ ...value.metrics }),
    diagnosticReference: value.diagnosticReference?.trim() || null,
  });
}

function overallState(measurements: readonly SystemOperationsHealthMeasurement[]): SystemOperationsHealthSnapshot["overall"] {
  if (measurements.some((item) => item.state === "outage")) return "outage";
  if (measurements.some((item) => item.state === "degraded")) return "degraded";
  if (measurements.some((item) => item.state === "unknown" || item.state === "not-configured")) return "unknown";
  return "operational";
}

export function buildSystemOperationsHealthSnapshot(
  authority: PlatformAdministratorAuthorityContext,
  generatedAt: string,
  values: Readonly<Partial<Record<SystemOperationsHealthSurface, Omit<SystemOperationsHealthMeasurement, "surface">>>>,
): SystemOperationsHealthSnapshot {
  assertSystemHealthAuthorized(authority);
  const at = normalizedTimestamp(generatedAt, "System operations health generatedAt");
  const measurements = SYSTEM_OPERATIONS_HEALTH_SURFACES.map((surface) => {
    const value = values[surface];
    return measurement(surface, value ?? {
      state: "unknown",
      summary: "No health probe result is currently available.",
      checkedAt: at,
      source: "rfxchange-health-aggregator",
      version: null,
      metrics: {},
      diagnosticReference: null,
    });
  });

  return Object.freeze({
    generatedAt: at,
    overall: overallState(measurements),
    operationalCount: measurements.filter((item) => item.state === "operational").length,
    degradedCount: measurements.filter((item) => item.state === "degraded").length,
    outageCount: measurements.filter((item) => item.state === "outage").length,
    unknownCount: measurements.filter((item) => item.state === "unknown").length,
    notConfiguredCount: measurements.filter((item) => item.state === "not-configured").length,
    measurements: Object.freeze(measurements),
  });
}

export async function collectSystemOperationsHealth(
  authority: PlatformAdministratorAuthorityContext,
  generatedAt: string,
  probes: readonly SystemOperationsHealthProbe[],
): Promise<SystemOperationsHealthSnapshot> {
  assertSystemHealthAuthorized(authority);
  const duplicate = probes.find(
    (probe, index) => probes.findIndex((candidate) => candidate.surface === probe.surface) !== index,
  );
  if (duplicate) throw new Error(`Duplicate system health probe registered for ${duplicate.surface}.`);

  const results: Partial<Record<SystemOperationsHealthSurface, Omit<SystemOperationsHealthMeasurement, "surface">>> = {};
  await Promise.all(
    probes.map(async (probe) => {
      try {
        results[probe.surface] = await probe.check();
      } catch (error) {
        results[probe.surface] = {
          state: "unknown",
          summary: "Health probe failed; status could not be determined.",
          checkedAt: generatedAt,
          source: `probe:${probe.surface}`,
          version: null,
          metrics: {},
          diagnosticReference: error instanceof Error ? error.name : "probe-error",
        };
      }
    }),
  );
  return buildSystemOperationsHealthSnapshot(authority, generatedAt, results);
}
