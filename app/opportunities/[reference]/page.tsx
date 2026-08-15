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
  const projection = await resolvePublicOpportunityProjection(reference);
  return projection
    ? {
        title: `${projection.payload.title} | The RFxchange`,
        description: projection.payload.summary,
      }
    : { title: "Opportunity unavailable | The RFxchange" };
}

export default async function PublicOpportunityPage({ params }: PublicOpportunityPageProps) {
  const { reference } = await params;
  const publicOpportunity = await resolvePublicOpportunityProjection(reference);
  if (publicOpportunity) return opportunityView(publicOpportunity);

  const audience = await resolveOpportunityPublicationAudience(reference);
  if (audience !== "authenticated-participants") notFound();

  const cookieStore = await cookies();
  const access = await resolveParticipantRoute({
    sessionCookie: cookieStore.get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
  });

  if (access.kind === "unauthenticated") {
    redirect(`/api/acquisition/start?opportunityReference=${encodeURIComponent(reference)}`);
  }
  if (access.kind === "access-resolution-required") {
    redirect(participantEntryDestination(access));
  }
  if (access.kind === "activation-required" || access.kind === "wrong-organization") {
    // Issue and bind the non-authorizing acquisition context before sending an
    // incomplete authenticated participant to their canonical server-derived setup path.
    redirect(`/api/acquisition/start?opportunityReference=${encodeURIComponent(reference)}`);
  }
  if (access.kind === "restricted") {
    redirect(`/join?access=${encodeURIComponent(access.restrictionState)}`);
  }

  // Current unrestricted participant authority is sufficient for an
  // authenticated-participants projection. OPEN/first-value lifecycle state is
  // intentionally not an additional viewing gate.
  const opportunity = await resolvePublicOpportunityProjection(reference, true);
  if (!opportunity) notFound();
  return opportunityView(opportunity);
}
