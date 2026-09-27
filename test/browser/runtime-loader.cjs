/* eslint-disable @typescript-eslint/no-require-imports -- Webpack synchronous loader entry. */
const ts = require('typescript');
const crypto = require('node:crypto');
module.exports = function (source) {
  if (this.resourcePath.endsWith('.css')) {
    const names = {};
    const prefix = crypto.createHash('sha1').update(this.resourcePath).digest('hex').slice(0, 7);
    const css = this.resourcePath.endsWith('.module.css')
      ? source.replace(/:global\(([^)]+)\)|\.([a-zA-Z_][\w-]*)/g, (_, global, name) => global ?? '.' + (names[name] = `c${prefix}_${name}`))
      : source;
    return `const style = document.createElement('style');style.textContent=${JSON.stringify(css)};document.head.append(style);module.exports=${JSON.stringify(names)};`;
  }
  return ts.transpileModule(source, { fileName: this.resourcePath, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
};
