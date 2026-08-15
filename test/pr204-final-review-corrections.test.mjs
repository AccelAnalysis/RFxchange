import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ACQ-009 resumes the exact bound participant-only opportunity after activation", async () => {
  const continuation = await read("app/acquisition/continue/page.tsx");
  const resumeIndex = continuation.indexOf("createServerAcquisitionContextService().resume");
  const projectionIndex = continuation.indexOf("const participantOpportunity");
  const redirectIndex = continuation.indexOf("participantOpportunity.reference");

  assert.ok(resumeIndex >= 0, "The bound acquisition context must be resumed.");
  assert.ok(
    projectionIndex > resumeIndex,
    "Opportunity authority must be resolved after the bound context is resumed.",
  );
  assert.ok(
    redirectIndex > projectionIndex,
    "The continuation must return to the exact resolved opportunity.",
  );
  assert.match(
    continuation,
    /resolvePublicOpportunityProjection\(\s*acquisition\.subjectReference,\s*true,\s*\)/,
    "An OPEN participant must resolve the bound reference through participant-authorized projection authority.",
  );
  assert.match(
    continuation,
    /`\/opportunities\/\$\{encodeURIComponent\(participantOpportunity\.reference\)\}`/,
    "The resumed destination must retain the exact authoritative opportunity reference.",
  );
  assert.ok(
    continuation.indexOf('redirect("/exchange")') > resumeIndex,
    "Generic Exchange routing must not run before acquisition resumption and subject handling.",
  );
});

test("structured qualifier input survives unrelated same-draft version refreshes", async () => {
  const workspace = await read("src/components/rfx/RFxDraftWorkspace.tsx");

  assert.match(
    workspace,
    /<RFxStructuredQualifierEditor[\s\S]{0,180}key=\{`\$\{selectedDraft\.id\}:qualifiers`\}/,
    "The qualifier editor must remain mounted for the same RFx draft.",
  );
  assert.doesNotMatch(
    workspace,
    /key=\{`\$\{selectedDraft\.id\}:\$\{selectedDraft\.version\}:qualifiers`\}/,
    "Unrelated aggregate version commits must not erase in-progress qualifier input.",
  );
});

test("a stale partial definition save cannot remove a concurrently committed first text qualifier", async () => {
  const service = await read("src/application/rfx/wave4-gap-governed-draft-service.ts");

  assert.match(service, /const firstExistingText = firstExistingTextIndex >= 0/);
  assert.match(
    service,
    /const effectiveIncoming = incoming\.length === 0 && firstExistingText[\s\S]{0,100}\? \[firstExistingText\][\s\S]{0,40}: incoming/,
    "An empty partial text-qualifier payload must retain the current committed first text qualifier.",
  );
  assert.match(
    service,
    /qualifiers: Object\.freeze\(\[\.\.\.effectiveIncoming, \.\.\.preserved\]\)/,
    "Lossless qualifier merging must combine the effective text state with every other structured qualifier.",
  );
});

test("durable discovery evaluation checks Firebase provider authority before creating a match", async () => {
  const worker = await read("functions/src/opportunity-discovery-evaluation-functions.ts");
  const providerCheck = worker.indexOf("await providerAccountAuthoritative(user)");
  const matchWrite = worker.indexOf("transaction.create(matchRef");

  assert.match(worker, /getFunctionsAuth/);
  assert.match(worker, /async function providerAccountAuthoritative/);
  assert.match(worker, /!account\.disabled/);
  assert.match(worker, /account\.emailVerified/);
  assert.match(worker, /auth\/user-not-found/);
  assert.ok(
    providerCheck >= 0 && matchWrite > providerCheck,
    "Firebase account status must be inspected before the immutable match tuple is persisted.",
  );
  assert.match(
    worker,
    /user\.id !== search\.userId \|\|[\s\S]{0,80}!providerAccountValid/,
    "Provider authority must be part of the fail-closed match authorization decision.",
  );
});
