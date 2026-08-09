import assert from "node:assert/strict";
import test from "node:test";

import {
  assertProfileAssetFileSignature,
  MAX_PROFILE_ASSET_MULTIPART_BYTES,
  OrganizationAssetUploadBoundaryError,
  requireBoundedMultipartContentLength,
  validateProfileAssetFileMetadata,
} from "../src/application/storage/organization-asset-upload-boundary.ts";

function bytes(...values) {
  return new Uint8Array(values);
}

function ascii(value) {
  return new Uint8Array([...value].map((character) => character.charCodeAt(0)));
}

function expectBoundaryError(fn, code, status) {
  assert.throws(fn, (error) =>
    error instanceof OrganizationAssetUploadBoundaryError &&
    error.code === code &&
    error.status === status,
  );
}

test("profile uploads require a bounded request envelope before multipart parsing", () => {
  expectBoundaryError(
    () => requireBoundedMultipartContentLength(null),
    "length-required",
    411,
  );
  expectBoundaryError(
    () => requireBoundedMultipartContentLength("chunked"),
    "length-required",
    411,
  );
  expectBoundaryError(
    () => requireBoundedMultipartContentLength(String(MAX_PROFILE_ASSET_MULTIPART_BYTES + 1)),
    "request-too-large",
    413,
  );
  assert.equal(
    requireBoundedMultipartContentLength(String(MAX_PROFILE_ASSET_MULTIPART_BYTES)),
    MAX_PROFILE_ASSET_MULTIPART_BYTES,
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

test("declared profile asset MIME must match canonical file signatures", () => {
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
    bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1),
  ));
  assert.doesNotThrow(() => assertProfileAssetFileSignature(
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    new Uint8Array([
      0x50, 0x4b, 0x03, 0x04,
      ...ascii("[Content_Types].xml word/document.xml"),
    ]),
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
});
