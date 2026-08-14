import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveFoundingCheckoutReleaseDecision } from "../src/infrastructure/commercial/founding-release-policy.ts";

const checkoutRoute = await readFile(new URL("../app/api/commercial/founding/checkout/route.ts", import.meta.url), "utf8");
const statusRoute = await readFile(new URL("../app/api/commercial/founding/status/route.ts", import.meta.url), "utf8");
const runtime = await readFile(new URL("../src/infrastructure/commercial/founding-runtime.ts", import.meta.url), "utf8");
const provider = await readFile(new URL("../src/infrastructure/commercial/stripe-payment-provider.ts", import.meta.url), "utf8");
const component = await readFile(new URL("../src/components/commercial/FoundingMembershipCard.tsx", import.meta.url), "utf8");

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
  assert.ok(provider.includes('planKey: "founding"'));
  assert.ok(provider.includes("priceId: config.priceId"));
  assert.ok(provider.includes("quantity: 1"));
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
  const sources = [checkoutRoute, statusRoute, runtime, provider, component].join("\n");
  for (const forbidden of ["card_number", "cardNumber", "cvc", "cvv", "STRIPE_SECRET_KEY=", "WEBHOOK_SECRET="]) {
    assert.equal(sources.includes(forbidden), false, `commercial source must not contain ${forbidden}`);
  }
});
