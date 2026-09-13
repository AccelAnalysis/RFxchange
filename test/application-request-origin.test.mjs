import assert from "node:assert/strict";
import test from "node:test";
import { applicationOrigins } from "../src/application/platform/application-origins.ts";
import { isApplicationRequestOrigin } from "../src/infrastructure/http/application-request-origin.ts";

test("hosted commands accept only their own deployed browser origin despite an internal request URL", t => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  t.after(() => { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; });
  for (const app of ["admin", "exchange"]) {
    const request = origin => new Request("http://0.0.0.0:8080/api/command", {
      headers: origin === undefined ? {} : { origin },
    });
    assert.equal(isApplicationRequestOrigin(request(applicationOrigins[app]), app), true);
    for (const origin of [undefined, "null", "http://0.0.0.0:8080", "http://localhost:8080",
      "https://attacker.example", applicationOrigins.marketing,
      applicationOrigins[app === "admin" ? "exchange" : "admin"],
      applicationOrigins[app] + "/", applicationOrigins[app] + ".attacker.example",
      applicationOrigins[app].replace("https:", "http:"), applicationOrigins[app] + ":8443",
      applicationOrigins[app] + ", https://attacker.example"]) {
      assert.equal(isApplicationRequestOrigin(request(origin), app), false, `${app}: ${origin}`);
    }
    const forged = new Request("https://attacker.example/api/command", { headers: {
      origin: "https://attacker.example", host: "attacker.example",
      "x-forwarded-host": new URL(applicationOrigins[app]).host,
      "x-forwarded-proto": "https", forwarded: `host=${new URL(applicationOrigins[app]).host};proto=https`,
    } });
    assert.equal(isApplicationRequestOrigin(forged, app), false);
  }
});

test("local development requires an exact loopback origin and never authorizes arbitrary same-host input", t => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  t.after(() => { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; });
  for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
    const url = `http://${host}:3013`;
    assert.equal(isApplicationRequestOrigin(new Request(url + "/api", { headers: { origin: url } }), "admin"), true);
    assert.equal(isApplicationRequestOrigin(new Request(url + "/api", { headers: { origin: "http://localhost:4000" } }), "admin"), false);
  }
  assert.equal(isApplicationRequestOrigin(new Request("https://attacker.example/api", { headers: { origin: "https://attacker.example" } }), "admin"), false);
});
