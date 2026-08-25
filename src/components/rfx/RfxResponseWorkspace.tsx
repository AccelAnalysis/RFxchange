"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import type { RfxResponseItem } from "../../domain/rfx/cycle";
import type { RfxResponderWorkspace } from "../../infrastructure/rfx/rfx-cycle-runtime";
import { ParticipantShell } from "../participant/ParticipantWorkspace";
import styles from "./RfxResponseWorkspace.module.css";

type DraftItem = Readonly<{
  text: string;
  acknowledged: boolean;
  priceMinor: string;
  currency: string;
  attachmentAssetIds: readonly string[];
}>;

function draftFrom(item: RfxResponseItem): DraftItem {
  return Object.freeze({
    text: item.text,
    acknowledged: item.acknowledged,
    priceMinor: item.priceMinor === null ? "" : String(item.priceMinor),
    currency: item.currency ?? "USD",
    attachmentAssetIds: item.attachmentAssetIds,
  });
}

function initialDraft(workspace: RfxResponderWorkspace): Record<string, DraftItem> {
  return Object.fromEntries((workspace.response?.items ?? []).map((item) => [item.sectionId, draftFrom(item)]));
}

function responseItemPayload(item: RfxResponseItem, value: DraftItem) {
  if (item.format === "acknowledgment") return { sectionId: item.sectionId, acknowledged: value.acknowledged };
  if (item.format === "pricing") return {
    sectionId: item.sectionId,
    priceMinor: value.priceMinor === "" ? null : Number(value.priceMinor),
    currency: value.currency,
  };
  if (item.format === "attachment") return { sectionId: item.sectionId, attachmentAssetIds: value.attachmentAssetIds };
  return {
    sectionId: item.sectionId,
    text: value.text,
    attachmentAssetIds: item.attachmentsAllowed ? value.attachmentAssetIds : [],
  };
}

function stepFor(workspace: RfxResponderWorkspace): number {
  if (!workspace.response) return 0;
  if (workspace.response.status === "submitted") return 3;
  if (workspace.readiness?.status === "ready") return 2;
  return 1;
}

