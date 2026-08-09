import { Buffer } from "node:buffer";
import { TextDecoder } from "node:util";
import { inflateRawSync } from "node:zlib";

import {
  STORED_ASSET_POLICIES,
  type StoredAssetCategory,
} from "../../domain/storage/model.ts";

const MEBIBYTE = 1024 * 1024;
const MULTIPART_ENVELOPE_ALLOWANCE_BYTES = MEBIBYTE;
const PROFILE_ASSET_CATEGORIES = [
  "organization-logo",
  "organization-media",
  "organization-document",
] as const satisfies readonly StoredAssetCategory[];

const MAX_PROFILE_ASSET_BYTES = Math.max(
  ...PROFILE_ASSET_CATEGORIES.map((category) => STORED_ASSET_POLICIES[category].maximumBytes),
);

/**
 * The multipart stream is bounded before it is handed to `formData()`. The allowance covers form
 * fields and multipart framing; the selected file is then checked against its exact category limit
 * before `File.arrayBuffer()` allocates another in-memory copy.
 */
export const MAX_PROFILE_ASSET_MULTIPART_BYTES =
  MAX_PROFILE_ASSET_BYTES + MULTIPART_ENVELOPE_ALLOWANCE_BYTES;

export type OrganizationAssetUploadBoundaryErrorCode =
  | "invalid-content-length"
  | "request-body-required"
  | "request-too-large"
  | "content-length-mismatch"
  | "unsupported-kind"
  | "empty-file"
  | "file-too-large"
  | "unsupported-content-type"
  | "content-type-mismatch";

export type OrganizationAssetUploadBoundaryStatus = 400 | 413 | 415;

export class OrganizationAssetUploadBoundaryError extends Error {
  readonly code: OrganizationAssetUploadBoundaryErrorCode;
  readonly status: OrganizationAssetUploadBoundaryStatus;

  constructor(
    code: OrganizationAssetUploadBoundaryErrorCode,
    status: OrganizationAssetUploadBoundaryStatus,
    message: string,
  ) {
    super(message);
    this.name = "OrganizationAssetUploadBoundaryError";
    this.code = code;
    this.status = status;
  }
}

function declaredContentLength(value: string | null): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new OrganizationAssetUploadBoundaryError(
      "invalid-content-length",
      400,
      "Profile asset upload Content-Length is invalid.",
    );
  }
  return parsed;
}

/**
 * Reads an HTTP request body incrementally and stops as soon as the multipart envelope crosses the
 * approved upper bound. A missing Content-Length remains safe because the stream itself is counted.
 */
