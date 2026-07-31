import type { Metadata } from "next";

import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import referenceStyles from "@/src/components/marketing/MarketingReference.module.css";
import styles from "@/src/components/marketing/MarketingSite.module.css";

export const metadata: Metadata = {
  title: "Image Credits | The RFxchange",
  description: "Stock image source credits used on The RFxchange public marketing surface.",
};

const credits = [
  ["Construction team reviewing plans", "RONNAKORN TRIRAGANON · Unsplash", "https://unsplash.com/photos/construction-workers-review-plans-at-a-job-site-IvEYfb-3B70"],
  ["Local workshop", "Zhen Yao · Unsplash", "https://unsplash.com/photos/two-men-working-in-a-workshop-with-shelves-of-supplies-Fhl-y01fSvg"],
  ["Manufacturing worker", "EqualStock · Unsplash", "https://unsplash.com/photos/factory-worker-sews-with-a-machine-on-a-production-line-a52uB25uD8A"],
  ["Business collaboration", "Vitaly Gariev · Unsplash", "https://unsplash.com/photos/business-people-collaborating-in-a-modern-office-meeting-VRT8k7BJ7wk"],
  ["Business meeting", "Vitaly Gariev · Unsplash", "https://unsplash.com/photos/four-business-people-in-a-meeting-discussing-documents-YHC8oV7tcdM"],
  ["City and regional scale", "McGill Productions · Unsplash", "https://unsplash.com/photos/an-aerial-view-of-a-large-city-in-the-middle-of-the-ocean-L4dE9VWfkEw"],
  ["Warehouse and supply", "Phillip Flores · Unsplash", "https://unsplash.com/photos/warehouse-storage-aisles-with-shelves-full-of-boxes-gjZTDr6E4vQ"],
] as const;

export default function ImageCreditsPage() {
  return (
    <main className={styles.site}>
      <MarketingHeader />
      <section className={referenceStyles.storyHero}>
        <div className={referenceStyles.storyHeroMedia}>
          <img
            src="https://images.unsplash.com/photo-1633536584998-2d71cbd95d37?auto=format&fit=crop&w=2200&q=82"
            alt="Aerial view of a city, region, and waterways"
          />
        </div>
        <div className={referenceStyles.storyHeroCopy}>
          <div className={referenceStyles.eyebrow}>Prototype sources</div>
          <h1>Stock photography credits.</h1>
          <p className={referenceStyles.storyHeroLede}>Photography sources used in this visual marketing prototype.</p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={referenceStyles.eyebrow}>Stock photography</div>
            <h2>Stock photography used in this prototype</h2>
            <p>
              The homepage uses photography from Unsplash. These are real stock photographs used as visual references; no fabricated RFxchange screens, businesses, testimonials or platform metrics are shown.
            </p>
          </div>
          <div className={styles.creditGrid}>
            {credits.map(([label, credit, href]) => (
              <article className={styles.creditCard} key={label}>
                <h3>{label}</h3>
                <p>{credit}</p>
                <p><a href={href} target="_blank" rel="noreferrer">View source</a></p>
              </article>
            ))}
          </div>
          <p>Review licensing and final image selection again before commercial production deployment.</p>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
