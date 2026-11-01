import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";

// Load the real TypeScript implementation; replace only server dependencies.
export function loadSource(file, dependencies = {}) {
  const filename = path.resolve(file);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  }).outputText;
  const localRequire = createRequire(filename);
  const result = { exports: {} };
  new Function("require", "module", "exports", source)((id) => {
    if (Object.hasOwn(dependencies, id)) return dependencies[id];
    if (id.startsWith(".")) return loadSource(path.resolve(path.dirname(filename), id + ".ts"));
    return localRequire(id);
  }, result, result.exports);
  return result.exports;
}

