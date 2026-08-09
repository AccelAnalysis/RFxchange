import { Buffer } from "node:buffer";
import assert from "node:assert/strict";
import test from "node:test";

import {
  assertProfileAssetFileSignature,
  MAX_PROFILE_ASSET_MULTIPART_BYTES,
  OrganizationAssetUploadBoundaryError,
  readBoundedProfileAssetMultipartBody,
  validateProfileAssetFileMetadata,
} from "../src/application/storage/organization-asset-upload-boundary.ts";

function bytes(...values) {
  return new Uint8Array(values);
}

function ascii(value) {
  return new Uint8Array(Buffer.from(value, "utf8"));
}

function stream(...chunks) {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

function expectBoundaryError(fn, code, status) {
  assert.throws(fn, (error) =>
    error instanceof OrganizationAssetUploadBoundaryError &&
    error.code === code &&
    error.status === status,
  );
}

async function expectAsyncBoundaryError(fn, code, status) {
  await assert.rejects(fn, (error) =>
    error instanceof OrganizationAssetUploadBoundaryError &&
    error.code === code &&
    error.status === status,
  );
}

function crc32(value) {
  let crc = 0xffffffff;
  for (const byte of value) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createStoredZip(files) {
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const data = Buffer.from(file.data);
    const checksum = crc32(data);
    const local = Buffer.alloc(30 + name.length + data.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    name.copy(local, 30);
    data.copy(local, 30 + name.length);
    localParts.push(local);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt32LE(localOffset, 42);
    name.copy(central, 46);
    centralParts.push(central);
    localOffset += local.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDirectory.length, 12);
  eocd.writeUInt32LE(localOffset, 16);
  eocd.writeUInt16LE(0, 20);
  return new Uint8Array(Buffer.concat([...localParts, centralDirectory, eocd]));
}

function writeCfbDirectoryEntry(buffer, offset, input) {
  const name = Buffer.from(`${input.name}\u0000`, "utf16le");
  name.copy(buffer, offset);
  buffer.writeUInt16LE(name.length, offset + 64);
  buffer[offset + 66] = input.type;
  buffer[offset + 67] = 1;
  buffer.writeUInt32LE(input.left ?? 0xffffffff, offset + 68);
  buffer.writeUInt32LE(input.right ?? 0xffffffff, offset + 72);
  buffer.writeUInt32LE(input.child ?? 0xffffffff, offset + 76);
  buffer.writeUInt32LE(input.startSector ?? 0xfffffffe, offset + 116);
  buffer.writeUInt32LE(input.size ?? 0, offset + 120);
}

function createCompoundFile(streamNames) {
  const sectorSize = 512;
  const sectorCount = 2 + streamNames.length;
  const file = Buffer.alloc((sectorCount + 1) * sectorSize);
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]).copy(file, 0);
  file.writeUInt16LE(0x003e, 24);
  file.writeUInt16LE(3, 26);
  file.writeUInt16LE(0xfffe, 28);
  file.writeUInt16LE(9, 30);
  file.writeUInt16LE(6, 32);
  file.writeUInt32LE(0, 40);
  file.writeUInt32LE(1, 44);
  file.writeUInt32LE(1, 48);
  file.writeUInt32LE(4096, 56);
  file.writeUInt32LE(0xfffffffe, 60);
  file.writeUInt32LE(0, 64);
  file.writeUInt32LE(0xfffffffe, 68);
  file.writeUInt32LE(0, 72);
  for (let index = 0; index < 109; index += 1) file.writeUInt32LE(0xffffffff, 76 + index * 4);
  file.writeUInt32LE(0, 76);

  const fatOffset = sectorSize;
  for (let index = 0; index < sectorSize / 4; index += 1) {
    file.writeUInt32LE(0xffffffff, fatOffset + index * 4);
  }
  file.writeUInt32LE(0xfffffffd, fatOffset);
  file.writeUInt32LE(0xfffffffe, fatOffset + 4);
  streamNames.forEach((_, index) => {
    file.writeUInt32LE(0xfffffffe, fatOffset + (2 + index) * 4);
  });

  const directoryOffset = sectorSize * 2;
  writeCfbDirectoryEntry(file, directoryOffset, {
    name: "Root Entry",
    type: 5,
    child: streamNames.length ? 1 : 0xffffffff,
  });
  streamNames.forEach((name, index) => {
    writeCfbDirectoryEntry(file, directoryOffset + (index + 1) * 128, {
      name,
      type: 2,
      right: index + 1 < streamNames.length ? index + 2 : 0xffffffff,
      startSector: 2 + index,
      size: sectorSize,
    });
  });
  return new Uint8Array(file);
}

function validDocx() {
  const contentTypes = ascii(
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
    "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">" +
    "<Override PartName=\"/word/document.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\"/>" +
    "</Types>",
  );
  const relationships = ascii(
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
    "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">" +
    "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"word/document.xml\"/>" +
    "</Relationships>",
  );
  const document = ascii(
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
    "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\"><w:body/></w:document>",
  );
  return createStoredZip([
    { name: "[Content_Types].xml", data: contentTypes },
    { name: "_rels/.rels", data: relationships },
    { name: "word/document.xml", data: document },
  ]);
}

