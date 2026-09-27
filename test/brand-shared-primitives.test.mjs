import assert from "node:assert/strict";
import test from "node:test";
import { assertAuthorityGatedVisualInput } from "../src/components/ui/object-contracts.ts";

const node = { objectType: "organization-node", organizationId: "org-one", label: "Example", relationship: "permitted", position: { longitude: -76.3, latitude: 36.8, precision: "approximate" }, authority: { kind: "organization-projection", recordId: "record-one", projectionVersion: 1, observedAt: "2026-09-27T12:00:00Z" } };
test("geographic visuals require a source record, valid version and observed time", () => {
  assert.doesNotThrow(() => assertAuthorityGatedVisualInput(node));
  for (const authority of [{ ...node.authority, recordId: " " }, { ...node.authority, projectionVersion: 0 }, { ...node.authority, observedAt: "invalid" }]) {
    assert.throws(() => assertAuthorityGatedVisualInput({ ...node, authority }));
  }
});
test("geographic visual positions reject out-of-range coordinates", () => {
  for (const position of [{ ...node.position, longitude: 181 }, { ...node.position, latitude: -91 }]) {
    assert.throws(() => assertAuthorityGatedVisualInput({ ...node, position }));
  }
});
