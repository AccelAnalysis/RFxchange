import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveFoundingCheckoutReleaseDecision } from "../src/infrastructure/commercial/founding-release-policy.ts";

const checkoutRoute = await readFile(new URL("../app/api/commercial/founding/checkout/route.ts", import.meta.url), "utf8");
const statusRoute = await readFile(new URL("../app/api/commercial/founding/status/route.ts", import.meta.url), "utf8");
const runtime = await readFile(new URL("../src/infrastructure/commercial/founding-runtime.ts", import.meta.url), "utf8");
const provider = await readFile(new URL("../src/infrastructure/commercial/stripe-payment-provider.ts", import.meta.url), "utf8");
const component = await readFile(new URL("../src/components/commercial/FoundingMembershipCard.tsx", import.meta.url), "utf8");
const foundingContinuation = await readFile(new URL("../src/components/acquisition/FoundingAcquisitionContinuation.tsx", import.meta.url), "utf8");
const publicFoundingPage = await readFile(new URL("../app/founding/page.tsx", import.meta.url), "utf8");
const functionsWebhook = await readFile(new URL("../functions/src/market-ready-founding-commerce-functions.ts", import.meta.url), "utf8");
const functionsStripe = await readFile(new URL("../functions/src/runtime/market-ready-founding-commerce-stripe.ts", import.meta.url), "utf8");
const functionsReconcile = await readFile(new URL("../functions/src/application/market-ready-founding-commerce-reconcile.ts", import.meta.url), "utf8");

const localeNames = ["en-US", "es", "fr", "it", "de"];
const localeMessages = await Promise.all(localeNames.map(async (locale) => JSON.parse(await readFile(new URL(`../src/i18n/messages/market-ready-founding-commerce/${locale}.json`, import.meta.url), "utf8"))));

test("checkout release policy defaults closed and binds proof organization server-side", () => {
  assert.deepEqual(resolveFoundingCheckoutReleaseDecision("org-a", { mode: undefined, proofOrganizationId: undefined }), { allowed: false, reason: "checkout-closed" });
  assert.deepEqual(resolveFoundingCheckoutReleaseDecision("org-a", { mode: "closed", proofOrganizationId: "org-a" }), { allowed: false, reason: "checkout-closed" });
  assert.deepEqual(resolveFoundingCheckoutReleaseDecision("org-a", { mode: "proof", proofOrganizationId: "org-b" }), { allowed: false, reason: "proof-organization-only" });
  assert.deepEqual(resolveFoundingCheckoutReleaseDecision("org-a", { mode: "proof", proofOrganizationId: "org-a" }), { allowed: true, reason: "available" });
  assert.deepEqual(resolveFoundingCheckoutReleaseDecision("org-a", { mode: "open", proofOrganizationId: undefined }), { allowed: true, reason: "available" });
  assert.deepEqual(resolveFoundingCheckoutReleaseDecision("org-a", { mode: "invalid", proofOrganizationId: "org-a" }), { allowed: false, reason: "release-configuration-invalid" });
});

test("browser cannot supply commercial authority or payment terms", () => {
  assert.equal(checkoutRoute.includes("request.json"), false);
  for (const forbidden of ["organizationId", "priceId", "amount", "currency", "interval", "billingEmail", "successUrl", "cancelUrl", "paidState"]) {
    assert.equal(checkoutRoute.includes(`body.${forbidden}`), false, `Checkout route must not accept ${forbidden} from browser state.`);
  }
  assert.ok(checkoutRoute.includes("RFXCHANGE_SESSION_COOKIE_NAME"));
  assert.ok(checkoutRoute.includes("resolveFoundingOrganizationContext"));
  assert.ok(checkoutRoute.includes("RFXCHANGE_PUBLIC_ORIGIN"));
  assert.ok(runtime.includes("resolveFoundingCheckoutReleaseDecision"));
  const beginCheckout = runtime.slice(runtime.indexOf("export async function beginFoundingCheckout"));
  assert.ok(beginCheckout.indexOf("assertRelease(organizationId)") >= 0, "checkout must evaluate the release policy");
  assert.ok(beginCheckout.indexOf("assertRelease(organizationId)") < beginCheckout.indexOf("reserveFoundingCheckout"), "release policy must be evaluated before capacity/provider mutation");
  assert.ok(runtime.includes('organizationPermission("billing.manage")'));
  assert.ok(beginCheckout.includes('planKey: "founding"'), "server runtime must bind the approved Founding plan");
  assert.ok(provider.includes('String(request.planKey) !== "founding"'), "Stripe provider must reject any non-Founding plan");
  assert.ok(provider.includes('"line_items[0][price]": config.priceId'), "Stripe provider must use the server-configured approved Price");
  assert.ok(provider.includes('"line_items[0][quantity]": 1'), "Stripe provider must bind quantity to one subscription");
});

