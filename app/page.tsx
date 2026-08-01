import Link from "next/link";

import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import {
  audienceEmphasis,
  publicAvailability,
  publicDifferentiation,
  publicPositioning,
} from "@/src/content/marketing";
import { publicImageAssets } from "@/src/content/public-assets";

import styles from "./home-b4.module.css";

const liveJourney = [
  ["Create the account", "Establish a verified participant identity and accept the governing policies."],
  ["Select the locality", "Use authoritative geography to establish the organization’s operating context."],
  ["Resolve the organization", "Find, claim, or create the organization without inventing authority."],
  ["Confirm the location", "Geocode and confirm a real or privacy-safe location on the map."],
  ["Describe one capability", "Add the minimum meaningful capability needed for Profile Complete."],
  ["Activate the organization node", "Complete orientation and enter the authenticated Exchange workspace."],
] as const;

const productModel = [
  ["Visible", "Organization", "A real organization and its capabilities become visible subject to permission."],
  ["Demand", "Opportunity", "A later RFx publication domain introduces structured business demand."],
  ["Fit", "Discovery", "Potential fit is explained without claiming qualification or endorsement."],
  ["Connect", "Relationship", "Referrals, teams, and providers require real governed relationship records."],
  ["Act", "Workflow", "The participant moves through an authorized operational workflow."],
  ["Evidence", "Outcome", "Credibility and outcomes appear only when authoritative evidence exists."],
] as const;

export default function HomePage() {
  return (
    <main className={styles.site}>
      <MarketingHeader />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroMedia}>
          <img
            src={publicImageAssets.construction.src}
            alt={publicImageAssets.construction.alt}
            fetchPriority="high"
          />
        </div>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>A Local Business Growth Network · By Accel Analysis</p>
            <h1 id="hero-title">
              The local market is already moving. <span className={styles.gold}>Make it visible.</span>
            </h1>
            <p className={styles.heroDeck}>{publicPositioning.summary}</p>
            <div className={styles.heroActions}>
              <Link className={styles.buttonGold} href="/join">Join the Exchange — Free</Link>
              <a className={styles.buttonLight} href="#how-it-works">See How It Works</a>
            </div>
            <p className={styles.evidenceNote}>
              Stock photography supplies atmosphere only. It does not depict RFxchange participants,
              opportunities, outcomes, testimonials, or live platform activity.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.availabilityBand} aria-labelledby="availability-title">
        <div className={styles.wrap}>
          <div className={styles.availabilityIntro}>
            <p className={styles.eyebrow}>Product availability</p>
            <h2 id="availability-title">See what is live—and what is still being built.</h2>
            <p>
              The RFxchange does not manufacture market activity for presentation. Current capabilities,
              active development, and later product pathways are identified separately.
            </p>
          </div>
          <div className={styles.availabilityGrid}>
            {publicAvailability.map((item) => (
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
            <p className={styles.eyebrow}>Available now</p>
            <h2 id="live-title">Your organization comes into focus around real geography.</h2>
            <p>
              The current activation journey moves from account establishment to a real organization node
              without requiring invented opportunity data, provider status, business objectives, or a paid plan.
            </p>
          </div>
          <div className={styles.liveJourney}>
            <figure className={styles.liveMedia}>
              <img
                src={publicImageAssets.workshop.src}
                alt={publicImageAssets.workshop.alt}
                loading="lazy"
                decoding="async"
              />
            </figure>
            <ol className={styles.liveSteps}>
              {liveJourney.map(([title, detail]) => (
                <li key={title}>
                  <div>
                    <strong>{title}</strong>
                    <p>{detail}</p>
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
            <p className={styles.eyebrow}>Visible. Connected. Actionable.</p>
            <h2 id="model-title">One market environment. A governed path from visibility to evidence.</h2>
            <p>
              This is the approved product model. Later steps appear in the live product only after their
              owning domains, permissions, evidence, and acceptance tests are implemented.
            </p>
            <span className={styles.modelLabel}>Planned product model · not live market activity</span>
          </div>
          <div className={styles.modelFlow} aria-label="RFxchange product model">
            {productModel.map(([kicker, title, detail], index) => (
              <article className={styles.modelStep} key={title}>
                <span>{String(index + 1).padStart(2, "0")} · {kicker}</span>
                <strong>{title}</strong>
                <p>{detail}</p>
              </article>
            ))}
          </div>
          <p><Link className={styles.textLink} href="/how-it-works">Read the complete product pathway →</Link></p>
        </div>
      </section>

      <section className={styles.sectionTight} aria-labelledby="difference-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>A living market—not a conventional dashboard</p>
            <h2 id="difference-title">Built around organizations, geography, and business action.</h2>
          </div>
          <div className={styles.differentiationGrid}>
            {publicDifferentiation.map((item) => (
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
            alt={publicImageAssets.collaboration.alt}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <div className={styles.splitCopy}>
          <p className={styles.eyebrow}>Build the connection</p>
          <h2 id="connection-title">Context should travel with the participant.</h2>
          <p>
            The product is designed so a capability, need, organization, geography, and next action can
            remain connected. Referrals, teaming, provider routing, and RFx activity are introduced only
            through their authorized implementation slices.
          </p>
          <p><Link className={styles.buttonDark} href="/about">Why The RFxchange exists</Link></p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="audience-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>One network · different responsibilities</p>
            <h2 id="audience-title">A practical environment for the people who move local business.</h2>
          </div>
          <div className={styles.audienceGrid}>
            {audienceEmphasis.map((audience, index) => {
              const image = [
                publicImageAssets.region,
                publicImageAssets.manufacturing,
                publicImageAssets.professional,
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
              <p className={styles.eyebrow}>Trust what you see</p>
              <div className={styles.sectionHead}>
                <h2 id="evidence-title">Real evidence—or a clear label.</h2>
                <p>
                  Marketing and product surfaces must not imply organizations, opportunities, statistics,
                  outcomes, testimonials, provider availability, or dashboards that do not exist.
                </p>
              </div>
              <Link className={styles.textLink} href="/image-credits">Review public image provenance →</Link>
            </div>
            <ul className={styles.evidenceRules}>
              <li>Stock photography is visual atmosphere, never proof of RFxchange activity.</li>
              <li>Synthetic tutorial content remains labeled and isolated from live records.</li>
              <li>Future product capabilities are identified as planned or in development.</li>
              <li>Public opportunity context never grants private access or domain authority.</li>
              <li>Credibility and outcomes require authoritative evidence before presentation.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={styles.cta} aria-labelledby="cta-title">
        <div className={styles.ctaMedia}>
          <img
            src={publicImageAssets.warehouse.src}
            alt={publicImageAssets.warehouse.alt}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className={styles.ctaInner}>
          <p className={styles.eyebrow}>Enter The RFxchange</p>
          <h2 id="cta-title">Be found.<br />Find opportunity.<br />Build the connection.</h2>
          <p>
            Start with the part that is live: establish your organization, confirm its geography,
            describe its capability, and become visible in the authenticated Exchange.
          </p>
          <div className={styles.ctaActions}>
            <Link className={styles.buttonGold} href="/join">Join Free</Link>
            <Link className={styles.buttonLight} href="/signin">Sign in</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
