"use client";

import Link from "next/link";
import { useState } from "react";

import type { RfxEvaluation, RfxEvaluationFactorReview, RfxExecutionOutcome, RfxResponse } from "../../domain/rfx/cycle";
import type { RfxEvaluationFactor } from "../../domain/rfx/model";
import type { RfxIssuerWorkspace } from "../../infrastructure/rfx/rfx-cycle-runtime";
import { ParticipantShell } from "../participant/ParticipantWorkspace";
import styles from "./RfxIssuerEvaluationWorkspace.module.css";

type FactorDraft = Readonly<{ gate: "not-reviewed" | "pass" | "fail"; score: string; note: string }>;
type EvaluationDraft = Readonly<{
  factors: Readonly<Record<string, FactorDraft>>;
  overallNote: string;
  consensusNote: string;
  connectionNote: string;
}>;
type OutcomeDraft = Readonly<{ status: RfxExecutionOutcome["status"]; executionNote: string; outcomeSummary: string; outcomeValue: string }>;

function factorDraft(factor: RfxEvaluationFactor, review?: RfxEvaluationFactorReview): FactorDraft {
  return Object.freeze({
    gate: review?.gate ?? "not-reviewed",
    score: review?.scoreBasisPoints === null || review?.scoreBasisPoints === undefined ? "" : String(review.scoreBasisPoints / 100),
    note: review?.note ?? "",
  });
}

function initialEvaluationDraft(workspace: RfxIssuerWorkspace, viewerMembershipId: string): Record<string, EvaluationDraft> {
  const definitions = workspace.snapshot.aggregate.definition?.evaluationDefinition.factors ?? [];
  return Object.fromEntries(workspace.responses.map((response) => {
    const evaluation = workspace.evaluations.find((item) => item.responseId === response.id);
    const ownReview = evaluation?.reviews.find((item) => String(item.evaluatorMembershipId) === viewerMembershipId);
    return [response.id, Object.freeze({
      factors: Object.freeze(Object.fromEntries(definitions.map((factor) => [factor.id, factorDraft(factor, ownReview?.factors.find((item) => item.factorId === factor.id))]))),
      overallNote: ownReview?.overallNote ?? "",
      consensusNote: evaluation?.consensusNote ?? "",
      connectionNote: evaluation?.connectionNote ?? "",
    })];
  }));
}

function initialOutcomeDraft(workspace: RfxIssuerWorkspace): Record<string, OutcomeDraft> {
  return Object.fromEntries(workspace.outcomes.map((outcome) => [outcome.id, Object.freeze({
    status: outcome.status,
    executionNote: outcome.executionNote,
    outcomeSummary: outcome.outcomeSummary,
    outcomeValue: outcome.outcomeValue,
  })]));
}

