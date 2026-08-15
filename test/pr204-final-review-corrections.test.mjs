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
