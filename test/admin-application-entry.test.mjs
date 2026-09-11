import test from "node:test";
import assert from "node:assert/strict";
import { administrativeReturnPath } from "../src/application/admin/return-path.ts";
import { exchangeOrigin } from "../src/application/platform/exchange-origin.ts";

test("Admin sign-in preserves scoped internal destinations without trusting external or normalized escape paths", () => {
  assert.equal(administrativeReturnPath("/admin/organizations?scope=GEOGRAPHY%3Alocal"), "/admin/organizations?scope=GEOGRAPHY%3Alocal");
  for (const value of [undefined, "https://evil.example/admin", "//evil.example/admin", "/\\evil.example/admin", "/admin/../../signin", "/administer", "/signin", "/admin\n/path"]) {
    assert.equal(administrativeReturnPath(value), "/admin", String(value));
  }
});

test("deployment origin refuses credentials, redirects and non-HTTPS production destinations", () => {
  assert.equal(exchangeOrigin("https://exchange.example"), "https://exchange.example");
  for (const value of ["https://user:password@exchange.example", "https://exchange.example/other", "https://exchange.example/?returnTo=elsewhere", "javascript:alert(1)", "http://exchange.example"]) {
    assert.throws(() => exchangeOrigin(value));
  }
});
