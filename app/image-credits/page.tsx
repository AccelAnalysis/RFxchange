import type { Metadata } from "next";

import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import referenceStyles from "@/src/components/marketing/MarketingReference.module.css";
import styles from "@/src/components/marketing/MarketingSite.module.css";
import { publicImageAssetList, publicImageAssets } from "@/src/content/public-assets";

export const metadata: Metadata = {
  title: "Image Credits | The RFxchange",
  description: "Sources for photography used on The RFxchange website.",
};

export default function ImageCreditsPage() {
  return (
    <main className={styles.site}>
      <MarketingHeader />
      <section className={referenceStyles.storyHero}>
        <div className={referenceStyles.storyHeroMedia}>
          <img src={publicImageAssets.region.src} alt={publicImageAssets.region.alt} />
        </div>
        <div className={referenceStyles.storyHeroCopy}>
          <div className={referenceStyles.eyebrow}>Image credits</div>
          <h1>Photography used on The RFxchange.</h1>
          <p className={referenceStyles.storyHeroLede}>
            Images on the public website are illustrative unless otherwise identified. Sources are listed below.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={referenceStyles.eyebrow}>Photography sources</div>
            <h2>Credits</h2>
            <p>The public website uses credited photography from the sources listed here.</p>
          </div>
          <div className={styles.creditGrid}>
            {publicImageAssetList.map((asset) => (
              <article className={styles.creditCard} key={asset.id}>
                <h3>{asset.alt}</h3>
                <p>{asset.creditLabel}</p>
                <p><a href={asset.sourceUrl} target="_blank" rel="noreferrer">View source</a></p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
