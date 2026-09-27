import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ADMIN_PORTAL_SECTION_KEYS,
  IMPLEMENTED_ADMIN_RUNTIME_DESTINATION_KEYS,
} from "../src/application/admin/portal-navigation.ts";

function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

test("only truthful current admin runtimes remain registered", () => {
  assert.equal(ADMIN_PORTAL_SECTION_KEYS.length, 19);
  for (const key of ADMIN_PORTAL_SECTION_KEYS) {
    assert.ok(IMPLEMENTED_ADMIN_RUNTIME_DESTINATION_KEYS.includes(key));
  }
});
