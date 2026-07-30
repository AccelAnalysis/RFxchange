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
    templateKey: string;
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
      throw new Error(
        `Transactional email provider returned receipt for ${receipt.messageId}; expected ${request.id}.`,
      );
    }
    return receipt;
  }
}
