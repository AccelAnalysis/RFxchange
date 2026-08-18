"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { TeamInvitationView } from "../../application/rfx/opportunity-teaming-service";
import { TEAMING_BOUNDARY_VERSION } from "../../domain/rfx/teaming";
import { useI18n } from "../i18n/I18nProvider";
import { OperationalWorkspace, ParticipantShell } from "../participant/ParticipantWorkspace";
import styles from "./OpportunityTeamInvitationReview.module.css";

export function OpportunityTeamInvitationReview({ invitation }: Readonly<{ invitation: TeamInvitationView }>) {
  const { locale, t } = useI18n(); const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<string | null>(null);
  async function decide(action: "accept" | "decline") {
    setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/opportunities/teaming", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, commandId: crypto.randomUUID(), invitationId: invitation.id, expectedVersion: invitation.version, boundaryVersion: action === "accept" ? TEAMING_BOUNDARY_VERSION : null, boundaryLocale: action === "accept" ? locale : null }) });
      if (!response.ok) throw new Error("decision-failed");
      setNotice(t(`rfxWorkspace.teamInvitation.${action}ed`)); router.refresh();
    } catch { setNotice(t("rfxWorkspace.teamInvitation.error")); }
    finally { setBusy(false); }
  }
  return <ParticipantShell activeItem="opportunities-rfx"><OperationalWorkspace ariaLabel={t("rfxWorkspace.teamInvitation.ariaLabel")} className={styles.workspace}>
    <article className={styles.card} data-team-invitation={invitation.id} data-team-invitation-status={invitation.status}>
      <span>{t("rfxWorkspace.teamInvitation.eyebrow")}</span><h1>{invitation.opportunityTitle}</h1><p>{t("rfxWorkspace.teamInvitation.from", { organization: invitation.leadOrganizationDisplayName })}</p>
      <dl><div><dt>{t("rfxWorkspace.teamInvitation.capability")}</dt><dd>{invitation.capabilityLabel}</dd></div><div><dt>{t("rfxWorkspace.teamInvitation.gap")}</dt><dd>{invitation.gapTitle}</dd></div><div><dt>{t("rfxWorkspace.teamInvitation.capacity")}</dt><dd>{t(`rfxWorkspace.teaming.capacityOption.${invitation.proposedCapacity}`)}</dd></div><div><dt>{t("rfxWorkspace.teamInvitation.responsibility")}</dt><dd>{invitation.responsibilitySummary}</dd></div></dl>
      <section className={styles.boundary} role="note" aria-labelledby="boundary-title"><h2 id="boundary-title">{t("rfxWorkspace.teamInvitation.boundaryTitle")}</h2><p>{t("rfxWorkspace.teamInvitation.boundaryBody")}</p></section>
      {invitation.canDecide ? <><label className={styles.check}><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>{t("rfxWorkspace.teamInvitation.acknowledge")}</span></label><div className={styles.actions}><button type="button" disabled={busy} onClick={() => decide("decline")}>{t("rfxWorkspace.teamInvitation.decline")}</button><button type="button" disabled={busy || !acknowledged} onClick={() => decide("accept")}>{t("rfxWorkspace.teamInvitation.accept")}</button></div></> : <p className={styles.status}>{t(`rfxWorkspace.teaming.status.${invitation.status}`)}</p>}
      {notice ? <p role="status">{notice}</p> : null}<Link href="/opportunities">{t("rfxWorkspace.teamInvitation.back")}</Link>
    </article>
  </OperationalWorkspace></ParticipantShell>;
}
