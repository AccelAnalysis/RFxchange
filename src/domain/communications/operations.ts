/** Operator actions never manufacture a delivery receipt or re-enable consent. */
export const COMMUNICATION_OPERATION_ACTIONS = ["hold", "release-hold", "close-job", "reconcile-callback"] as const;
export type CommunicationOperationAction = typeof COMMUNICATION_OPERATION_ACTIONS[number];
export interface CommunicationOperation {
  commandId: string; action: CommunicationOperationAction; targetId: string; expectedVersion: number; reason: string;
}
export function communicationOperation(value: unknown): CommunicationOperation {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid-command");
  const v = value as Record<string, unknown>;
  if (typeof v.commandId !== "string" || !/^[A-Za-z0-9-]{8,128}$/.test(v.commandId) ||
    !COMMUNICATION_OPERATION_ACTIONS.includes(v.action as CommunicationOperationAction) ||
    typeof v.targetId !== "string" || !/^[A-Za-z0-9._:-]{1,128}$/.test(v.targetId) ||
    !Number.isSafeInteger(v.expectedVersion) || Number(v.expectedVersion) < 0 ||
    typeof v.reason !== "string" || !v.reason.trim() || v.reason.length > 1000) throw new Error("invalid-command");
  return { commandId: v.commandId, action: v.action as CommunicationOperationAction, targetId: v.targetId,
    expectedVersion: Number(v.expectedVersion), reason: v.reason.trim() };
}
export function canCloseCommunicationJob(status: unknown): boolean {
  return ["failed", "retryable-failure", "needs-reconciliation"].includes(String(status));
}
export function communicationAttention(value: Record<string, unknown>): boolean {
  return ["needs-reconciliation", "needs-attention", "failed", "retryable-failure"].includes(String(value.status)) ||
    ["delivery_failed", "sending_failed"].includes(String(value.deliveryStatus));
}
