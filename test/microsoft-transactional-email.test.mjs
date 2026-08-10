import assert from "node:assert/strict";
import test from "node:test";

import {
  TransactionalEmailProviderError,
  TransactionalEmailService,
} from "../src/application/communications/transactional-email.ts";
import {
  MicrosoftGraphTransactionalEmailProvider,
  microsoftGraphTransactionalEmailConfigurationFromEnvironment,
} from "../src/infrastructure/communications/microsoft-graph-transactional-email.ts";
import {
  createBackgroundJobRequest,
  executeBackgroundJob,
} from "../functions/lib/application/background-jobs.js";
import {
  transactionalEmailBackgroundJobHandler,
} from "../functions/lib/application/transactional-email-jobs.js";
import { createFunctionsRuntimeContext } from "../functions/lib/application/runtime-foundation.js";
import { backgroundJobPayloadFingerprint } from "../functions/lib/runtime/background-job-identifiers.js";

const NOW = "2026-07-30T16:00:00.000Z";
const configuration = Object.freeze({
  environment: "development",
  tenantId: "tenant.example",
  clientId: "client-id-123",
  clientSecret: "secret-never-log",
  approvedSenderAddress: "approved-sender@example.com",
  timeoutMilliseconds: 5_000,
});
const renderer = Object.freeze({
  async render() {
    return {
      subject: "Controlled adapter test",
      text: "Minimum-data plain text.",
    };
  },
});

function emailInput(id = "message-001") {
  return {
    id,
    purpose: "administrative",
    recipientEmail: "recipient@example.test",
    recipientDisplayName: "Controlled Recipient",
    eventKey: "system.microsoft-email-acceptance",
    templateKey: "system.microsoft-email-acceptance.v1",
    correlationId: `correlation-${id}`,
    idempotencyKey: `idempotency-${id}`,
    requestedAt: NOW,
  };
}

function successfulFetch(calls) {
  return async (input, init) => {
    calls.push({ url: String(input), init });
    if (String(input).includes("/oauth2/v2.0/token")) {
      return new Response(JSON.stringify({
        token_type: "Bearer",
        expires_in: 3600,
        access_token: "opaque-access-token",
      }), {
        status: 200,
        headers: { "content-type": "application/json", "request-id": "token-request-1" },
      });
    }
    return new Response(null, {
      status: 202,
      headers: { "request-id": "graph-request-accepted-1" },
    });
  };
}

test("COMMS-002 loads environment-scoped Graph configuration without committed defaults", () => {
  const loaded = microsoftGraphTransactionalEmailConfigurationFromEnvironment({
    RFXCHANGE_ENV: "staging",
    RFXCHANGE_MICROSOFT_EXPECTED_ENV: "staging",
    RFXCHANGE_MICROSOFT_TENANT_ID: "tenant.example",
    RFXCHANGE_MICROSOFT_CLIENT_ID: "client-123",
    RFXCHANGE_MICROSOFT_CLIENT_SECRET: "managed-secret-value",
    RFXCHANGE_MICROSOFT_APPROVED_SENDER: "Sender@Example.COM",
  });
  assert.equal(loaded.environment, "staging");
  assert.equal(loaded.approvedSenderAddress, "sender@example.com");
  assert.equal(loaded.timeoutMilliseconds, 15_000);

  assert.throws(
    () => microsoftGraphTransactionalEmailConfigurationFromEnvironment({
      RFXCHANGE_ENV: "production",
      RFXCHANGE_MICROSOFT_EXPECTED_ENV: "staging",
      RFXCHANGE_MICROSOFT_TENANT_ID: "tenant.example",
      RFXCHANGE_MICROSOFT_CLIENT_ID: "client-123",
      RFXCHANGE_MICROSOFT_CLIENT_SECRET: "managed-secret-value",
      RFXCHANGE_MICROSOFT_APPROVED_SENDER: "sender@example.com",
    }),
    (error) =>
      error instanceof TransactionalEmailProviderError &&
      error.code === "microsoft-email-configuration-invalid" &&
      error.retryable === false,
  );
  assert.throws(
    () => microsoftGraphTransactionalEmailConfigurationFromEnvironment({
      RFXCHANGE_ENV: "production",
    }),
    /RFXCHANGE_MICROSOFT_APPROVED_SENDER is required/,
  );
});

