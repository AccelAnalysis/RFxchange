import {
  retryableBackgroundJobError,
  terminalBackgroundJobError,
  type BackgroundJobHandler,
  type BackgroundJobMetadata,
} from "./background-jobs.js";

export interface BackgroundTransactionalEmailDeliveryReceipt {
  readonly status: "accepted" | "rejected";
  readonly providerKey: string;
  readonly externalReference: string | null;
  readonly diagnosticCode: string | null;
}

export interface TransactionalEmailProviderFailureClassification {
  readonly code: string;
  readonly retryable: boolean;
  readonly providerKey: string;
  readonly externalReference: string | null;
  readonly retryAfterSeconds: number | null;
}

function bounded(value: string | null, maximumLength = 256): string | null {
  if (value === null) return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maximumLength) : null;
}

export function classifyTransactionalEmailProviderFailure(
  error: unknown,
): TransactionalEmailProviderFailureClassification | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as {
    readonly code?: unknown;
    readonly retryable?: unknown;
    readonly providerKey?: unknown;
    readonly externalReference?: unknown;
    readonly retryAfterSeconds?: unknown;
  };
  if (
    typeof candidate.code !== "string" ||
    typeof candidate.retryable !== "boolean" ||
    typeof candidate.providerKey !== "string"
  ) {
    return null;
  }
  const code = bounded(candidate.code, 120);
  const providerKey = bounded(candidate.providerKey, 64);
  const externalReference = typeof candidate.externalReference === "string"
    ? bounded(candidate.externalReference)
    : null;
  const retryAfterSeconds = typeof candidate.retryAfterSeconds === "number" &&
      Number.isInteger(candidate.retryAfterSeconds) &&
      candidate.retryAfterSeconds >= 0 &&
      candidate.retryAfterSeconds <= 86_400
    ? candidate.retryAfterSeconds
    : null;
  return code && providerKey
    ? Object.freeze({
        code,
        retryable: candidate.retryable,
        providerKey,
        externalReference,
        retryAfterSeconds,
      })
    : null;
}

export function transactionalEmailDeliveryMetadata(
  receipt: BackgroundTransactionalEmailDeliveryReceipt,
): BackgroundJobMetadata {
  return Object.freeze({
    deliveryStatus: receipt.status,
    providerKey: bounded(receipt.providerKey, 64),
    providerReference: bounded(receipt.externalReference),
    diagnosticCode: bounded(receipt.diagnosticCode, 120),
  });
}

/**
 * Bridges COMMS-001 delivery into INF-007 without introducing a second queue. The job aggregate
 * records the accepted provider response metadata, while classified failures use the shared
 * retry/terminal lifecycle and event ledger.
 */
export function transactionalEmailBackgroundJobHandler(
  deliver: () => Promise<BackgroundTransactionalEmailDeliveryReceipt>,
): BackgroundJobHandler {
  return async (): Promise<BackgroundJobMetadata> => {
    let receipt: BackgroundTransactionalEmailDeliveryReceipt;
    try {
      receipt = await deliver();
    } catch (error) {
      const failure = classifyTransactionalEmailProviderFailure(error);
      if (!failure) {
        throw retryableBackgroundJobError(
          "transactional-email-provider-unhandled",
          "Transactional email provider failed without a recognized classification.",
        );
      }
      const code = `transactional-email-${failure.providerKey}-${failure.code}`.slice(0, 120);
      throw failure.retryable
        ? retryableBackgroundJobError(code, "Transactional email delivery should be retried.")
        : terminalBackgroundJobError(code, "Transactional email delivery must not be retried.");
    }

    if (receipt.status !== "accepted") {
      throw terminalBackgroundJobError(
        `transactional-email-${receipt.providerKey}-rejected`.slice(0, 120),
        "Transactional email provider rejected the delivery.",
      );
    }
    return transactionalEmailDeliveryMetadata(receipt);
  };
}
