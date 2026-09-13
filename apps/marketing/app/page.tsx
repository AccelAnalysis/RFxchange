import type { Metadata } from "next";
import Link from "next/link";

import { MarketingFooter, MarketingHeader } from "@/apps/marketing/components/MarketingChrome";
import { publicImageAssets } from "@/src/content/public-assets";
import { getMarketingDictionary as getRequestDictionary } from "@/apps/marketing/dictionary";

import styles from "@/apps/marketing/components/MarketingLanding.module.css";

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
  const valueImages = [
    publicImageAssets.manufacturing,
    publicImageAssets.construction,
    publicImageAssets.collaboration,
  ] as const;
  const audienceImages = [
    publicImageAssets.workshop,
    publicImageAssets.professional,
    publicImageAssets.region,
  ] as const;
  const mosaicImages = [
    publicImageAssets.manufacturing,
    publicImageAssets.workshop,
    publicImageAssets.professional,
    publicImageAssets.warehouse,
    publicImageAssets.region,
  ] as const;

  return (
    <main className={styles.site}>
      <aside className={styles.campaignBar} aria-label={home.campaign.ariaLabel}>
        <span>{home.campaign.text}</span>
        <Link href="/founding">{home.campaign.link} <span aria-hidden="true">→</span></Link>
      </aside>

      <MarketingHeader />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroMedia}>
          <img src={publicImageAssets.region.src} alt={home.images.hero} fetchPriority="high" />
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
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="market-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{home.network.eyebrow}</p>
            <h2 id="market-title">{home.network.title}</h2>
            <p>{home.network.description}</p>
          </div>
          <div className={styles.marketMosaic} aria-label={home.network.title}>
            {mosaicImages.map((image, index) => (
              <figure key={image.src}>
                <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
                <figcaption>
                  {index < home.value.items.length
                    ? home.value.items[index].kicker
                    : home.network.eyebrow}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.problemBand} aria-labelledby="problem-title">
        <div className={styles.problemMedia}>
          <img src={publicImageAssets.workshop.src} alt={home.images.problem} loading="lazy" decoding="async" />
        </div>
        <div className={styles.problemCopy}>
          <p className={styles.eyebrow}>{home.problem.eyebrow}</p>
          <h2 id="problem-title">{home.problem.title}</h2>
          <p>{home.problem.description}</p>
          <div className={styles.problemPills}>
            {home.problem.items.slice(0, 2).map((item) => <span key={item.title}>{item.title}</span>)}
          </div>
          <strong>{home.problem.closing}</strong>
        </div>
      </section>

      <section className={`${styles.section} ${styles.valueSection}`} aria-labelledby="value-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{dictionary.marketing.home.difference.eyebrow}</p>
            <h2 id="value-title">{home.value.promise}</h2>
          </div>
          <div className={styles.visualGrid}>
            {home.value.items.slice(0, 3).map((item, index) => (
              <article className={styles.visualCard} key={item.kicker}>
                <img src={valueImages[index].src} alt={valueImages[index].alt} loading="lazy" decoding="async" />
                <div className={styles.cardContent}>
                  <span className={styles.cardIndex}>{String(index + 1).padStart(2, "0")} · {item.kicker}</span>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`${styles.split} ${styles.splitDark}`} aria-labelledby="how-title">
        <div className={styles.splitMedia}>
          <img src={publicImageAssets.construction.src} alt={home.images.audienceProvider} loading="lazy" decoding="async" />
        </div>
        <div className={styles.splitCopy}>
          <p className={styles.eyebrow}>{home.how.eyebrow}</p>
          <h2 id="how-title">{home.how.title}</h2>
          <p>{home.how.description}</p>
          <div className={styles.flow} aria-label={home.how.ariaLabel}>
            {home.how.steps.map((step, index) => (
              <span key={step.kicker}>
                {step.kicker}
                {index < home.how.steps.length - 1 ? <b aria-hidden="true">→</b> : null}
              </span>
            ))}
          </div>
          <p><Link className={styles.buttonGold} href="/how-it-works">{home.hero.secondary}</Link></p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="network-actions-title">
        <div className={`${styles.wrap} ${styles.resourceStrip}`}>
          <div className={styles.resourcePhoto}>
            <img src={publicImageAssets.professional.src} alt={home.images.network} loading="lazy" decoding="async" />
          </div>
          <div className={styles.resourceList}>
            <p className={styles.eyebrow}>{home.network.eyebrow}</p>
            <h2 id="network-actions-title">{home.network.title}</h2>
            {home.network.items.map((item) => (
              <div className={styles.resourceItem} key={item.title}>
                <strong>{item.title}</strong>
                <span aria-hidden="true">↗</span>
              </div>
            ))}
            <p><Link className={styles.buttonDark} href="/businesses">{dictionary.marketing.nav.businesses}</Link></p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.audienceSection}`} aria-labelledby="audience-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{home.audience.eyebrow}</p>
            <h2 id="audience-title">{home.audience.title}</h2>
          </div>
          <div className={styles.audienceGrid}>
            {home.audience.items.map((audience, index) => (
              <article className={styles.audienceCard} key={audience.name}>
                <img src={audienceImages[index].src} alt={audienceImages[index].alt} loading="lazy" decoding="async" />
                <div className={styles.cardContent}>
                  <span className={styles.audienceLabel}>{audience.name}</span>
                  <h3>{audience.promise}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.foundingBand} aria-labelledby="founding-title">
        <div className={styles.foundingMedia}>
          <img src={publicImageAssets.collaboration.src} alt={home.images.founding} loading="lazy" decoding="async" />
        </div>
        <div className={styles.foundingCopy}>
          <p className={styles.eyebrow}>{home.founding.eyebrow}</p>
          <h2 id="founding-title">{home.founding.title}</h2>
          <p>{home.founding.description}</p>
          <div className={styles.heroActions}>
            <Link className={styles.buttonGold} href="/founding">{home.founding.primary}</Link>
            <Link className={styles.buttonDark} href="/join">{home.founding.secondary}</Link>
          </div>
        </div>
      </section>

      <section className={styles.fullBleedCta} aria-labelledby="cta-title">
        <img src={publicImageAssets.warehouse.src} alt={home.images.cta} loading="lazy" decoding="async" />
        <div className={styles.fullBleedCtaInner}>
          <p className={styles.eyebrow}>{home.cta.eyebrow}</p>
          <h2 id="cta-title">{home.cta.title}</h2>
          <p>{home.cta.description}</p>
          <div className={styles.heroActions}>
            <Link className={styles.buttonGold} href="/join">{home.cta.primary}</Link>
            <Link className={styles.buttonLight} href="/signin">{dictionary.common.actions.signIn}</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
