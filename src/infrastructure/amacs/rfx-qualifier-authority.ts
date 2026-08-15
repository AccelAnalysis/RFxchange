import { readFile } from "node:fs/promises";
import path from "node:path";

import type { AmacsRegistryRecord } from "../../domain/amacs/model.ts";

interface GeneratedRegistries {
  readonly releaseVersion: string;
  readonly registries: Readonly<Record<string, readonly AmacsRegistryRecord[]>>;
}

export interface RfxQuantityUnitOption {
  readonly id: string;
  readonly label: string;
  readonly code: string;
  readonly symbol: string | null;
  readonly unitFamily: string;
}

export interface RfxQuantityDimensionOption {
  readonly id: string;
  readonly label: string;
  readonly dataType: "number" | "duration" | "currency";
  readonly unitFamily: string;
  readonly allowedUnitIds: readonly string[];
}

interface RfxQualifierAuthority {
  readonly units: readonly RfxQuantityUnitOption[];
  readonly dimensions: readonly RfxQuantityDimensionOption[];
}

let cached: Promise<RfxQualifierAuthority> | null = null;

async function loadAuthority(root = process.cwd()): Promise<RfxQualifierAuthority> {
  if (root === process.cwd() && cached) return cached;
  const load = (async () => {
    const file = path.join(root, "src/generated/amacs/0.5.0/registries.json");
    const generated = JSON.parse(await readFile(file, "utf8")) as GeneratedRegistries;
    if (generated.releaseVersion !== "0.5.0") {
      throw new Error("Pinned AMACS qualifier authority is unavailable.");
    }

    const units = (generated.registries.units ?? []).flatMap((record) => {
      if (
        record.status !== "active" ||
        typeof record.unit_id !== "string" ||
        typeof record.preferred_label !== "string" ||
        typeof record.code !== "string" ||
        typeof record.unit_family !== "string"
      ) return [];
      return [Object.freeze({
        id: record.unit_id,
        label: record.preferred_label,
        code: record.code,
        symbol: typeof record.symbol === "string" ? record.symbol : null,
        unitFamily: record.unit_family,
      })];
    });
    units.sort((left, right) =>
      left.unitFamily.localeCompare(right.unitFamily) ||
      left.label.localeCompare(right.label) ||
      left.id.localeCompare(right.id),
    );
    const activeUnitIds = new Set(units.map((unit) => unit.id));

    const dimensions = (generated.registries.properties ?? []).flatMap((record) => {
      const dataType = record.data_type;
      const allowedUnitIds = record.allowed_unit_ids;
      if (
        record.status !== "active" ||
        typeof record.property_id !== "string" ||
        typeof record.preferred_label !== "string" ||
        typeof record.unit_family !== "string" ||
        (dataType !== "number" && dataType !== "duration" && dataType !== "currency") ||
        !Array.isArray(allowedUnitIds) ||
        allowedUnitIds.length === 0 ||
        !allowedUnitIds.every((value) => typeof value === "string" && activeUnitIds.has(value))
      ) return [];
      return [Object.freeze({
        id: record.property_id,
        label: record.preferred_label,
        dataType,
        unitFamily: record.unit_family,
        allowedUnitIds: Object.freeze([...allowedUnitIds] as string[]),
      })];
    });
    dimensions.sort((left, right) =>
      left.label.localeCompare(right.label) || left.id.localeCompare(right.id),
    );

    return Object.freeze({
      units: Object.freeze(units),
      dimensions: Object.freeze(dimensions),
    });
  })();
  if (root === process.cwd()) cached = load;
  return load;
}

export async function loadRfxQuantityUnitAuthority(
  root = process.cwd(),
): Promise<readonly RfxQuantityUnitOption[]> {
  return (await loadAuthority(root)).units;
}

export async function loadRfxQuantityDimensionAuthority(
  root = process.cwd(),
): Promise<readonly RfxQuantityDimensionOption[]> {
  return (await loadAuthority(root)).dimensions;
}
