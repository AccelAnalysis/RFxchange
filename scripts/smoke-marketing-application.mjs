import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const children = [];
const logs = [];
async function start(directory, port, env = {}) {
  const child = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "--port", String(port), "--hostname", "127.0.0.1"], {
    cwd: path.join(root, directory), env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${directory} startup timed out.`)), 20000);
    child.stdout.on("data", chunk => { logs.push(String(chunk)); if (String(chunk).includes("Ready")) { clearTimeout(timer); resolve(); } });
    child.stderr.on("data", chunk => logs.push(String(chunk)));
    child.once("error", reject);
    child.once("exit", code => { clearTimeout(timer); reject(new Error(`${directory} exited with ${code}.`)); });
  });
}
const marketing = "http://127.0.0.1:3014";
const exchange = "http://127.0.0.1:3015";
const visibleText = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ");
try {
  await start(".", 3015);
  await start("apps/marketing", 3014, { NEXT_PUBLIC_RFXCHANGE_EXCHANGE_ORIGIN: "https://exchange.example" });
  for (const locale of ["en-US", "es", "fr", "it", "de"]) {
    for (const route of ["/", "/membership", "/founding"]) {
      const response = await fetch(marketing + route, { headers: { cookie: `rfx-locale=${locale}` } });
      assert.equal(response.status, 200, `${locale} ${route}`);
      const html = await response.text();
      assert.match(html, new RegExp(`<html lang="${locale}"`));
      assert.doesNotMatch(visibleText(html), /\$\s*49|49\s*\$/);
    }
  }
  for (const route of ["/help", "/how-it-works", "/businesses", "/buyers", "/resource-providers", "/about", "/terms", "/privacy", "/platform-rules", "/accessibility", "/image-credits"]) {
    assert.equal((await fetch(marketing + route)).status, 200, route);
  }
  const landing = await fetch(marketing + "/?utm_campaign=regional-launch");
  assert.match(landing.headers.get("set-cookie"), /rfx_marketing_campaign=regional-launch/);
  assert.doesNotMatch(landing.headers.get("set-cookie"), /Domain=/i);
  const handoff = await fetch(marketing + "/signin?utm_campaign=second&returnTo=%2Fopportunities&token=must-not-leak", {
    redirect: "manual", headers: { cookie: "rfx_marketing_campaign=regional-launch; rfx-locale=fr; rfx_session=must-not-leak" },
  });
  assert.equal(handoff.status, 303);
  const destination = new URL(handoff.headers.get("location"));
  assert.equal(destination.origin, "https://exchange.example");
  assert.equal(destination.pathname, "/acquisition/entry");
  assert.deepEqual(Object.fromEntries(destination.searchParams), { intent: "signin", campaign: "regional-launch", locale: "fr", returnTo: "/opportunities" });
  assert.match(handoff.headers.get("cache-control"), /no-store/);
  const receiver = await fetch(exchange + destination.pathname + destination.search, { redirect: "manual" });
  assert.equal(receiver.status, 303);
  assert.match(receiver.headers.get("location"), /^\/signin(?:\?|$)/, "Receiver must redirect on the public origin, never an internal hosting listener");
  assert.equal(new URL(receiver.headers.get("location"), exchange).pathname, "/signin");
  assert.match(receiver.headers.get("set-cookie"), /rfx_marketing_campaign=regional-launch/);
  assert.match(receiver.headers.get("set-cookie"), /rfx-locale=fr/);
  assert.doesNotMatch(receiver.headers.get("set-cookie"), /Domain=/i);
  const unsafe = await fetch(exchange + "/acquisition/entry?intent=signin&returnTo=https%3A%2F%2Fevil.example&campaign=second", {
    redirect: "manual", headers: { cookie: "rfx_marketing_campaign=original" },
  });
  assert.equal(new URL(unsafe.headers.get("location"), exchange).search, "");
  assert.equal(unsafe.headers.get("set-cookie"), null, "Existing campaign attribution must not be overwritten");
  const admin = await fetch(marketing + "/admin", { redirect: "manual" });
  assert.equal(admin.status, 404, "Marketing ships no Admin route");
  const oldAdmin = await fetch(exchange + "/admin/organizations?token=must-not-leak", { redirect: "manual" });
  assert.equal(oldAdmin.status, 307);
  assert.equal(oldAdmin.headers.get("location"), "https://rfxchange-admin--rfxchange.us-east4.hosted.app/admin/organizations");
  assert.match(oldAdmin.headers.get("cache-control"), /no-store/);
  const oldPublic = await fetch(exchange + "/businesses?utm_campaign=launch&token=must-not-leak", {
    redirect: "manual", headers: { cookie: "rfx-locale=fr; rfx_session=must-not-leak" },
  });
  const publicDestination = new URL(oldPublic.headers.get("location"));
  assert.equal(publicDestination.origin, "https://rfxchange-marketing--rfxchange.us-east4.hosted.app");
  assert.deepEqual(Object.fromEntries(publicDestination.searchParams), { utm_campaign: "launch", locale: "fr" });
  const localeEntry = await fetch(marketing + "/businesses?locale=fr", { redirect: "manual" });
  assert.equal(localeEntry.status, 307);
  assert.match(localeEntry.headers.get("set-cookie"), /rfx-locale=fr/);
  assert.equal(new URL(localeEntry.headers.get("location"), marketing).search, "");
  assert.equal(new URL(localeEntry.headers.get("location"), marketing).origin, "https://rfxchange-marketing--rfxchange.us-east4.hosted.app");
  console.log("Marketing production builds: public pages, five locales, first-touch campaign, safe cross-origin handoff, Exchange receiver and no Admin surface passed.");
} catch (error) {
  console.error(logs.join(""));
  throw error;
} finally {
  for (const child of children) if (child.exitCode === null) { child.kill("SIGTERM"); await once(child, "exit"); }
}
