import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("mobile RFx task canvas layers plain-language authoring over the existing canonical workspace", () => {
  const page = read("app/opportunities/manage/page.tsx");
  const canvas = read("src/components/rfx/RFxMobileTaskCanvas.tsx");
  assert.match(page, /<RFxMobileTaskCanvas[\s\S]*<RFxDraftWorkspace/);
  assert.match(page, /creatingNew = canCreate && createParam === "1"/);
  assert.match(page, /selectedDraftId = creatingNew\s*\? null/);
  assert.match(page, /canCreate=\{canCreate\}/);
  assert.match(page, /key=\{workspaceSelectionKey\}/);
  assert.match(canvas, /data-rfx-mobile-task-canvas/);
  assert.match(canvas, /href="\/opportunities\/manage\?create=1"/);
  assert.match(canvas, /href=\{`\/opportunities\/manage\?draft=/);
  assert.doesNotMatch(canvas, /fetch\(|firebase|firestore|postgres|neon|maplibre|exchange_records/i);
});

test("query-selected drafts remount the canonical workspace instead of leaving stale client selection", () => {
  const page = read("app/opportunities/manage/page.tsx");
  assert.match(page, /workspaceSelectionKey = selectedDraftId \?\? \(creatingNew \? "new" : "none"\)/);
  assert.match(page, /<RFxDraftWorkspace\s+key=\{workspaceSelectionKey\}/);
});

test("Quick Guided and Formal change presentation depth without changing RFx schema or authority", () => {
  const canvas = read("src/components/rfx/RFxMobileTaskCanvas.tsx");
  assert.match(canvas, /type TaskDepth = "quick" \| "guided" \| "formal"/);
  assert.match(canvas, /#rfx-need/);
  assert.match(canvas, /#rfx-scope-outputs/);
  assert.match(canvas, /#rfx-definition-requirements/);
  assert.match(canvas, /#rfx-readiness/);
  assert.match(canvas, /disabled=\{!canCreate\}/);
  assert.doesNotMatch(canvas, /requestFamilySnapshot|RfxPackageInput|save-package|publish-rfx|expectedVersion/);
});

test("dictation is progressive while unavailable attachment capture remains visibly disabled", () => {
  const canvas = read("src/components/rfx/RFxMobileTaskCanvas.tsx");
  const packageBuilder = read("src/components/rfx/RFxPackageBuilder.tsx");
  assert.match(canvas, /SpeechRecognition/);
  assert.match(canvas, /webkitSpeechRecognition/);
  assert.match(canvas, /const Constructor = speechRecognitionConstructor\(\)/);
  assert.match(canvas, /if \(!Constructor\) \{\s*setStatus\(copy\.dictationUnavailable\);\s*return;/);
  assert.doesNotMatch(canvas, /speechAvailable|setSpeechAvailable/);
  assert.match(canvas, /\.slice\(event\.resultIndex\)/);
  assert.match(canvas, /result\.isFinal !== false/);
  assert.match(canvas, /disabled title=\{copy\.attachmentsUnavailable\}/);
  assert.doesNotMatch(canvas, /type="file"|capture="environment"|multiple onChange=/);
  assert.match(canvas, /querySelector<HTMLTextAreaElement>\("\[data-rfx-source-statement\]"\)/);
  assert.match(canvas, /dispatchEvent\(new Event\("input", \{ bubbles: true \}\)\)/);
  assert.match(packageBuilder, /data-rfx-source-statement/);
  assert.match(packageBuilder, /change\("sourceStatement", event\.target\.value\)/);
  assert.doesNotMatch(canvas, /localStorage|indexedDB|sessionStorage|upload|arrayBuffer|FormData/);
});

test("mobile RFx task copy covers permission and progressive-attachment boundaries in all five locales", () => {
  const locale = read("src/application/rfx/rfx-mobile-task-locale.ts");
  for (const key of ['"en-US"', "es:", "fr:", "it:", "de:"]) assert.match(locale, new RegExp(key));
  for (const key of ["quick", "guided", "formal", "intentLabel", "dictate", "camera", "file", "apply", "review", "createUnavailable", "attachmentsUnavailable"]) {
    assert.match(locale, new RegExp(`${key}:`));
  }
});

test("390px RFx authoring remains thumb-sized and reduced-motion safe", () => {
  const canvas = read("src/components/rfx/RFxMobileTaskCanvas.tsx");
  const css = read("src/components/rfx/RFxMobileTaskCanvas.module.css");
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /min-height: 2\.65rem/);
  assert.match(css, /env\(safe-area-inset-top/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(canvas, /matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/);
  assert.match(canvas, /behavior: reducedMotion \? "auto" : "smooth"/);
});
