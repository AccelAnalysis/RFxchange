import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("action projection preserves handler candidates through permission refresh and binds selected Opportunity actions", () => {
  const registry = read("src/application/participant/exchange-room-actions.ts");
  const controller = read("src/components/participant/ExchangeRoomActionController.tsx");
  const opportunity = read("src/components/rfx/OpportunityDiscoveryWorkspace.tsx");
  assert.match(registry, /handlerCandidate: ExchangeRoomActionHandler \| null/);
  assert.match(registry, /externalHandler: "opportunity-assessment"/);
  assert.match(registry, /externalHandler: "opportunity-watch"/);
  assert.match(controller, /action\.handlerCandidate/);
  assert.match(controller, /onActionIntent/);
  assert.match(opportunity, /currentOpportunityReference: selected\?\.reference \?\? null/);
  assert.match(opportunity, /currentOpportunityReturnTo: queryHref\(result, selected\?\.reference \?\? null\)/);
  assert.match(registry, /safeOpportunityReturnTo/);
  assert.match(opportunity, /<ExchangeRoomActionController/);
  assert.match(opportunity, /opportunity-watch/);
});


test("domain-owned action projections preserve permission-gated handler candidates", () => {
  const capabilities = read("src/application/organizations/capabilities-exchange.ts");
  const resources = read("src/application/resource-network/mobile-resource-exchange.ts");
  assert.match(capabilities, /let handlerCandidate: ExchangeRoomActionProjection\["handlerCandidate"\] = null/);
  assert.match(capabilities, /resolvedHandler = authorized \? handlerCandidate : null/);
  assert.match(capabilities, /disabledReason,[\s\S]*handlerCandidate,[\s\S]*resolvedHandler/);
  assert.match(resources, /const handlerCandidate: ExchangeRoomActionProjection\["handlerCandidate"\]/);
  assert.match(resources, /resolvedHandler: reason === null \? handlerCandidate : null/);
});
