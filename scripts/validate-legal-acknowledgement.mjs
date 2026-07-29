import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const model = await readFile(new URL("../src/domain/legal/model.ts", import.meta.url), "utf8");
const repository = await readFile(
  new URL("../src/domain/legal/repository.ts", import.meta.url),
  "utf8",
);

for (const required of ["terms-of-service", "platform-rules", "privacy-policy"]) {
  assert.ok(model.includes(`"${required}"`), `Missing required legal document kind: ${required}`);
}

assert.match(model, /"terms-of-service": "accepted"/);
assert.match(model, /"platform-rules": "accepted"/);
assert.match(model, /"privacy-policy": "acknowledged"/);

for (const field of [
  "userId",
  "membershipId",
  "organizationId",
  "documentVersionId",
  "documentKind",
  "documentVersion",
  "status",
  "recordedAt",
  "evidence",
]) {
  assert.ok(model.includes(`readonly ${field}`), `Legal acknowledgement must preserve ${field}.`);
}

assert.ok(
  !model.includes("termsAccepted") && !model.includes("privacyAccepted") && !model.includes("rulesAccepted"),
  "Legal state must not collapse versioned acknowledgements into boolean flags.",
);
assert.ok(
  model.includes("resolveLegalAcknowledgementGate"),
  "Legal domain must expose a current-version acknowledgement gate.",
);
assert.ok(
  model.includes("record.documentVersionId === version.id"),
  "Gate must require acknowledgement of the exact current document version.",
);
assert.ok(
  model.includes('source: "explicit-user-action"'),
  "Acknowledgement evidence must record explicit user action.",
);
assert.ok(
  model.includes('membership.status !== "active"'),
  "Inactive membership must not be allowed to record legal acknowledgement.",
);

for (const repositoryName of [
  "LegalDocumentVersionRepository",
  "LegalAcknowledgementRepository",
]) {
  assert.ok(repository.includes(repositoryName), `Missing repository port: ${repositoryName}`);
}
assert.match(repository, /append\(version: LegalDocumentVersion\)/);
assert.match(repository, /append\(record: LegalAcknowledgement\)/);
assert.ok(!/\bupdate\s*\(/.test(repository), "Legal repositories must not expose update operations.");
assert.ok(!/\bdelete\s*\(/.test(repository), "Legal repositories must not expose delete operations.");

console.log("Legal acknowledgement architecture guardrails passed.");
