import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { test } from "node:test";

import { rewriteParticipantText } from "../src/i18n/participant-language-firewall.ts";

const repoRoot = new URL("../", import.meta.url);
const messageRoot = new URL("src/i18n/messages/", repoRoot);
const supportedLocales = new Set(["en-US", "es", "fr", "it", "de"]);

async function walk(directory, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) await walk(url, output);
    else if (entry.isFile() && entry.name.endsWith(".json")) output.push(url);
  }
  return output;
}

function strings(value, path = "root", output = []) {
  if (typeof value === "string") {
    output.push({ path, value });
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => strings(item, `${path}[${index}]`, output));
    return output;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => strings(item, `${path}.${key}`, output));
  }
  return output;
}

test("localized participant message sources do not depend on runtime language rewriting", async () => {
  const violations = [];

  for (const url of await walk(messageRoot)) {
    const locale = basename(url.pathname, extname(url.pathname));
    if (!supportedLocales.has(locale)) continue;

    const catalog = JSON.parse(await readFile(url, "utf8"));
    for (const entry of strings(catalog)) {
      const rewritten = rewriteParticipantText(entry.value, locale);
      if (rewritten !== entry.value) {
        violations.push(`${url.pathname.replace(repoRoot.pathname, "")}:${entry.path}: ${JSON.stringify(entry.value)} -> ${JSON.stringify(rewritten)}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
