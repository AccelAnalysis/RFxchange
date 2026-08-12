import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import { PublicOpportunityView } from "@/src/components/rfx/PublicOpportunityView";
import { RFXCHANGE_SESSION_COOKIE_NAME } from "@/src/infrastructure/auth/participant-route-runtime";
import {
  resolveOptionalOpportunityParticipant,
  resolvePublicOpportunityProjection,
} from "@/src/infrastructure/acquisition/runtime";

import styles from "./page.module.css";

interface PublicOpportunityPageProps {
  readonly params: Promise<Readonly<{ reference: string }>>;
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
  // This trusted route returns only the approved public projection or an authorized participant projection.
  const { reference } = await params;
  let opportunity = await resolvePublicOpportunityProjection(reference);
  if (!opportunity) {
    opportunity = await resolvePublicOpportunityProjection(
      reference,
      await resolveOptionalOpportunityParticipant(
        (await cookies()).get(RFXCHANGE_SESSION_COOKIE_NAME)?.value,
      ),
    );
  }
  if (!opportunity) notFound();
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
