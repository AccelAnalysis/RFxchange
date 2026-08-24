import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { rewriteParticipantText } from "../src/i18n/participant-language-firewall.ts";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const messagesRoot = join(repoRoot, "src", "i18n", "messages");
const locales = new Set(["en-US", "es", "fr", "it", "de"]);
const write = process.argv.includes("--write");

async function walk(directory, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path, output);
    else if (entry.isFile() && entry.name.endsWith(".json")) output.push(path);
  }
  return output;
}

function rewriteValue(value, locale) {
  if (typeof value === "string") return rewriteParticipantText(value, locale);
  if (Array.isArray(value)) return value.map((item) => rewriteValue(item, locale));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, rewriteValue(item, locale)]),
    );
  }
  return value;
}

const changed = [];
for (const path of await walk(messagesRoot)) {
  const locale = path.split("/").at(-1).replace(/\.json$/, "");
  if (!locales.has(locale)) continue;

  const source = await readFile(path, "utf8");
  const parsed = JSON.parse(source);
  const rewritten = `${JSON.stringify(rewriteValue(parsed, locale), null, 2)}\n`;
  const normalizedSource = `${JSON.stringify(parsed, null, 2)}\n`;

  if (rewritten !== normalizedSource) {
    changed.push(relative(repoRoot, path));
    if (write) await writeFile(path, rewritten, "utf8");
  } else if (write && source !== normalizedSource) {
    await writeFile(path, normalizedSource, "utf8");
  }
}

if (changed.length > 0) {
  console.log(`${write ? "Rewrote" : "Would rewrite"} ${changed.length} participant message source(s):`);
  for (const path of changed) console.log(`- ${path}`);
  if (!write) process.exitCode = 1;
} else {
  console.log("Participant message sources are already source-clean.");
}
