import { BrandWordmark } from "@/src/components/brand/BrandWordmark";
import { NetworkField } from "@/src/components/marketing/NetworkField";
import { JourneyRail } from "@/src/components/marketing/JourneyRail";
import { audienceEmphasis, publicDifferentiation, publicPositioning } from "@/src/content/marketing";

export default function HomePage() {
  return (
    <main>
      <header className="site-header shell">
        <BrandWordmark />
        <nav aria-label="Primary">
          <a href="#how-it-works">How it works</a>
          <a href="#for-you">Who it serves</a>
          <a className="nav-cta" href="#join">Join</a>
        </nav>
      </header>

      <section className="hero shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">A local business growth network</p>
          <h1 id="hero-title">Make business capability, opportunity, and connection visible.</h1>
          <p className="hero-deck">{publicPositioning.summary}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#join">Join</a>
            <a className="button button-secondary" href="#how-it-works">See How It Works</a>
          </div>
          <p className="launch-note">
            Founding access opens after the account, legal, geography, and commercial controls required for production enrollment are ready.
          </p>
        </div>
        <NetworkField />
      </section>

      <section className="proof-strip" aria-label="Core network functions">
        <div className="shell proof-grid">
          {publicPositioning.pillars.map((pillar) => (
            <div key={pillar.title} className="proof-item">
              <span>{pillar.kicker}</span>
              <strong>{pillar.title}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="section shell differentiation-section" aria-labelledby="different-title">
        <div className="section-intro">
          <p className="eyebrow">Built for business action</p>
          <h2 id="different-title">A working business network—not another place to post and scroll.</h2>
          <p>
            The RFxchange connects business identity, demand, relationships, and support so a useful discovery can move into a useful next step.
          </p>
        </div>
        <div className="differentiation-grid">
          {publicDifferentiation.map((item) => (
            <div key={item.label} className="differentiation-item">
              <h3>{item.label}</h3>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="section shell">
        <div className="section-intro">
          <p className="eyebrow">One connected journey</p>
          <h2>Move from capability to action with context.</h2>
          <p>
            The RFxchange connects the stages that businesses, buyers, and resource providers already navigate—so discovery can lead to a useful next step.
          </p>
        </div>
        <JourneyRail />
      </section>

      <section id="for-you" className="section section-dark">
        <div className="shell">
          <div className="section-intro section-intro-light">
            <p className="eyebrow">One network. Three entry points.</p>
            <h2>Shared infrastructure, relevant value.</h2>
          </div>
          <div className="audience-grid">
            {audienceEmphasis.map((audience) => (
              <article key={audience.name} className="audience-panel">
                <p className="audience-label">{audience.name}</p>
                <h3>{audience.promise}</h3>
                <p>{audience.detail}</p>
                <ul>
                  {audience.signals.map((signal) => <li key={signal}>{signal}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section shell signal-section">
        <div>
          <p className="eyebrow">Measured intelligence</p>
          <h2>See what the network is doing without turning activity into hype.</h2>
        </div>
        <div className="signal-card" aria-label="Example measurement ladder">
          <span>Participation</span>
          <span>Discovery</span>
          <span>Connection</span>
          <span>Activity</span>
          <span>Outcome</span>
          <strong>Verified impact</strong>
        </div>
      </section>

      <section id="join" className="join-section">
        <div className="shell join-layout">
          <div>
            <p className="eyebrow">Founding launch</p>
            <h2>Establish your organization where the network begins.</h2>
          </div>
          <div className="join-copy">
            <p>
              The production enrollment flow will open when organization authority, controlled geography, legal acceptance, and approved commercial terms are enforceable end to end.
            </p>
            <p className="join-status">Wave 0 establishes the product system that those flows will inherit.</p>
          </div>
        </div>
      </section>

      <footer className="site-footer shell">
        <BrandWordmark compact />
        <p>Be found. Find opportunity. Build the connection.</p>
      </footer>
    </main>
  );
}