test("post-value Founding continuation reaches commerce while public acquisition remains acquisition-oriented", () => {
  assert.match(foundingContinuation, /<Link href="\/commercial\/founding">/);
  assert.match(publicFoundingPage, /const foundingActivationHref = "\/acquisition\/founding"/);
  assert.equal(publicFoundingPage.includes('const foundingActivationHref = "/commercial/founding"'), false);
});

test("definitive pre-session failure releases only an unattached reservation while ambiguous Checkout retains it", () => {
  assert.match(runtime, /releaseUnattachedFoundingReservation/);
  assert.match(runtime, /reservation\.checkoutSessionId \|\| reservation\.checkoutUrl/);
  assert.match(runtime, /error instanceof StripeCheckoutOutcomeUnknownError/);
  const catchBlock = runtime.slice(runtime.indexOf("} catch (error) {"), runtime.indexOf("const latest = await repository.getByOrganizationId"));
  assert.ok(catchBlock.includes("releaseUnattachedFoundingReservation"));
  assert.ok(catchBlock.includes("!(error instanceof StripeCheckoutOutcomeUnknownError)"));
  assert.match(provider, /checkoutPost: true/);
  assert.match(provider, /input\.checkoutPost && response\.status >= 500/);
  assert.match(provider, /catch \{[\s\S]*?input\.checkoutPost[\s\S]*?StripeCheckoutOutcomeUnknownError/);
});

test("webhook subscription correlation uses the trusted mode-specific Price", () => {
  assert.match(functionsReconcile, /foundingPriceIdForMode/);
  assert.match(functionsReconcile, /if \(mode === "live"\) return FOUNDING_PRICE_ID/);
  assert.match(functionsReconcile, /expectedPriceId/);
  assert.match(functionsWebhook, /foundingPriceIdForMode\([\s\S]*?RFXCHANGE_FOUNDING_STRIPE_TEST_PRICE_ID/);
  assert.match(functionsWebhook, /retrieveCurrentFoundingSubscription\([\s\S]*?expectedPriceId/);
  assert.match(functionsWebhook, /providerHasNonTerminalFoundingSubscription\([\s\S]*?expectedPriceId/);
  assert.match(functionsStripe, /assertFoundingSubscriptionCorrelation\(\{ snapshot, organizationId, customerId, expectedPriceId \}\)/);
  assert.equal(functionsStripe.includes("snapshot.priceId === FOUNDING_PRICE_ID"), false);
});

test("five commerce locales expose one complete participant message contract", () => {
  const expectedKeys = Object.keys(localeMessages[0]).sort();
  assert.ok(expectedKeys.length >= 30);
  for (const [index, messages] of localeMessages.entries()) {
    assert.deepEqual(Object.keys(messages).sort(), expectedKeys, `${localeNames[index]} must match the commerce locale contract`);
    for (const value of Object.values(messages)) assert.equal(typeof value === "string" && value.trim().length > 0, true);
  }
  for (const required of ["priceFallback", "capacitySummary", "becomeFounding", "preparingCheckout", "billingAuthorityRequired", "capacityFull", "activeTitle", "delinquent", "suspended", "canceled", "returnExchange", "checkoutClosed", "proofOrganizationOnly"]) {
    assert.ok(expectedKeys.includes(required), `commerce locale contract missing ${required}`);
  }
});

test("browser return and Checkout completion cannot assert paid recognition", () => {
  assert.equal(component.includes("checkout=return"), false);
  assert.equal(component.includes("foundingRecognition: true"), false);
  assert.equal(statusRoute.includes("safeCommercialStatus"), true);
  assert.equal(runtime.includes("founding.recognition") && runtime.includes('["active", "trialing"]'), true);
});

test("commerce sources do not persist or expose provider secrets or card data", () => {
  const sources = [checkoutRoute, statusRoute, runtime, provider, component, functionsWebhook, functionsStripe].join("\n");
  for (const forbidden of ["card_number", "cardNumber", "cvc", "cvv", "STRIPE_SECRET_KEY=", "WEBHOOK_SECRET="]) {
    assert.equal(sources.includes(forbidden), false, `commercial source must not contain ${forbidden}`);
  }
});