test("COMMS-002 reaches Graph only through COMMS-001 and records the 202 request reference", async () => {
  const calls = [];
  const provider = new MicrosoftGraphTransactionalEmailProvider(
    configuration,
    renderer,
    successfulFetch(calls),
    () => new Date(NOW),
  );
  const service = new TransactionalEmailService(provider);
  const receipt = await service.request(emailInput());

  assert.equal(calls.length, 2);
  assert.equal(
    calls[0].url,
    "https://login.microsoftonline.com/tenant.example/oauth2/v2.0/token",
  );
  const tokenBody = new URLSearchParams(calls[0].init.body);
  assert.equal(tokenBody.get("grant_type"), "client_credentials");
  assert.equal(tokenBody.get("scope"), "https://graph.microsoft.com/.default");
  assert.equal(tokenBody.get("client_secret"), "secret-never-log");

  assert.equal(
    calls[1].url,
    "https://graph.microsoft.com/v1.0/users/approved-sender%40example.com/sendMail",
  );
  assert.equal(calls[1].init.headers.authorization, "Bearer opaque-access-token");
  assert.equal(calls[1].init.headers["client-request-id"], "correlation-message-001");
  const graphBody = JSON.parse(calls[1].init.body);
  assert.equal(graphBody.message.subject, "Controlled adapter test");
  assert.equal(graphBody.message.body.contentType, "Text");
  assert.equal(graphBody.message.toRecipients[0].emailAddress.address, "recipient@example.test");
  assert.deepEqual(
    graphBody.message.internetMessageHeaders.map(({ name }) => name),
    ["x-rfxchange-message-id", "x-rfxchange-correlation-id"],
  );
  assert.equal(JSON.stringify(graphBody).includes("secret-never-log"), false);

  assert.deepEqual(
    {
      status: receipt.status,
      providerKey: receipt.providerKey,
      externalReference: receipt.externalReference,
      diagnosticCode: receipt.diagnosticCode,
    },
    {
      status: "accepted",
      providerKey: "microsoft-graph",
      externalReference: "graph-request-accepted-1",
      diagnosticCode: "microsoft-graph-accepted",
    },
  );

  await service.request(emailInput("message-002"));
  assert.equal(
    calls.filter(({ url }) => url.includes("/oauth2/v2.0/token")).length,
    1,
    "valid application tokens should be reused",
  );
});

