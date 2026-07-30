import {
  authorizeAdministrativeAction,
  createAdministrativeActionRequirement,
  type PlatformAdministratorAuthorityContext,
} from "../../domain/admin-authorization/model.ts";
import type {
  AdministrativeWorkItem,
  AdministrativeWorkQueueProvider,
} from "../../domain/admin-work-queue/model.ts";

const SEVERITY_WEIGHT = Object.freeze({ low: 1, normal: 2, high: 3, critical: 4 });

function visible(
  authority: PlatformAdministratorAuthorityContext,
  item: AdministrativeWorkItem,
): boolean {
  return (
    authorizeAdministrativeAction(
      authority,
      createAdministrativeActionRequirement({ permission: item.requiredPermission }),
    ).kind === "allow"
  );
}

function urgency(item: AdministrativeWorkItem, nowMs: number): number {
  const severity = SEVERITY_WEIGHT[item.severity] * 1_000_000_000_000;
  const due = item.slaDueAt ? Date.parse(item.slaDueAt) : Number.POSITIVE_INFINITY;
  const overdueBoost = Number.isFinite(due) && due <= nowMs ? 500_000_000_000 : 0;
  return severity + overdueBoost - Math.min(due, 999_999_999_999);
}

export async function buildUnifiedAdministrativeWorkQueue(
  authority: PlatformAdministratorAuthorityContext,
  providers: readonly AdministrativeWorkQueueProvider[],
  now: string,
): Promise<readonly AdministrativeWorkItem[]> {
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new Error("Administrative work queue timestamp must be valid.");
  const sourceNames = providers.map((provider) => provider.source.trim());
  if (sourceNames.some((source) => !source)) throw new Error("Administrative work queue provider source is required.");
  if (new Set(sourceNames).size !== sourceNames.length) {
    throw new Error("Administrative work queue providers must have unique source identifiers.");
  }

  const rows = (await Promise.all(providers.map((provider) => provider.listOpenWork()))).flat();
  const ids = rows.map((row) => row.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("Unified administrative work queue contains duplicate work-item ids.");
  }

  return Object.freeze(
    rows
      .filter((item) => item.status !== "closed" && visible(authority, item))
      .sort((left, right) => {
        const urgencyDelta = urgency(right, nowMs) - urgency(left, nowMs);
        if (urgencyDelta !== 0) return urgencyDelta;
        return Date.parse(left.createdAt) - Date.parse(right.createdAt);
      }),
  );
}
