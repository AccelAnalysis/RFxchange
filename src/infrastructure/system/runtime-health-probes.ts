import type {
  SystemOperationsHealthMeasurement,
  SystemOperationsHealthProbe,
  SystemOperationsHealthState,
  SystemOperationsHealthSurface,
} from "../../application/admin/system-operations-health.ts";

export interface StaticSystemHealthProbeInput {
  readonly surface: SystemOperationsHealthSurface;
  readonly state: SystemOperationsHealthState;
  readonly summary: string;
  readonly checkedAt: () => string;
  readonly source: string;
  readonly version?: string | null;
  readonly metrics?: Readonly<Record<string, number | string | boolean | null>>;
  readonly diagnosticReference?: string | null;
}

export function createStaticSystemHealthProbe(
  input: StaticSystemHealthProbeInput,
): SystemOperationsHealthProbe {
  return Object.freeze({
    surface: input.surface,
    async check(): Promise<Omit<SystemOperationsHealthMeasurement, "surface">> {
      return Object.freeze({
        state: input.state,
        summary: input.summary,
        checkedAt: input.checkedAt(),
        source: input.source,
        version: input.version ?? null,
        metrics: Object.freeze({ ...(input.metrics ?? {}) }),
        diagnosticReference: input.diagnosticReference ?? null,
      });
    },
  });
}

export function createEnvironmentStatusProbe(
  environment: Readonly<{
    environment: string;
    projectId: string;
    expectedProjectId: string;
    region: string;
  }>,
  now: () => string,
): SystemOperationsHealthProbe {
  const aligned = environment.projectId === environment.expectedProjectId;
  return createStaticSystemHealthProbe({
    surface: "environment",
    state: aligned ? "operational" : "outage",
    summary: aligned
      ? "Runtime environment is aligned with the expected Firebase project."
      : "Runtime Firebase project does not match the expected project contract.",
    checkedAt: now,
    source: "rfxchange-runtime-environment",
    metrics: {
      environment: environment.environment,
      projectId: environment.projectId,
      expectedProjectId: environment.expectedProjectId,
      region: environment.region,
      projectAligned: aligned,
    },
    diagnosticReference: aligned ? null : "firebase-project-mismatch",
  });
}

export function createDeploymentStatusProbe(
  deployment: Readonly<{
    version: string | null;
    commitSha: string | null;
    environment: string;
  }>,
  now: () => string,
): SystemOperationsHealthProbe {
  const configured = Boolean(deployment.version || deployment.commitSha);
  return createStaticSystemHealthProbe({
    surface: "deployment",
    state: configured ? "operational" : "not-configured",
    summary: configured
      ? "Deployment identity is available to operations."
      : "Deployment version/commit metadata is not configured.",
    checkedAt: now,
    source: "rfxchange-deployment-metadata",
    version: deployment.version,
    metrics: {
      environment: deployment.environment,
      commitSha: deployment.commitSha,
    },
  });
}
