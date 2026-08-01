import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  OperationalWorkspace,
  ParticipantShell,
} from "@/src/components/participant/ParticipantWorkspace";
import type { AcquisitionIntentKind } from "@/src/domain/acquisition/model";
import { accessJourneyId } from "@/src/domain/lifecycle/model";
import {
  createServerAcquisitionContextService,
  resolvePublicOpportunityProjection,
} from "@/src/infrastructure/acquisition/runtime";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";

import styles from "./page.module.css";

const INTENT_LABELS = Object.freeze({
  opportunity: "Opportunity",
  "organization-claim": "Organization claim",
  referral: "Referral",
  "team-invitation": "Team invitation",
  provider: "Provider recommendation",
  "buyer-need": "Buyer need",
  direct: "Direct entry",
} satisfies Record<AcquisitionIntentKind, string>);

export default async function AcquisitionContinuationPage() {
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });
  if (access.kind === "unauthenticated") redirect("/signin?returnTo=%2Facquisition%2Fcontinue");
  if (access.kind === "activation-required") redirect("/join");
  if (access.kind === "wrong-organization") redirect(access.state.controlledPlatformUrl ?? "/join");
  if (access.kind === "restricted") redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  if (access.state.lifecycleState === "open-platform") redirect("/exchange");

  const acquisition = access.state.acquisitionContext;
  if (!acquisition || acquisition.kind === "direct") {
    redirect(access.state.controlledPlatformUrl ?? "/geography/canvas");
  }
  let resumeStatus: "resumed" | "pending" = "pending";
  try {
    const resumed = await createServerAcquisitionContextService().resume({
      contextId: acquisition.id,
      userId: access.context.user.id,
      accessJourneyId: accessJourneyId(access.state.accessJourneyId),
    });
    resumeStatus = resumed.resumeStatus;
  } catch {
    // The saved context never blocks access to the participant's canonical Exchange workspace.
  }
  const opportunity = acquisition.kind === "opportunity" && acquisition.subjectReference
    ? await resolvePublicOpportunityProjection(acquisition.subjectReference)
    : null;
  const mapUrl = "/orientation";

  return (
    <ParticipantShell activeItem={acquisition.kind === "opportunity" ? "Opportunities" : "Intelligence"}>
      <OperationalWorkspace ariaLabel="Saved acquisition context">
        <section className={styles.wrap}>
          <p className={styles.eyebrow}>Context recovered</p>
          <h1>We remembered why you came.</h1>
          <p className={styles.lede}>
            This {INTENT_LABELS[acquisition.kind].toLowerCase()} was bound to your authenticated
            activation journey. It did not grant organization authority, change geography, or skip
            any activation gate.
          </p>

          <article className={styles.card}>
            <span>{INTENT_LABELS[acquisition.kind]}</span>
            <h2>{opportunity?.title ?? "Your saved next step"}</h2>
            <p>
              {opportunity?.summary ??
                "The originating workflow is scheduled for a later approved product slice. Your context is preserved without claiming that the action was completed or accepted."}
            </p>
            {opportunity ? (
              <dl>
                <div><dt>Issued by</dt><dd>{opportunity.issuerDisplayName}</dd></div>
                <div><dt>Geography</dt><dd>{opportunity.localityLabel}</dd></div>
                <div><dt>Status</dt><dd>{opportunity.availabilityLabel}</dd></div>
              </dl>
            ) : null}
            <small>Reference: {acquisition.subjectReference}</small>
            <small>Resume status: {resumeStatus}</small>
          </article>

          <div className={styles.actions}>
            {opportunity ? (
              <Link className={styles.primary} href={`/opportunities/${encodeURIComponent(opportunity.reference)}`}>
                Review public opportunity
              </Link>
            ) : null}
            <Link className={styles.secondary} href={mapUrl}>Continue to orientation</Link>
          </div>
        </section>
      </OperationalWorkspace>
    </ParticipantShell>
  );
}
