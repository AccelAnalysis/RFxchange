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
  Object.freeze({ name: "marketing-pages", directory: path.join(messageDirectory, "marketing-pages") }),
  Object.freeze({ name: "network", directory: path.join(messageDirectory, "network") }),
  Object.freeze({ name: "market-profile", directory: path.join(messageDirectory, "market-profile") }),
  Object.freeze({ name: "network-education", directory: path.join(messageDirectory, "network-education") }),
  Object.freeze({ name: "recovery", directory: path.join(messageDirectory, "recovery") }),
  Object.freeze({ name: "participant-navigation", directory: path.join(messageDirectory, "participant-navigation") }),
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeCatalog(namespaceName, catalog) {
  if (
    namespaceName !== "base"
    || catalog?.marketing?.home
    || !catalog?.home
  ) {
    return catalog;
  }
  const { home, ...rest } = catalog;
  return Object.freeze({
    ...rest,
    marketing: Object.freeze({
      ...catalog.marketing,
      home,
    }),
  });
}

function collectShape(value, prefix = "") {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectShape(entry, `${prefix}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) =>
      collectShape(entry, prefix ? `${prefix}.${key}` : key),
    );
  }
  return [{ path: prefix, type: typeof value, value }];
}

function normalizedShape(value) {
  return collectShape(value)
    .map(({ path: messagePath, type }) => ({ path: messagePath, type }))
    .sort((left, right) =>
      left.path.localeCompare(right.path) || left.type.localeCompare(right.type),
    );
}

const requestedNamespace = process.env.RFXCHANGE_I18N_NAMESPACE?.trim() || null;
const requestedLocale = process.env.RFXCHANGE_I18N_LOCALE?.trim() || null;
if (requestedNamespace && !catalogNamespaces.some(({ name }) => name === requestedNamespace)) {
  throw new Error(`Unknown internationalization namespace: ${requestedNamespace}`);
}
if (requestedLocale && !expectedLocales.includes(requestedLocale)) {
  throw new Error(`Unknown internationalization locale: ${requestedLocale}`);
}
const namespacesToValidate = requestedNamespace
  ? catalogNamespaces.filter(({ name }) => name === requestedNamespace)
  : catalogNamespaces;
const localesToValidate = requestedLocale ? [requestedLocale] : expectedLocales;

for (const namespace of namespacesToValidate) {
  for (const locale of expectedLocales) {
    const filePath = path.join(namespace.directory, `${locale}.json`);
    assert.ok(fs.existsSync(filePath), `Missing ${namespace.name} locale catalog: ${locale}`);
  }

  const reference = normalizeCatalog(
    namespace.name,
    readJson(path.join(namespace.directory, `${referenceLocale}.json`)),
  );
  const referenceShape = normalizedShape(reference);

  for (const locale of localesToValidate) {
    const catalog = normalizeCatalog(
      namespace.name,
      readJson(path.join(namespace.directory, `${locale}.json`)),
    );
    const catalogShape = collectShape(catalog);
    assert.deepEqual(
      normalizedShape(catalog),
      referenceShape,
      `${namespace.name}:${locale} must have the same message paths and value types as ${referenceLocale}`,
    );
    for (const entry of catalogShape) {
      if (entry.type === "string") {
        assert.ok(entry.value.trim().length > 0, `${namespace.name}:${locale}:${entry.path} must not be empty`);
      }
    }
  }
}

const config = fs.readFileSync(path.join(root, "src", "i18n", "config.ts"), "utf8");
for (const locale of expectedLocales) {
  assert.match(config, new RegExp(`[\\\"']${locale}[\\\"']`), `Config must include ${locale}`);
}

const dictionary = fs.readFileSync(path.join(root, "src", "i18n", "get-dictionary.ts"), "utf8");
assert.match(dictionary, /marketingPages/, "Resolved dictionaries must include the public marketing-pages namespace");
assert.match(dictionary, /networkWorkspace/, "Resolved dictionaries must include the Network workspace namespace");
assert.match(dictionary, /marketProfile/, "Resolved dictionaries must include the market-profile namespace");
assert.match(dictionary, /networkEducation/, "Resolved dictionaries must include the persistent Network education namespace");
assert.match(dictionary, /recovery/, "Resolved dictionaries must include the shared recovery and access-resolution namespace");
assert.match(dictionary, /participantNavigation/, "Resolved dictionaries must include the participant-navigation namespace");
assert.match(dictionary, /applyParticipantLanguageFirewall/, "Resolved dictionaries must pass through the participant-language firewall");
assert.match(dictionary, /normalizeBaseCatalog/, "Resolved dictionaries must normalize the legacy marketing-home locale structure");

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

console.log(
  `Internationalization foundation validated${requestedNamespace ? ` for ${requestedNamespace}` : ""}${requestedLocale ? `:${requestedLocale}` : ""}.`,
);
