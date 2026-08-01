import type {
  SystemOperationsHealthProbe,
} from "../admin/system-operations-health.ts";

export interface TransactionalEmailTerminalFailureSummary {
  readonly deliveryId: string;
  readonly status: "terminal-failure";
  readonly attemptCount: number;
  readonly lastErrorCode: string | null;
}

export interface TransactionalEmailTerminalFailureReader {
  listTerminalFailures(input: Readonly<{
    environment: string;
    projectId: string;
    organizationId?: string | null;
    limit?: number;
  }>): Promise<readonly TransactionalEmailTerminalFailureSummary[]>;
}

function required(value: string, field: string, maximumLength = 128): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${field} is required.`);
  if (normalized.length > maximumLength) {
    throw new Error(`${field} cannot exceed ${maximumLength} characters.`);
  }
  return normalized;
}

/**
 * Authorized operations compose this probe into the existing system-health collector. The reader
 * returns only bounded failure summaries, so recipient routing, provider bodies and message content
 * never enter the administrative health projection.
 */
export function createTransactionalEmailDeliveryHealthProbe(input: Readonly<{
  reader: TransactionalEmailTerminalFailureReader;
  environment: string;
  projectId: string;
  organizationId?: string | null;
  limit?: number;
  checkedAt: () => string;
}>): SystemOperationsHealthProbe {
  const environment = required(input.environment, "Transactional email health environment", 32);
  const projectId = required(input.projectId, "Transactional email health project id");
  const limit = Math.max(1, Math.min(input.limit ?? 50, 200));
  return Object.freeze({
    surface: "email-delivery" as const,
    async check() {
      const failures = await input.reader.listTerminalFailures({
        environment,
        projectId,
        organizationId: input.organizationId ?? null,
        limit,
      });
      const terminalFailureCount = failures.length;
      const mostRecentErrorCode = failures[0]?.lastErrorCode ?? null;
      return Object.freeze({
        state: terminalFailureCount > 0 ? "degraded" as const : "operational" as const,
        summary: terminalFailureCount > 0
          ? `${terminalFailureCount} terminal transactional email ${terminalFailureCount === 1 ? "failure requires" : "failures require"} authorized operations review.`
          : "No terminal transactional email delivery failures are currently visible.",
        checkedAt: input.checkedAt(),
        source: "transactional-email-delivery-audit",
        version: "1",
        metrics: Object.freeze({
          terminalFailureCount,
          mostRecentErrorCode,
        }),
        diagnosticReference: mostRecentErrorCode,
      });
    },
  });
}
