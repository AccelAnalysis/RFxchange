"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { RfxResponseItem } from "../../domain/rfx/cycle";
import type { RfxResponseCollaborationWorkspace as CollaborationWorkspace } from "../../infrastructure/rfx/rfx-response-collaboration-runtime";
import { ParticipantShell } from "../participant/ParticipantWorkspace";
import styles from "./RfxResponseCollaborationWorkspace.module.css";

type ItemDraft = Readonly<{
  text: string;
  acknowledged: boolean;
  priceMinor: string;
  currency: string;
  attachmentAssetIds: readonly string[];
}>;

function itemDraft(item: RfxResponseItem): ItemDraft {
  return Object.freeze({
    text: item.text,
    acknowledged: item.acknowledged,
    priceMinor: item.priceMinor === null ? "" : String(item.priceMinor),
    currency: item.currency ?? "USD",
    attachmentAssetIds: item.attachmentAssetIds,
  });
}

function itemPayload(item: RfxResponseItem, draft: ItemDraft) {
  if (item.format === "acknowledgment") return { sectionId: item.sectionId, acknowledged: draft.acknowledged };
  if (item.format === "pricing") return {
    sectionId: item.sectionId,
    priceMinor: draft.priceMinor === "" ? null : Number(draft.priceMinor),
    currency: draft.currency,
  };
  if (item.format === "attachment") return { sectionId: item.sectionId, attachmentAssetIds: draft.attachmentAssetIds };
  return {
    sectionId: item.sectionId,
    text: draft.text,
    attachmentAssetIds: item.attachmentsAllowed ? draft.attachmentAssetIds : [],
  };
}

