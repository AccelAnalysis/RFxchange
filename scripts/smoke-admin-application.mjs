import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 3013;
const origin = `http://127.0.0.1:${port}`;
const publicAdminOrigin = "https://rfxchange-admin--rfxchange.us-east4.hosted.app";
const child = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "--port", String(port), "--hostname", "127.0.0.1"], {
  cwd: path.join(root, "apps/admin"),
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Admin startup timed out.")), 20000);
    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (output.includes("Ready")) { clearTimeout(timer); resolve(); }
    });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", reject);
    child.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Admin exited with ${code}.`)); });
  });
  for (const route of ["/admin", "/admin/overview", "/admin/organizations", "/admin/audit-security", "/admin/communications/operations", "/admin/campaigns", "/admin/communications/lifecycle", "/admin/communications/help", "/admin/enrichment"]) {
    const response = await fetch(`${origin}${route}`, { redirect: "manual" });
    assert.equal(response.status, 307, `${route} requires authentication`);
    assert.match(response.headers.get("location"), /^\/signin\?returnTo=/);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
  for (const route of ["/api/admin/campaigns", "/api/admin/communication-operations", "/api/admin/lifecycle", "/api/admin/public-help", "/api/admin/public-enrichment?organizationId=untrusted"]) {
    for (const method of ["GET", "POST"]) {
      const response = await fetch(`${origin}${route}`, { method, redirect: "manual", headers: { origin: publicAdminOrigin, "content-type": "application/json" }, ...(method === "POST" ? { body: "{}" } : {}) });
      assert.equal(response.status, 403, `${method} ${route} denies anonymous configuration/data access even with a valid Origin`);
      assert.notEqual((await response.json()).error, "Request origin required.", "Public origin passes CSRF behind an internal listener but still requires authorization");
    }
  }
  for (const route of ["/api/admin/campaigns", "/api/admin/communication-operations", "/api/admin/lifecycle", "/api/admin/public-help", "/api/admin/public-enrichment"]) {
    for (const untrusted of ["https://attacker.example", "https://rfxchange--rfxchange.us-east4.hosted.app", origin]) {
      const response = await fetch(`${origin}${route}`, { method: "POST", headers: {
        origin: untrusted, "x-forwarded-host": new URL(publicAdminOrigin).host,
        "x-forwarded-proto": "https", "content-type": "application/json",
      }, body: "{}" });
      assert.equal(response.status, 403);
      assert.equal((await response.json()).error, "Request origin required.");
    }
  }
  for (const [route, method] of [["/api/admin/provider-applications", "GET"], ["/api/admin/cases/unknown/transition", "POST"]]) {
    const response = await fetch(`${origin}${route}`, { method, redirect: "manual", ...(method === "POST" ? { headers: { "content-type": "application/json" }, body: "{}" } : {}) });
    assert.ok([401, 403].includes(response.status), `${method} ${route} must deny anonymous access (got ${response.status})`);
  }
  const rejectedSession = await fetch(`${origin}/api/auth/session`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: "untrusted" }),
  });
  assert.equal(rejectedSession.status, 403, "Session exchange requires CSRF verification");
  const csrf = await fetch(`${origin}/api/auth/session`);
  assert.match(csrf.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(csrf.headers.get("set-cookie"), /Secure/i);
  assert.match(csrf.headers.get("set-cookie"), /SameSite=Strict/i);
  assert.doesNotMatch(csrf.headers.get("set-cookie"), /Domain=/i);
  const signin = await fetch(`${origin}/signin?returnTo=https%3A%2F%2Fevil.example`);
  assert.equal(signin.status, 200);
  assert.match(await signin.text(), /Sign in to administration/);
  assert.match(signin.headers.get("x-robots-tag"), /noindex/);
  console.log("Admin production build: protected pages/APIs, CSRF, host-only cookies and sign-in passed.");
} catch (error) {
  console.error(output);
  throw error;
} finally {
  if (child.exitCode === null) { child.kill("SIGTERM"); await once(child, "exit"); }
}
