import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Unknown executable paths select integration coverage; UI and docs can take the fast path.
export function ciScope(paths, full = false) {
  const presentation = /^(?:src\/(?:components|design|i18n)\/|public\/)|\.(?:css|md|txt|png|jpe?g|svg|webp|ico)$/;
  const sensitive = /^(?:functions\/|src\/(?:application|domain|infrastructure|accelpo|config|lib)\/|app\/|apps\/|scripts\/|test\/|\.github\/)|^(?:firestore\.|storage\.rules|firebase\.json|\.firebaserc|package(?:-lock)?\.json|next\.config\.|tsconfig\.)/;
  return { browser: full || paths.some(path => /^(?:src\/components\/|src\/application\/participant\/|app\/|test\/browser\/|scripts\/smoke-exchange-runtime)|^package(?:-lock)?\.json$/.test(path)), firebase: full || paths.some((path) => sensitive.test(path) || (!presentation.test(path) && !path.startsWith("docs/") && path !== "AGENTS.md")) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const full = process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
  const base = process.env.RFXCHANGE_BASE_SHA;
  const head = process.env.RFXCHANGE_HEAD_SHA ?? "HEAD";
  const paths = base && !/^0+$/.test(base)
    ? execFileSync("git", ["diff", "--name-only", "--no-renames", base, head], { encoding: "utf8" }).trim().split("\n").filter(Boolean)
    : ["package-lock.json"];
  const scope = ciScope(paths, full);
  const output = `firebase=${scope.firebase}\nbrowser=${scope.browser}\n`;
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, output);
  process.stdout.write(output);
}
