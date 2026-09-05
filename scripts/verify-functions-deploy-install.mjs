import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Firebase builds the uploaded functions/ artifact outside the root npm workspace.
const directory = mkdtempSync(join(tmpdir(), "rfx-functions-deploy-"));
try {
  for (const name of ["package.json", "package-lock.json", "lib"]) {
    cpSync(new URL(`../functions/${name}`, import.meta.url), join(directory, name), { recursive: true });
  }
  execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["ci", "--omit=dev", "--ignore-scripts", "--workspaces=false", "--no-audit", "--no-fund"], { cwd: directory, stdio: "inherit" });
  execFileSync(process.execPath, ["--input-type=module", "-e", "import assert from 'node:assert/strict'; const functions = await import('./lib/index.js'); assert.equal(typeof functions.runtimeFoundationHealth, 'function'); assert.equal(typeof functions.scheduledBackgroundJobHeartbeat, 'function'); console.log('Isolated production Functions artifact loads without workspace or development dependencies.');"], { cwd: directory, stdio: "inherit" });
} finally {
  rmSync(directory, { recursive: true, force: true });
}
