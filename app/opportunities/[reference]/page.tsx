import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import { resolvePublicOpportunityProjection } from "@/src/infrastructure/acquisition/runtime";

import styles from "./page.module.css";

interface PublicOpportunityPageProps {
  readonly params: Promise<Readonly<{ reference: string }>>;
}

export async function generateMetadata({ params }: PublicOpportunityPageProps): Promise<Metadata> {
  const { reference } = await params;
  const projection = await resolvePublicOpportunityProjection(reference);
  return projection
    ? {
        title: `${projection.title} | The RFxchange`,
        description: projection.summary,
      }
    : { title: "Opportunity unavailable | The RFxchange" };
}

export default async function PublicOpportunityPage({ params }: PublicOpportunityPageProps) {
  const { reference } = await params;
  const opportunity = await resolvePublicOpportunityProjection(reference);
  if (!opportunity) notFound();

  return (
    <main className={styles.site}>
      <MarketingHeader />
      <section className={styles.hero} aria-labelledby="opportunity-title">
        <div className={styles.context}>
          <p className={styles.eyebrow}>Public opportunity</p>
          <p className={styles.availability}>{opportunity.availabilityLabel}</p>
          <h1 id="opportunity-title">{opportunity.title}</h1>
          <p className={styles.summary}>{opportunity.summary}</p>
          <form action="/api/acquisition/start" method="post">
            <input type="hidden" name="opportunityReference" value={opportunity.reference} />
            <button type="submit">View Opportunity</button>
          </form>
          <p className={styles.joinNote}>
            Create or sign in to a free organization account. RFxchange will preserve this
            opportunity while you complete activation; the link never bypasses participation or
            organization-authority requirements.
          </p>
        </div>
        <aside className={styles.details} aria-label="Public opportunity details">
          <span>Issued by</span>
          <strong>{opportunity.issuerDisplayName}</strong>
          <span>Geography</span>
          <strong>{opportunity.localityLabel}</strong>
          <span>Relevant capabilities</span>
          <ul>
            {opportunity.capabilityCategories.map((category) => <li key={category}>{category}</li>)}
          </ul>
          <small>{opportunity.provenanceLabel}</small>
        </aside>
      </section>
      <section className={styles.boundary} aria-labelledby="public-boundary-title">
        <p className={styles.eyebrow}>Public boundary</p>
        <h2 id="public-boundary-title">Enough context to decide whether to continue.</h2>
        <p>
          This page contains only the approved public projection. Response details, issuer-private
          information, participant identity, evaluation, and protected RFx records remain inside
          their authoritative workflows.
        </p>
      </section>
      <MarketingFooter />
    </main>
  );
}
