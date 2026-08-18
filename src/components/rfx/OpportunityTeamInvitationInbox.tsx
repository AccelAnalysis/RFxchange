"use client";

import Link from "next/link";

import type { TeamInvitationView } from "../../application/rfx/opportunity-teaming-service";
import { useI18n } from "../i18n/I18nProvider";
import { OperationalWorkspace, ParticipantShell } from "../participant/ParticipantWorkspace";
import styles from "./OpportunityTeamInvitationReview.module.css";

export function OpportunityTeamInvitationInbox({ invitations }: Readonly<{ invitations: readonly TeamInvitationView[] }>) {
  const { t } = useI18n();
  return <ParticipantShell activeItem="opportunities-rfx"><OperationalWorkspace ariaLabel={t("rfxWorkspace.teamInbox.ariaLabel")} className={styles.workspace}>
    <section className={styles.card} data-team-invitation-inbox>
      <span>{t("rfxWorkspace.teamInbox.eyebrow")}</span><h1>{t("rfxWorkspace.teamInbox.title")}</h1><p>{t("rfxWorkspace.teamInbox.intro")}</p>
      {invitations.length ? <ul className={styles.inbox}>{invitations.map((item) => <li key={item.id}><div><strong>{item.opportunityTitle}</strong><span>{t(`rfxWorkspace.teaming.status.${item.status}`)}</span></div><p>{t("rfxWorkspace.teamInvitation.from", { organization: item.leadOrganizationDisplayName })}</p><p>{item.capabilityLabel}</p><Link href={`/opportunities/team-invitations/${encodeURIComponent(item.id)}`}>{t("rfxWorkspace.teamInbox.review")}</Link></li>)}</ul> : <p>{t("rfxWorkspace.teamInbox.empty")}</p>}
      <Link href="/opportunities">{t("rfxWorkspace.teamInvitation.back")}</Link>
    </section>
  </OperationalWorkspace></ParticipantShell>;
}
