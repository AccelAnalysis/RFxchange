import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const model = await readFile(new URL("../src/domain/commercial/model.ts", import.meta.url), "utf8");
const provider = await readFile(new URL("../src/domain/commercial/payment-provider.ts", import.meta.url), "utf8");
const application = await readFile(new URL("../src/application/commercial/organization-commercial-account.ts", import.meta.url), "utf8");

for (const required of [
  "OrganizationCommercialAccount",
  "organizationId",
  "planKey",
  "subscription",
  "entitlementKeys",
  "providerReferences",
  "PaymentProviderReference",
]) {
  assert.ok(model.includes(required), `ARC-010/COM-038 commercial model is missing ${required}.`);
}

assert.ok(provider.includes("interface PaymentProvider"), "COM-038 must define a provider-neutral payment port.");
assert.ok(provider.includes("ensureCustomer"), "COM-038 payment port must support customer provisioning.");
assert.ok(provider.includes("beginSubscriptionCheckout"), "COM-038 payment port must support subscription checkout initiation.");
assert.ok(provider.includes("createCustomerPortalSession"), "COM-038 payment port must support customer portal initiation.");
assert.ok(application.includes("OrganizationCommercialAccountService"), "COM-038 must expose an application service over the provider port.");

for (const source of [model, provider, application]) {
  const lower = source.toLowerCase();
  for (const forbidden of ["stripe", "@stripe", "firebase", "checkout.session", "subscriptionobject", "customerobject"]) {
    assert.equal(lower.includes(forbidden), false, `Commercial domain/application code must not contain provider-specific dependency ${forbidden}.`);
  }
}

assert.equal(/userId\s*:/.test(model), false, "ARC-010 must not assign commercial state to an individual user.");
assert.equal(/membershipId\s*:/.test(model), false, "ARC-010 must not assign commercial state to an individual membership.");

console.log("ARC-010 / COM-038 organization commercial state and payment provider boundary validated.");
