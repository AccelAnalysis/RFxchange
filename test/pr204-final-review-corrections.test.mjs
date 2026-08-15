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

test("text qualifier saves distinguish preservation, replacement, explicit removal, and acknowledged autosave baselines", async () => {
  const [builder, service] = await Promise.all([
    read("src/components/rfx/RFxDefinitionBuilder.tsx"),
    read("src/application/rfx/wave4-gap-governed-draft-service.ts"),
  ]);

  assert.match(builder, /qualifierBase: string/);
  assert.match(builder, /qualifierDirty: boolean/);
  assert.match(
    builder,
    /textQualifierIntent: item\.qualifierDirty[\s\S]{0,120}\? "set"[\s\S]{0,60}: "remove"[\s\S]{0,60}: "preserve"/,
    "The editor must send explicit preserve, set, or remove intent rather than overloading an empty array.",
  );
  assert.match(builder, /textQualifierBaseValue: item\.qualifierBase/);
  assert.match(
    builder,
    /qualifier: event\.target\.value,[\s\S]{0,60}qualifierDirty: true/,
    "Only an explicit participant edit may authorize replacement or removal of a text qualifier.",
  );
  assert.match(builder, /interface AcknowledgedDefinitionCommit/);
  assert.match(builder, /const submittedQualifierValues = new Map/);
  assert.match(
    builder,
    /acknowledgedDefinitionCommit\.current = Object\.freeze\([\s\S]{0,180}qualifierValues: submittedQualifierValues/,
    "A successful definition save must retain the exact qualifier values acknowledged by that aggregate version.",
  );
  assert.match(
    builder,
    /const acknowledgedCommit =[\s\S]{0,220}acknowledgedDefinitionCommit\.current/,
    "Only the exact aggregate returned by this editor's save may advance its edit baseline.",
  );
  assert.match(
    builder,
    /submittedQualifier === undefined \|\|[\s\S]{0,100}authoritative\.qualifier !== submittedQualifier[\s\S]{0,80}return requirement/,
    "Unrelated or mismatched aggregate refreshes must preserve the original dirty qualifier baseline.",
  );
  assert.match(
    builder,
    /qualifierBase: authoritative\.qualifier,[\s\S]{0,100}qualifierDirty: requirement\.qualifier !== submittedQualifier/,
    "The editor's own acknowledged save must advance the baseline while retaining later in-flight edits.",
  );
  assert.match(
    builder,
    /if \(!requirement\.qualifierDirty\)[\s\S]{0,180}qualifier: authoritative\.qualifier,[\s\S]{0,80}qualifierBase: authoritative\.qualifier/,
    "Untouched qualifier fields must absorb the latest authoritative value and baseline.",
  );

  assert.match(service, /type TextQualifierIntent = "preserve" \| "set" \| "remove"/);
  assert.match(service, /function textQualifierIntent/);
  assert.match(
    service,
    /if \(intent !== "preserve" && currentValue !== baseValue\)[\s\S]{0,180}The text qualifier changed before this definition save/,
    "Replacement and removal must conflict when the committed qualifier changed after the editor baseline.",
  );
  assert.match(
    service,
    /intent === "preserve"[\s\S]{0,100}\[firstExistingText\][\s\S]{0,120}intent === "set"[\s\S]{0,80}\[incomingText\][\s\S]{0,60}: \[\]/,
    "Preserve must retain the committed text, set must use the submitted text, and remove must emit no text qualifier.",
  );
  assert.match(
    service,
    /qualifiers: Object\.freeze\(\[\.\.\.effectiveText, \.\.\.preserved\]\)/,
    "Every non-first structured qualifier must survive all text-qualifier intents.",
  );
  assert.match(service, /const \{[\s\S]{0,120}textQualifierIntent: rawIntent,[\s\S]{0,120}textQualifierBaseValue: rawBaseValue,[\s\S]{0,120}\.\.\.canonicalRequirement/);
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

test("synchronous publication discovery also validates Firebase provider authority before saving a match", async () => {
  const repository = await read("src/infrastructure/rfx/wave4-gap-opportunity-discovery-repository.ts");
  const providerCheck = repository.indexOf("await this.providerAccountAuthoritative(search)");
  const baseSave = repository.indexOf("return super.saveMatch(bundle)");

  assert.match(repository, /getServerFirebaseAuth/);
  assert.match(repository, /private async providerAccountAuthoritative/);
  assert.match(repository, /override async saveMatch\(bundle: OpportunityMatchBundle\)/);
  assert.match(repository, /!account\.disabled/);
  assert.match(repository, /account\.emailVerified/);
  assert.match(repository, /auth\/user-not-found/);
  assert.ok(
    providerCheck >= 0 && baseSave > providerCheck,
    "The synchronous publication path must fail closed before delegating the match write.",
  );
  assert.match(
    repository,
    /search\.membershipId !== bundle\.match\.membershipId \|\|[\s\S]{0,80}!\(await this\.providerAccountAuthoritative\(search\)\)/,
    "The validated account must belong to the exact saved-search match tuple.",
  );
});
