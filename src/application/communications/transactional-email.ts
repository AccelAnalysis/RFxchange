import {
  createTransactionalEmailRequest,
  type TransactionalEmailDeliveryReceipt,
  type TransactionalEmailPurpose,
  type TransactionalEmailRequest,
  type TransactionalEmailVariable,
} from "../../domain/communications/transactional-email.ts";

/**
 * Provider port for transactional/administrative mail. Implementations may use Microsoft or another
 * provider, but application/domain code only sees RFxchange request and receipt contracts.
 */
export interface TransactionalEmailProvider {
  deliver(request: TransactionalEmailRequest): Promise<TransactionalEmailDeliveryReceipt>;
}

/**
 * Provider-neutral failure information that an asynchronous adapter can translate into the
 * shared background-job retry policy. Provider response bodies and credentials must not cross
 * this boundary.
 */
export class TransactionalEmailProviderError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly deliveryOutcome: "known-failure" | "unknown";
  readonly providerKey: string;
  readonly externalReference: string | null;
  readonly retryAfterSeconds: number | null;

  constructor(input: Readonly<{
    code: string;
    message: string;
    retryable: boolean;
    deliveryOutcome: "known-failure" | "unknown";
    providerKey: string;
    externalReference?: string | null;
    retryAfterSeconds?: number | null;
  }>) {
    super(input.message);
    this.name = "TransactionalEmailProviderError";
    this.code = input.code;
    this.retryable = input.retryable;
    this.deliveryOutcome = input.deliveryOutcome;
    this.providerKey = input.providerKey;
    this.externalReference = input.externalReference ?? null;
    this.retryAfterSeconds = input.retryAfterSeconds ?? null;
  }
}

export class TransactionalEmailService {
  private readonly provider: TransactionalEmailProvider;

  constructor(provider: TransactionalEmailProvider) {
    this.provider = provider;
  }

  async request(input: Readonly<{
    id: string;
    purpose: TransactionalEmailPurpose;
    recipientEmail: string;
    recipientDisplayName?: string | null;
    eventKey: string;
    eventVersion?: number;
    templateKey: string;
    templateVersion?: number;
    variables?: Readonly<Record<string, TransactionalEmailVariable>>;
    correlationId: string;
    idempotencyKey: string;
    requestedAt: string;
    organizationId?: string | null;
    userId?: string | null;
    relatedObjectType?: string | null;
    relatedObjectId?: string | null;
    tags?: readonly string[];
  }>): Promise<TransactionalEmailDeliveryReceipt> {
    const request = createTransactionalEmailRequest(input);
    const receipt = await this.provider.deliver(request);
    if (receipt.messageId !== request.id) {
      throw new TransactionalEmailProviderError({
        code: "transactional-email-receipt-identity-mismatch",
        message: `Transactional email provider returned receipt for ${receipt.messageId}; expected ${request.id}.`,
        retryable: false,
        deliveryOutcome: "unknown",
        providerKey: receipt.providerKey,
        externalReference: receipt.externalReference,
      });
    }
    return receipt;
  }
}
