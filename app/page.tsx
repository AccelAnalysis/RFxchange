import Link from "next/link";

import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import styles from "@/src/components/marketing/MarketingSite.module.css";
import { publicDifferentiation } from "@/src/content/marketing";

const images = {
  construction: "https://images.unsplash.com/photo-1742112125567-3e8967bad60f?auto=format&fit=crop&w=2400&q=82",
  manufacturing: "https://images.unsplash.com/photo-1742934028777-4d283a3233cc?auto=format&fit=crop&w=1800&q=80",
  workshop: "https://images.unsplash.com/photo-1770386291809-dfbd371046c9?auto=format&fit=crop&w=1600&q=80",
  professional: "https://images.unsplash.com/photo-1758518729711-1cbacd55efdb?auto=format&fit=crop&w=1600&q=80",
  collaboration: "https://images.unsplash.com/photo-1758518727929-4506fc031e1c?auto=format&fit=crop&w=1600&q=80",
  warehouse: "https://images.unsplash.com/photo-1777026321659-64941fb943dd?auto=format&fit=crop&w=1800&q=80",
  region: "https://images.unsplash.com/photo-1633536584998-2d71cbd95d37?auto=format&fit=crop&w=2400&q=82",
} as const;

export default function HomePage() {
  return (
    <main className={styles.site}>
      <MarketingHeader />

      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroMedia}>
          <img src={images.construction} alt="Construction professionals reviewing plans at an active job site" />
        </div>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>A Local Business Growth Network</p>
            <h1 id="hero-title">Where business capability meets <span className={styles.gold}>opportunity.</span></h1>
            <p className={styles.heroDeck}>
              Discover businesses. Find opportunities. Build partnerships. Connect to the resources that move business forward.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.buttonGold} href="/join">Join</Link>
              <a className={styles.buttonLight} href="#how-it-works">See How It Works</a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="activity-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>The economy is already moving</p>
            <h2 id="activity-title">Opportunity is already moving through your community.</h2>
            <p>
              Businesses are buying, selling, hiring, contracting, referring, partnering, and growing every day. RFxchange makes more of that activity visible and easier to act on.
            </p>
          </div>
          <div className={styles.mosaic} aria-label="Business activity across industries">
            <figure>
              <img src={images.manufacturing} alt="Worker operating equipment on a manufacturing production line" />
              <figcaption>Manufacturing</figcaption>
            </figure>
            <figure>
              <img src={images.workshop} alt="Small business craftspeople working in a local workshop" />
              <figcaption>Small business</figcaption>
            </figure>
            <figure>
              <img src={images.professional} alt="Professional team discussing business work around a table" />
              <figcaption>Professional services</figcaption>
            </figure>
            <figure>
              <img src={images.warehouse} alt="Warehouse aisles filled with inventory" />
              <figcaption>Logistics & supply</figcaption>
            </figure>
            <figure>
              <img src={images.region} alt="Aerial view of a city and waterways" />
              <figcaption>Local roots. Wider markets.</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className={styles.problemBand} aria-labelledby="problem-title">
        <div className={styles.problemMedia}>
          <img src={images.workshop} alt="Business owners working together in a workshop" />
        </div>
        <div className={styles.problemCopy}>
          <p className={styles.eyebrow}>The connection gap</p>
          <h2 id="problem-title">The opportunity may exist. The connection may not.</h2>
          <div className={styles.wordCloud} aria-label="Business connection categories">
            {['Buyers', 'Suppliers', 'RFx', 'Partners', 'Referrals', 'Capital', 'Workforce', 'Resources'].map((word) => <span key={word}>{word}</span>)}
          </div>
          <p>
            Those connections are often scattered across portals, directories, emails, events, institutional systems, and personal relationships.
          </p>
        </div>
      </section>

      <section className={styles.sectionTight} aria-labelledby="different-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>Built for business action</p>
            <h2 id="different-title">A working network—not another place to post and scroll.</h2>
          </div>
          <div className={styles.differentiationGrid}>
            {publicDifferentiation.map((item) => (
              <article className={styles.differentiationItem} key={item.label}>
                <h3>{item.label}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="value-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>One network</p>
            <h2 id="value-title">Multiple ways to move business forward.</h2>
          </div>
          <div className={styles.triPanel}>
            <article className={styles.visualCard}>
              <img src={images.workshop} alt="People working inside a small business workshop" />
              <div className={styles.cardContent}>
                <span className={styles.cardIndex}>01 · Be found</span>
                <h3>Show what your organization can actually do.</h3>
                <p>Capabilities · geography · experience · services</p>
              </div>
            </article>
            <article className={styles.visualCard}>
              <img src={images.construction} alt="Construction professionals reviewing project details" />
              <div className={styles.cardContent}>
                <span className={styles.cardIndex}>02 · Find opportunity</span>
                <h3>Find demand that fits your capabilities.</h3>
                <p>RFx · contracts · supplier needs · referrals</p>
              </div>
            </article>
            <article className={styles.visualCard}>
              <img src={images.collaboration} alt="Professionals collaborating in a business meeting" />
              <div className={styles.cardContent}>
                <span className={styles.cardIndex}>03 · Build the connection</span>
                <h3>Find the business, partner, or resource you need next.</h3>
                <p>Partners · resources · referrals · teams</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`${styles.split} ${styles.splitDark}`} aria-labelledby="rfx-title">
        <div className={styles.splitMedia}>
          <img src={images.construction} alt="Project team reviewing plans on site" />
        </div>
        <div className={styles.splitCopy}>
          <p className={styles.eyebrow}>The transaction cycle</p>
          <h2 id="rfx-title">From need to opportunity.</h2>
          <p>
            RFxchange connects a business need to the market around it—so discovery, matching, response, connection, and outcome can operate as one journey.
          </p>
          <div className={styles.flow} aria-label="RFx transaction flow">
            {['Need', 'RFx', 'Match', 'Respond', 'Select', 'Outcome'].map((step, index, list) => (
              <span key={step}>{step}{index < list.length - 1 ? <b className={styles.arrow}> →</b> : null}</span>
            ))}
          </div>
          <p><Link className={styles.buttonGold} href="/how-it-works">Explore the Process</Link></p>
        </div>
      </section>

      <section className={styles.split} aria-labelledby="partner-title">
        <div className={styles.splitCopy}>
          <p className={styles.eyebrow}>Teaming</p>
          <h2 id="partner-title">The right opportunity may require the right partner.</h2>
          <p>
            When capability, capacity, geography, or experience creates a gap, RFxchange helps surface complementary organizations to explore working together.
          </p>
          <p><Link className={styles.buttonDark} href="/businesses">For Businesses</Link></p>
        </div>
        <div className={styles.splitMedia}>
          <img src={images.collaboration} alt="Professionals collaborating around business documents" />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="resource-title">
        <div className={`${styles.wrap} ${styles.resourceStrip}`}>
          <div className={styles.resourcePhoto}>
            <img src={images.professional} alt="Professional team discussing business needs" />
          </div>
          <div className={styles.resourceList}>
            <p className={styles.eyebrow}>Resources in context</p>
            <h3 id="resource-title">When you need help, find the right door.</h3>
            {['Capital', 'Contracting', 'Workforce', 'Technical Assistance', 'Training & Business Support'].map((resource) => (
              <div className={styles.resourceItem} key={resource}><b>{resource}</b><span>↗</span></div>
            ))}
            <p><Link className={styles.buttonOutline} href="/resource-providers">For Resource Providers</Link></p>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionDark}`} aria-labelledby="audience-title">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>One network. Different entry points.</p>
            <h2 id="audience-title">Built around the people who move business.</h2>
          </div>
          <div className={styles.audienceGrid}>
            <Link className={styles.audienceCard} href="/businesses">
              <img src={images.workshop} alt="Local business workshop" />
              <div className={styles.cardContent}><span className={styles.audienceLabel}>Business</span><h3>Find opportunity. Be discovered.</h3><p>Build a reusable position for growth.</p></div>
            </Link>
            <Link className={styles.audienceCard} href="/buyers">
              <img src={images.construction} alt="Project professionals reviewing requirements" />
              <div className={styles.cardContent}><span className={styles.audienceLabel}>Buyers & Issuers</span><h3>Bring needs to the market.</h3><p>Discover capable organizations and suppliers.</p></div>
            </Link>
            <Link className={styles.audienceCard} href="/resource-providers">
              <img src={images.professional} alt="Professional business consultation" />
              <div className={styles.cardContent}><span className={styles.audienceLabel}>Resource Providers</span><h3>Reach businesses when help matters.</h3><p>Support better routing and stronger handoffs.</p></div>
            </Link>
            <Link className={styles.audienceCard} href="/about">
              <img src={images.region} alt="Regional city and waterfront from above" />
              <div className={styles.cardContent}><span className={styles.audienceLabel}>Communities</span><h3>Make the ecosystem more legible.</h3><p>See capabilities, connections, demand, and gaps.</p></div>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="trust-title">
        <div className={`${styles.wrap} ${styles.trust}`}>
          <div>
            <p className={styles.eyebrow}>Credibility</p>
            <div className={styles.sectionHead}>
              <h2 id="trust-title">Know more about who you&apos;re connecting with.</h2>
              <p>
                Identity, activity, experience, completed interactions, and authorized endorsements can build an evidence-backed organizational history without reducing trust to a public numerical score.
              </p>
            </div>
            <div className={styles.trustBadges} aria-label="Credibility families">
              {['Verified', 'Active', 'Experienced', 'Trusted', 'Endorsed'].map((badge) => <div className={styles.trustBadge} key={badge}>{badge}</div>)}
            </div>
          </div>
          <div className={styles.trustMedia}>
            <img src={images.collaboration} alt="Business professionals collaborating in an office" />
          </div>
        </div>
      </section>

      <section className={styles.fullBleed} aria-labelledby="scale-title">
        <img src={images.region} alt="Aerial view of a city, region, and waterways" />
        <div className={styles.fullBleedContent}>
          <div>
            <p className={styles.eyebrow}>Geography as context</p>
            <h2 id="scale-title">Local roots. Wider opportunity.</h2>
            <p>Build relationships nearby. Pursue opportunity across regions. Let capability—not just proximity—define where your business can compete.</p>
          </div>
        </div>
      </section>

      <section className={styles.joinBand} aria-labelledby="join-title">
        <div className={styles.joinCopy}>
          <p className={styles.eyebrow}>Free organization account</p>
          <h2 id="join-title">Start building your position in the Exchange. Free.</h2>
          <p>Establish your organization, describe your capabilities, and enter a network built around opportunity, referrals, teaming, and resources.</p>
          <div className={styles.stepsInline}><span><b>01</b>Create</span><span><b>02</b>Establish</span><span><b>03</b>Participate</span></div>
          <p><Link className={styles.buttonGold} href="/join">Join the Exchange — Free</Link></p>
        </div>
        <div className={styles.joinMedia}>
          <img src={images.manufacturing} alt="Worker on a production line" />
        </div>
      </section>

      <section className={styles.founding} aria-labelledby="founding-title">
        <div className={styles.foundingMedia}>
          <img src={images.warehouse} alt="Large warehouse and supply operation" />
        </div>
        <div className={styles.foundingCopy}>
          <p className={styles.eyebrow}>Founding RFxchange</p>
          <h2 id="founding-title">Help build the network you want to use.</h2>
          <p>Founding Organizations participate early, help shape practical workflows, and become part of the network&apos;s launch cohort. Current benefits and commercial terms are explained on the dedicated Founding page.</p>
          <p><Link className={styles.buttonGold} href="/founding">Explore Founding Membership</Link></p>
        </div>
      </section>

      <section className={styles.ctaBanner} aria-labelledby="cta-title">
        <img src={images.construction} alt="Business professionals working together on an active project" />
        <div className={styles.ctaInner}>
          <p className={styles.eyebrow}>Enter the Exchange</p>
          <h2 id="cta-title">Be found.<br />Find opportunity.<br />Build the connection.</h2>
          <div className={styles.ctaActions}>
            <Link className={styles.buttonGold} href="/join">Join Free</Link>
            <Link className={styles.buttonLight} href="/signin">Sign In</Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
