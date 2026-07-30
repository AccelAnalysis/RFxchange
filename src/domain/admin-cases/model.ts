import { requireCataloguedAdminPermission, type AdminPermissionKey } from "../admin-authorization/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type AdministrativeCaseId = Brand<string, "AdministrativeCaseId">;
export type AdministrativeCaseNumber = Brand<string, "AdministrativeCaseNumber">;
export type AdministrativeCaseEventId = Brand<string, "AdministrativeCaseEventId">;
export type AdministrativeCaseTimestamp = Brand<string, "AdministrativeCaseTimestamp">;

export const ADMINISTRATIVE_CASE_STATUSES = [
  "new",
  "triaged",
  "assigned",
  "in-review",
  "waiting-for-participant",
  "action-required",
  "monitoring",
  "resolved",
  "closed",
] as const;

export type AdministrativeCaseStatus = (typeof ADMINISTRATIVE_CASE_STATUSES)[number];
export type AdministrativeCaseSeverity = "low" | "normal" | "high" | "critical";
export type AdministrativeCaseSlaState = "not-configured" | "within-sla" | "due-soon" | "overdue" | "satisfied";

export interface AdministrativeCase {
  readonly id: AdministrativeCaseId;
  readonly caseNumber: AdministrativeCaseNumber;
  readonly objectType: string;
  readonly objectId: string;
  readonly organizationId: string | null;
  readonly userId: string | null;
  readonly type: string;
  readonly severity: AdministrativeCaseSeverity;
  readonly source: string;
  readonly geography: string | null;
  readonly assignedAdministratorId: string | null;
  readonly status: AdministrativeCaseStatus;
  readonly evidenceReferences: readonly string[];
  readonly relatedCaseIds: readonly AdministrativeCaseId[];
  readonly readPermission: AdminPermissionKey;
  readonly actionPermission: AdminPermissionKey;
  readonly slaPolicyKey: string | null;
  readonly slaDueAt: AdministrativeCaseTimestamp | null;
  readonly createdAt: AdministrativeCaseTimestamp;
  readonly updatedAt: AdministrativeCaseTimestamp;
  readonly resolvedAt: AdministrativeCaseTimestamp | null;
  readonly closedAt: AdministrativeCaseTimestamp | null;
}

