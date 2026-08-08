import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  ImmutableAmacsCatalog,
  type GeneratedAmacsCatalog,
  type GeneratedAmacsRegistries,
  type GeneratedAmacsSearchIndex,
} from "./immutable-catalog.ts";

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

export async function loadImmutableAmacsCatalog(
  root = process.cwd(),
): Promise<ImmutableAmacsCatalog> {
  const generated = path.join(root, "src/generated/amacs/0.5.0");
  const [catalog, searchIndex, registries, historical] = await Promise.all([
    readJson<GeneratedAmacsCatalog>(path.join(generated, "catalog.json")),
    readJson<GeneratedAmacsSearchIndex>(path.join(generated, "search-index.json")),
    readJson<GeneratedAmacsRegistries>(path.join(generated, "registries.json")),
    readJson<GeneratedAmacsCatalog>(path.join(generated, "historical/0.1.0/catalog.json")),
  ]);
  return new ImmutableAmacsCatalog(
    catalog,
    searchIndex,
    registries,
    new Map([[historical.release.version, historical]]),
  );
}
