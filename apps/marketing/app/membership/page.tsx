import Link from "next/link";
import { MarketingHeader, MarketingFooter } from "@/apps/marketing/components/MarketingChrome";
import { getMarketingDictionary } from "@/apps/marketing/dictionary";
import styles from "../founding/founding.module.css";
import layout from "@/apps/marketing/components/MarketingLanding.module.css";

export default async function MembershipPage() {
  const { dictionary } = await getMarketingDictionary();
  const content = dictionary.marketingPages.founding.comparison;
  return (
    <main className={layout.site}>
      <MarketingHeader />
      <section className={layout.section} aria-labelledby="membership-title">
        <div className={layout.wrap}>
          <div className={layout.sectionHead}>
            <p className={layout.eyebrow}>{content.eyebrow}</p>
            <h1 id="membership-title">{content.title}</h1>
            <p>{content.description}</p>
          </div>
          <div className={styles.comparisonGrid}>
            <article className={styles.planCard}>
              <h2>{content.free.title}</h2>
              <p>{content.free.subtitle}</p>
              <ul>{content.free.items.map(item => <li key={item}>{item}</li>)}</ul>
              <Link className={layout.buttonGold} href="/join">{content.free.cta}</Link>
            </article>
            <article className={styles.planCard}>
              <h2>{content.founding.title}</h2>
              <p>{content.founding.price}</p>
              <p>{dictionary.marketingPages.founding.membership.readiness}</p>
              <Link className={layout.buttonLight} href="/founding">{dictionary.marketing.footer.foundingMembership}</Link>
            </article>
          </div>
          <p className={styles.footnote}>{content.footnote}</p>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