export function RfxResponseCollaborationWorkspace({
  initialWorkspace,
  reference,
  leadOrganizationId,
  returnHref,
}: Readonly<{
  initialWorkspace: CollaborationWorkspace;
  reference: string;
  leadOrganizationId: string | null;
  returnHref: string;
}>) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedParticipation, setSelectedParticipation] = useState<Record<string, string>>({});
  const [responsibilities, setResponsibilities] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>(() => Object.fromEntries(
    initialWorkspace.response.items.map((item) => [item.sectionId, itemDraft(item)]),
  ));

  const title = workspace.role === "lead" ? "Coordinate response work" : "Contribute to the response";
  const assignedBySection = useMemo(() => {
    const map = new Map<string, typeof workspace.assignments>();
    for (const assignment of workspace.assignments.filter((item) => item.status === "active")) {
      map.set(assignment.sectionId, Object.freeze([...(map.get(assignment.sectionId) ?? []), assignment]));
    }
    return map;
  }, [workspace.assignments]);

  async function reload() {
    const params = new URLSearchParams({ reference });
    if (leadOrganizationId) params.set("lead", leadOrganizationId);
    const result = await fetch(`/api/rfx-cycle/collaboration?${params.toString()}`, { credentials: "same-origin" });
    if (!result.ok) throw new Error("Could not refresh the shared response workspace.");
    const next = await result.json() as CollaborationWorkspace;
    setWorkspace(next);
    setDrafts(Object.fromEntries(next.response.items.map((item) => [item.sectionId, itemDraft(item)])));
  }

  async function post(body: Record<string, unknown>) {
    const result = await fetch("/api/rfx-cycle/collaboration", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await result.json() as { error?: string };
    if (!result.ok) throw new Error(payload.error ?? "The collaboration action did not complete.");
    return payload;
  }

  async function assign(sectionId: string) {
    if (workspace.role !== "lead") return;
    const participationId = selectedParticipation[sectionId];
    const responsibilitySummary = responsibilities[sectionId]?.trim();
    if (!participationId || !responsibilitySummary) return;
    setBusy(`assign:${sectionId}`); setNotice(null);
    try {
      await post({ action: "assign-section", reference, participationId, sectionId, responsibilitySummary });
      await reload();
      setNotice("Response work assigned. Team acceptance alone did not grant edit authority; this assignment did.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The response work could not be assigned.");
    } finally { setBusy(null); }
  }

  async function revoke(assignmentId: string, expectedVersion: number) {
    setBusy(`revoke:${assignmentId}`); setNotice(null);
    try {
      await post({ action: "revoke-assignment", assignmentId, expectedVersion });
      await reload();
      setNotice("Response assignment revoked.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The response assignment could not be revoked.");
    } finally { setBusy(null); }
  }

  function updateDraft(sectionId: string, patch: Partial<ItemDraft>) {
    setDrafts((current) => ({ ...current, [sectionId]: Object.freeze({ ...current[sectionId], ...patch }) }));
  }

  async function saveContribution(item: RfxResponseItem, override?: ItemDraft) {
    if (workspace.role !== "contributor" || !workspace.canEdit) return;
    const value = override ?? drafts[item.sectionId];
    if (!value) return;
    setBusy(`save:${item.sectionId}`); setNotice("Saving contribution…");
    try {
      const result = await fetch("/api/rfx-cycle/collaboration", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save-contribution",
          reference,
          leadOrganizationId: String(workspace.participation.leadOrganizationId),
          expectedVersion: workspace.response.version,
          item: itemPayload(item, value),
        }),
      });
      const payload = await result.json() as { response?: CollaborationWorkspace["response"]; error?: string };
      if (!result.ok || !payload.response) throw new Error(payload.error ?? "The contribution could not be saved.");
      setWorkspace((current) => current.role === "contributor" ? Object.freeze({ ...current, response: payload.response! }) : current);
      setNotice("Saved to the lead organization’s shared response.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The contribution could not be saved.");
    } finally { setBusy(null); }
  }

  async function upload(item: RfxResponseItem, file: File | null) {
    if (!file || workspace.role !== "contributor" || !workspace.canEdit) return;
    setBusy(`upload:${item.sectionId}`); setNotice("Uploading contribution…");
    try {
      const form = new FormData();
      form.set("commandId", `collab:${crypto.randomUUID()}`);
      form.set("reference", reference);
      form.set("leadOrganizationId", String(workspace.participation.leadOrganizationId));
      form.set("sectionId", item.sectionId);
      form.set("file", file);
      const result = await fetch("/api/rfx-cycle/collaboration/attachment", { method: "POST", credentials: "same-origin", body: form });
      const payload = await result.json() as { assetId?: string; filename?: string; error?: string };
      if (!result.ok || !payload.assetId) throw new Error(payload.error ?? "The contribution attachment could not be uploaded.");
      const current = drafts[item.sectionId] ?? itemDraft(item);
      const next = Object.freeze({ ...current, attachmentAssetIds: Object.freeze([...new Set([...current.attachmentAssetIds, payload.assetId])]) });
      updateDraft(item.sectionId, next);
      await saveContribution(item, next);
      setNotice(`${payload.filename ?? file.name} added to your assigned response section.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The contribution attachment could not be uploaded.");
    } finally { setBusy(null); }
  }

  return <ParticipantShell activeItem="opportunities-rfx">
    <main className={styles.workspace} data-rfx-response-collaboration={workspace.role}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>RFx response collaboration</p>
        <h1>{title}</h1>
        <p>{workspace.role === "lead"
          ? "Accepted teammates are eligible for collaboration, but they cannot edit the response until you explicitly assign response work."
          : "You can edit only the response sections the lead organization explicitly assigned to your organization. You cannot submit or change the lead organization’s other response content."}</p>
        <div className={styles.actions}><Link href={returnHref}>Back</Link></div>
      </header>

      {workspace.role === "lead" ? <>
        <section className={styles.section}>
          <h2>Accepted response team</h2>
          {workspace.team.length ? <ul className={styles.team}>{workspace.team.map((member) => <li key={member.id}>
            <strong>{String(member.participantOrganizationId)}</strong><br /><span>{member.proposedCapacity.replaceAll("-", " ")} · {member.capabilityLabelSnapshot}</span>
          </li>)}</ul> : <div className={styles.notice}>No accepted external teammates yet. Internal users with response-create authority already share the organization response.</div>}
        </section>
        <section className={styles.section}>
          <h2>Assign response work</h2>
          {workspace.response.items.map((item) => <article className={styles.card} key={item.sectionId}>
            <div><p className={styles.eyebrow}>{item.required ? "Required" : "Optional"}</p><h3>{item.titleSnapshot}</h3></div>
            <p>{item.instructionsSnapshot}</p>
            {assignedBySection.get(item.sectionId)?.map((assignment) => <div className={styles.assignment} key={assignment.id}>
              <strong>Assigned to {String(assignment.participantOrganizationId)}</strong>
              <span>{assignment.responsibilitySummary}</span><small>{assignment.proposedCapacitySnapshot.replaceAll("-", " ")}</small>
              <div className={styles.actions}><button className={styles.secondary} type="button" disabled={busy !== null || workspace.response.status !== "draft" || !workspace.deadlineOpen} onClick={() => void revoke(assignment.id, assignment.version)}>Revoke</button></div>
            </div>)}
            {workspace.team.length && workspace.response.status === "draft" && workspace.deadlineOpen ? <div className={styles.split}>
              <label>Teammate<select value={selectedParticipation[item.sectionId] ?? ""} onChange={(event) => setSelectedParticipation((current) => ({ ...current, [item.sectionId]: event.target.value }))}><option value="">Choose teammate</option>{workspace.team.map((member) => <option key={member.id} value={member.id}>{String(member.participantOrganizationId)} · {member.capabilityLabelSnapshot}</option>)}</select></label>
              <label>Responsibility<input maxLength={600} value={responsibilities[item.sectionId] ?? ""} onChange={(event) => setResponsibilities((current) => ({ ...current, [item.sectionId]: event.target.value }))} placeholder="What should this teammate provide for this section?" /></label>
              <div className={styles.actions}><button type="button" disabled={busy !== null || !selectedParticipation[item.sectionId] || !(responsibilities[item.sectionId] ?? "").trim()} onClick={() => void assign(item.sectionId)}>Assign work</button></div>
            </div> : null}
          </article>)}
        </section>
      </> : <section className={styles.section}>
        <h2>Your assigned response work</h2>
        {workspace.assignments.map((assignment) => <div className={styles.assignment} key={assignment.id}><strong>{assignment.sectionTitleSnapshot}</strong><span>{assignment.responsibilitySummary}</span></div>)}
        {workspace.response.items.map((item) => {
          const draft = drafts[item.sectionId] ?? itemDraft(item);
          const acceptsAttachments = item.format === "attachment" || item.attachmentsAllowed;
          return <article className={styles.card} key={item.sectionId} data-collaboration-section={item.sectionId}>
            <h3>{item.titleSnapshot}</h3><p>{item.instructionsSnapshot}</p>
            {item.format === "acknowledgment" ? <label><span>Acknowledge</span><input type="checkbox" checked={draft.acknowledged} disabled={!workspace.canEdit} onChange={(event) => { const next = Object.freeze({ ...draft, acknowledged: event.target.checked }); updateDraft(item.sectionId, next); void saveContribution(item, next); }} /></label> : null}
            {item.format === "pricing" ? <div className={styles.split}><label>Price<input inputMode="decimal" disabled={!workspace.canEdit} value={draft.priceMinor === "" ? "" : String(Number(draft.priceMinor) / 100)} onChange={(event) => { const number = Number(event.target.value); updateDraft(item.sectionId, { priceMinor: event.target.value === "" || !Number.isFinite(number) ? "" : String(Math.round(number * 100)) }); }} onBlur={() => void saveContribution(item)} /></label><label>Currency<input maxLength={3} disabled={!workspace.canEdit} value={draft.currency} onChange={(event) => updateDraft(item.sectionId, { currency: event.target.value.toUpperCase() })} onBlur={() => void saveContribution(item)} /></label></div> : null}
            {item.format === "narrative" || item.format === "structured-answer" ? <label>Your contribution<textarea maxLength={item.characterLimit ?? 20000} disabled={!workspace.canEdit} value={draft.text} onChange={(event) => updateDraft(item.sectionId, { text: event.target.value })} onBlur={() => void saveContribution(item)} /></label> : null}
            {acceptsAttachments ? <div className={styles.notice}><strong>Documents / camera</strong><p>Add files directly to this assigned section. They are stored inside the lead organization’s private response package and cannot be submitted by your organization.</p><div className={styles.actions}><label className={styles.secondary}>Camera<input hidden type="file" accept="image/jpeg,image/png" capture="environment" disabled={!workspace.canEdit || busy !== null} onChange={(event) => { const file = event.currentTarget.files?.[0] ?? null; event.currentTarget.value = ""; void upload(item, file); }} /></label><label className={styles.secondary}>File<input hidden type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png" disabled={!workspace.canEdit || busy !== null} onChange={(event) => { const file = event.currentTarget.files?.[0] ?? null; event.currentTarget.value = ""; void upload(item, file); }} /></label></div>{draft.attachmentAssetIds.length ? <ul>{draft.attachmentAssetIds.map((assetId, index) => <li key={assetId}><a href={`/api/rfx-cycle/collaboration/attachment?assetId=${encodeURIComponent(assetId)}&reference=${encodeURIComponent(reference)}&lead=${encodeURIComponent(String(workspace.participation.leadOrganizationId))}&section=${encodeURIComponent(item.sectionId)}`}>Open attachment {index + 1}</a></li>)}</ul> : null}</div> : null}
          </article>;
        })}
      </section>}
      <p className={styles.status} role="status">{notice ?? (busy ? "Working…" : "")}</p>
    </main>
  </ParticipantShell>;
}
