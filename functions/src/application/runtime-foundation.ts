export const RFXCHANGE_FUNCTION_WORKLOAD_KINDS = Object.freeze([
  "asynchronous",
  "scheduled",
  "event-driven",
  "integration",
] as const);

export type RFxchangeFunctionWorkloadKind =
  (typeof RFXCHANGE_FUNCTION_WORKLOAD_KINDS)[number];

export type RFxchangeRuntimeEnvironment = "development" | "staging" | "production";

export interface FunctionsRuntimeContext {
  readonly service: "rfxchange-functions";
  readonly environment: RFxchangeRuntimeEnvironment;
  readonly projectId: string;
  readonly emulator: boolean;
  readonly region: string;
  readonly runtime: "nodejs22";
}

export interface FunctionsRuntimeHealthReport extends FunctionsRuntimeContext {
  readonly status: "ok";
  readonly workloadKinds: readonly RFxchangeFunctionWorkloadKind[];
  readonly generatedAt: string;
}

function requiredValue(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

export function runtimeEnvironment(value: string): RFxchangeRuntimeEnvironment {
  const normalized = requiredValue(value, "RFxchange runtime environment").toLowerCase();
  if (!["development", "staging", "production"].includes(normalized)) {
    throw new Error(`Unsupported RFxchange runtime environment: ${normalized}`);
  }
  return normalized as RFxchangeRuntimeEnvironment;
}

export function createFunctionsRuntimeContext(input: Readonly<{
  environment: string;
  projectId: string;
  emulator: boolean;
  region: string;
}>): FunctionsRuntimeContext {
  const environment = runtimeEnvironment(input.environment);
  const projectId = requiredValue(input.projectId, "Firebase project id");
  const region = requiredValue(input.region, "Cloud Functions region");

  if (environment === "production" && input.emulator) {
    throw new Error("Production RFxchange functions cannot run with the emulator flag enabled.");
  }

  return Object.freeze({
    service: "rfxchange-functions" as const,
    environment,
    projectId,
    emulator: input.emulator,
    region,
    runtime: "nodejs22" as const,
  });
}

export function createFunctionsRuntimeHealthReport(
  context: FunctionsRuntimeContext,
  now: string,
): FunctionsRuntimeHealthReport {
  const parsed = Date.parse(now);
  if (!Number.isFinite(parsed)) {
    throw new Error("Runtime health timestamp must be a valid ISO-compatible date-time value.");
  }

  return Object.freeze({
    ...context,
    status: "ok" as const,
    workloadKinds: RFXCHANGE_FUNCTION_WORKLOAD_KINDS,
    generatedAt: new Date(parsed).toISOString(),
  });
}
