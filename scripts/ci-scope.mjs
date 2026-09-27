import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { FIREBASE_SMOKE_SCRIPTS } from "./run-firebase-smoke.mjs";

const root = process.cwd();
const graph = new Map();
function resolveImport(from, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
  let target = specifier.startsWith("@/") ? specifier.slice(2) : path.join(path.dirname(from), specifier);
  target = target.replace(/^functions\/lib\//, "functions/src/");
  const stem = target.replace(/\.[mc]?js$/, "");
  return (
    [target, `${stem}.ts`, `${stem}.tsx`, `${target}.ts`, `${target}.tsx`, `${target}.mjs`, `${target}/index.ts`].find(
      (file) => existsSync(path.join(root, file)),
    ) ?? target
  );
}
function dependencies(file, found = new Set()) {
  if (found.has(file)) return found;
  found.add(file);
  if (!graph.has(file)) {
    let imports = [];
    if (existsSync(file) && /\.[cm]?[jt]sx?$/.test(file)) {
      const source = readFileSync(file, "utf8");
      imports = ts
        .preProcessFile(source, true, true)
        .importedFiles.map((item) => resolveImport(file, item.fileName))
        .filter(Boolean);
    }
    graph.set(file, imports);
  }
  for (const imported of graph.get(file)) dependencies(imported, found);
  return found;
}
let unitDependencies;
function coveredByUnits(file) {
  unitDependencies ??= new Set(
    readdirSync("test")
      .filter((name) => name.endsWith(".test.mjs"))
      .flatMap((name) => [...dependencies(`test/${name}`)]),
  );
  return unitDependencies.has(file);
}

export function ciScope(paths, full = false) {
  const selected = new Set();
  const selectAll = () => FIREBASE_SMOKE_SCRIPTS.forEach((script) => selected.add(script));
  if (full) selectAll();
  for (const file of paths) {
    if (
      /^(?:functions\/|\.github\/)|^(?:firestore\.|storage\.rules|firebase\.json|\.firebaserc|package(?:-lock)?\.json|tsconfig\.)/.test(
        file,
      ) ||
      ["scripts/ci-scope.mjs", "scripts/run-firebase-smoke.mjs", "scripts/node-typescript-source-loader.mjs"].includes(
        file,
      )
    ) {
      selectAll();
      continue;
    }
    let matched = false;
    for (const script of FIREBASE_SMOKE_SCRIPTS) {
      if (dependencies(script).has(file)) {
        selected.add(script);
        matched = true;
      }
    }
    if (matched) continue;
    // Unit/browser tests and their ordinary tooling run in the fast gate.
    if (/^test\/|^scripts\//.test(file)) continue;
    if (
      /^(?:docs|public|src\/(?:components|design|i18n))\/|\.(?:css|md|txt|png|jpe?g|svg|webp|ico)$/.test(file) ||
      file === "AGENTS.md"
    )
      continue;
    if (
      /^(?:app|apps)\/.*\/(?:page|layout|loading|error|not-found|template)\.tsx$/.test(file) ||
      /^app\/(?:page|layout|loading|error|not-found|template)\.tsx$/.test(file)
    ) {
      if (existsSync(file) && !/^[ \t]*["']use server["']/m.test(readFileSync(file, "utf8"))) continue;
    }
    if (/^src\/(?:domain|application)\//.test(file) && existsSync(file) && coveredByUnits(file)) continue;
    // Unmapped server code and deletions remain conservative until covered.
    selectAll();
  }
  const scripts = FIREBASE_SMOKE_SCRIPTS.filter((script) => selected.has(script));
  return {
    browser:
      full ||
      paths.some((file) =>
        /^(?:src\/components\/|src\/application\/participant\/|app\/|test\/browser\/|scripts\/smoke-exchange-runtime)|^package(?:-lock)?\.json$/.test(
          file,
        ),
      ),
    firebase: scripts.length > 0,
    scripts,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const full = process.env.GITHUB_EVENT_NAME !== "pull_request";
  const base = process.env.RFXCHANGE_BASE_SHA;
  const head = process.env.RFXCHANGE_HEAD_SHA ?? "HEAD";
  const paths =
    base && !/^0+$/.test(base)
      ? execFileSync("git", ["diff", "--name-only", "--no-renames", base, head], { encoding: "utf8" })
          .trim()
          .split("\n")
          .filter(Boolean)
      : ["package-lock.json"];
  const scope = ciScope(paths, full);
  const output = `firebase=${scope.firebase}\nbrowser=${scope.browser}\nsmokes=${JSON.stringify(scope.scripts)}\n`;
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, output);
  process.stdout.write(output);
}