function responseValue(item: RfxResponse["items"][number]): string {
  if (item.format === "acknowledgment") return item.acknowledged ? "Acknowledged" : "Not acknowledged";
  if (item.format === "pricing") return item.priceMinor === null || !item.currency ? "Not provided" : `${item.currency} ${(item.priceMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (item.format === "attachment") return item.attachmentAssetIds.length ? `${item.attachmentAssetIds.length} attachment${item.attachmentAssetIds.length === 1 ? "" : "s"}` : "No attachment";
  return item.text || "No response";
}

function requiresGate(factor: RfxEvaluationFactor): boolean {
  return factor.treatment === "required-condition" || factor.treatment === "required-and-scored";
}

function requiresScore(factor: RfxEvaluationFactor): boolean {
  return factor.treatment === "scored-factor" || factor.treatment === "required-and-scored";
}

export function RfxIssuerEvaluationWorkspace({ initialWorkspace, viewerMembershipId, returnHref }: Readonly<{
  initialWorkspace: RfxIssuerWorkspace;
  viewerMembershipId: string;
  returnHref: string;
}>) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [evaluationDrafts, setEvaluationDrafts] = useState<Record<string, EvaluationDraft>>(() => initialEvaluationDraft(initialWorkspace, viewerMembershipId));
  const [outcomeDrafts, setOutcomeDrafts] = useState<Record<string, OutcomeDraft>>(() => initialOutcomeDraft(initialWorkspace));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [addendumTitle, setAddendumTitle] = useState("");
  const [addendumBody, setAddendumBody] = useState("");
  const [addendumAck, setAddendumAck] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const definitions = [...(workspace.snapshot.aggregate.definition?.evaluationDefinition.factors ?? [])].sort((a, b) => a.order - b.order);
  const title = workspace.snapshot.aggregate.package?.title ?? workspace.snapshot.aggregate.requestFamily.labelSnapshot;
  const selectedResponseId = workspace.evaluations.find((item) => item.decision === "selected")?.responseId ?? null;

  async function refresh() {
    const result = await fetch(`/api/rfx-cycle?mode=issuer&rfxId=${encodeURIComponent(String(workspace.snapshot.rfxId))}`, { credentials: "same-origin" });
    if (!result.ok) throw new Error("Could not refresh issuer RFx tasks.");
    const next = await result.json() as RfxIssuerWorkspace;
    setWorkspace(next);
    setEvaluationDrafts(initialEvaluationDraft(next, viewerMembershipId));
    setOutcomeDrafts(initialOutcomeDraft(next));
  }

  async function post(body: Record<string, unknown>) {
    const result = await fetch("/api/rfx-cycle", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await result.json() as { error?: string };
    if (!result.ok) throw new Error(payload.error ?? "The RFx action did not complete.");
    return payload;
  }

  function updateFactor(responseId: string, factorId: string, patch: Partial<FactorDraft>) {
    setEvaluationDrafts((current) => ({
      ...current,
      [responseId]: Object.freeze({
        ...current[responseId],
        factors: Object.freeze({
          ...current[responseId].factors,
          [factorId]: Object.freeze({ ...current[responseId].factors[factorId], ...patch }),
        }),
      }),
    }));
  }

  function updateEvaluationDraft(responseId: string, patch: Partial<EvaluationDraft>) {
    setEvaluationDrafts((current) => ({ ...current, [responseId]: Object.freeze({ ...current[responseId], ...patch }) }));
  }

  async function answerQuestion(questionId: string) {
    const answer = answers[questionId]?.trim();
    if (!answer) return;
    setBusy(`question:${questionId}`); setNotice(null);
    try {
      await post({ action: "answer-question", questionId, answer });
      setAnswers((current) => ({ ...current, [questionId]: "" }));
      await refresh();
      setNotice("Answer published to the responder.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "The answer could not be saved."); }
    finally { setBusy(null); }
  }

  async function issueAddendum() {
    if (!addendumTitle.trim() || !addendumBody.trim()) return;
    setBusy("addendum"); setNotice(null);
    try {
      await post({
        action: "issue-addendum",
        commandId: `addendum:${crypto.randomUUID()}`,
        rfxId: String(workspace.snapshot.rfxId),
        title: addendumTitle,
        body: addendumBody,
        requiresAcknowledgment: addendumAck,
      });
      setAddendumTitle(""); setAddendumBody(""); setAddendumAck(true);
      await refresh();
      setNotice("Addendum issued. Required acknowledgments now participate in responder readiness.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "The addendum could not be issued."); }
    finally { setBusy(null); }
  }

  async function saveEvaluation(responseId: string) {
    const draft = evaluationDrafts[responseId];
    if (!draft) return;
    setBusy(`evaluation:${responseId}`); setNotice(null);
    try {
      await post({
        action: "save-evaluation",
        responseId,
        overallNote: draft.overallNote,
        factorInputs: definitions.map((factor) => {
          const value = draft.factors[factor.id];
          const score = value.score.trim() === "" ? null : Number(value.score);
          return {
            factorId: factor.id,
            gate: value.gate,
            scoreBasisPoints: score === null || !Number.isFinite(score) ? null : Math.round(score * 100),
            note: value.note,
          };
        }),
      });
      await refresh();
      setNotice("Evaluator review saved. Consensus updated from all saved reviews.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "The evaluator review could not be saved."); }
    finally { setBusy(null); }
  }

  async function decide(responseId: string, decision: "selected" | "not-selected") {
    const evaluation = workspace.evaluations.find((item) => item.responseId === responseId);
    const draft = evaluationDrafts[responseId];
    if (!evaluation || !draft) return;
    setBusy(`decision:${responseId}`); setNotice(null);
    try {
      await post({
        action: "decide",
        responseId,
        expectedVersion: evaluation.version,
        decision,
        consensusNote: draft.consensusNote,
        connectionNote: draft.connectionNote,
      });
      await refresh();
      setNotice(decision === "selected" ? "Response selected and connection/execution record opened." : "Response marked not selected.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "The decision could not be saved."); }
    finally { setBusy(null); }
  }

  function updateOutcomeDraft(outcomeId: string, patch: Partial<OutcomeDraft>) {
    setOutcomeDrafts((current) => ({ ...current, [outcomeId]: Object.freeze({ ...current[outcomeId], ...patch }) }));
  }

  async function saveOutcome(outcome: RfxExecutionOutcome) {
    const draft = outcomeDrafts[outcome.id];
    if (!draft) return;
    setBusy(`outcome:${outcome.id}`); setNotice(null);
    try {
      await post({
        action: "update-outcome",
        outcomeId: outcome.id,
        expectedVersion: outcome.version,
        status: draft.status,
        executionNote: draft.executionNote,
        outcomeSummary: draft.outcomeSummary,
        outcomeValue: draft.outcomeValue,
      });
      await refresh();
      setNotice(draft.status === "completed" ? "Outcome completed and emitted into RFxchange Intelligence input." : "Execution status updated.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "The execution update could not be saved."); }
    finally { setBusy(null); }
  }

  return <ParticipantShell activeItem="opportunities-rfx">
    <main className={styles.workspace} data-rfx-issuer-evaluation-workspace>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Issuer RFx cycle</p>
        <h1>{title}</h1>
        <p>Manage responder questions and changes, review only submitted responses, evaluate against the published factors, select, connect, and record execution outcome.</p>
        <div className={styles.actions}><Link href={returnHref}>Back to RFx workspace</Link></div>
      </header>

      <section className={styles.section}>
        <h2>Questions</h2>
        {workspace.questions.length ? <ul className={styles.questions}>{workspace.questions.map((question) => <li key={question.id}>
          <strong>{question.question}</strong>
          <p>Responder organization: {String(question.responderOrganizationId)}</p>
          {question.answer ? <p><strong>Answer:</strong> {question.answer}</p> : workspace.canManageRfx ? <div className={styles.card}>
            <label>Answer<textarea maxLength={4000} value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} /></label>
            <div className={styles.actions}><button type="button" disabled={busy !== null || !(answers[question.id] ?? "").trim()} onClick={() => void answerQuestion(question.id)}>Publish answer</button></div>
          </div> : <p>Awaiting an issuer member with RFx publication authority.</p>}
        </li>)}</ul> : <p>No responder questions yet.</p>}
      </section>

      <section className={styles.section}>
        <h2>Addenda</h2>
        {workspace.addenda.length ? <ul className={styles.addenda}>{workspace.addenda.map((addendum) => <li key={addendum.id}><strong>{addendum.title}</strong><p>{addendum.body}</p><span>{addendum.requiresAcknowledgment ? "Acknowledgment required" : "Informational"}</span></li>)}</ul> : <p>No addenda have been issued.</p>}
        {workspace.canManageRfx ? <div className={styles.card}>
          <h3>Issue an addendum</h3>
          <label>Title<input maxLength={240} value={addendumTitle} onChange={(event) => setAddendumTitle(event.target.value)} /></label>
          <label>Change or clarification<textarea maxLength={8000} value={addendumBody} onChange={(event) => setAddendumBody(event.target.value)} /></label>
          <label><input type="checkbox" checked={addendumAck} onChange={(event) => setAddendumAck(event.target.checked)} /> Require responder acknowledgment before submission</label>
          <div className={styles.actions}><button type="button" disabled={busy !== null || !addendumTitle.trim() || !addendumBody.trim()} onClick={() => void issueAddendum()}>Issue addendum</button></div>
        </div> : null}
      </section>

      <section className={styles.section}>
        <h2>Submitted responses</h2>
        <p>Draft responder work is never projected here. Only submitted response records enter evaluation.</p>
        {!workspace.responses.length ? <div className={styles.notice}>No submitted responses yet.</div> : workspace.responses.map((response, responseIndex) => {
          const receipt = workspace.receipts.find((item) => item.responseId === response.id);
          const evaluation = workspace.evaluations.find((item) => item.responseId === response.id);
          const outcome = workspace.outcomes.find((item) => item.responseId === response.id);
          const draft = evaluationDrafts[response.id];
          const ownReview = evaluation?.reviews.find((item) => String(item.evaluatorMembershipId) === viewerMembershipId);
          return <article className={styles.response} key={response.id} data-submitted-response={response.id}>
            <div><p className={styles.eyebrow}>Response {responseIndex + 1}</p><h3>Responder {String(response.responderOrganizationId)}</h3></div>
            <div className={styles.meta}><span>Submitted {receipt?.submittedAt ? new Date(receipt.submittedAt).toLocaleString() : response.submittedAt ? new Date(response.submittedAt).toLocaleString() : "—"}</span><span>{response.collaboratorOrganizationIds.length} teammate{response.collaboratorOrganizationIds.length === 1 ? "" : "s"}</span><span>{evaluation?.decision.replaceAll("-", " ") ?? "not evaluated"}</span></div>
            <ul className={styles.responseItems}>{response.items.map((item) => <li key={item.sectionId}><strong>{item.titleSnapshot}</strong><p>{responseValue(item)}</p>{item.attachmentAssetIds.length ? <div className={styles.actions}>{item.attachmentAssetIds.map((assetId, index) => <a key={assetId} href={`/api/rfx-cycle/attachment/${encodeURIComponent(assetId)}`}>Open attachment {index + 1}</a>)}</div> : null}</li>)}</ul>

            {workspace.canEvaluate && draft ? <section className={styles.card}>
              <div><p className={styles.eyebrow}>{ownReview ? "Update your review" : "Evaluator review"}</p><h3>Score published evaluation factors</h3></div>
              {definitions.map((factor) => {
                const value = draft.factors[factor.id];
                const consensus = evaluation?.consensus.find((item) => item.factorId === factor.id);
                return <div className={styles.factor} key={factor.id} data-evaluation-factor={factor.id}>
                  <h4>{factor.title}</h4>
                  <p>{factor.instructions}</p>
                  <div className={styles.meta}><span>{factor.treatment.replaceAll("-", " ")}</span>{factor.weightBasisPoints !== null ? <span>Weight {factor.weightBasisPoints / 100}%</span> : null}</div>
                  {requiresGate(factor) ? <label>Gate<select value={value.gate} onChange={(event) => updateFactor(response.id, factor.id, { gate: event.target.value as FactorDraft["gate"] })}><option value="not-reviewed">Not reviewed</option><option value="pass">Pass</option><option value="fail">Fail</option></select></label> : null}
                  {requiresScore(factor) ? <label>Score (0–100)<input type="number" min={0} max={100} step="0.01" inputMode="decimal" value={value.score} onChange={(event) => updateFactor(response.id, factor.id, { score: event.target.value })} /></label> : null}
                  <label>Evaluator note<textarea maxLength={2000} value={value.note} onChange={(event) => updateFactor(response.id, factor.id, { note: event.target.value })} /></label>
                  {consensus ? <div className={styles.consensus}><span>Consensus gate: {consensus.gate}</span>{consensus.averageScoreBasisPoints !== null ? <span>Average: {consensus.averageScoreBasisPoints / 100}</span> : null}<span>{consensus.reviewCount} review{consensus.reviewCount === 1 ? "" : "s"}</span></div> : null}
                </div>;
              })}
              <label>Overall evaluator note<textarea maxLength={4000} value={draft.overallNote} onChange={(event) => updateEvaluationDraft(response.id, { overallNote: event.target.value })} /></label>
              <div className={styles.actions}><button type="button" disabled={busy !== null || evaluation?.decision !== undefined && evaluation.decision !== "under-review"} onClick={() => void saveEvaluation(response.id)}>Save evaluator review</button></div>
            </section> : null}

            {workspace.canEvaluate && evaluation && evaluation.decision === "under-review" && draft ? <section className={styles.card}>
              <p className={styles.eyebrow}>Consensus and selection</p>
              <label>Consensus rationale<textarea maxLength={6000} value={draft.consensusNote} onChange={(event) => updateEvaluationDraft(response.id, { consensusNote: event.target.value })} /></label>
              <label>Connection / award handoff note<textarea maxLength={4000} value={draft.connectionNote} onChange={(event) => updateEvaluationDraft(response.id, { connectionNote: event.target.value })} /></label>
              <div className={styles.actions}><button className={styles.secondary} type="button" disabled={busy !== null || !draft.consensusNote.trim()} onClick={() => void decide(response.id, "not-selected")}>Not selected</button><button className={styles.primary} type="button" disabled={busy !== null || Boolean(selectedResponseId && selectedResponseId !== response.id) || !draft.consensusNote.trim() || !draft.connectionNote.trim()} onClick={() => void decide(response.id, "selected")}>Select & connect</button></div>
            </section> : null}

            {evaluation?.decision === "selected" && outcome ? <section className={styles.outcome}>
              <p className={styles.eyebrow}>Execute → Outcome → Intelligence</p>
              <h3>Execution and outcome</h3>
              {workspace.canEvaluate && outcomeDrafts[outcome.id] ? <>
                <label>Status<select value={outcomeDrafts[outcome.id].status} onChange={(event) => updateOutcomeDraft(outcome.id, { status: event.target.value as OutcomeDraft["status"] })}><option value="connected">Connected</option><option value="executing">Executing</option><option value="completed">Completed</option></select></label>
                <label>Execution note<textarea maxLength={6000} value={outcomeDrafts[outcome.id].executionNote} onChange={(event) => updateOutcomeDraft(outcome.id, { executionNote: event.target.value })} /></label>
                <label>Outcome summary<textarea maxLength={8000} value={outcomeDrafts[outcome.id].outcomeSummary} onChange={(event) => updateOutcomeDraft(outcome.id, { outcomeSummary: event.target.value })} /></label>
                <label>Outcome value / signal<input maxLength={2000} value={outcomeDrafts[outcome.id].outcomeValue} onChange={(event) => updateOutcomeDraft(outcome.id, { outcomeValue: event.target.value })} /></label>
                <div className={styles.actions}><button type="button" disabled={busy !== null || outcome.status === "completed"} onClick={() => void saveOutcome(outcome)}>Save execution update</button></div>
              </> : <p>{outcome.status}</p>}
            </section> : null}
          </article>;
        })}
      </section>
      <p className={styles.status} role="status">{notice}</p>
    </main>
  </ParticipantShell>;
}
