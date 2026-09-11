import assert from "node:assert/strict";
import test from "node:test";
import { marketingCampaignReference, marketingReturnPath } from "../src/application/acquisition/marketing-entry.ts";

test("Marketing attribution accepts bounded campaign names without treating URLs or arbitrary input as authority", () => {
  assert.equal(marketingCampaignReference("  regional-launch_2026:partner  "), "regional-launch_2026:partner");
  for (const value of [null, "", "https://example.com", "campaign\nname", "../claim", "x".repeat(192), "<script>"]) {
    assert.equal(marketingCampaignReference(value), null);
  }
});

test("Marketing return destinations stay on participant routes after URL normalization", () => {
  assert.equal(marketingReturnPath("/opportunities?scope=local"), "/opportunities?scope=local");
  for (const value of [null, "https://elsewhere.example", "//elsewhere.example", "/\\elsewhere.example", "/admin", "/join/../admin", "/join/%2e%2e/admin", "/signin", "/acquisition/entry", "/account\n/elsewhere"]) {
    assert.equal(marketingReturnPath(value), null, String(value));
  }
});
