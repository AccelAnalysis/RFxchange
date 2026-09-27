import ts from "typescript";
import fs from "node:fs";
export const loadTypeScript = (file, dependencies) => {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const loadedModule = { exports: {} };
  const load = (name) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    throw new Error(`Missing test dependency: ${name}`);
  };
  new Function("require", "module", "exports", source)(load, loadedModule, loadedModule.exports);
  return loadedModule.exports;
};
