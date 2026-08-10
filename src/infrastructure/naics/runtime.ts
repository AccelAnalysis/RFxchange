import catalog from "../../generated/naics/2022/catalog.json";
import release from "../../generated/naics/2022/release.json";
import type { NaicsIndustry, NaicsReleaseMetadata } from "../../domain/naics/model.ts";
import { ImmutableNaicsCatalog } from "./immutable-catalog.ts";

let sharedCatalog: ImmutableNaicsCatalog | null = null;

export function loadImmutableNaicsCatalog(): ImmutableNaicsCatalog {
  sharedCatalog ??= new ImmutableNaicsCatalog(
    release as NaicsReleaseMetadata,
    catalog as readonly NaicsIndustry[],
  );
  return sharedCatalog;
}
