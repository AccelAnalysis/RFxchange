import {
  TransactionalEmailProviderError,
  type TransactionalEmailProvider,
} from "../../application/communications/transactional-email.ts";
import {
  createTransactionalEmailDeliveryReceipt,
  transactionalEmailAddress,
  type TransactionalEmailRequest,
} from "../../domain/communications/transactional-email.ts";

export const MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY =
  "microsoft-graph" as const;

const MICROSOFT_GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const MICROSOFT_IDENTITY_ORIGIN = "https://login.microsoftonline.com";
const MICROSOFT_GRAPH_ORIGIN = "https://graph.microsoft.com";
const DEFAULT_TIMEOUT_MILLISECONDS = 15_000;

export interface MicrosoftGraphTransactionalEmailConfiguration {
  readonly environment: string;
  readonly tenantId: string;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly approvedSenderAddress: string;
  readonly timeoutMilliseconds: number;
}

export interface TransactionalEmailRenderedContent {
  readonly subject: string;
  readonly text: string;
  readonly html?: string | null;
}

export interface TransactionalEmailContentRenderer {
  render(request: TransactionalEmailRequest): Promise<TransactionalEmailRenderedContent>;
}

export interface MicrosoftGraphFetch {
  (input: string | URL | Request, init?: RequestInit): Promise<Response>;
}

interface MicrosoftTokenResponse {
  readonly access_token?: unknown;
  readonly expires_in?: unknown;
  readonly token_type?: unknown;
  readonly error?: unknown;
}

interface CachedAccessToken {
  readonly value: string;
  readonly expiresAtMilliseconds: number;
}

function requiredConfiguration(
  value: string | undefined,
  label: string,
  maximumLength = 512,
): string {
  const normalized = value?.trim() ?? "";
  if (!normalized) throw configurationError(`${label} is required.`);
  if (normalized.length > maximumLength) {
    throw configurationError(`${label} cannot exceed ${maximumLength} characters.`);
  }
  if (/^(replace-with|example|changeme)/i.test(normalized)) {
    throw configurationError(`${label} contains a placeholder value.`);
  }
  return normalized;
}

function configurationError(message: string): TransactionalEmailProviderError {
  return new TransactionalEmailProviderError({
    code: "microsoft-email-configuration-invalid",
    message,
    retryable: false,
    deliveryOutcome: "known-failure",
    providerKey: MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY,
  });
}

function boundedTimeout(value: string | undefined): number {
  if (!value?.trim()) return DEFAULT_TIMEOUT_MILLISECONDS;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1_000 || parsed > 60_000) {
    throw configurationError(
      "RFXCHANGE_MICROSOFT_GRAPH_TIMEOUT_MS must be an integer between 1000 and 60000.",
    );
  }
  return parsed;
}

function tenantIdentifier(value: string | undefined): string {
  const normalized = requiredConfiguration(
    value,
    "RFXCHANGE_MICROSOFT_TENANT_ID",
    128,
  ).toLowerCase();
  if (!/^[a-z0-9][a-z0-9.-]{1,126}[a-z0-9]$/.test(normalized)) {
    throw configurationError("RFXCHANGE_MICROSOFT_TENANT_ID is malformed.");
  }
  return normalized;
}

function clientIdentifier(value: string | undefined): string {
  const normalized = requiredConfiguration(
    value,
    "RFXCHANGE_MICROSOFT_CLIENT_ID",
    128,
  ).toLowerCase();
  if (!/^[a-z0-9][a-z0-9.-]{1,126}[a-z0-9]$/.test(normalized)) {
    throw configurationError("RFXCHANGE_MICROSOFT_CLIENT_ID is malformed.");
  }
  return normalized;
}

