import type { Metadata } from "next";
import Link from "next/link";

import { MarketingAvailability } from "@/src/components/marketing/MarketingAvailability";
import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import { publicImageAssets } from "@/src/content/public-assets";
import { getRequestDictionary } from "@/src/i18n/server";

import styles from "./home-b4.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const { dictionary } = await getRequestDictionary();
  const metadata = dictionary.marketingPages.home.metadata;

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

export default async function HomePage() {
  const { dictionary } = await getRequestDictionary();
  const home = dictionary.marketingPages.home;
  const differentiation = dictionary.marketing.home.difference;

  return (
    <main className={styles.site}>
      <aside className={styles.campaignBar} aria-label={home.campaign.ariaLabel}>
        <span>{home.campaign.text}</span>
        <Link href="/founding">{home.campaign.link} <span aria-hidden="true">→</span></Link>
      </aside>

      <MarketingHeader />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroMedia}>
          <img
            src={publicImageAssets.region.src}
            alt={home.images.hero}
            fetchPriority="high"
          />
        </div>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{home.hero.eyebrow}</p>
            <h1 id="hero-title">
              {home.hero.titleBefore} <span className={styles.gold}>{home.hero.titleAccent}</span>
            </h1>
            <p className={styles.heroDeck}>{home.hero.summary}</p>
            <div className={styles.heroActions}>
              <Link className={styles.buttonGold} href="/join">{home.hero.primary}</Link>
              <a className={styles.buttonLight} href="#how-it-works">{home.hero.secondary}</a>
            </div>
            <p className={styles.heroNote}>{home.hero.note}</p>
            <p className={styles.evidenceNote}>{home.hero.stockNote}</p>
          </div>
        </div>
      </section>

      <section className={styles.valueBand} aria-label={home.value.ariaLabel}>
        <div className={styles.wrap}>
          <div className={styles.valueGrid}>
            {home.value.items.map((item, index) => (
              <article className={styles.valueItem} key={item.kicker}>
                <span>{String(index + 1).padStart(2, "0")} · {item.kicker}</span>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <p className={styles.promise}>{home.value.promise}</p>
        </div>
      </section>

      <section className={styles.splitSection} aria-labelledby="problem-title">
        <figure className={styles.splitMedia}>
          <img
            src={publicImageAssets.professional.src}
            alt={home.images.problem}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <div className={styles.splitCopy}>
          <p className={styles.eyebrow}>{home.problem.eyebrow}</p>
          <h2 id="problem-title">{home.problem.title}</h2>
          <p className={styles.lede}>{home.problem.description}</p>
          <div className={styles.problemList}>
            {home.problem.items.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <p className={styles.closingStatement}>{home.problem.closing}</p>
        </div>
      </section>

      <section id="how-it-works" className={styles.section} aria-labelledby="how-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{home.how.eyebrow}</p>
            <h2 id="how-title">{home.how.title}</h2>
            <p>{home.how.description}</p>
          </div>
          <ol className={styles.stepGrid} aria-label={home.how.ariaLabel}>
            {home.how.steps.map((step, index) => (
              <li key={step.title}>
                <span>{String(index + 1).padStart(2, "0")} · {step.kicker}</span>
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="amacs" className={styles.amacsSection} aria-labelledby="amacs-title">
        <div className={styles.wrap}>
          <div className={styles.amacsIntro}>
            <p className={styles.eyebrow}>{home.amacs.eyebrow}</p>
            <h2 id="amacs-title">{home.amacs.title}</h2>
            <p>{home.amacs.description}</p>
            <strong>{home.amacs.support}</strong>
          </div>
          <div className={styles.amacsFlow}>
            {home.amacs.nodes.map((node, index) => (
              <article key={node.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{node.title}</h3>
                <p>{node.detail}</p>
              </article>
            ))}
          </div>
          <p className={styles.amacsNote}>{home.amacs.futureNote}</p>
        </div>
      </section>

      <section className={`${styles.splitSection} ${styles.aiSection}`} aria-labelledby="ai-title">
        <div className={styles.splitCopy}>
          <p className={styles.eyebrow}>{home.ai.eyebrow}</p>
          <h2 id="ai-title">{home.ai.title}</h2>
          <p className={styles.lede}>{home.ai.description}</p>
          <p className={styles.highlight}>{home.ai.highlight}</p>
          <ul className={styles.ruleList}>
            {home.ai.principles.map((principle) => <li key={principle}>{principle}</li>)}
          </ul>
        </div>
        <figure className={styles.splitMedia}>
          <img
            src={publicImageAssets.collaboration.src}
            alt={home.images.ai}
            loading="lazy"
            decoding="async"
          />
        </figure>
      </section>

      <section className={styles.section} aria-labelledby="network-title">
        <div className={styles.wrap}>
          <div className={styles.networkGrid}>
            <figure className={styles.networkMedia}>
              <img
                src={publicImageAssets.workshop.src}
                alt={home.images.network}
                loading="lazy"
                decoding="async"
              />
              <figcaption>{home.network.imageNote}</figcaption>
            </figure>
            <div>
              <div className={styles.sectionHead}>
                <p className={styles.eyebrow}>{home.network.eyebrow}</p>
                <h2 id="network-title">{home.network.title}</h2>
                <p>{home.network.description}</p>
              </div>
              <div className={styles.networkList}>
                {home.network.items.map((item) => (
                  <article key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="difference-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{differentiation.eyebrow}</p>
            <h2 id="difference-title">{differentiation.title}</h2>
          </div>
          <div className={styles.differenceGrid}>
            {differentiation.items.map((item) => (
              <article className={styles.differenceCard} key={item.label}>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
          <p className={styles.provenanceLink}>
            <Link href="/image-credits">{dictionary.marketing.home.evidence.link}</Link>
          </p>
        </div>
      </section>

      <MarketingAvailability content={dictionary.marketingPages.availability} />

      <section className={styles.trustSection} aria-labelledby="trust-title">
        <div className={styles.wrap}>
          <div className={styles.trustGrid}>
            <div className={styles.sectionHead}>
              <p className={styles.eyebrow}>{home.trust.eyebrow}</p>
              <h2 id="trust-title">{home.trust.title}</h2>
              <p>{home.trust.description}</p>
              <strong className={styles.highlight}>{home.trust.highlight}</strong>
            </div>
            <ul className={styles.ruleList}>
              {home.trust.rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="audience-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{home.audience.eyebrow}</p>
            <h2 id="audience-title">{home.audience.title}</h2>
          </div>
          <div className={styles.audienceGrid}>
            {home.audience.items.map((audience, index) => {
              const image = [
                { ...publicImageAssets.manufacturing, alt: home.images.audienceBusiness },
                { ...publicImageAssets.construction, alt: home.images.audienceProvider },
                { ...publicImageAssets.region, alt: home.images.audienceLeader },
              ][index];

              return (
                <article className={styles.audienceCard} key={audience.name}>
                  <div className={styles.audienceMedia}>
                    <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
                  </div>
                  <div className={styles.audienceBody}>
                    <span>{audience.name}</span>
                    <h3>{audience.promise}</h3>
                    <p>{audience.detail}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.foundingSection} aria-labelledby="founding-title">
        <div className={styles.foundingMedia}>
          <img
            src={publicImageAssets.collaboration.src}
            alt={home.images.founding}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className={styles.foundingCopy}>
          <p className={styles.eyebrow}>{home.founding.eyebrow}</p>
          <h2 id="founding-title">{home.founding.title}</h2>
          <p>{home.founding.description}</p>
          <div className={styles.heroActions}>
            <Link className={styles.buttonGold} href="/founding">{home.founding.primary}</Link>
            <Link className={styles.buttonDark} href="/join">{home.founding.secondary}</Link>
          </div>
          <p className={styles.foundingNote}>{home.founding.note}</p>
        </div>
      </section>

      <section className={styles.cta} aria-labelledby="cta-title">
        <div className={styles.ctaMedia}>
          <img
            src={publicImageAssets.warehouse.src}
            alt={home.images.cta}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className={styles.ctaInner}>
          <p className={styles.eyebrow}>{home.cta.eyebrow}</p>
          <h2 id="cta-title">{home.cta.title}</h2>
          <p>{home.cta.description}</p>
          <div className={styles.ctaActions}>
            <Link className={styles.buttonGold} href="/join">{home.cta.primary}</Link>
            <Link className={styles.buttonLight} href="/signin">{dictionary.common.actions.signIn}</Link>
          </div>
          <strong>{home.cta.promise}</strong>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
