import assert from "node:assert/strict";
import test from "node:test";

import {
  CP07_FILE_EVIDENCE_COMMAND_DEFINITIONS,
  ACCELPO_EVIDENCE_OBJECTS_COLLECTION,
} from "../apps/accelpo/src/file-evidence/commands.ts";
import {
  FILE_EVIDENCE_COMMANDS,
  FILE_EVIDENCE_MAX_BYTES,
  fileEvidenceObjectPath,
  validateFileEvidenceDescriptor,
} from "../apps/accelpo/src/file-evidence/contracts.ts";
import { AccelPOFileEvidenceClient, releasedEvidenceReference } from "../apps/accelpo/src/file-evidence/client.ts";
import { CP07_FILE_EVIDENCE_PART } from "../apps/accelpo/src/file-evidence/part.ts";

function definition(name) {
  const found = CP07_FILE_EVIDENCE_COMMAND_DEFINITIONS.find((item) => item.name === name);
  assert.ok(found, `missing command ${name}`);
  return found;
}

function context({ target = null, currentVersion = null, commandId = "accelpo_cmd_1234567890abcdef", payload = {}, gets = new Map() } = {}) {
  const creates = [];
  const updates = [];
  return {
    creates,
    updates,
    value: {
      command: { payload },
      commandId,
      actor: { userId: "user-one", membershipId: "membership-one", organizationId: "org-one" },
      target,
      currentVersion,
      now: "2026-09-14T23:30:00.000Z",
      transaction: {
        async get(path) {
          return gets.get(path) ?? { path, exists: false, data: null };
        },
        create(path, data) { creates.push({ path, data }); },
        set() { throw new Error("unexpected set"); },
        update(path, data) { updates.push({ path, data }); },
      },
    },
  };
}

test("CP-07 uses tenant-scoped private object paths and bounded file validation", () => {
  assert.equal(
    fileEvidenceObjectPath("org-one", "evidence-one"),
    "organizations/org-one/private/accelpo-evidence/evidence-one/object",
  );
  assert.throws(() => fileEvidenceObjectPath("../org-two", "evidence-one"));
  assert.throws(() => fileEvidenceObjectPath("org-one", "../evidence-two"));
  assert.deepEqual(validateFileEvidenceDescriptor({
    originalFilename: " Vendor Quote.pdf ",
    contentType: "application/pdf",
    size: 1024,
  }), {
    originalFilename: "Vendor Quote.pdf",
    contentType: "application/pdf",
    size: 1024,
  });
  assert.throws(() => validateFileEvidenceDescriptor({ originalFilename: "receipt.exe", contentType: "application/octet-stream", size: 10 }));
  assert.throws(() => validateFileEvidenceDescriptor({ originalFilename: "large.pdf", contentType: "application/pdf", size: FILE_EVIDENCE_MAX_BYTES + 1 }));
});

test("CP-07 initiation is private by default and attached to the Purchase Case", async () => {
  const command = definition(FILE_EVIDENCE_COMMANDS.initiateUpload);
  assert.equal(command.permission, "purchasing.request");
  assert.equal(command.idempotency, "required");
  const target = command.target({ purchaseCaseId: "case-one" });
  assert.deepEqual(target.owner, { field: "requesterUserId", kind: "user" });

  const execution = context({
    payload: {
      purchaseCaseId: "case-one",
      purpose: "quote",
      originalFilename: "quote.pdf",
      contentType: "application/pdf",
      size: 2048,
    },
  });
  const outcome = await command.handle(execution.value);
  assert.equal(outcome.data.status, "pending-upload");
  assert.equal(outcome.data.releaseStatus, "private");
  assert.equal(outcome.data.purchaseCaseId, "case-one");
  assert.equal(execution.creates.length, 2);
  const metadata = execution.creates.find((entry) => entry.path.startsWith("accelpoEvidence/"));
  assert.equal(metadata.data.releaseStatus, "private");
  assert.equal(metadata.data.owningRecord.id, "case-one");
  assert.equal("downloadUrl" in metadata.data, false);
  assert.equal("publicUrl" in metadata.data, false);
});

test("CP-07 completion verifies the upload receipt and preserves metadata history", async () => {
  const command = definition(FILE_EVIDENCE_COMMANDS.completeUpload);
  const evidenceId = "evidence-123";
  const targetData = {
    id: evidenceId,
    organizationId: "org-one",
    purchaseCaseId: "case-one",
    uploaderUserId: "user-one",
    purpose: "receipt",
    originalFilename: "receipt.pdf",
    contentType: "application/pdf",
    size: 1200,
    status: "pending-upload",
    releaseStatus: "private",
    version: 0,
  };
  const receiptPath = `${ACCELPO_EVIDENCE_OBJECTS_COLLECTION}/${evidenceId}`;
  const execution = context({
    payload: { evidenceId },
    currentVersion: 0,
    target: { path: `accelpoEvidence/${evidenceId}`, exists: true, data: targetData },
    gets: new Map([[receiptPath, {
      path: receiptPath,
      exists: true,
      data: {
        organizationId: "org-one",
        evidenceId,
        objectPath: fileEvidenceObjectPath("org-one", evidenceId),
        status: "uploaded",
        uploadedByUserId: "user-one",
        originalFilename: "receipt.pdf",
        contentType: "application/pdf",
        size: 1200,
        sha256: "a".repeat(64),
      },
    }]]),
  });
  const outcome = await command.handle(execution.value);
  assert.equal(outcome.resultingVersion, 1);
  assert.equal(outcome.data.status, "uploaded");
  assert.equal(outcome.data.releaseStatus, "private");
  assert.equal(execution.updates[0].data.version, 1);
  assert.ok(execution.creates.some((entry) => entry.path.startsWith("accelpoEvidenceHistory/")));
});

