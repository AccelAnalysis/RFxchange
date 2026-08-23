"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";

import { rfxMobileTaskCopy } from "../../application/rfx/rfx-mobile-task-locale";
import type { RfxAggregate } from "../../domain/rfx/model";
import { useI18n } from "../i18n/I18nProvider";

import styles from "./RFxMobileTaskCanvas.module.css";

type TaskDepth = "quick" | "guided" | "formal";

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function speechRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const candidate = window as typeof window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };
  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null;
}

function setControlledTextareaValue(element: HTMLTextAreaElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value");
  descriptor?.set?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

function scrollToTarget(selector: string) {
  const target = document.querySelector<HTMLElement>(selector);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (target && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target?.focus({ preventScroll: true });
}

export function RFxMobileTaskCanvas({
  drafts,
  selectedDraftId,
  creatingNew,
  children,
}: Readonly<{
  drafts: readonly RfxAggregate[];
  selectedDraftId: string | null;
  creatingNew: boolean;
  children: ReactNode;
}>) {
  const { locale } = useI18n();
  const copy = rfxMobileTaskCopy(locale);
  const [depth, setDepth] = useState<TaskDepth>("quick");
  const [intent, setIntent] = useState("");
  const [fileNames, setFileNames] = useState<readonly string[]>([]);
  const [dictating, setDictating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const speechAvailable = useMemo(() => speechRecognitionConstructor() !== null, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const depthHelp = depth === "quick"
    ? copy.quickHelp
    : depth === "guided"
      ? copy.guidedHelp
      : copy.formalHelp;

  function startDictation() {
    const Constructor = speechRecognitionConstructor();
    if (!Constructor) {
      setStatus(copy.dictationUnavailable);
      return;
    }
    recognitionRef.current?.stop();
    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = locale === "en-US" ? "en-US" : locale;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .flatMap((result) => Array.from(result))
        .map((item) => item.transcript.trim())
        .filter(Boolean)
        .join(" ");
      if (!transcript) return;
      setIntent((current) => `${current}${current.trim() ? " " : ""}${transcript}`.trimStart());
    };
    recognition.onerror = () => {
      setDictating(false);
      setStatus(copy.dictationUnavailable);
    };
    recognition.onend = () => setDictating(false);
    recognitionRef.current = recognition;
    setStatus(null);
    setDictating(true);
    recognition.start();
  }

  function stopDictation() {
    recognitionRef.current?.stop();
    setDictating(false);
  }

  function captureFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    setFileNames(files.map((file) => file.name));
    setStatus(files.length ? copy.localOnly : null);
  }

  function applyIntent() {
    const field = document.querySelector<HTMLTextAreaElement>("[data-rfx-source-statement]");
    if (!field) {
      setStatus(copy.applyFirst);
      return;
    }
    const normalized = intent.trim();
    if (!normalized) return;
    setControlledTextareaValue(field, normalized);
    field.focus();
    setStatus(copy.applied);
  }

  function chooseDepth(next: TaskDepth) {
    setDepth(next);
    const selector = next === "quick"
      ? "#rfx-need"
      : next === "guided"
        ? "#rfx-scope-outputs"
        : "#rfx-definition-requirements";
    if (document.querySelector(selector)) scrollToTarget(selector);
  }

  return (
    <>
      <section className={styles.mobileCanvas} aria-label={copy.ariaLabel} data-rfx-mobile-task-canvas>
        <header className={styles.hero}>
          <div>
            <span>{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
          <Link className={styles.newRfx} href="/opportunities/manage?create=1" aria-current={creatingNew ? "page" : undefined}>
            {copy.newRfx}
          </Link>
        </header>

        <div className={styles.depthControl} role="group" aria-label="RFx authoring depth">
          {(["quick", "guided", "formal"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={depth === option}
              data-active={depth === option}
              onClick={() => chooseDepth(option)}
            >
              {copy[option]}
            </button>
          ))}
        </div>
        <p className={styles.depthHelp}>{depthHelp}</p>

        <label className={styles.intentField}>
          <span>{copy.intentLabel}</span>
          <textarea
            value={intent}
            rows={3}
            maxLength={4000}
            placeholder={copy.intentPlaceholder}
            onChange={(event) => setIntent(event.target.value)}
          />
        </label>

        <div className={styles.captureActions}>
          <button
            type="button"
            disabled={!speechAvailable && !dictating}
            aria-pressed={dictating}
            onClick={dictating ? stopDictation : startDictation}
          >
            {dictating ? copy.dictating : copy.dictate}
          </button>
          <label>
            <span>{copy.camera}</span>
            <input type="file" accept="image/*" capture="environment" onChange={captureFiles} />
          </label>
          <label>
            <span>{copy.file}</span>
            <input type="file" multiple onChange={captureFiles} />
          </label>
          <button type="button" disabled={!intent.trim()} onClick={applyIntent}>
            {copy.apply}
          </button>
        </div>

        {fileNames.length ? (
          <div className={styles.deviceFiles}>
            <strong>{copy.selectedFiles}</strong>
            <span>{fileNames.slice(0, 3).join(" · ")}{fileNames.length > 3 ? ` +${fileNames.length - 3}` : ""}</span>
          </div>
        ) : null}
        {status ? <p className={styles.status} role="status">{status}</p> : null}

        <nav className={styles.taskRail} aria-label="RFx task stages">
          <button type="button" onClick={() => scrollToTarget("#rfx-need")}>{copy.need}</button>
          <button type="button" onClick={() => scrollToTarget("#rfx-scope-outputs")}>{copy.build}</button>
          <button type="button" onClick={() => scrollToTarget("#rfx-definition-requirements")}>{copy.define}</button>
          <button type="button" onClick={() => scrollToTarget("#rfx-readiness")}>{copy.review}</button>
        </nav>

        <div className={styles.resume}>
          <strong>{copy.resume}</strong>
          {drafts.length ? (
            <div>
              {drafts.slice(0, 4).map((draft) => (
                <Link
                  key={draft.id}
                  href={`/opportunities/manage?draft=${encodeURIComponent(draft.id)}`}
                  aria-current={draft.id === selectedDraftId && !creatingNew ? "page" : undefined}
                >
                  {draft.package?.title || draft.requestFamily.labelSnapshot}
                </Link>
              ))}
            </div>
          ) : <span>{copy.noDrafts}</span>}
        </div>
      </section>
      {children}
    </>
  );
}
