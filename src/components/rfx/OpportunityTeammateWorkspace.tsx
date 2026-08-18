"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import type { RfxGapResolutionContext } from "../../domain/rfx/teaming";
import type { TeamInvitationView } from "../../application/rfx/opportunity-teaming-service";
import { useI18n } from "../i18n/I18nProvider";
import { ParticipantShell, SpatialWorkspace } from "../participant/ParticipantWorkspace";
import styles from "./OpportunityTeammateWorkspace.module.css";

export interface OpportunityTeammateCandidateView {
  readonly organizationId: string;
  readonly displayName: string;
  readonly matchedCapabilityNames: readonly string[];
  readonly serviceGeographyIds: readonly string[];
}

interface Props {
  readonly context: RfxGapResolutionContext;
  readonly candidates: readonly OpportunityTeammateCandidateView[];
  readonly invitations: readonly TeamInvitationView[];
  readonly serviceAreas: readonly Readonly<{ id: string; name: string }>[];
  readonly query: Readonly<{ capacity: string; need: string; serviceArea: string }>;
  readonly returnHref: string;
}

const capacities = ["capability-contributor", "delivery-support", "subject-matter-support"] as const;

export function OpportunityTeammateWorkspace({ context, candidates, invitations, serviceAreas, query, returnHref }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function create(event: FormEvent<HTMLFormElement>, candidateOrganizationId?: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const commandId = crypto.randomUUID();
    setBusy(candidateOrganizationId ?? "external"); setNotice(null);
    try {
      const response = await fetch("/api/opportunities/teaming", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "create", commandId, reference: context.opportunityReference, gapReference: context.gapReference,
          candidateOrganizationId: candidateOrganizationId ?? null,
          recipientDisplayName: candidateOrganizationId ? null : String(form.get("recipientDisplayName") ?? ""),
          recipientEmail: candidateOrganizationId ? null : String(form.get("recipientEmail") ?? ""),
          proposedCapacity: String(form.get("proposedCapacity") ?? query.capacity),
          responsibilitySummary: String(form.get("responsibilitySummary") ?? ""),
        }),
      });
      if (!response.ok) throw new Error("create-failed");
      setNotice(t("rfxWorkspace.teaming.invitationCreated"));
      router.refresh();
    } catch { setNotice(t("rfxWorkspace.teaming.invitationError")); }
    finally { setBusy(null); }
  }

  async function revoke(invitation: TeamInvitationView) {
    setBusy(invitation.id); setNotice(null);
    try {
      const response = await fetch("/api/opportunities/teaming", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "revoke", commandId: crypto.randomUUID(), invitationId: invitation.id, expectedVersion: invitation.version }) });
      if (!response.ok) throw new Error("revoke-failed");
      setNotice(t("rfxWorkspace.teaming.invitationRevoked")); router.refresh();
    } catch { setNotice(t("rfxWorkspace.teaming.invitationError")); }
    finally { setBusy(null); }
  }

  return <ParticipantShell activeItem="opportunities-rfx">
    <SpatialWorkspace ariaLabel={t("rfxWorkspace.teaming.ariaLabel")} className={styles.workspace}>
      <header className={styles.header}>
        <div><span>{t("rfxWorkspace.teaming.eyebrow")}</span><h1>{t("rfxWorkspace.teaming.title")}</h1><p>{t("rfxWorkspace.teaming.intro")}</p></div>
        <Link href={returnHref}>{t("rfxWorkspace.teaming.back")}</Link>
      </header>
      <section className={styles.context} aria-labelledby="teaming-gap-title" data-rfx-gap-context={context.gapReference}>
        <span>{context.opportunityTitle}</span><h2 id="teaming-gap-title">{context.gapTitle}</h2><p>{context.capabilityLabel}</p>
        <small>{t("rfxWorkspace.teaming.candidateBoundary")}</small>
      </section>
      <form className={styles.filters} method="get">
        <input type="hidden" name="returnTo" value={returnHref} />
        <label>{t("rfxWorkspace.teaming.capacity")}<select name="capacity" defaultValue={query.capacity}>{capacities.map((item) => <option key={item} value={item}>{t(`rfxWorkspace.teaming.capacityOption.${item}`)}</option>)}</select></label>
        <label>{t("rfxWorkspace.teaming.serviceArea")}<select name="serviceArea" defaultValue={query.serviceArea}><option value="">{t("rfxWorkspace.teaming.currentGeography")}</option>{serviceAreas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>{t("rfxWorkspace.teaming.need")}<input name="need" maxLength={160} defaultValue={query.need} /></label>
        <button type="submit">{t("rfxWorkspace.teaming.search")}</button>
      </form>
      {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
      <div className={styles.layout}>
        <section aria-labelledby="candidate-title"><h2 id="candidate-title">{t("rfxWorkspace.teaming.candidates")}</h2>
          {candidates.length ? <ul className={styles.cards}>{candidates.map((candidate) => <li key={candidate.organizationId} data-teammate-candidate={candidate.organizationId}>
            <h3>{candidate.displayName}</h3><p>{candidate.matchedCapabilityNames.join(", ")}</p>
            <details><summary>{t("rfxWorkspace.teaming.invite")}</summary><form onSubmit={(event) => create(event, candidate.organizationId)}>
              <label>{t("rfxWorkspace.teaming.capacity")}<select name="proposedCapacity" defaultValue={query.capacity}>{capacities.map((item) => <option key={item} value={item}>{t(`rfxWorkspace.teaming.capacityOption.${item}`)}</option>)}</select></label>
              <label>{t("rfxWorkspace.teaming.responsibility")}<textarea name="responsibilitySummary" required maxLength={800} defaultValue={query.need} /></label>
              <button disabled={busy !== null} type="submit">{busy === candidate.organizationId ? t("rfxWorkspace.teaming.sending") : t("rfxWorkspace.teaming.sendInvitation")}</button>
            </form></details>
          </li>)}</ul> : <p className={styles.empty}>{t("rfxWorkspace.teaming.empty")}</p>}
        </section>
        <aside className={styles.aside} aria-labelledby="external-title"><h2 id="external-title">{t("rfxWorkspace.teaming.externalTitle")}</h2><p>{t("rfxWorkspace.teaming.externalBody")}</p>
          <form onSubmit={(event) => create(event)}><label>{t("rfxWorkspace.teaming.recipientName")}<input name="recipientDisplayName" required maxLength={160} /></label><label>{t("rfxWorkspace.teaming.recipientEmail")}<input type="email" name="recipientEmail" required maxLength={320} /></label><label>{t("rfxWorkspace.teaming.capacity")}<select name="proposedCapacity" defaultValue={query.capacity}>{capacities.map((item) => <option key={item} value={item}>{t(`rfxWorkspace.teaming.capacityOption.${item}`)}</option>)}</select></label><label>{t("rfxWorkspace.teaming.responsibility")}<textarea name="responsibilitySummary" required maxLength={800} defaultValue={query.need} /></label><button disabled={busy !== null} type="submit">{busy === "external" ? t("rfxWorkspace.teaming.sending") : t("rfxWorkspace.teaming.sendInvitation")}</button></form>
        </aside>
      </div>
      <section className={styles.invitations} aria-labelledby="invitation-title"><h2 id="invitation-title">{t("rfxWorkspace.teaming.sentInvitations")}</h2>{invitations.length ? <ul>{invitations.map((item) => <li key={item.id}><div><strong>{item.targetDisplayName}</strong><span>{t(`rfxWorkspace.teaming.status.${item.status}`)}</span></div><p>{item.responsibilitySummary}</p>{item.canRevoke ? <button disabled={busy !== null} type="button" onClick={() => revoke(item)}>{t("rfxWorkspace.teaming.revoke")}</button> : null}</li>)}</ul> : <p>{t("rfxWorkspace.teaming.noInvitations")}</p>}</section>
    </SpatialWorkspace>
  </ParticipantShell>;
}