export function microsoftGraphTransactionalEmailConfigurationFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): MicrosoftGraphTransactionalEmailConfiguration {
  const runtimeEnvironment = requiredConfiguration(
    environment.RFXCHANGE_ENV,
    "RFXCHANGE_ENV",
    32,
  ).toLowerCase();
  if (!["development", "staging", "production"].includes(runtimeEnvironment)) {
    throw configurationError("RFXCHANGE_ENV must be development, staging, or production.");
  }

  const expectedEnvironment = environment.RFXCHANGE_MICROSOFT_EXPECTED_ENV?.trim().toLowerCase();
  if (expectedEnvironment && expectedEnvironment !== runtimeEnvironment) {
    throw configurationError(
      `Microsoft email configuration is scoped to ${expectedEnvironment}, not ${runtimeEnvironment}.`,
    );
  }

  let approvedSenderAddress: string;
  try {
    approvedSenderAddress = transactionalEmailAddress(
      requiredConfiguration(
        environment.RFXCHANGE_MICROSOFT_APPROVED_SENDER,
        "RFXCHANGE_MICROSOFT_APPROVED_SENDER",
        320,
      ),
    );
  } catch (error) {
    if (error instanceof TransactionalEmailProviderError) throw error;
    throw configurationError("RFXCHANGE_MICROSOFT_APPROVED_SENDER must be a valid email address.");
  }

  return Object.freeze({
    environment: runtimeEnvironment,
    tenantId: tenantIdentifier(environment.RFXCHANGE_MICROSOFT_TENANT_ID),
    clientId: clientIdentifier(environment.RFXCHANGE_MICROSOFT_CLIENT_ID),
    clientSecret: requiredConfiguration(
      environment.RFXCHANGE_MICROSOFT_CLIENT_SECRET,
      "RFXCHANGE_MICROSOFT_CLIENT_SECRET",
      4096,
    ),
    approvedSenderAddress,
    timeoutMilliseconds: boundedTimeout(environment.RFXCHANGE_MICROSOFT_GRAPH_TIMEOUT_MS),
  });
}

function requiredRenderedValue(value: string, label: string, maximumLength: number): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new TransactionalEmailProviderError({
      code: "transactional-email-content-invalid",
      message: `${label} is required.`,
      retryable: false,
      deliveryOutcome: "known-failure",
      providerKey: MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY,
    });
  }
  if (normalized.length > maximumLength) {
    throw new TransactionalEmailProviderError({
      code: "transactional-email-content-invalid",
      message: `${label} cannot exceed ${maximumLength} characters.`,
      retryable: false,
      deliveryOutcome: "known-failure",
      providerKey: MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY,
    });
  }
  return normalized;
}

function normalizedRenderedContent(
  value: TransactionalEmailRenderedContent,
): TransactionalEmailRenderedContent {
  const subject = requiredRenderedValue(value.subject, "Transactional email subject", 255);
  const text = requiredRenderedValue(value.text, "Transactional email text body", 100_000);
  const html = value.html?.trim()
    ? requiredRenderedValue(value.html, "Transactional email HTML body", 200_000)
    : null;
  return Object.freeze({ subject, text, html });
}

function providerReference(response: Response): string | null {
  return (
    response.headers.get("request-id") ??
    response.headers.get("x-ms-request-id") ??
    response.headers.get("client-request-id")
  )?.trim() || null;
}

function retryAfterSeconds(response: Response): number | null {
  const value = response.headers.get("retry-after")?.trim();
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isInteger(seconds) && seconds >= 0 && seconds <= 86_400) return seconds;
  const date = Date.parse(value);
  if (!Number.isFinite(date)) return null;
  return Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

function retryableStatus(status: number): boolean {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function boundedProviderCode(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 80);
  return normalized || fallback;
}

async function providerDiagnosticCode(response: Response, prefix: string): Promise<string> {
  try {
    const body = await response.clone().json() as {
      readonly error?: { readonly code?: unknown };
    };
    return `${prefix}-${boundedProviderCode(body.error?.code, String(response.status))}`;
  } catch {
    return `${prefix}-http-${String(response.status)}`;
  }
}

