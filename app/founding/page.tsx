import type { Metadata } from "next";
import Link from "next/link";

import { MarketingAvailability } from "@/src/components/marketing/MarketingAvailability";
import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import { publicImageAssets } from "@/src/content/public-assets";
import { getRequestDictionary } from "@/src/i18n/server";

import styles from "./founding.module.css";

const foundingActivationHref = "/acquisition/founding";

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();
  const metadata = dictionary.marketingPages.founding.metadata;

  return {
    title: metadata.title,
    description: metadata.description,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: "website",
    },
  };
}

export default async function FoundingPage() {
  const { dictionary } = await getRequestDictionary();
  const founding = dictionary.marketingPages.founding;

  return (
    <main className={styles.site}>
      <MarketingHeader />

      <section className={styles.hero} aria-labelledby="founding-hero-title">
        <div className={styles.heroMedia}>
          <img
            src={publicImageAssets.warehouse.src}
            alt={founding.images.hero}
            fetchPriority="high"
          />
        </div>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{founding.hero.eyebrow}</p>
            <h1 id="founding-hero-title">{founding.hero.title}</h1>
            <p className={styles.heroDeck}>{founding.hero.description}</p>
            <div className={styles.heroActions}>
              <Link className={styles.buttonGold} href={foundingActivationHref}>{founding.hero.primary}</Link>
              <a className={styles.buttonLight} href="#availability">{founding.hero.secondary}</a>
            </div>
            <div className={styles.pricePanel}>
              <strong>{founding.hero.price}</strong>
              <span>{founding.hero.cap}</span>
              <p>{founding.hero.readiness}</p>
            </div>
            <p className={styles.evidenceNote}>{founding.hero.stockNote}</p>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="why-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{founding.why.eyebrow}</p>
            <h2 id="why-title">{founding.why.title}</h2>
            <p>{founding.why.description}</p>
          </div>
          <div className={styles.fourGrid}>
            {founding.why.items.map((item, index) => (
              <article className={styles.numberedCard} key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.scenarioSection} aria-labelledby="scenario-title">
        <div className={styles.wrap}>
          <div className={styles.scenarioGrid}>
            <div>
              <p className={styles.eyebrow}>{founding.scenario.eyebrow}</p>
              <h2 id="scenario-title">{founding.scenario.title}</h2>
              <p>{founding.scenario.description}</p>
            </div>
            <blockquote>{founding.scenario.quote}</blockquote>
          </div>
        </div>
      </section>

      <section className={styles.standardSection} aria-labelledby="standard-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{founding.standard.eyebrow}</p>
            <h2 id="standard-title">{founding.standard.title}</h2>
            <p>{founding.standard.description}</p>
            <strong>{founding.standard.highlight}</strong>
          </div>
          <div className={styles.flow} aria-label={founding.standard.title}>
            {founding.standard.flow.map((item, index) => (
              <div key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MarketingAvailability content={dictionary.marketingPages.availability} />

      <section className={styles.section} aria-labelledby="membership-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{founding.membership.eyebrow}</p>
            <h2 id="membership-title">{founding.membership.title}</h2>
            <p>{founding.membership.description}</p>
          </div>
          <div className={styles.fourGrid}>
            {founding.membership.items.map((item) => (
              <article className={styles.benefitCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <p className={styles.readinessNote}>{founding.membership.readiness}</p>
        </div>
      </section>

      <section className={styles.comparisonSection} aria-labelledby="comparison-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{founding.comparison.eyebrow}</p>
            <h2 id="comparison-title">{founding.comparison.title}</h2>
            <p>{founding.comparison.description}</p>
          </div>
          <div className={styles.comparisonGrid}>
            <article className={styles.planCard}>
              <span>{founding.comparison.free.subtitle}</span>
              <h3>{founding.comparison.free.title}</h3>
              <ul>
                {founding.comparison.free.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <Link className={styles.buttonDark} href={foundingActivationHref}>{founding.comparison.free.cta}</Link>
            </article>
            <article className={`${styles.planCard} ${styles.foundingPlan}`}>
              <span>{founding.comparison.founding.subtitle}</span>
              <h3>{founding.comparison.founding.title}</h3>
              <strong className={styles.planPrice}>{founding.comparison.founding.price}</strong>
              <em>{founding.comparison.founding.cap}</em>
              <ul>
                {founding.comparison.founding.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <Link className={styles.buttonGold} href={foundingActivationHref}>{founding.comparison.founding.cta}</Link>
            </article>
          </div>
          <p className={styles.footnote}>{founding.comparison.footnote}</p>
        </div>
      </section>

      <section className={styles.contributionSection} aria-labelledby="contribution-title">
        <figure>
          <img
            src={publicImageAssets.collaboration.src}
            alt={founding.images.contribution}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <div>
          <p className={styles.eyebrow}>{founding.contribution.eyebrow}</p>
          <h2 id="contribution-title">{founding.contribution.title}</h2>
          <p>{founding.contribution.description}</p>
          <strong>{founding.contribution.highlight}</strong>
        </div>
      </section>

      <section className={styles.boundarySection} aria-labelledby="boundaries-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{founding.boundaries.eyebrow}</p>
            <h2 id="boundaries-title">{founding.boundaries.title}</h2>
          </div>
          <div className={styles.fourGrid}>
            {founding.boundaries.items.map((item) => (
              <article className={styles.boundaryCard} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <p className={styles.boundaryClosing}>{founding.boundaries.closing}</p>
        </div>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{founding.faq.eyebrow}</p>
            <h2 id="faq-title">{founding.faq.title}</h2>
          </div>
          <div className={styles.faqList}>
            {founding.faq.items.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cta} aria-labelledby="founding-cta-title">
        <div className={styles.ctaInner}>
          <p className={styles.eyebrow}>{founding.cta.eyebrow}</p>
          <h2 id="founding-cta-title">{founding.cta.title}</h2>
          <p>{founding.cta.description}</p>
          <div className={styles.ctaActions}>
            <Link className={styles.buttonGold} href={foundingActivationHref}>{founding.cta.primary}</Link>
            <Link className={styles.buttonLight} href={foundingActivationHref}>{founding.cta.secondary}</Link>
          </div>
          <span>{founding.cta.note}</span>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
