import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import { PublicOpportunityView } from "@/src/components/rfx/PublicOpportunityView";
import { participantEntryDestination } from "@/src/infrastructure/auth/participant-route-destination";
import {
  RFXCHANGE_SESSION_COOKIE_NAME,
  resolveParticipantRoute,
} from "@/src/infrastructure/auth/participant-route-runtime";
import {
  resolveOpportunityPublicationAudience,
  resolvePublicOpportunityProjection,
} from "@/src/infrastructure/acquisition/runtime";

import styles from "./page.module.css";

interface PublicOpportunityPageProps {
  readonly params: Promise<Readonly<{ reference: string }>>;
}

type OpportunityProjection = NonNullable<
  Awaited<ReturnType<typeof resolvePublicOpportunityProjection>>
>;

function opportunityView(opportunity: OpportunityProjection) {
  const viewModel = Object.freeze({
    reference: opportunity.reference,
    audience: opportunity.audience,
    digest: opportunity.digest,
    payload: opportunity.payload,
  });

  return (
    <main className={styles.site}>
      <MarketingHeader />
      <PublicOpportunityView opportunity={viewModel} />
      <MarketingFooter />
    </main>
  );
}

export async function generateMetadata({ params }: PublicOpportunityPageProps): Promise<Metadata> {
  const { reference } = await params;
  // Anonymous metadata is derived only from the approved public projection.
  const projection = await resolvePublicOpportunityProjection(reference);
  return projection
    ? {
        title: `${projection.payload.title} | The RFxchange`,
        description: projection.payload.summary,
      }
    : { title: "Opportunity unavailable | The RFxchange" };
}

export default async function PublicOpportunityPage({ params }: PublicOpportunityPageProps) {
  // A public publication remains available through its minimized public projection
  // regardless of whether a signed-in visitor is still completing activation.
  const { reference } = await params;
  const publicOpportunity = await resolvePublicOpportunityProjection(reference);
  if (publicOpportunity) return opportunityView(publicOpportunity);

  // Participant-only publications require current server-derived participant authority.
  // The opportunity reference remains continuity context only and grants no authority.
  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });

  if (access.kind === "access-resolution-required") {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "activation-required") {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "wrong-organization") {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }
  if (
    access.kind === "authorized" &&
    access.state.lifecycleState !== "open-platform"
  ) {
    redirect(access.state.controlledPlatformUrl ?? "/join");
  }

  const participantAuthorized =
    access.kind === "authorized" && access.state.lifecycleState === "open-platform";
  const opportunity = await resolvePublicOpportunityProjection(reference, participantAuthorized);

  if (!opportunity && access.kind === "unauthenticated") {
    const audience = await resolveOpportunityPublicationAudience(reference);
    if (audience === "authenticated-participants") {
      // The route handler issues the durable acquisition envelope/cookie before
      // sign-in, preserving this exact RFx through activation for new participants.
      redirect(
        `/api/acquisition/start?opportunityReference=${encodeURIComponent(reference)}`,
      );
    }
  }
  if (!opportunity) notFound();

  return opportunityView(opportunity);
}
