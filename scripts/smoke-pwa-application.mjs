import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const origin = process.env.RFXCHANGE_PWA_SMOKE_ORIGIN || "http://127.0.0.1:3421";
const server = process.env.RFXCHANGE_PWA_SMOKE_ORIGIN ? null : spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3421"],
  { stdio: "ignore" },
);
const digest = (data) => createHash("sha256").update(data).digest("hex");
const get = (path, options = {}) => fetch(new URL(path, origin), {
  signal: AbortSignal.timeout(20_000), ...options,
});

try {
  if (server) {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try { await get("/manifest.webmanifest"); break; }
      catch {
        if (attempt === 39 || server.exitCode !== null) throw new Error("PWA smoke server did not start");
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  }

  const response = await get("/manifest.webmanifest");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/manifest\+json/);
  const manifest = await response.json();
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.start_url, "/geography/canvas");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose.includes("maskable")));

  const signin = await get("/signin");
  assert.equal(signin.status, 200);
  const html = await signin.text();
  for (const value of [
    'rel="manifest" href="/manifest.webmanifest"',
    'name="mobile-web-app-capable" content="yes"',
    'name="apple-mobile-web-app-title" content="RFxchange"',
    'rel="apple-touch-icon"',
  ]) assert.ok(html.includes(value), `Missing installation metadata: ${value}`);

  const linkedIcons = [...html.matchAll(/<link\b[^>]*rel="(?:icon|apple-touch-icon)"[^>]*>/g)]
    .map(([tag]) => ({ src: tag.match(/href="([^"]+)"/)?.[1], sizes: tag.match(/sizes="([^"]+)"/)?.[1] }));
  for (const icon of [...manifest.icons, ...linkedIcons]) {
    assert.ok(icon.src, "Icon link must have a URL");
    const url = new URL(icon.src, origin);
    assert.equal(url.origin, new URL(origin).origin);
    const asset = await get(icon.src);
    assert.equal(asset.status, 200, `Icon unavailable: ${icon.src}`);
    assert.match(asset.headers.get("content-type"), /image\/png/);
    const bytes = Buffer.from(await asset.arrayBuffer());
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`, icon.sizes);
    const source = await readFile(new URL(`../app${url.pathname}`, import.meta.url));
    assert.equal(digest(bytes), digest(source), `Icon differs from source: ${icon.src}`);
  }

  const launch = await get(manifest.start_url, { redirect: "manual" });
  assert.equal(launch.status, 307);
  assert.equal(launch.headers.get("location"), "/signin?returnTo=%2Fgeography%2Fcanvas");
  console.log("PWA HTTP smoke passed: standalone manifest, Home Screen metadata, compiled PNG assets, and protected launch");
} finally {
  server?.kill("SIGTERM");
}
