import {
  CP08_RFX_BRIDGE_VERSION,
  RFxBridgeError,
  type RFxBridgeReleasedFile,
  type SupplierSafeNeedProjection,
} from "./contracts.ts";

const MAX_TITLE = 240;
const MAX_SPECIFICATION = 12_000;
const MAX_REQUIREMENTS = 50;
const MAX_REQUIREMENT_LENGTH = 600;
const MAX_FILES = 20;

function objectValue(value: unknown): Readonly<Record<string, unknown>> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : null;
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, max) : null;
}

function requiredText(value: unknown, label: string, max: number): string {
  const normalized = text(value, max);
  if (!normalized) throw new RFxBridgeError("invalid-input", `${label} is required.`);
  return normalized;
}

function finiteNonNegative(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function positiveQuantity(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new RFxBridgeError("invalid-input", "Quantity must be greater than zero.");
  }
  return value;
}

function iso(value: unknown, label: string, required = false): string | null {
  if (value === null || value === undefined || value === "") {
    if (required) throw new RFxBridgeError("invalid-input", `${label} is required.`);
    return null;
  }
  if (typeof value !== "string") throw new RFxBridgeError("invalid-input", `${label} is invalid.`);
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new RFxBridgeError("invalid-input", `${label} is invalid.`);
  return new Date(parsed).toISOString();
}

function requirements(value: unknown): readonly string[] {
  if (value === null || value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) {
    throw new RFxBridgeError("invalid-input", "Supplier requirements are invalid.");
  }
  const normalized = value.flatMap((item) => {
    const requirement = text(item, MAX_REQUIREMENT_LENGTH);
    return requirement ? [requirement] : [];
  });
  if (normalized.length > MAX_REQUIREMENTS) {
    throw new RFxBridgeError("invalid-input", "Too many supplier requirements were provided.");
  }
  return Object.freeze([...new Set(normalized)]);
}

function releasedFiles(value: unknown): readonly RFxBridgeReleasedFile[] {
  if (value === null || value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) throw new RFxBridgeError("invalid-input", "Released files are invalid.");

  const files = value.flatMap((item) => {
    const record = objectValue(item);
    if (!record || record.releaseStatus !== "released") return [];
    const evidenceId = requiredText(record.id ?? record.evidenceId, "Released file identity", 190);
    const originalFilename = requiredText(record.originalFilename, "Released filename", 255);
    const contentType = requiredText(record.contentType, "Released file type", 160);
    const size = record.size === null || record.size === undefined
      ? null
      : finiteNonNegative(record.size);
    if (record.size !== null && record.size !== undefined && size === null) {
      throw new RFxBridgeError("invalid-input", "Released file size is invalid.");
    }
    return [Object.freeze({ evidenceId, originalFilename, contentType, size })];
  });

  if (files.length > MAX_FILES) {
    throw new RFxBridgeError("invalid-input", "Too many released files were provided.");
  }
  return Object.freeze(files);
}

/**
 * Runtime allowlist for data leaving AccelPO. Unknown/private fields are ignored rather than copied.
 * File URLs and storage paths are intentionally never accepted into the returned projection.
 */
export function createSupplierSafeNeedProjection(
  source: Readonly<Record<string, unknown>>,
): SupplierSafeNeedProjection {
  const title = requiredText(source.title ?? source.need, "Need", MAX_TITLE);
  const specification = text(source.specification ?? source.description, MAX_SPECIFICATION);
  const responseDeadline = iso(source.responseDeadline, "Response deadline", true);
  if (!responseDeadline) throw new RFxBridgeError("invalid-input", "Response deadline is required.");

  return Object.freeze({
    bridgeVersion: CP08_RFX_BRIDGE_VERSION,
    need: Object.freeze({
      title,
      specification,
      quantity: positiveQuantity(source.quantity),
      quantityUnit: text(source.quantityUnit, 80),
    }),
    timing: Object.freeze({
      neededBy: iso(source.neededBy, "Needed-by date"),
      responseDeadline,
    }),
    fulfillment: Object.freeze({
      method: text(source.fulfillmentMethod, 120),
      geography: text(source.fulfillmentGeography, 500),
    }),
    supplierRequirements: requirements(source.supplierRequirements),
    releasedFiles: releasedFiles(source.files ?? source.releasedFiles),
  });
}