test("profile uploads are stream-counted before multipart parsing", async () => {
  const withoutDeclaredLength = await readBoundedProfileAssetMultipartBody(
    stream(ascii("abc")),
    null,
  );
  assert.equal(new TextDecoder().decode(withoutDeclaredLength), "abc");

  const withMatchingLength = await readBoundedProfileAssetMultipartBody(
    stream(ascii("abc")),
    "3",
  );
  assert.equal(withMatchingLength.byteLength, 3);

  await expectAsyncBoundaryError(
    () => readBoundedProfileAssetMultipartBody(stream(ascii("abc")), "chunked"),
    "invalid-content-length",
    400,
  );
  await expectAsyncBoundaryError(
    () => readBoundedProfileAssetMultipartBody(
      stream(ascii("unused")),
      String(MAX_PROFILE_ASSET_MULTIPART_BYTES + 1),
    ),
    "request-too-large",
    413,
  );
  await expectAsyncBoundaryError(
    () => readBoundedProfileAssetMultipartBody(stream(ascii("abc")), "4"),
    "content-length-mismatch",
    400,
  );
  await expectAsyncBoundaryError(
    () => readBoundedProfileAssetMultipartBody(
      stream(new Uint8Array(MAX_PROFILE_ASSET_MULTIPART_BYTES), bytes(1)),
      null,
    ),
    "request-too-large",
    413,
  );
  await expectAsyncBoundaryError(
    () => readBoundedProfileAssetMultipartBody(null, null),
    "request-body-required",
    400,
  );
});

test("profile file metadata is rejected before File.arrayBuffer allocates another copy", () => {
  const image = validateProfileAssetFileMetadata({
    kind: "image",
    sizeBytes: 15 * 1024 * 1024,
    contentType: "IMAGE/PNG",
  });
  assert.equal(image.category, "organization-media");
  assert.equal(image.contentType, "image/png");

  expectBoundaryError(
    () => validateProfileAssetFileMetadata({
      kind: "logo",
      sizeBytes: 5 * 1024 * 1024 + 1,
      contentType: "image/png",
    }),
    "file-too-large",
    413,
  );
  expectBoundaryError(
    () => validateProfileAssetFileMetadata({
      kind: "image",
      sizeBytes: 10,
      contentType: "application/pdf",
    }),
    "unsupported-content-type",
    415,
  );
  expectBoundaryError(
    () => validateProfileAssetFileMetadata({
      kind: "video",
      sizeBytes: 10,
      contentType: "video/mp4",
    }),
    "unsupported-kind",
    400,
  );
  expectBoundaryError(
    () => validateProfileAssetFileMetadata({
      kind: "document",
      sizeBytes: 0,
      contentType: "application/pdf",
    }),
    "empty-file",
    400,
  );
});

test("declared profile asset MIME must match canonical and structural file evidence", () => {
  assert.doesNotThrow(() => assertProfileAssetFileSignature(
    "image/jpeg",
    bytes(0xff, 0xd8, 0xff, 0xe0),
  ));
  assert.doesNotThrow(() => assertProfileAssetFileSignature(
    "image/png",
    bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a),
  ));
  assert.doesNotThrow(() => assertProfileAssetFileSignature(
    "image/webp",
    bytes(0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50),
  ));
  assert.doesNotThrow(() => assertProfileAssetFileSignature(
    "application/pdf",
    ascii("\n%PDF-1.7"),
  ));
  assert.doesNotThrow(() => assertProfileAssetFileSignature(
    "application/msword",
    createCompoundFile(["WordDocument", "1Table"]),
  ));
  assert.doesNotThrow(() => assertProfileAssetFileSignature(
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    validDocx(),
  ));

  expectBoundaryError(
    () => assertProfileAssetFileSignature("image/png", ascii("<script>alert(1)</script>")),
    "content-type-mismatch",
    415,
  );
  expectBoundaryError(
    () => assertProfileAssetFileSignature("application/pdf", bytes(0x50, 0x4b, 0x03, 0x04)),
    "content-type-mismatch",
    415,
  );
  expectBoundaryError(
    () => assertProfileAssetFileSignature(
      "application/msword",
      createCompoundFile(["Workbook"]),
    ),
    "content-type-mismatch",
    415,
  );
  expectBoundaryError(
    () => assertProfileAssetFileSignature(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      new Uint8Array([
        0x50, 0x4b, 0x03, 0x04,
        ...ascii("[Content_Types].xml word/document.xml"),
      ]),
    ),
    "content-type-mismatch",
    415,
  );
  expectBoundaryError(
    () => assertProfileAssetFileSignature(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      createStoredZip([
        { name: "[Content_Types].xml", data: ascii("<Types/>") },
        { name: "_rels/.rels", data: ascii("<Relationships/>") },
        { name: "word/document.xml", data: ascii("<not-word/>") },
      ]),
    ),
    "content-type-mismatch",
    415,
  );
});
