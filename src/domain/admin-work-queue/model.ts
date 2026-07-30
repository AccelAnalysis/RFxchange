import { requireCataloguedAdminPermission, type AdminPermissionKey } from "../admin-authorization/model.ts";

type Brand<T, Name extends string> = T & { readonly __brand: Name };

export type AdministrativeWorkItemId = Brand<string, "AdministrativeWorkItemId">;
export type AdministrativeCaseNumber = Brand<string, "AdministrativeCaseNumber">;
export type AdministrativeWorkTimestamp = Brand<string, "AdministrativeWorkTimestamp">;

export const ADMINISTRATIVE_WORK_STATUSES = [
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

export type AdministrativeWorkStatus = (typeof ADMINISTRATIVE_WORK_STATUSES)[number];
export type AdministrativeWorkSeverity = "low" | "normal" | "high" | "critical";

export interface AdministrativeWorkItem {
  readonly id: AdministrativeWorkItemId;
  readonly caseNumber: AdministrativeCaseNumber;
  readonly objectType: string;
  readonly objectId: string;
  readonly organizationId: string | null;
  readonly userId: string | null;
  readonly type: string;
  readonly severity: AdministrativeWorkSeverity;
  readonly source: string;
  readonly geography: string | null;
  readonly assignedAdministratorId: string | null;
  readonly createdAt: AdministrativeWorkTimestamp;
  readonly slaDueAt: AdministrativeWorkTimestamp | null;
  readonly status: AdministrativeWorkStatus;
  readonly evidenceReferences: readonly string[];
  readonly relatedCaseNumbers: readonly AdministrativeCaseNumber[];
  readonly requiredPermission: AdminPermissionKey;
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

function timestamp(value: string, label: string): AdministrativeWorkTimestamp {
  const parsed = Date.parse(required(value, label));
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid date-time.`);
  return new Date(parsed).toISOString() as AdministrativeWorkTimestamp;
}

function optionalTimestamp(value: string | null | undefined, label: string): AdministrativeWorkTimestamp | null {
  return value ? timestamp(value, label) : null;
}

function unique(values: readonly string[], label: string): readonly string[] {
  return Object.freeze([...new Set(values.map((value) => required(value, label)))]);
}

export function createAdministrativeWorkItem(input: Readonly<{
  id: string;
  caseNumber: string;
  objectType: string;
  objectId: string;
  organizationId?: string | null;
  userId?: string | null;
  type: string;
  severity?: AdministrativeWorkSeverity;
  source: string;
  geography?: string | null;
  assignedAdministratorId?: string | null;
  createdAt: string;
  slaDueAt?: string | null;
  status?: AdministrativeWorkStatus;
  evidenceReferences?: readonly string[];
  relatedCaseNumbers?: readonly string[];
  requiredPermission: string;
}>): AdministrativeWorkItem {
  const status = input.status ?? "new";
  if (!ADMINISTRATIVE_WORK_STATUSES.includes(status)) {
    throw new Error(`Unsupported administrative work status: ${status}.`);
  }
  const severity = input.severity ?? "normal";
  if (!["low", "normal", "high", "critical"].includes(severity)) {
    throw new Error(`Unsupported administrative work severity: ${severity}.`);
  }
  return Object.freeze({
    id: required(input.id, "Administrative work item id") as AdministrativeWorkItemId,
    caseNumber: required(input.caseNumber, "Administrative case number") as AdministrativeCaseNumber,
    objectType: required(input.objectType, "Administrative work object type"),
    objectId: required(input.objectId, "Administrative work object id"),
    organizationId: optional(input.organizationId),
    userId: optional(input.userId),
    type: required(input.type, "Administrative work type"),
    severity,
    source: required(input.source, "Administrative work source"),
    geography: optional(input.geography),
    assignedAdministratorId: optional(input.assignedAdministratorId),
    createdAt: timestamp(input.createdAt, "Administrative work creation timestamp"),
    slaDueAt: optionalTimestamp(input.slaDueAt, "Administrative work SLA timestamp"),
    status,
    evidenceReferences: unique(input.evidenceReferences ?? [], "Administrative work evidence reference"),
    relatedCaseNumbers: Object.freeze(
      unique(input.relatedCaseNumbers ?? [], "Related administrative case number").map(
        (value) => value as AdministrativeCaseNumber,
      ),
    ),
    requiredPermission: requireCataloguedAdminPermission(input.requiredPermission),
  });
}

export interface AdministrativeWorkQueueProvider {
  readonly source: string;
  listOpenWork(): Promise<readonly AdministrativeWorkItem[]>;
}
