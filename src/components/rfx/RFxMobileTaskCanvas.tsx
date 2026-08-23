"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { rfxMobileTaskCopy } from "../../application/rfx/rfx-mobile-task-locale";
import type { RfxAggregate } from "../../domain/rfx/model";
import { useI18n } from "../i18n/I18nProvider";

import styles from "./RFxMobileTaskCanvas.module.css";

type TaskDepth = "quick" | "guided" | "formal";

type BrowserSpeechRecognitionResult = ArrayLike<{ transcript: string }> & { isFinal?: boolean };
type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: {
    resultIndex: number;
    results: ArrayLike<BrowserSpeechRecognitionResult>;
  }) => void) | null;
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
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  if (target && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target?.focus({ preventScroll: true });
}

export function RFxMobileTaskCanvas({
  canCreate,
  drafts,
  selectedDraftId,
  creatingNew,
  children,
}: Readonly<{
  canCreate: boolean;
  drafts: readonly RfxAggregate[];
  selectedDraftId: string | null;
  creatingNew: boolean;
  children: ReactNode;
}>) {
  const { locale } = useI18n();
  const copy = rfxMobileTaskCopy(locale);
  const [depth, setDepth] = useState<TaskDepth>("quick");
  const [intent, setIntent] = useState("");
  const [dictating, setDictating] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  useEffect(() => {
    setSpeechAvailable(speechRecognitionConstructor() !== null);
    return () => recognitionRef.current?.stop();
  }, []);

  const depthHelp = depth === "quick"
    ? copy.quickHelp
    : depth === "guided"
      ? copy.guidedHelp
      : copy.formalHelp;

  function startDictation() {
    if (!canCreate) return;
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
        .slice(event.resultIndex)
        .filter((result) => result.isFinal !== false)
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

  function applyIntent() {
    if (!canCreate) return;
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
    if (!canCreate) return;
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
          {canCreate ? (
            <Link className={styles.newRfx} href="/opportunities/manage?create=1" aria-current={creatingNew ? "page" : undefined}>
              {copy.newRfx}
            </Link>
          ) : (
            <span className={styles.newRfx} aria-disabled="true">{copy.newRfx}</span>
          )}
        </header>

        {!canCreate ? <p className={styles.status} role="status">{copy.createUnavailable}</p> : null}

        <div className={styles.depthControl} role="group" aria-label="RFx authoring depth">
          {(["quick", "guided", "formal"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={depth === option}
              data-active={depth === option}
              disabled={!canCreate}
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
            disabled={!canCreate}
            onChange={(event) => setIntent(event.target.value)}
          />
        </label>

        <div className={styles.captureActions}>
          <button
            type="button"
            disabled={!canCreate || (!speechAvailable && !dictating)}
            aria-pressed={dictating}
            onClick={dictating ? stopDictation : startDictation}
          >
            {dictating ? copy.dictating : copy.dictate}
          </button>
          <button type="button" disabled title={copy.attachmentsUnavailable}>{copy.camera}</button>
          <button type="button" disabled title={copy.attachmentsUnavailable}>{copy.file}</button>
          <button type="button" disabled={!canCreate || !intent.trim()} onClick={applyIntent}>
            {copy.apply}
          </button>
        </div>
        <p className={styles.depthHelp}>{copy.attachmentsUnavailable}</p>

        {status ? <p className={styles.status} role="status">{status}</p> : null}

        <nav className={styles.taskRail} aria-label="RFx task stages">
          <button type="button" disabled={!canCreate} onClick={() => scrollToTarget("#rfx-need")}>{copy.need}</button>
          <button type="button" disabled={!canCreate} onClick={() => scrollToTarget("#rfx-scope-outputs")}>{copy.build}</button>
          <button type="button" disabled={!canCreate} onClick={() => scrollToTarget("#rfx-definition-requirements")}>{copy.define}</button>
          <button type="button" disabled={!canCreate} onClick={() => scrollToTarget("#rfx-readiness")}>{copy.review}</button>
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