export interface AdministrativeCaseEvent {
  readonly id: AdministrativeCaseEventId;
  readonly caseId: AdministrativeCaseId;
  readonly caseNumber: AdministrativeCaseNumber;
  readonly actorAdministratorId: string;
  readonly fromStatus: AdministrativeCaseStatus;
  readonly toStatus: AdministrativeCaseStatus;
  readonly reason: string;
  readonly occurredAt: AdministrativeCaseTimestamp;
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function optional(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return value.trim() || null;
}

function timestamp(value: string, label: string): AdministrativeCaseTimestamp {
  const parsed = Date.parse(required(value, label));
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid date-time.`);
  return new Date(parsed).toISOString() as AdministrativeCaseTimestamp;
}

function optionalTimestamp(value: string | null | undefined, label: string): AdministrativeCaseTimestamp | null {
  return value ? timestamp(value, label) : null;
}

function unique(values: readonly string[], label: string): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => required(value, label)))]);
}

export function administrativeCaseId(value: string): AdministrativeCaseId {
  return required(value, "Administrative case id") as AdministrativeCaseId;
}

export function administrativeCaseEventId(value: string): AdministrativeCaseEventId {
  return required(value, "Administrative case event id") as AdministrativeCaseEventId;
}

export function createAdministrativeCase(input: Readonly<{
  id: string;
  caseNumber: string;
  objectType: string;
  objectId: string;
  organizationId?: string | null;
  userId?: string | null;
  type: string;
  severity?: AdministrativeCaseSeverity;
  source: string;
  geography?: string | null;
  assignedAdministratorId?: string | null;
  evidenceReferences?: readonly string[];
  relatedCaseIds?: readonly string[];
  readPermission: string;
  actionPermission: string;
  slaPolicyKey?: string | null;
  slaDueAt?: string | null;
  now: string;
}>): AdministrativeCase {
  const now = timestamp(input.now, "Administrative case creation timestamp");
  const severity = input.severity ?? "normal";
  if (!["low", "normal", "high", "critical"].includes(severity)) {
    throw new Error(`Unsupported administrative case severity: ${severity}.`);
  }
  const slaDueAt = optionalTimestamp(input.slaDueAt, "Administrative case SLA due timestamp");
  if (slaDueAt && Date.parse(slaDueAt) <= Date.parse(now)) {
    throw new Error("Administrative case SLA due timestamp must be after case creation.");
  }
  return Object.freeze({
    id: administrativeCaseId(input.id),
    caseNumber: required(input.caseNumber, "Administrative case number") as AdministrativeCaseNumber,
    objectType: required(input.objectType, "Administrative case object type"),
    objectId: required(input.objectId, "Administrative case object id"),
    organizationId: optional(input.organizationId),
    userId: optional(input.userId),
    type: required(input.type, "Administrative case type"),
    severity,
    source: required(input.source, "Administrative case source"),
    geography: optional(input.geography),
    assignedAdministratorId: optional(input.assignedAdministratorId),
    status: "new" as const,
    evidenceReferences: unique(input.evidenceReferences ?? [], "Administrative case evidence reference"),
    relatedCaseIds: Object.freeze(
      unique(input.relatedCaseIds ?? [], "Related administrative case id").map(administrativeCaseId),
    ),
    readPermission: requireCataloguedAdminPermission(input.readPermission),
    actionPermission: requireCataloguedAdminPermission(input.actionPermission),
    slaPolicyKey: optional(input.slaPolicyKey),
    slaDueAt,
    createdAt: now,
    updatedAt: now,
    resolvedAt: null,
    closedAt: null,
  });
}

export function nextAdministrativeCaseStatus(current: AdministrativeCaseStatus): AdministrativeCaseStatus | null {
  const index = ADMINISTRATIVE_CASE_STATUSES.indexOf(current);
  return index >= 0 && index < ADMINISTRATIVE_CASE_STATUSES.length - 1
    ? ADMINISTRATIVE_CASE_STATUSES[index + 1]
    : null;
}

export function transitionAdministrativeCase(input: Readonly<{
  caseRecord: AdministrativeCase;
  eventId: string;
  actorAdministratorId: string;
  nextStatus: AdministrativeCaseStatus;
  reason: string;
  now: string;
}>): Readonly<{ caseRecord: AdministrativeCase; event: AdministrativeCaseEvent }> {
  const expected = nextAdministrativeCaseStatus(input.caseRecord.status);
  if (input.nextStatus !== expected) {
    throw new Error(`Invalid administrative case transition: ${input.caseRecord.status} -> ${input.nextStatus}.`);
  }
  const occurredAt = timestamp(input.now, "Administrative case transition timestamp");
  if (Date.parse(occurredAt) < Date.parse(input.caseRecord.updatedAt)) {
    throw new Error("Administrative case transition cannot precede the current case state.");
  }
  const updated = Object.freeze({
    ...input.caseRecord,
    status: input.nextStatus,
    updatedAt: occurredAt,
    resolvedAt: input.nextStatus === "resolved" ? occurredAt : input.caseRecord.resolvedAt,
    closedAt: input.nextStatus === "closed" ? occurredAt : input.caseRecord.closedAt,
  });
  const event = Object.freeze({
    id: administrativeCaseEventId(input.eventId),
    caseId: input.caseRecord.id,
    caseNumber: input.caseRecord.caseNumber,
    actorAdministratorId: required(input.actorAdministratorId, "Administrative case actor id"),
    fromStatus: input.caseRecord.status,
    toStatus: input.nextStatus,
    reason: required(input.reason, "Administrative case transition reason"),
    occurredAt,
  });
  return Object.freeze({ caseRecord: updated, event });
}

export function assessAdministrativeCaseSla(
  caseRecord: AdministrativeCase,
  now: string,
  dueSoonWindowMinutes = 60,
): AdministrativeCaseSlaState {
  if (caseRecord.status === "resolved" || caseRecord.status === "closed") return "satisfied";
  if (!caseRecord.slaDueAt) return "not-configured";
  if (!Number.isInteger(dueSoonWindowMinutes) || dueSoonWindowMinutes < 1) {
    throw new Error("Administrative case SLA due-soon window must be a positive integer.");
  }
  const nowMs = Date.parse(timestamp(now, "Administrative case SLA evaluation timestamp"));
  const dueMs = Date.parse(caseRecord.slaDueAt);
  if (nowMs > dueMs) return "overdue";
  return dueMs - nowMs <= dueSoonWindowMinutes * 60_000 ? "due-soon" : "within-sla";
}
