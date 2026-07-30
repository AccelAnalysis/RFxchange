import path from "node:path";

function extensionlessRelativeSpecifier(specifier) {
  if (!(specifier.startsWith("./") || specifier.startsWith("../"))) return false;
  return path.extname(specifier) === "";
}

/**
 * Production code is compiled by TypeScript/Next and legitimately contains extensionless source imports.
 * INF-009 deliberately executes those production adapters directly in Node during emulator acceptance.
 * This test-only loader mirrors TypeScript source resolution by retrying unresolved relative imports as .ts.
 */
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (error?.code !== "ERR_MODULE_NOT_FOUND" || !extensionlessRelativeSpecifier(specifier)) {
      throw error;
    }
    return nextResolve(`${specifier}.ts`, context);
  }
}