export async function readBoundedProfileAssetMultipartBody(
  body: ReadableStream<Uint8Array> | null,
  declaredLengthHeader: string | null,
): Promise<Uint8Array> {
  const declaredLength = declaredContentLength(declaredLengthHeader);
  if (declaredLength !== null && declaredLength > MAX_PROFILE_ASSET_MULTIPART_BYTES) {
    throw new OrganizationAssetUploadBoundaryError(
      "request-too-large",
      413,
      `Profile asset upload exceeds the ${MAX_PROFILE_ASSET_MULTIPART_BYTES}-byte request limit.`,
    );
  }
  if (!body) {
    throw new OrganizationAssetUploadBoundaryError(
      "request-body-required",
      400,
      "Profile asset upload body is required.",
    );
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      if (!result.value?.byteLength) continue;
      total += result.value.byteLength;
      if (total > MAX_PROFILE_ASSET_MULTIPART_BYTES) {
        await reader.cancel("Profile asset multipart limit exceeded.").catch(() => undefined);
        throw new OrganizationAssetUploadBoundaryError(
          "request-too-large",
          413,
          `Profile asset upload exceeds the ${MAX_PROFILE_ASSET_MULTIPART_BYTES}-byte request limit.`,
        );
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  if (declaredLength !== null && declaredLength !== total) {
    throw new OrganizationAssetUploadBoundaryError(
      "content-length-mismatch",
      400,
      "Profile asset upload length does not match the declared Content-Length.",
    );
  }

  const bounded = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bounded.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bounded;
}

export function profileAssetCategory(kind: string): StoredAssetCategory {
  if (kind === "logo") return "organization-logo";
  if (kind === "image" || kind === "portfolio") return "organization-media";
  if (kind === "document") return "organization-document";
  throw new OrganizationAssetUploadBoundaryError(
    "unsupported-kind",
    400,
    "Unsupported organization profile asset kind.",
  );
}

export function validateProfileAssetFileMetadata(input: Readonly<{
  kind: string;
  sizeBytes: number;
  contentType: string;
}>): Readonly<{
  category: StoredAssetCategory;
  contentType: string;
  maximumBytes: number;
}> {
  const category = profileAssetCategory(input.kind);
  const policy = STORED_ASSET_POLICIES[category];
  const contentType = input.contentType.trim().toLowerCase();

  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0) {
    throw new OrganizationAssetUploadBoundaryError(
      "empty-file",
      400,
      "Profile asset file must contain data.",
    );
  }
  if (input.sizeBytes > policy.maximumBytes) {
    throw new OrganizationAssetUploadBoundaryError(
      "file-too-large",
      413,
      `Profile asset exceeds the ${policy.maximumBytes}-byte ${category} limit.`,
    );
  }
  if (!policy.permittedContentTypes.includes(contentType)) {
    throw new OrganizationAssetUploadBoundaryError(
      "unsupported-content-type",
      415,
      `Content type ${contentType || "unknown"} is not permitted for ${category}.`,
    );
  }

  return Object.freeze({
    category,
    contentType,
    maximumBytes: policy.maximumBytes,
  });
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  if (bytes.byteLength < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

function viewFor(bytes: Uint8Array, offset: number, length: number): DataView | null {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset + length > bytes.byteLength) return null;
  return new DataView(bytes.buffer, bytes.byteOffset + offset, length);
}

function uint16(bytes: Uint8Array, offset: number): number | null {
  return viewFor(bytes, offset, 2)?.getUint16(0, true) ?? null;
}

function uint32(bytes: Uint8Array, offset: number): number | null {
  return viewFor(bytes, offset, 4)?.getUint32(0, true) ?? null;
}

const CFB_FREE_SECTOR = 0xffffffff;
const CFB_END_OF_CHAIN = 0xfffffffe;
const CFB_FAT_SECTOR = 0xfffffffd;
const CFB_DIFAT_SECTOR = 0xfffffffc;
const CFB_NO_STREAM = 0xffffffff;
const CFB_HEADER_DIFAT_ENTRIES = 109;
const CFB_DIRECTORY_ENTRY_BYTES = 128;

interface CfbDirectoryEntry {
  readonly name: string;
  readonly type: number;
  readonly leftSiblingId: number;
  readonly rightSiblingId: number;
  readonly childId: number;
  readonly startSector: number;
  readonly sizeLow: number;
}

function cfbSectorOffset(sectorId: number, sectorSize: number, sectorCount: number): number | null {
  if (!Number.isInteger(sectorId) || sectorId < 0 || sectorId >= sectorCount) return null;
  return (sectorId + 1) * sectorSize;
}

function parseCfbDirectoryEntry(bytes: Uint8Array, offset: number): CfbDirectoryEntry | null {
  if (offset < 0 || offset + CFB_DIRECTORY_ENTRY_BYTES > bytes.byteLength) return null;
  const nameLength = uint16(bytes, offset + 64);
  const type = bytes[offset + 66];
  const leftSiblingId = uint32(bytes, offset + 68);
  const rightSiblingId = uint32(bytes, offset + 72);
  const childId = uint32(bytes, offset + 76);
  const startSector = uint32(bytes, offset + 116);
  const sizeLow = uint32(bytes, offset + 120);
  if (
    nameLength === null ||
    leftSiblingId === null ||
    rightSiblingId === null ||
    childId === null ||
    startSector === null ||
    sizeLow === null
  ) {
    return null;
  }
  if (type === 0) {
    return Object.freeze({
      name: "",
      type,
      leftSiblingId,
      rightSiblingId,
      childId,
      startSector,
      sizeLow,
    });
  }
  if (nameLength < 2 || nameLength > 64 || nameLength % 2 !== 0) return null;
  try {
    const nameBytes = bytes.subarray(offset, offset + nameLength - 2);
    const name = new TextDecoder("utf-16le", { fatal: true }).decode(nameBytes);
    if (!name || name.includes("\u0000")) return null;
    return Object.freeze({
      name,
      type,
      leftSiblingId,
      rightSiblingId,
      childId,
      startSector,
      sizeLow,
    });
  } catch {
    return null;
  }
}

function collectCfbFatSectorIds(
  bytes: Uint8Array,
  sectorSize: number,
  sectorCount: number,
  requiredCount: number,
): readonly number[] | null {
  const fatSectorIds: number[] = [];
  for (let index = 0; index < CFB_HEADER_DIFAT_ENTRIES && fatSectorIds.length < requiredCount; index += 1) {
    const sectorId = uint32(bytes, 76 + index * 4);
    if (sectorId === null) return null;
    if (sectorId === CFB_FREE_SECTOR) continue;
    if (cfbSectorOffset(sectorId, sectorSize, sectorCount) === null) return null;
    fatSectorIds.push(sectorId);
  }

  const firstDifatSector = uint32(bytes, 68);
  const difatSectorCount = uint32(bytes, 72);
  if (firstDifatSector === null || difatSectorCount === null) return null;
  let sectorId = firstDifatSector;
  const visited = new Set<number>();
  const entriesPerDifatSector = sectorSize / 4 - 1;
  for (let index = 0; index < difatSectorCount && fatSectorIds.length < requiredCount; index += 1) {
    if (sectorId === CFB_END_OF_CHAIN || visited.has(sectorId)) return null;
    const offset = cfbSectorOffset(sectorId, sectorSize, sectorCount);
    if (offset === null) return null;
    visited.add(sectorId);
    for (let entry = 0; entry < entriesPerDifatSector && fatSectorIds.length < requiredCount; entry += 1) {
      const fatSectorId = uint32(bytes, offset + entry * 4);
      if (fatSectorId === null) return null;
      if (fatSectorId === CFB_FREE_SECTOR) continue;
      if (cfbSectorOffset(fatSectorId, sectorSize, sectorCount) === null) return null;
      fatSectorIds.push(fatSectorId);
    }
    const next = uint32(bytes, offset + entriesPerDifatSector * 4);
    if (next === null) return null;
    sectorId = next;
  }
  return fatSectorIds.length >= requiredCount
    ? Object.freeze(fatSectorIds.slice(0, requiredCount))
    : null;
}

function parseCfbFat(
  bytes: Uint8Array,
  sectorSize: number,
  sectorCount: number,
  fatSectorIds: readonly number[],
): readonly number[] | null {
  const fat: number[] = [];
  const entriesPerSector = sectorSize / 4;
  for (const fatSectorId of fatSectorIds) {
    const offset = cfbSectorOffset(fatSectorId, sectorSize, sectorCount);
    if (offset === null) return null;
    for (let index = 0; index < entriesPerSector; index += 1) {
      const value = uint32(bytes, offset + index * 4);
      if (value === null) return null;
      fat.push(value);
    }
  }
  return Object.freeze(fat);
}

function parseCfbDirectory(
  bytes: Uint8Array,
  sectorSize: number,
  sectorCount: number,
  fat: readonly number[],
  firstDirectorySector: number,
): readonly CfbDirectoryEntry[] | null {
  const entries: CfbDirectoryEntry[] = [];
  const visited = new Set<number>();
  let sectorId = firstDirectorySector;
  while (sectorId !== CFB_END_OF_CHAIN) {
    if (visited.has(sectorId) || visited.size >= sectorCount) return null;
    const offset = cfbSectorOffset(sectorId, sectorSize, sectorCount);
    if (offset === null) return null;
    visited.add(sectorId);
    for (let entryOffset = 0; entryOffset < sectorSize; entryOffset += CFB_DIRECTORY_ENTRY_BYTES) {
      const entry = parseCfbDirectoryEntry(bytes, offset + entryOffset);
      if (!entry) return null;
      entries.push(entry);
    }
    const next = fat[sectorId];
    if (
      next === undefined ||
      next === CFB_FREE_SECTOR ||
      next === CFB_FAT_SECTOR ||
      next === CFB_DIFAT_SECTOR
    ) {
      return null;
    }
    sectorId = next;
  }
  return Object.freeze(entries);
}

function reachableCfbChildNames(
  entries: readonly CfbDirectoryEntry[],
  root: CfbDirectoryEntry,
): ReadonlyMap<string, CfbDirectoryEntry> | null {
  const streams = new Map<string, CfbDirectoryEntry>();
  const visited = new Set<number>();
  const visit = (entryId: number): boolean => {
    if (entryId === CFB_NO_STREAM) return true;
    if (!Number.isInteger(entryId) || entryId < 0 || entryId >= entries.length || visited.has(entryId)) {
      return false;
    }
    visited.add(entryId);
    const entry = entries[entryId];
    if (!entry || entry.type === 0) return false;
    if (!visit(entry.leftSiblingId)) return false;
    if (entry.type === 2) streams.set(entry.name.toLocaleLowerCase("en-US"), entry);
    if (!visit(entry.rightSiblingId)) return false;
    return true;
  };
  return visit(root.childId) ? streams : null;
}

function isLegacyWordCompoundFile(bytes: Uint8Array): boolean {
  if (!startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return false;
  const majorVersion = uint16(bytes, 26);
  const byteOrder = uint16(bytes, 28);
  const sectorShift = uint16(bytes, 30);
  const fatSectorCount = uint32(bytes, 44);
  const firstDirectorySector = uint32(bytes, 48);
  if (
    majorVersion === null ||
    byteOrder !== 0xfffe ||
    sectorShift === null ||
    fatSectorCount === null ||
    firstDirectorySector === null ||
    fatSectorCount === 0
  ) {
    return false;
  }
  if (!((majorVersion === 3 && sectorShift === 9) || (majorVersion === 4 && sectorShift === 12))) {
    return false;
  }
  const sectorSize = 2 ** sectorShift;
  if (bytes.byteLength < sectorSize * 2 || bytes.byteLength % sectorSize !== 0) return false;
  const sectorCount = bytes.byteLength / sectorSize - 1;
  if (fatSectorCount > sectorCount) return false;
  const fatSectorIds = collectCfbFatSectorIds(
    bytes,
    sectorSize,
    sectorCount,
    fatSectorCount,
  );
  if (!fatSectorIds) return false;
  const fat = parseCfbFat(bytes, sectorSize, sectorCount, fatSectorIds);
  if (!fat) return false;
  const entries = parseCfbDirectory(
    bytes,
    sectorSize,
    sectorCount,
    fat,
    firstDirectorySector,
  );
  if (!entries?.length) return false;
  const root = entries[0];
  if (!root || root.type !== 5 || root.name.toLocaleLowerCase("en-US") !== "root entry") {
    return false;
  }
  const streams = reachableCfbChildNames(entries, root);
  if (!streams) return false;
  const wordDocument = streams.get("worddocument");
  const table = streams.get("0table") ?? streams.get("1table");
  return Boolean(
    wordDocument &&
    table &&
    wordDocument.sizeLow > 0 &&
    table.sizeLow > 0 &&
    wordDocument.startSector !== CFB_END_OF_CHAIN &&
    table.startSector !== CFB_END_OF_CHAIN
  );
}

const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const ZIP_MAX_ENTRY_COUNT = 4096;
const ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES = 128 * MEBIBYTE;
const ZIP_MAX_VALIDATED_XML_BYTES = 64 * MEBIBYTE;

interface ZipEntry {
  readonly name: string;
  readonly flags: number;
  readonly method: number;
  readonly crc32: number;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly localHeaderOffset: number;
  readonly dataOffset: number;
}

function findZipEndOfCentralDirectory(bytes: Uint8Array): number | null {
  if (bytes.byteLength < 22) return null;
  const minimum = Math.max(0, bytes.byteLength - 22 - 0xffff);
  for (let offset = bytes.byteLength - 22; offset >= minimum; offset -= 1) {
    if (uint32(bytes, offset) !== ZIP_END_OF_CENTRAL_DIRECTORY) continue;
    const commentLength = uint16(bytes, offset + 20);
    if (commentLength !== null && offset + 22 + commentLength === bytes.byteLength) return offset;
  }
  return null;
}

function decodeZipEntryName(bytes: Uint8Array, utf8: boolean): string | null {
  if (!utf8 && bytes.some((value) => value > 0x7f)) return null;
  try {
    const name = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (
      !name ||
      name.startsWith("/") ||
      name.includes("\\") ||
      name.split("/").some((segment) => segment === "..")
    ) {
      return null;
    }
    return name;
  } catch {
    return null;
  }
}

function parseZipEntries(bytes: Uint8Array): ReadonlyMap<string, ZipEntry> | null {
  const eocdOffset = findZipEndOfCentralDirectory(bytes);
  if (eocdOffset === null) return null;
  const diskNumber = uint16(bytes, eocdOffset + 4);
  const centralDirectoryDisk = uint16(bytes, eocdOffset + 6);
  const entriesOnDisk = uint16(bytes, eocdOffset + 8);
  const entryCount = uint16(bytes, eocdOffset + 10);
  const centralDirectorySize = uint32(bytes, eocdOffset + 12);
  const centralDirectoryOffset = uint32(bytes, eocdOffset + 16);
  if (
    diskNumber !== 0 ||
    centralDirectoryDisk !== 0 ||
    entriesOnDisk === null ||
    entryCount === null ||
    entriesOnDisk !== entryCount ||
    entryCount === 0 ||
    entryCount > ZIP_MAX_ENTRY_COUNT ||
    centralDirectorySize === null ||
    centralDirectoryOffset === null ||
    centralDirectorySize === 0 ||
    centralDirectoryOffset + centralDirectorySize > eocdOffset
  ) {
    return null;
  }

  const entries = new Map<string, ZipEntry>();
  let totalUncompressedBytes = 0;
  let cursor = centralDirectoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (uint32(bytes, cursor) !== ZIP_CENTRAL_DIRECTORY_HEADER) return null;
    const flags = uint16(bytes, cursor + 8);
    const method = uint16(bytes, cursor + 10);
    const crc = uint32(bytes, cursor + 16);
    const compressedSize = uint32(bytes, cursor + 20);
    const uncompressedSize = uint32(bytes, cursor + 24);
    const filenameLength = uint16(bytes, cursor + 28);
    const extraLength = uint16(bytes, cursor + 30);
    const commentLength = uint16(bytes, cursor + 32);
    const diskStart = uint16(bytes, cursor + 34);
    const localHeaderOffset = uint32(bytes, cursor + 42);
    if (
      flags === null ||
      method === null ||
      crc === null ||
      compressedSize === null ||
      uncompressedSize === null ||
      filenameLength === null ||
      extraLength === null ||
      commentLength === null ||
      diskStart !== 0 ||
      localHeaderOffset === null ||
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      localHeaderOffset === 0xffffffff ||
      (flags & 0x1) !== 0 ||
      (method !== 0 && method !== 8)
    ) {
      return null;
    }
    const nameStart = cursor + 46;
    const nameEnd = nameStart + filenameLength;
    const next = nameEnd + extraLength + commentLength;
    if (next > centralDirectoryOffset + centralDirectorySize) return null;
    const name = decodeZipEntryName(bytes.subarray(nameStart, nameEnd), (flags & 0x800) !== 0);
    if (!name || entries.has(name)) return null;

    if (uint32(bytes, localHeaderOffset) !== ZIP_LOCAL_FILE_HEADER) return null;
    const localFlags = uint16(bytes, localHeaderOffset + 6);
    const localMethod = uint16(bytes, localHeaderOffset + 8);
    const localFilenameLength = uint16(bytes, localHeaderOffset + 26);
    const localExtraLength = uint16(bytes, localHeaderOffset + 28);
    if (
      localFlags === null ||
      localMethod === null ||
      localFilenameLength === null ||
      localExtraLength === null ||
      localFlags !== flags ||
      localMethod !== method
    ) {
      return null;
    }
    const localNameStart = localHeaderOffset + 30;
    const localNameEnd = localNameStart + localFilenameLength;
    const dataOffset = localNameEnd + localExtraLength;
    if (
      dataOffset + compressedSize > centralDirectoryOffset ||
      decodeZipEntryName(bytes.subarray(localNameStart, localNameEnd), (flags & 0x800) !== 0) !== name
    ) {
      return null;
    }

    totalUncompressedBytes += uncompressedSize;
    if (!Number.isSafeInteger(totalUncompressedBytes) || totalUncompressedBytes > ZIP_MAX_TOTAL_UNCOMPRESSED_BYTES) {
      return null;
    }
    entries.set(name, Object.freeze({
      name,
      flags,
      method,
      crc32: crc,
      compressedSize,
      uncompressedSize,
      localHeaderOffset,
      dataOffset,
    }));
    cursor = next;
  }
  if (cursor !== centralDirectoryOffset + centralDirectorySize) return null;
  return entries;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function readZipEntry(
  packageBytes: Uint8Array,
  entry: ZipEntry,
  maximumOutputBytes: number,
): Uint8Array | null {
  if (entry.uncompressedSize > maximumOutputBytes) return null;
  const compressed = packageBytes.subarray(
    entry.dataOffset,
    entry.dataOffset + entry.compressedSize,
  );
  let output: Uint8Array;
  try {
    if (entry.method === 0) {
      if (entry.compressedSize !== entry.uncompressedSize) return null;
      output = Uint8Array.from(compressed);
    } else {
      output = Uint8Array.from(inflateRawSync(Buffer.from(compressed), {
        maxOutputLength: maximumOutputBytes,
      }));
    }
  } catch {
    return null;
  }
  if (output.byteLength !== entry.uncompressedSize || crc32(output) !== entry.crc32) return null;
  return output;
}

function decodeXml(bytes: Uint8Array): string | null {
  try {
    if (startsWith(bytes, [0xff, 0xfe])) {
      return new TextDecoder("utf-16le", { fatal: true }).decode(bytes.subarray(2));
    }
    if (startsWith(bytes, [0xfe, 0xff])) {
      const swapped = new Uint8Array(bytes.byteLength - 2);
      for (let index = 2; index + 1 < bytes.byteLength; index += 2) {
        swapped[index - 2] = bytes[index + 1];
        swapped[index - 1] = bytes[index];
      }
      return new TextDecoder("utf-16le", { fatal: true }).decode(swapped);
    }
    const start = startsWith(bytes, [0xef, 0xbb, 0xbf]) ? 3 : 0;
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(start));
  } catch {
    return null;
  }
}

function xmlAttribute(tag: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`\\b${escaped}\\s*=\\s*(["'])(.*?)\\1`, "i").exec(tag);
  return match?.[2] ?? null;
}

function contentTypesDeclareWordDocument(xml: string): boolean {
  const expected = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
  return (xml.match(/<Override\b[^>]*>/gi) ?? []).some((tag) =>
    xmlAttribute(tag, "PartName") === "/word/document.xml" &&
    xmlAttribute(tag, "ContentType")?.toLocaleLowerCase("en-US") === expected,
  );
}

function rootRelationshipsTargetWordDocument(xml: string): boolean {
  return (xml.match(/<Relationship\b[^>]*>/gi) ?? []).some((tag) => {
    const type = xmlAttribute(tag, "Type")?.toLocaleLowerCase("en-US") ?? "";
    const target = xmlAttribute(tag, "Target")?.replace(/^\//, "") ?? "";
    return type.endsWith("/officedocument") && target === "word/document.xml";
  });
}

function isWordprocessingDocumentXml(xml: string): boolean {
  return /<(?:[A-Za-z_][\w.-]*:)?document\b/i.test(xml) &&
    /schemas\.openxmlformats\.org\/wordprocessingml\/2006\/main/i.test(xml);
}

function isDocxPackage(bytes: Uint8Array): boolean {
  const entries = parseZipEntries(bytes);
  if (!entries) return false;
  const contentTypesEntry = entries.get("[Content_Types].xml");
  const relationshipsEntry = entries.get("_rels/.rels");
  const documentEntry = entries.get("word/document.xml");
  if (!contentTypesEntry || !relationshipsEntry || !documentEntry || documentEntry.uncompressedSize === 0) {
    return false;
  }
  const contentTypesBytes = readZipEntry(bytes, contentTypesEntry, MEBIBYTE);
  const relationshipsBytes = readZipEntry(bytes, relationshipsEntry, MEBIBYTE);
  const documentBytes = readZipEntry(bytes, documentEntry, ZIP_MAX_VALIDATED_XML_BYTES);
  if (!contentTypesBytes || !relationshipsBytes || !documentBytes) return false;
  const contentTypesXml = decodeXml(contentTypesBytes);
  const relationshipsXml = decodeXml(relationshipsBytes);
  const documentXml = decodeXml(documentBytes);
  return Boolean(
    contentTypesXml &&
    relationshipsXml &&
    documentXml &&
    contentTypesDeclareWordDocument(contentTypesXml) &&
    rootRelationshipsTargetWordDocument(relationshipsXml) &&
    isWordprocessingDocumentXml(documentXml)
  );
}

function signatureMatches(contentType: string, bytes: Uint8Array): boolean {
  switch (contentType) {
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8);
    case "application/pdf":
      return bytes.subarray(0, Math.min(bytes.byteLength, 1024)).some((_, offset) =>
        startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d], offset),
      );
    case "application/msword":
      return isLegacyWordCompoundFile(bytes);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return isDocxPackage(bytes);
    default:
      return false;
  }
}

/**
 * Browser-provided MIME metadata is not sufficient to establish file type. This validates the
 * bounded bytes against the canonical image/PDF signature, the reachable Word streams in a CFB
 * `.doc`, or the central directory, content types, relationships, and document part in a DOCX.
 * It is a type-confusion boundary, not a malware scanner.
 */
export function assertProfileAssetFileSignature(
  contentType: string,
  bytes: Uint8Array,
): void {
  if (!signatureMatches(contentType.trim().toLowerCase(), bytes)) {
    throw new OrganizationAssetUploadBoundaryError(
      "content-type-mismatch",
      415,
      "Profile asset bytes do not match the declared content type.",
    );
  }
}
