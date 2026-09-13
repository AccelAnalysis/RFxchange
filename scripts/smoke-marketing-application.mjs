import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

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
const publicExchangeOrigin = "https://rfxchange--rfxchange.us-east4.hosted.app";
const visibleText = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ");
try {
  await start(".", 3015);
  await start("apps/marketing", 3014, { NEXT_PUBLIC_RFXCHANGE_EXCHANGE_ORIGIN: "https://exchange.example" });
  for (const route of ["/account/communications", "/organization-profile/public-data"]) {
    const response = await fetch(exchange + route, { redirect: "manual" });
    assert.equal(response.status, 307, `${route} requires authentication`);
    assert.match(response.headers.get("location"), /^\/signin\?returnTo=/);
  }
  for (const route of ["/api/communications/preferences", "/api/organization-enrichment/public-data?organizationId=untrusted"]) {
    for (const method of ["GET", "POST"]) {
      const response = await fetch(exchange + route, { method, headers: { origin: publicExchangeOrigin, "content-type": "application/json" }, ...(method === "POST" ? { body: JSON.stringify({ commandId: "untrusted-command" }) } : {}) });
      assert.ok([401, 403].includes(response.status), `${method} ${route} denies anonymous access even with a valid Origin`);
      assert.notEqual((await response.json()).error, "Request origin required.", "Public origin passes CSRF behind an internal listener; session checks remain required");
    }
  }
  const anonymousCommands = [
    ["/api/organization-market-profile", { organizationId: "untrusted", commandId: "untrusted-command", action: "update-industry", input: {} }],
    ["/api/organization-enrichment", { organizationId: "untrusted", commandId: "untrusted-command", action: "upsert-credential", input: {} }],
    ["/api/ai/amacs/interpret", { organizationId: "untrusted", purpose: "capabilities", sources: [] }],
    ["/api/ai/amacs/disposition", { organizationId: "untrusted", recordId: "untrusted", decision: {} }],
    ["/api/rfx-cycle/collaboration/attachment", {}],
  ];
  for (const [route, body] of anonymousCommands) {
    const response = await fetch(exchange + route, { method: "POST", headers: { origin: publicExchangeOrigin, "content-type": "application/json" }, body: JSON.stringify(body) });
    assert.equal(response.status, 401, `${route} reaches session checks behind the internal listener`);
  }
  const attachment = new FormData();
  attachment.set("commandId", "untrusted-command"); attachment.set("reference", "untrusted-reference");
  attachment.set("sectionId", "untrusted-section"); attachment.set("file", new Blob(["untrusted"], { type: "text/plain" }), "test.txt");
  assert.equal((await fetch(exchange + "/api/rfx-cycle/attachment", { method: "POST", headers: { origin: publicExchangeOrigin }, body: attachment })).status, 401);
  for (const route of [...anonymousCommands.map(([route]) => route), "/api/rfx-cycle/attachment", "/api/communications/preferences", "/api/organization-enrichment/public-data"]) {
    const response = await fetch(exchange + route, { method: "POST", headers: { origin: "https://attacker.example", "x-forwarded-host": new URL(publicExchangeOrigin).host }, body: "{}" });
    assert.equal(response.status, 403, `${route} rejects a forged forwarded host`);
    assert.match((await response.json()).error, /origin required|Same-origin request required/);
  }
  assert.equal((await fetch(exchange + "/api/internal/lifecycle", { method: "POST", headers: { authorization: "Bearer untrusted" } })).status, 403, "Unconfigured/invalid worker credentials fail closed");
  assert.ok([401, 503].includes((await fetch(exchange + "/api/communications/telnyx", { method: "POST", body: "{}" })).status), "Unconfigured/unsigned SMS callbacks fail closed");
  const unsubscribe = await fetch(exchange + "/communications/unsubscribe/" + "a".repeat(43));
  assert.equal(unsubscribe.status, 200, "Withdrawal confirmation does not require sign-in");
  assert.match(await unsubscribe.text(), /method="post"/);
  assert.equal((await fetch(exchange + "/api/communications/unsubscribe")).status, 405, "GET cannot withdraw consent");
  assert.equal((await fetch(exchange + "/api/communications/unsubscribe", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "token=invalid" })).status, 400);
  for (const locale of ["en-US", "es", "fr", "it", "de"]) {
    for (const route of ["/", "/membership", "/founding", "/help"]) {
      const response = await fetch(marketing + route, { headers: { cookie: `rfx-locale=${locale}` } });
      assert.equal(response.status, 200, `${locale} ${route}`);
      const html = await response.text();
      assert.match(html, new RegExp(`<html lang="${locale}"`));
      assert.doesNotMatch(visibleText(html), /\$\s*49|49\s*\$/);
      if (route === "/help") {
        const copy = JSON.parse(readFileSync(path.join(root, "src/i18n/messages", `${locale}.json`), "utf8")).interface.services.help;
        assert.ok(visibleText(html).includes(copy.title), `${locale} help title`);
        assert.ok(visibleText(html).includes(copy.search), `${locale} help search action`);
      }
    }
  }
  for (const route of ["/sms", "/policies/2026-07-31/terms", "/policies/2026-07-31/privacy", "/policies/2026-07-31/platform-rules", "/help", "/how-it-works", "/businesses", "/buyers", "/resource-providers", "/about", "/terms", "/privacy", "/platform-rules", "/accessibility", "/image-credits"]) {
    assert.equal((await fetch(marketing + route)).status, 200, route);
  }
  const smsPage = await (await fetch(marketing + "/sms")).text();
  assert.match(visibleText(smsPage), /not a condition of purchase/);
  assert.match(smsPage, /account\/communications/);
  assert.match(smsPage, /Reply STOP/);
  assert.match(smsPage, /\/terms/);
  assert.match(smsPage, /\/privacy/);
  assert.doesNotMatch(smsPage, /<input[^>]+checked/);
  assert.equal((await fetch(marketing + "/policies/2026-07-31/nonexistent")).status, 404);
  const currentTerms = visibleText(await (await fetch(marketing + "/terms")).text());
  const oldTerms = visibleText(await (await fetch(marketing + "/policies/2026-07-31/terms")).text());
  assert.match(currentTerms, /2026\.09\.12/);
  assert.match(currentTerms, /binding arbitration/i);
  assert.match(oldTerms, /2026\.07\.31/);
  assert.doesNotMatch(oldTerms, /binding arbitration/i);
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
  assert.deepEqual(Object.fromEntries(destination.searchParams), { intent: "signin", campaign: "regional-launch", lastCampaign: "second", locale: "fr", returnTo: "/opportunities" });
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
  assert.doesNotMatch(unsafe.headers.get("set-cookie"), /(?:^|, )rfx_marketing_campaign=/, "Existing first-touch attribution must not be overwritten");
  assert.match(unsafe.headers.get("set-cookie"), /rfx_marketing_last_campaign=second/, "Last touch is independently refreshed");
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
