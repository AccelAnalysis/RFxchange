import type { Metadata } from "next";

import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import styles from "@/src/components/marketing/MarketingSite.module.css";

export const metadata: Metadata = {
  title: "Image Credits | The RFxchange",
  description: "Stock image source credits used on The RFxchange public marketing surface.",
};

const credits = [
  ["Construction and project planning imagery", "https://unsplash.com/photos/construction-workers-review-plans-at-a-job-site-IvEYfb-3B70"],
  ["Manufacturing imagery", "https://unsplash.com/"],
  ["Small business workshop imagery", "https://unsplash.com/"],
  ["Professional services imagery", "https://unsplash.com/"],
  ["Business collaboration imagery", "https://unsplash.com/"],
  ["Warehouse and logistics imagery", "https://unsplash.com/"],
  ["Regional aerial imagery", "https://unsplash.com/"],
] as const;

export default function ImageCreditsPage() {
  return (
    <main className={styles.site}>
      <MarketingHeader />
      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>Image Credits</p>
            <h2>Real stock imagery, not fabricated product scenes.</h2>
            <p>
              The public marketing surface uses externally hosted stock photography during this implementation stage. Product-interface imagery should use real RFxchange screenshots only when the corresponding production surface is ready to present.
            </p>
          </div>
          <div className={styles.creditGrid}>
            {credits.map(([label, href]) => (
              <article className={styles.creditCard} key={label}>
                <h3>{label}</h3>
                <p><a href={href} target="_blank" rel="noreferrer">Source on Unsplash</a></p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
