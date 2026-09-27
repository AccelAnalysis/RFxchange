/* eslint-disable @typescript-eslint/no-require-imports -- Webpack synchronous loader entry. */
const ts = require('typescript');
const { loadBindings } = require('next/dist/build/swc');
module.exports = async function (source) {
  if (this.resourcePath.endsWith('.css')) {
    const bindings = await loadBindings();
    const result = bindings.css.lightning.transform({
      filename: this.resourcePath,
      code: Buffer.from(source),
      cssModules: this.resourcePath.endsWith('.module.css'),
    });
    const names = {};
    for (const [name, value] of Object.entries(result.exports ?? {})) {
      names[name] = [value.name, ...value.composes.map(compose => compose.name)].join(' ');
    }
    const css = result.code.toString();
    return `const style = document.createElement('style');style.textContent=${JSON.stringify(css)};document.head.append(style);module.exports=${JSON.stringify(names)};`;
  }
  return ts.transpileModule(source, { fileName: this.resourcePath, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
};
