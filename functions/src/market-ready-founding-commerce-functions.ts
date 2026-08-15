import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

import { createBackgroundJobRequest, executeBackgroundJob, terminalBackgroundJobError } from "./application/background-jobs.js";
import { foundingPriceIdForMode } from "./application/market-ready-founding-commerce-reconcile.js";
import { functionsRuntimeContextFromEnvironment } from "./runtime/environment.js";
import { FirestoreBackgroundJobStore } from "./runtime/firestore-background-job-store.js";
import { backgroundJobPayloadFingerprint } from "./runtime/background-job-identifiers.js";
import { getFunctionsFirestore } from "./runtime/firebase-admin.js";
import {
  reconcileCurrentFoundingSubscription,
  reconcileExpiredFoundingCheckout,
  recordFoundingCheckoutCompletionWithoutRecognition,
} from "./runtime/market-ready-founding-commerce-store.js";
import {
  parseVerifiedStripeEvent,
  providerHasNonTerminalFoundingSubscription,
  retrieveCurrentFoundingSubscription,
  stripeObjectOrganizationId,
  stripeObjectReference,
} from "./runtime/market-ready-founding-commerce-stripe.js";

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const SUPPORTED_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "checkout.session.completed",
  "checkout.session.expired",
]);

function stripeMode(): "live" | "test" {
  const value = process.env.RFXCHANGE_STRIPE_MODE?.trim();
  if (value !== "live" && value !== "test") throw new Error("RFXCHANGE_STRIPE_MODE must be live or test.");
  return value;
}

function checkoutPlan(object: Readonly<Record<string, unknown>>): void {
  const metadata = object.metadata;
  if (!metadata || typeof metadata !== "object" || (metadata as Record<string, unknown>).rfxchangePlan !== "founding") {
    throw new Error("Stripe Checkout metadata does not identify Founding Membership.");
  }
}

export const marketReadyFoundingCommerceWebhook = onRequest(
  {
    invoker: "public",
    secrets: [stripeSecretKey, stripeWebhookSecret],
    timeoutSeconds: 60,
    memory: "256MiB",
  },
  async (request, response) => {
    response.set("cache-control", "no-store");
    if (request.method !== "POST") {
      response.status(405).json({ error: "method-not-allowed" });
      return;
    }

    try {
      const signature = request.get("stripe-signature");
      if (!signature) {
        response.status(400).json({ error: "signature-required" });
        return;
      }
      const rawBody = request.rawBody;
      if (!Buffer.isBuffer(rawBody)) throw new Error("Stripe webhook raw body is unavailable.");
      const mode = stripeMode();
      const expectedPriceId = foundingPriceIdForMode(
        mode,
        process.env.RFXCHANGE_FOUNDING_STRIPE_TEST_PRICE_ID,
      );
      const event = parseVerifiedStripeEvent({
        rawBody,
        signatureHeader: signature,
        webhookSecret: stripeWebhookSecret.value(),
        expectedMode: mode,
      });
      if (!SUPPORTED_EVENTS.has(event.type)) {
        response.status(200).json({ received: true, ignored: true });
        return;
      }

      const runtime = functionsRuntimeContextFromEnvironment();
      const db = getFunctionsFirestore();
      const jobs = new FirestoreBackgroundJobStore(db);
      const job = createBackgroundJobRequest({
        jobName: "webhook.founding-stripe",
        category: "webhook",
        idempotencyKey: event.id,
        payloadFingerprint: backgroundJobPayloadFingerprint({
          id: event.id,
          type: event.type,
          createdAt: event.createdAt,
          livemode: event.livemode,
        }),
        correlationId: event.id,
        environment: runtime.environment,
        projectId: runtime.projectId,
        requestedAt: event.createdAt,
        maxAttempts: 5,
        retryBackoffSeconds: 10,
        leaseSeconds: 60,
      });

      const result = await executeBackgroundJob({
        request: job,
        runtime,
        store: jobs,
        now: new Date().toISOString(),
        handler: async () => {
          if (event.type.startsWith("customer.subscription.")) {
            const subscriptionId = stripeObjectReference(event.object, "id");
            if (!subscriptionId) throw terminalBackgroundJobError("subscription-id-missing", "Stripe subscription event is missing its id.");
            const snapshot = await retrieveCurrentFoundingSubscription(
              stripeSecretKey.value(),
              subscriptionId,
              expectedPriceId,
            );
            const reconciled = await reconcileCurrentFoundingSubscription({
              db,
              eventId: event.id,
              eventType: event.type,
              eventCreatedAt: event.createdAt,
              snapshot,
            });
            return {
              organizationId: snapshot.organizationId,
              providerStatus: snapshot.status,
              recognized: reconciled.recognized,
              retainsCapacity: reconciled.retainsCapacity,
              duplicateProviderEvent: reconciled.duplicate,
            };
          }

          checkoutPlan(event.object);
          const organizationId = stripeObjectOrganizationId(event.object);
          const customerId = stripeObjectReference(event.object, "customer");
          if (!customerId) throw terminalBackgroundJobError("checkout-customer-missing", "Stripe Checkout event is missing its Customer.");

          if (event.type === "checkout.session.completed") {
            const recorded = await recordFoundingCheckoutCompletionWithoutRecognition({
              db,
              eventId: event.id,
              organizationId,
              customerId,
              eventCreatedAt: event.createdAt,
            });
            return { organizationId, recognitionGranted: false, duplicateProviderEvent: recorded.duplicate };
          }

          const hasSubscription = await providerHasNonTerminalFoundingSubscription({
            secretKey: stripeSecretKey.value(),
            customerId,
            organizationId,
            expectedPriceId,
          });
          const reconciled = await reconcileExpiredFoundingCheckout({
            db,
            eventId: event.id,
            organizationId,
            customerId,
            eventCreatedAt: event.createdAt,
            providerHasNonTerminalFoundingSubscription: hasSubscription,
          });
          return { organizationId, providerHasNonTerminalSubscription: hasSubscription, duplicateProviderEvent: reconciled.duplicate };
        },
      });

      if (result.outcome === "retry-scheduled" || result.outcome === "retry-not-ready" || result.outcome === "in-progress") {
        response.status(503).json({ received: true, outcome: result.outcome });
        return;
      }
      if (result.outcome === "terminal-failure") {
        response.status(400).json({ received: false, outcome: result.outcome, error: result.errorCode });
        return;
      }
      response.status(200).json({ received: true, outcome: result.outcome });
    } catch {
      response.status(400).json({ error: "invalid-webhook" });
    }
  },
);