export function RfxResponseWorkspace({ initialWorkspace, returnHref }: Readonly<{
  initialWorkspace: RfxResponderWorkspace;
  returnHref: string;
}>) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [draft, setDraft] = useState<Record<string, DraftItem>>(() => initialDraft(initialWorkspace));
  const draftRef = useRef(draft);
  const committedRef = useRef(initialWorkspace.response);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [questionBusy, setQuestionBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [acknowledgedAddenda, setAcknowledgedAddenda] = useState<readonly string[]>(
    initialWorkspace.response?.acknowledgedAddendumIds ?? [],
  );

  const activeStep = stepFor(workspace);
  const response = workspace.response;
  const title = workspace.snapshot.aggregate.package?.title ?? workspace.snapshot.aggregate.requestFamily.labelSnapshot;

  function setDraftItem(sectionId: string, patch: Partial<DraftItem>) {
    setDraft((current) => {
      const next = { ...current, [sectionId]: Object.freeze({ ...current[sectionId], ...patch }) };
      draftRef.current = next;
      return next;
    });
  }

  async function refresh() {
    const result = await fetch(`/api/rfx-cycle?reference=${encodeURIComponent(workspace.snapshot.reference)}`, { credentials: "same-origin" });
    if (!result.ok) throw new Error("Could not refresh the response task.");
    const current = await result.json() as RfxResponderWorkspace;
    committedRef.current = current.response;
    setWorkspace(current);
    if (current.response) {
      const values = initialDraft(current);
      draftRef.current = values;
      setDraft(values);
      setAcknowledgedAddenda(current.response.acknowledgedAddendumIds);
    }
  }

  async function startResponse() {
    setSaving(true);
    setNotice(null);
    try {
      const result = await fetch("/api/rfx-cycle", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "start-response", reference: workspace.snapshot.reference }),
      });
      if (!result.ok) throw new Error("The response could not be started.");
      await refresh();
      setNotice("Response started. Your organization now has one shared response workspace for this RFx.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The response could not be started.");
    } finally {
      setSaving(false);
    }
  }

  function queueSave(sectionId: string, addendumIds = acknowledgedAddenda) {
    const item = committedRef.current?.items.find((candidate) => candidate.sectionId === sectionId);
    if (!item || !committedRef.current) return;
    setSaving(true);
    setNotice("Saving…");
    saveQueue.current = saveQueue.current.then(async () => {
      const currentResponse = committedRef.current;
      if (!currentResponse || currentResponse.status !== "draft") return;
      const committedItem = currentResponse.items.find((candidate) => candidate.sectionId === sectionId);
      const value = draftRef.current[sectionId];
      if (!committedItem || !value) return;
      const result = await fetch("/api/rfx-cycle", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save-response-item",
          reference: workspace.snapshot.reference,
          expectedVersion: currentResponse.version,
          item: responseItemPayload(committedItem, value),
          acknowledgedAddendumIds: addendumIds,
        }),
      });
      const payload = await result.json() as Partial<RfxResponderWorkspace> & { response?: RfxResponderWorkspace["response"]; readiness?: RfxResponderWorkspace["readiness"] };
      if (!result.ok || !payload.response) throw new Error("Autosave did not complete. Your unsaved entry is still on this screen.");
      committedRef.current = payload.response;
      setWorkspace((current) => ({ ...current, response: payload.response!, readiness: payload.readiness ?? current.readiness }));
      setNotice("Saved");
    }).catch((error) => {
      setNotice(error instanceof Error ? error.message : "Autosave did not complete.");
    }).finally(() => {
      setSaving(false);
    });
  }

  function toggleAddendum(addendumId: string, checked: boolean) {
    const next = checked
      ? [...new Set([...acknowledgedAddenda, addendumId])]
      : acknowledgedAddenda.filter((id) => id !== addendumId);
    setAcknowledgedAddenda(next);
    const first = response?.items[0];
    if (first) queueSave(first.sectionId, next);
  }

  async function askQuestion() {
    if (!question.trim()) return;
    setQuestionBusy(true);
    setNotice(null);
    try {
      const result = await fetch("/api/rfx-cycle", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "ask-question",
          commandId: `question:${crypto.randomUUID()}`,
          reference: workspace.snapshot.reference,
          question,
        }),
      });
      if (!result.ok) throw new Error("The question could not be sent.");
      setQuestion("");
      await refresh();
      setNotice("Question sent to the issuer.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The question could not be sent.");
    } finally {
      setQuestionBusy(false);
    }
  }

  async function submit() {
    if (!response || workspace.readiness?.status !== "ready") return;
    setSubmitBusy(true);
    setNotice(null);
    try {
      await saveQueue.current;
      const current = committedRef.current;
      if (!current) throw new Error("The response could not be loaded for submission.");
      const result = await fetch("/api/rfx-cycle", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "submit-response", reference: workspace.snapshot.reference, expectedVersion: current.version }),
      });
      if (!result.ok) throw new Error("Submission did not complete. Review the current readiness state and try again.");
      await refresh();
      setNotice("Submitted. RFxchange recorded an immutable submission receipt.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Submission did not complete.");
    } finally {
      setSubmitBusy(false);
    }
  }

  return <ParticipantShell activeItem="opportunities-rfx">
    <main className={styles.workspace} data-rfx-response-workspace>
      <header className={styles.header}>
        <p className={styles.eyebrow}>RFx response</p>
        <h1>{title}</h1>
        <p>Build the response as a short task flow. Your organization shares one response, and every save stays private from the issuer until submission.</p>
        <div className={styles.actions}><Link href={returnHref}>Back to opportunity</Link></div>
      </header>

      <nav className={styles.progress} aria-label="Response progress">
        {[
          "Start",
          "Build",
          "Review",
          "Status",
        ].map((label, index) => <span key={label} data-active={index === activeStep}>{label}</span>)}
      </nav>

      {!response ? <section className={styles.card}>
        <p className={styles.eyebrow}>Pursue → Respond</p>
        <h3>Start your organization’s response</h3>
        <p>The response is created from the RFx’s published requirements, response structure, and evaluation setup. Accepted teammates are carried into the response context.</p>
        <button className={styles.primary} type="button" disabled={saving} onClick={() => void startResponse()}>Start response</button>
      </section> : null}

      {response ? <>
        {workspace.team.length ? <section className={styles.section}>
          <h2>Response team</h2>
          <p>Accepted RFx teammates are connected to this pursuit. Their participation does not change the lead organization’s submission authority.</p>
          <ul className={styles.teamList}>{workspace.team.map((member) => <li key={member.id}>Accepted teammate · {member.proposedCapacity.replaceAll("-", " ")}</li>)}</ul>
        </section> : null}

        {response.status === "draft" ? <section className={styles.section}>
          <h2>Build response</h2>
          {response.items.map((item) => {
            const value = draft[item.sectionId] ?? draftFrom(item);
            return <article className={styles.card} key={item.sectionId} data-response-section={item.sectionId}>
              <div><p className={styles.eyebrow}>{item.required ? "Required" : "Optional"}</p><h3>{item.titleSnapshot}</h3></div>
              {item.instructionsSnapshot ? <p>{item.instructionsSnapshot}</p> : null}
              {item.format === "acknowledgment" ? <label><span>Acknowledge</span><input type="checkbox" checked={value.acknowledged} onChange={(event) => { setDraftItem(item.sectionId, { acknowledged: event.target.checked }); queueMicrotask(() => queueSave(item.sectionId)); }} /></label> : null}
              {item.format === "pricing" ? <div className={styles.inline}>
                <label><span>Price</span><input inputMode="decimal" value={value.priceMinor === "" ? "" : String(Number(value.priceMinor) / 100)} onChange={(event) => { const number = Number(event.target.value); setDraftItem(item.sectionId, { priceMinor: event.target.value === "" || !Number.isFinite(number) ? "" : String(Math.round(number * 100)) }); }} onBlur={() => queueSave(item.sectionId)} /></label>
                <label><span>Currency</span><input maxLength={3} value={value.currency} onChange={(event) => setDraftItem(item.sectionId, { currency: event.target.value.toUpperCase() })} onBlur={() => queueSave(item.sectionId)} /></label>
              </div> : null}
              {item.format === "narrative" || item.format === "structured-answer" ? <label><span>Your response</span><textarea maxLength={item.characterLimit ?? 20000} value={value.text} onChange={(event) => setDraftItem(item.sectionId, { text: event.target.value })} onBlur={() => queueSave(item.sectionId)} /></label> : null}
              {item.format === "attachment" || item.attachmentsAllowed ? <div className={styles.notice}>
                <strong>Attachments</strong>
                <p>Private response attachment upload is being connected to this section. Existing attachment references are preserved and validated before submission.</p>
                {value.attachmentAssetIds.length ? <p>{value.attachmentAssetIds.length} attachment{value.attachmentAssetIds.length === 1 ? "" : "s"} attached.</p> : null}
              </div> : null}
            </article>;
          })}
        </section> : null}

        <section className={styles.section}>
          <h2>Questions and addenda</h2>
          {workspace.addenda.length ? <ul className={styles.addendumList}>{workspace.addenda.map((item) => <li key={item.id}>
            <strong>{item.title}</strong><p>{item.body}</p>
            {response.status === "draft" && item.requiresAcknowledgment ? <label><input type="checkbox" checked={acknowledgedAddenda.includes(item.id)} onChange={(event) => toggleAddendum(item.id, event.target.checked)} /> I reviewed this addendum</label> : null}
          </li>)}</ul> : <p>No addenda have been issued.</p>}
          {response.status === "draft" ? <div className={styles.question}>
            <label><span>Ask the issuer a question</span><textarea value={question} maxLength={2000} onChange={(event) => setQuestion(event.target.value)} /></label>
            <button type="button" disabled={questionBusy || !question.trim()} onClick={() => void askQuestion()}>Send question</button>
          </div> : null}
          {workspace.questions.length ? <ul className={styles.questionList}>{workspace.questions.map((item) => <li key={item.id}><strong>Q:</strong> {item.question}{item.answer ? <><br /><strong>A:</strong> {item.answer}</> : <><br /><span>Awaiting issuer response</span></>}</li>)}</ul> : null}
        </section>

        <section className={styles.section}>
          <h2>Readiness</h2>
          <div className={styles.readiness} data-response-readiness={workspace.readiness?.status ?? "blocked"}>
            <strong>{workspace.readiness?.status === "ready" ? "Ready for review and submission" : "Response still needs attention"}</strong>
            <p>{workspace.readiness ? `${workspace.readiness.completedRequiredCount} of ${workspace.readiness.requiredCount} required items complete.` : "Readiness will appear after the response starts."}</p>
            {workspace.readiness?.blocking.length ? <ul>{workspace.readiness.blocking.map((item) => <li key={`${item.kind}:${item.reference}`}>{item.label}</li>)}</ul> : null}
          </div>
        </section>

        {response.status === "submitted" ? <section className={styles.card}>
          <p className={styles.eyebrow}>Submitted</p>
          <h3>Response received by RFxchange</h3>
          <p>The submitted response is locked. An immutable hosted receipt was recorded at {workspace.receipt?.submittedAt ? new Date(workspace.receipt.submittedAt).toLocaleString() : "submission"}.</p>
          {workspace.evaluation ? <p>Evaluation status: {workspace.evaluation.decision.replaceAll("-", " ")}.</p> : <p>Evaluation has not been finalized.</p>}
          {workspace.outcome ? <p>Execution status: {workspace.outcome.status}. {workspace.outcome.outcomeSummary}</p> : null}
        </section> : null}

        {response.status === "draft" ? <div className={styles.sticky}>
          <div><strong>{workspace.readiness?.status === "ready" ? "Ready to submit" : "Keep building"}</strong><p className={styles.status} role="status">{notice ?? (saving ? "Saving…" : "Changes save as you work.")}</p></div>
          <button className={styles.primary} type="button" disabled={submitBusy || saving || !workspace.canSubmit || workspace.readiness?.status !== "ready"} onClick={() => void submit()}>{submitBusy ? "Submitting…" : "Review & submit"}</button>
        </div> : <p className={styles.status} role="status">{notice}</p>}
      </> : <p className={styles.status} role="status">{notice}</p>}
    </main>
  </ParticipantShell>;
}