test("COMMS-002 classifies Graph throttling and permanent failures without leaking responses", async () => {
  for (const scenario of [
    {
      status: 429,
      providerCode: "TooManyRequests",
      expectedRetryable: true,
      expectedRetryAfter: 17,
    },
    {
      status: 403,
      providerCode: "ErrorAccessDenied",
      expectedRetryable: false,
      expectedRetryAfter: null,
    },
  ]) {
    const fetchImplementation = async (input) => {
      if (String(input).includes("/oauth2/v2.0/token")) {
        return new Response(JSON.stringify({
          token_type: "Bearer",
          expires_in: 3600,
          access_token: "opaque-access-token",
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({
        error: {
          code: scenario.providerCode,
          message: "provider details must not cross the adapter",
        },
      }), {
        status: scenario.status,
        headers: {
          "content-type": "application/json",
          "request-id": `failure-${scenario.status}`,
          ...(scenario.expectedRetryAfter === null
            ? {}
            : { "retry-after": String(scenario.expectedRetryAfter) }),
        },
      });
    };
    const service = new TransactionalEmailService(
      new MicrosoftGraphTransactionalEmailProvider(
        configuration,
        renderer,
        fetchImplementation,
        () => new Date(NOW),
      ),
    );
    await assert.rejects(
      () => service.request(emailInput(`message-${scenario.status}`)),
      (error) => {
        assert.equal(error instanceof TransactionalEmailProviderError, true);
        assert.equal(error.retryable, scenario.expectedRetryable);
        assert.equal(error.deliveryOutcome, "known-failure");
        assert.equal(error.externalReference, `failure-${scenario.status}`);
        assert.equal(error.retryAfterSeconds, scenario.expectedRetryAfter);
        assert.match(error.code, new RegExp(scenario.providerCode.toLowerCase()));
        assert.equal(error.message.includes("provider details"), false);
        return true;
      },
    );
  }
});

test("COMMS-002 distinguishes known pre-dispatch failure from an unknown Graph dispatch outcome", async () => {
  const identityUnavailable = new TransactionalEmailService(
    new MicrosoftGraphTransactionalEmailProvider(
      configuration,
      renderer,
      async () => { throw new Error("identity transport unavailable"); },
      () => new Date(NOW),
    ),
  );
  await assert.rejects(
    () => identityUnavailable.request(emailInput("message-identity-unavailable")),
    (error) => {
      assert.equal(error instanceof TransactionalEmailProviderError, true);
      assert.equal(error.code, "microsoft-identity-unavailable");
      assert.equal(error.retryable, true);
      assert.equal(error.deliveryOutcome, "known-failure");
      return true;
    },
  );

  let callCount = 0;
  const graphOutcomeUnknown = new TransactionalEmailService(
    new MicrosoftGraphTransactionalEmailProvider(
      configuration,
      renderer,
      async () => {
        callCount += 1;
        if (callCount === 1) {
          return new Response(JSON.stringify({
            token_type: "Bearer",
            expires_in: 3600,
            access_token: "opaque-access-token",
          }), { status: 200, headers: { "content-type": "application/json" } });
        }
        throw new Error("response lost after dispatch");
      },
      () => new Date(NOW),
    ),
  );
  await assert.rejects(
    () => graphOutcomeUnknown.request(emailInput("message-graph-outcome-unknown")),
    (error) => {
      assert.equal(error instanceof TransactionalEmailProviderError, true);
      assert.equal(error.code, "microsoft-graph-unavailable");
      assert.equal(error.retryable, false);
      assert.equal(error.deliveryOutcome, "unknown");
      return true;
    },
  );
});

test("COMMS-002 delivery composes with INF-007 response recording and retry classification", async () => {
  const runtime = createFunctionsRuntimeContext({
    environment: "development",
    projectId: "demo-rfxchange",
    emulator: true,
    region: "us-east1",
  });
  const request = createBackgroundJobRequest({
    jobName: "notification.transactional-email",
    category: "notification",
    idempotencyKey: "email-message-001",
    payloadFingerprint: backgroundJobPayloadFingerprint({ messageId: "message-001" }),
    correlationId: "correlation-message-001",
    environment: runtime.environment,
    projectId: runtime.projectId,
    requestedAt: NOW,
  });
  const calls = [];
  const successes = [];
  const failures = [];
  const store = {
    async claim() {
      return {
        kind: "claimed",
        claim: { jobId: "email-job-001", attemptNumber: 1, maxAttempts: 3 },
      };
    },
    async completeSuccess(input) {
      successes.push(input);
    },
    async completeFailure(input) {
      failures.push(input);
      return {
        status: input.retryable ? "retryable-failure" : "terminal-failure",
        nextAttemptAt: input.retryable ? "2026-07-30T16:00:10.000Z" : null,
      };
    },
  };
  const service = new TransactionalEmailService(
    new MicrosoftGraphTransactionalEmailProvider(
      configuration,
      renderer,
      successfulFetch(calls),
      () => new Date(NOW),
    ),
  );
  const result = await executeBackgroundJob({
    request,
    runtime,
    store,
    now: NOW,
    handler: transactionalEmailBackgroundJobHandler(
      () => service.request(emailInput()),
    ),
  });

  assert.equal(result.outcome, "succeeded");
  assert.equal(successes.length, 1);
  assert.deepEqual(successes[0].metadata, {
    deliveryStatus: "accepted",
    providerKey: "microsoft-graph",
    providerReference: "graph-request-accepted-1",
    diagnosticCode: "microsoft-graph-accepted",
  });
  assert.equal(failures.length, 0);

  const throttledHandler = transactionalEmailBackgroundJobHandler(async () => {
    throw new TransactionalEmailProviderError({
      code: "microsoft-graph-toomanyrequests",
      message: "Throttled.",
      retryable: true,
      deliveryOutcome: "known-failure",
      providerKey: "microsoft-graph",
    });
  });
  const retry = await executeBackgroundJob({
    request: createBackgroundJobRequest({
      ...request,
      idempotencyKey: "email-message-002",
      payloadFingerprint: backgroundJobPayloadFingerprint({ messageId: "message-002" }),
    }),
    runtime,
    store,
    now: NOW,
    handler: throttledHandler,
  });
  assert.equal(retry.outcome, "retry-scheduled");
  assert.equal(failures.at(-1).retryable, true);
  assert.match(retry.errorCode, /microsoft-graph-toomanyrequests/);
});