test("CP-07 supplier release is explicit, versioned, and reversible", async () => {
  const released = definition(FILE_EVIDENCE_COMMANDS.release);
  assert.equal(released.permission, "rfx.publish");
  assert.equal(released.requiresExpectedVersion, true);
  const targetData = {
    id: "evidence-release",
    organizationId: "org-one",
    purchaseCaseId: "case-one",
    uploaderUserId: "user-one",
    purpose: "quote",
    originalFilename: "quote.pdf",
    contentType: "application/pdf",
    size: 100,
    status: "uploaded",
    releaseStatus: "private",
    version: 1,
  };
  const execution = context({
    payload: { evidenceId: "evidence-release" },
    currentVersion: 1,
    target: { path: "accelpoEvidence/evidence-release", exists: true, data: targetData },
  });
  const outcome = await released.handle(execution.value);
  assert.equal(outcome.resultingVersion, 2);
  assert.equal(outcome.data.releaseStatus, "released");
  assert.equal(execution.updates[0].data.releaseStatus, "released");

  assert.equal(releasedEvidenceReference({
    id: "evidence-release",
    purchaseCaseId: "case-one",
    purpose: "quote",
    originalFilename: "quote.pdf",
    contentType: "application/pdf",
    size: 100,
    createdAt: "2026-09-14T23:30:00.000Z",
    status: "uploaded",
    releaseStatus: "released",
  }).evidenceId, "evidence-release");
  assert.equal(releasedEvidenceReference({
    id: "private-file",
    purchaseCaseId: "case-one",
    purpose: "quote",
    originalFilename: "quote.pdf",
    contentType: "application/pdf",
    size: 100,
    createdAt: null,
    status: "uploaded",
    releaseStatus: "private",
  }), null);
});

test("CP-07 browser client sequences initiate, private upload, and completion without exposing storage URLs", async () => {
  const seen = [];
  const commandPort = {
    async execute(command) {
      seen.push(command);
      if (command.commandName === FILE_EVIDENCE_COMMANDS.initiateUpload) {
        return {
          commandPortVersion: 1,
          commandId: "cmd-init",
          commandName: command.commandName,
          requestId: command.requestId,
          status: "committed",
          replayed: false,
          resultingVersion: null,
          data: {
            evidenceId: "evidence-client",
            organizationId: "org-one",
            purchaseCaseId: "case-one",
            purpose: "photo",
            originalFilename: "photo.png",
            contentType: "image/png",
            size: 8,
            status: "pending-upload",
            releaseStatus: "private",
            version: 0,
          },
        };
      }
      return {
        commandPortVersion: 1,
        commandId: "cmd-complete",
        commandName: command.commandName,
        requestId: command.requestId,
        status: "committed",
        replayed: false,
        resultingVersion: 1,
        data: {
          evidenceId: "evidence-client",
          organizationId: "org-one",
          purchaseCaseId: "case-one",
          purpose: "photo",
          originalFilename: "photo.png",
          contentType: "image/png",
          size: 8,
          status: "uploaded",
          releaseStatus: "private",
          version: 1,
        },
      };
    },
  };
  let uploadUrl = null;
  const client = new AccelPOFileEvidenceClient({
    commandPort,
    queryProjection: { async read() { throw new Error("not used"); } },
    idFactory: () => "operation-one",
    fetcher: async (url) => {
      uploadUrl = String(url);
      return new Response(JSON.stringify({ evidenceId: "evidence-client", status: "uploaded" }), { status: 201, headers: { "content-type": "application/json" } });
    },
  });
  const file = new File([new Uint8Array([137,80,78,71,13,10,26,10])], "photo.png", { type: "image/png" });
  const result = await client.upload({ organizationId: "org-one", purchaseCaseId: "case-one", purpose: "photo" }, file);
  assert.equal(result.status, "uploaded");
  assert.equal(result.releaseStatus, "private");
  assert.equal(seen[0].commandName, FILE_EVIDENCE_COMMANDS.initiateUpload);
  assert.equal(seen[1].commandName, FILE_EVIDENCE_COMMANDS.completeUpload);
  assert.equal(seen[1].expectedVersion, 0);
  assert.equal(uploadUrl, "/api/accelpo/evidence/evidence-client/content");
  assert.equal("objectPath" in result, false);
  assert.equal("downloadUrl" in result, false);
});

test("CP-07 registers only service connection points and no user-facing route", () => {
  assert.equal(CP07_FILE_EVIDENCE_PART.id, "CP-07");
  assert.deepEqual(CP07_FILE_EVIDENCE_PART.routes, []);
  assert.ok(CP07_FILE_EVIDENCE_PART.connectionPoints.includes("FileEvidence"));
  assert.ok(CP07_FILE_EVIDENCE_PART.connectionPoints.includes("CommandPort"));
  assert.ok(CP07_FILE_EVIDENCE_PART.connectionPoints.includes("QueryProjection"));
});
