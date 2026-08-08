import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const messageDirectory = path.join(root, "src", "i18n", "messages");
const expectedLocales = ["en-US", "es", "fr", "it", "de"];
const referenceLocale = "en-US";
const catalogNamespaces = [
  Object.freeze({ name: "base", directory: messageDirectory }),
  Object.freeze({ name: "network", directory: path.join(messageDirectory, "network") }),
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectShape(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectShape(entry, `${prefix}[${index}]`),
    );
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) =>
      collectShape(entry, prefix ? `${prefix}.${key}` : key),
    );
  }

  return [{ path: prefix, type: typeof value, value }];
}

for (const namespace of catalogNamespaces) {
  for (const locale of expectedLocales) {
    const filePath = path.join(namespace.directory, `${locale}.json`);
    assert.ok(
      fs.existsSync(filePath),
      `Missing ${namespace.name} locale catalog: ${locale}`,
    );
  }

  const reference = readJson(path.join(namespace.directory, `${referenceLocale}.json`));
  const referenceShape = collectShape(reference).map(({ path: messagePath, type }) => ({
    path: messagePath,
    type,
  }));

  for (const locale of expectedLocales) {
    const catalog = readJson(path.join(namespace.directory, `${locale}.json`));
    const catalogShape = collectShape(catalog);

    assert.deepEqual(
      catalogShape.map(({ path: messagePath, type }) => ({ path: messagePath, type })),
      referenceShape,
      `${namespace.name}:${locale} must have the same message shape as ${referenceLocale}`,
    );

    for (const entry of catalogShape) {
      if (entry.type === "string") {
        assert.ok(
          entry.value.trim().length > 0,
          `${namespace.name}:${locale}:${entry.path} must not be empty`,
        );
      }
    }
  }
}

const config = fs.readFileSync(path.join(root, "src", "i18n", "config.ts"), "utf8");
for (const locale of expectedLocales) {
  assert.match(config, new RegExp(`[\"']${locale}[\"']`), `Config must include ${locale}`);
}

const dictionary = fs.readFileSync(path.join(root, "src", "i18n", "get-dictionary.ts"), "utf8");
assert.match(
  dictionary,
  /networkWorkspace/,
  "Resolved dictionaries must include the Network workspace namespace",
);

const layout = fs.readFileSync(path.join(root, "app", "layout.tsx"), "utf8");
assert.match(layout, /<html lang=\{locale\}/, "Root layout must set the resolved locale on html");
assert.match(layout, /I18nProvider/, "Root layout must provide the locale dictionary");

const boundary = fs.readFileSync(
  path.join(root, "docs", "architecture", "INTERNATIONALIZATION_FOUNDATION.md"),
  "utf8",
);
assert.match(
  boundary,
  /Participant-authored content is never translated/,
  "The participant-content translation exclusion must remain canonical",
);
assert.match(
  boundary,
  /Uploaded documents are never translated/,
  "The uploaded-document translation exclusion must remain canonical",
);

console.log("Internationalization foundation validated.");
