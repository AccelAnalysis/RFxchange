import Link from "next/link";

import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import { publicImageAssets } from "@/src/content/public-assets";
import { getRequestDictionary } from "@/src/i18n/server";

import styles from "./home-b4.module.css";

export default async function HomePage() {
  const { dictionary } = await getRequestDictionary();
  const home = dictionary.home;

  return (
    <main className={styles.site}>
      <MarketingHeader />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroMedia}>
          <img
            src={publicImageAssets.construction.src}
            alt={home.images.construction}
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
              <Link className={styles.buttonGold} href="/join">{home.hero.join}</Link>
              <a className={styles.buttonLight} href="#how-it-works">{home.hero.howItWorks}</a>
            </div>
            <p className={styles.evidenceNote}>{home.hero.evidenceNote}</p>
          </div>
        </div>
      </section>

      <section className={styles.availabilityBand} aria-labelledby="availability-title">
        <div className={styles.wrap}>
          <div className={styles.availabilityIntro}>
            <p className={styles.eyebrow}>{home.availability.eyebrow}</p>
            <h2 id="availability-title">{home.availability.title}</h2>
            <p>{home.availability.description}</p>
          </div>
          <div className={styles.availabilityGrid}>
            {home.availability.items.map((item) => (
              <article className={styles.availabilityCard} key={item.title}>
                <span>{item.status}</span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="live-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{home.live.eyebrow}</p>
            <h2 id="live-title">{home.live.title}</h2>
            <p>{home.live.description}</p>
          </div>
          <div className={styles.liveJourney}>
            <figure className={styles.liveMedia}>
              <img
                src={publicImageAssets.workshop.src}
                alt={home.images.workshop}
                loading="lazy"
                decoding="async"
              />
            </figure>
            <ol className={styles.liveSteps}>
              {home.live.steps.map((step) => (
                <li key={step.title}>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`${styles.section} ${styles.modelSection}`} aria-labelledby="model-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{home.model.eyebrow}</p>
            <h2 id="model-title">{home.model.title}</h2>
            <p>{home.model.description}</p>
            <span className={styles.modelLabel}>{home.model.label}</span>
          </div>
          <div className={styles.modelFlow} aria-label={home.model.ariaLabel}>
            {home.model.steps.map((step, index) => (
              <article className={styles.modelStep} key={step.title}>
                <span>{String(index + 1).padStart(2, "0")} · {step.kicker}</span>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </article>
            ))}
          </div>
          <p><Link className={styles.textLink} href="/how-it-works">{home.model.readMore}</Link></p>
        </div>
      </section>

      <section className={styles.sectionTight} aria-labelledby="difference-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>{home.difference.eyebrow}</p>
            <h2 id="difference-title">{home.difference.title}</h2>
          </div>
          <div className={styles.differentiationGrid}>
            {home.difference.items.map((item) => (
              <article className={styles.differentiationCard} key={item.label}>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.split} aria-labelledby="connection-title">
        <figure className={styles.splitMedia}>
          <img
            src={publicImageAssets.collaboration.src}
            alt={home.images.collaboration}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <div className={styles.splitCopy}>
          <p className={styles.eyebrow}>{home.connection.eyebrow}</p>
          <h2 id="connection-title">{home.connection.title}</h2>
          <p>{home.connection.description}</p>
          <p><Link className={styles.buttonDark} href="/about">{home.connection.link}</Link></p>
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
                { ...publicImageAssets.region, alt: home.images.region },
                { ...publicImageAssets.manufacturing, alt: home.images.manufacturing },
                { ...publicImageAssets.professional, alt: home.images.professional },
              ][index];

              return (
                <article className={styles.audienceCard} key={audience.name}>
                  <div className={styles.audienceCardMedia}>
                    <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
                  </div>
                  <div className={styles.audienceCardBody}>
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

      <section className={styles.sectionTight} aria-labelledby="evidence-title">
        <div className={styles.wrap}>
          <div className={styles.evidencePanel}>
            <div>
              <p className={styles.eyebrow}>{home.evidence.eyebrow}</p>
              <div className={styles.sectionHead}>
                <h2 id="evidence-title">{home.evidence.title}</h2>
                <p>{home.evidence.description}</p>
              </div>
              <Link className={styles.textLink} href="/image-credits">{home.evidence.link}</Link>
            </div>
            <ul className={styles.evidenceRules}>
              {home.evidence.rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.cta} aria-labelledby="cta-title">
        <div className={styles.ctaMedia}>
          <img
            src={publicImageAssets.warehouse.src}
            alt={home.images.warehouse}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className={styles.ctaInner}>
          <p className={styles.eyebrow}>{home.cta.eyebrow}</p>
          <h2 id="cta-title">
            {home.cta.line1}<br />
            {home.cta.line2}<br />
            {home.cta.line3}
          </h2>
          <p>{home.cta.description}</p>
          <div className={styles.ctaActions}>
            <Link className={styles.buttonGold} href="/join">{dictionary.common.actions.joinFree}</Link>
            <Link className={styles.buttonLight} href="/signin">{dictionary.common.actions.signIn}</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
