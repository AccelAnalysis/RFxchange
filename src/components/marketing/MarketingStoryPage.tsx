import Link from "next/link";

import { MarketingFooter, MarketingHeader } from "./MarketingChrome";
import referenceStyles from "./MarketingReference.module.css";
import styles from "./MarketingSite.module.css";

export interface MarketingStorySection {
  readonly eyebrow: string;
  readonly title: string;
  readonly body: string;
  readonly bullets?: readonly string[];
}

export interface MarketingStoryPageProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly lede: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly sections: readonly MarketingStorySection[];
  readonly ctaTitle?: string;
  readonly ctaBody?: string;
  readonly ctaHref?: string;
  readonly ctaLabel?: string;
}

export function MarketingStoryPage({
  eyebrow,
  title,
  lede,
  image,
  imageAlt,
  sections,
  ctaTitle = "Establish your organization in the Exchange.",
  ctaBody = "Create a free organization account and begin building a discoverable business position.",
  ctaHref = "/join",
  ctaLabel = "Join Free",
}: MarketingStoryPageProps) {
  return (
    <main className={styles.site}>
      <MarketingHeader />
      <section className={referenceStyles.storyHero}>
        <div className={referenceStyles.storyHeroMedia}>
          <img src={image} alt={imageAlt} />
        </div>
        <div className={referenceStyles.storyHeroCopy}>
          <div className={referenceStyles.eyebrow}>{eyebrow}</div>
          <h1>{title}</h1>
          <p className={referenceStyles.storyHeroLede}>{lede}</p>
        </div>
      </section>

      <div className={styles.storyWrap}>
        {sections.map((section, index) => (
          <section className={styles.storySection} key={section.title}>
            <div className={styles.storyGrid}>
              <div>
                <span className={styles.storyNumber}>{String(index + 1).padStart(2, "0")} · {section.eyebrow}</span>
              </div>
              <div className={styles.storyBody}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {section.bullets?.length ? (
                  <ul>
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                ) : null}
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className={styles.storyCta}>
        <div className={styles.storyCtaInner}>
          <div className={referenceStyles.eyebrow}>Next step</div>
          <h2>{ctaTitle}</h2>
          <p>{ctaBody}</p>
          <Link className={styles.buttonGold} href={ctaHref}>{ctaLabel}</Link>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