function timeoutSignal(milliseconds: number): AbortSignal {
  return AbortSignal.timeout(milliseconds);
}

class MicrosoftGraphApplicationTokenSource {
  private cached: CachedAccessToken | null = null;
  private readonly configuration: MicrosoftGraphTransactionalEmailConfiguration;
  private readonly fetchImplementation: MicrosoftGraphFetch;
  private readonly now: () => Date;

  constructor(
    configuration: MicrosoftGraphTransactionalEmailConfiguration,
    fetchImplementation: MicrosoftGraphFetch,
    now: () => Date,
  ) {
    this.configuration = configuration;
    this.fetchImplementation = fetchImplementation;
    this.now = now;
  }

  async accessToken(): Promise<string> {
    const nowMilliseconds = this.now().getTime();
    if (this.cached && this.cached.expiresAtMilliseconds - 60_000 > nowMilliseconds) {
      return this.cached.value;
    }

    let response: Response;
    try {
      response = await this.fetchImplementation(
        `${MICROSOFT_IDENTITY_ORIGIN}/${encodeURIComponent(this.configuration.tenantId)}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: this.configuration.clientId,
            client_secret: this.configuration.clientSecret,
            grant_type: "client_credentials",
            scope: MICROSOFT_GRAPH_SCOPE,
          }),
          signal: timeoutSignal(this.configuration.timeoutMilliseconds),
        },
      );
    } catch {
      throw new TransactionalEmailProviderError({
        code: "microsoft-identity-unavailable",
        message: "Microsoft identity token acquisition was unavailable.",
        retryable: true,
        deliveryOutcome: "known-failure",
        providerKey: MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY,
      });
    }

    if (!response.ok) {
      throw new TransactionalEmailProviderError({
        code: await providerDiagnosticCode(response, "microsoft-identity"),
        message: "Microsoft identity rejected token acquisition.",
        retryable: retryableStatus(response.status),
        deliveryOutcome: "known-failure",
        providerKey: MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY,
        externalReference: providerReference(response),
        retryAfterSeconds: retryAfterSeconds(response),
      });
    }

    let token: MicrosoftTokenResponse;
    try {
      token = await response.json() as MicrosoftTokenResponse;
    } catch {
      throw new TransactionalEmailProviderError({
        code: "microsoft-identity-response-invalid",
        message: "Microsoft identity returned an invalid token response.",
        retryable: true,
        deliveryOutcome: "known-failure",
        providerKey: MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY,
        externalReference: providerReference(response),
      });
    }
    if (
      typeof token.access_token !== "string" ||
      !token.access_token.trim() ||
      typeof token.expires_in !== "number" ||
      !Number.isFinite(token.expires_in) ||
      token.expires_in <= 0
    ) {
      throw new TransactionalEmailProviderError({
        code: "microsoft-identity-response-invalid",
        message: "Microsoft identity returned an incomplete token response.",
        retryable: true,
        deliveryOutcome: "known-failure",
        providerKey: MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY,
        externalReference: providerReference(response),
      });
    }

    this.cached = Object.freeze({
      value: token.access_token,
      expiresAtMilliseconds: nowMilliseconds + token.expires_in * 1000,
    });
    return token.access_token;
  }
}

function graphMessage(
  request: TransactionalEmailRequest,
  content: TransactionalEmailRenderedContent,
): Readonly<Record<string, unknown>> {
  const body = content.html
    ? { contentType: "HTML", content: content.html }
    : { contentType: "Text", content: content.text };
  return Object.freeze({
    message: {
      subject: content.subject,
      body,
      toRecipients: [
        {
          emailAddress: {
            address: request.recipient.email,
            ...(request.recipient.displayName ? { name: request.recipient.displayName } : {}),
          },
        },
      ],
      internetMessageHeaders: [
        { name: "x-rfxchange-message-id", value: request.id },
        { name: "x-rfxchange-correlation-id", value: request.metadata.correlationId },
      ],
    },
    saveToSentItems: true,
  });
}

export class MicrosoftGraphTransactionalEmailProvider implements TransactionalEmailProvider {
  private readonly tokenSource: MicrosoftGraphApplicationTokenSource;
  private readonly configuration: MicrosoftGraphTransactionalEmailConfiguration;
  private readonly renderer: TransactionalEmailContentRenderer;
  private readonly fetchImplementation: MicrosoftGraphFetch;
  private readonly now: () => Date;

  constructor(
    configuration: MicrosoftGraphTransactionalEmailConfiguration,
    renderer: TransactionalEmailContentRenderer,
    fetchImplementation: MicrosoftGraphFetch = fetch,
    now: () => Date = () => new Date(),
  ) {
    this.configuration = configuration;
    this.renderer = renderer;
    this.fetchImplementation = fetchImplementation;
    this.now = now;
    this.tokenSource = new MicrosoftGraphApplicationTokenSource(
      configuration,
      fetchImplementation,
      now,
    );
  }

  async deliver(request: TransactionalEmailRequest) {
    const content = normalizedRenderedContent(await this.renderer.render(request));
    const accessToken = await this.tokenSource.accessToken();
    let response: Response;
    try {
      response = await this.fetchImplementation(
        `${MICROSOFT_GRAPH_ORIGIN}/v1.0/users/${encodeURIComponent(
          this.configuration.approvedSenderAddress,
        )}/sendMail`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json",
            "client-request-id": request.metadata.correlationId,
          },
          body: JSON.stringify(graphMessage(request, content)),
          signal: timeoutSignal(this.configuration.timeoutMilliseconds),
        },
      );
    } catch {
      throw new TransactionalEmailProviderError({
        code: "microsoft-graph-unavailable",
        message: "Microsoft Graph email delivery returned an unknown outcome.",
        retryable: false,
        deliveryOutcome: "unknown",
        providerKey: MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY,
      });
    }

    const externalReference = providerReference(response);
    if (response.status !== 202) {
      throw new TransactionalEmailProviderError({
        code: await providerDiagnosticCode(response, "microsoft-graph"),
        message: "Microsoft Graph did not accept the email request.",
        retryable: retryableStatus(response.status),
        deliveryOutcome: "known-failure",
        providerKey: MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY,
        externalReference,
        retryAfterSeconds: retryAfterSeconds(response),
      });
    }

    return createTransactionalEmailDeliveryReceipt({
      messageId: request.id,
      status: "accepted",
      providerKey: MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY,
      externalReference,
      recordedAt: this.now().toISOString(),
      diagnosticCode: "microsoft-graph-accepted",
    });
  }
}

/**
 * The only built-in template is an intentionally inert acceptance probe. Feature workflows must
 * supply their own reviewed, minimum-data renderer instead of placing arbitrary variables in mail.
 */
export class MicrosoftGraphAcceptanceEmailRenderer
  implements TransactionalEmailContentRenderer {
  async render(request: TransactionalEmailRequest): Promise<TransactionalEmailRenderedContent> {
    if (
      request.eventKey !== "system.microsoft-email-acceptance" ||
      request.templateKey !== "system.microsoft-email-acceptance.v1"
    ) {
      throw new TransactionalEmailProviderError({
        code: "transactional-email-template-not-configured",
        message: "No reviewed transactional email renderer is configured for this template.",
        retryable: false,
        deliveryOutcome: "known-failure",
        providerKey: MICROSOFT_GRAPH_TRANSACTIONAL_EMAIL_PROVIDER_KEY,
      });
    }
    return Object.freeze({
      subject: `[${request.purpose}] RFxchange Microsoft email acceptance`,
      text:
        "This controlled RFxchange message verifies the Microsoft transactional email adapter. " +
        `Correlation: ${request.metadata.correlationId}. No action is required.`,
    });
  }
}
