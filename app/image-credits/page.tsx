import type { Metadata } from "next";

import { MarketingFooter, MarketingHeader } from "@/src/components/marketing/MarketingChrome";
import referenceStyles from "@/src/components/marketing/MarketingReference.module.css";
import styles from "@/src/components/marketing/MarketingSite.module.css";
import {
  publicAssetPolicy,
  publicImageAssetList,
  publicImageAssets,
} from "@/src/content/public-assets";

export const metadata: Metadata = {
  title: "Image Credits | The RFxchange",
  description: "Public photography provenance and evidence-use rules for The RFxchange.",
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
          <div className={referenceStyles.eyebrow}>Public asset provenance</div>
          <h1>Photography sources and evidence rules.</h1>
          <p className={referenceStyles.storyHeroLede}>
            Stock photography supports atmosphere only. It is not evidence of RFxchange participants,
            activity, outcomes, testimonials, or adoption.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={referenceStyles.eyebrow}>Governed photography register</div>
            <h2>Every public image has a named source.</h2>
            <p>
              The homepage uses credited Unsplash photography. No fabricated RFxchange screens,
              organizations, opportunities, maps, statistics, testimonials, or outcomes are presented.
            </p>
          </div>
          <div className={styles.creditGrid}>
            {publicImageAssetList.map((asset) => (
              <article className={styles.creditCard} key={asset.id}>
                <h3>{asset.alt}</h3>
                <p>{asset.creditLabel}</p>
                <p>Use: atmosphere only—not product evidence.</p>
                <p><a href={asset.sourceUrl} target="_blank" rel="noreferrer">View source</a></p>
              </article>
            ))}
          </div>
          <p>
            Final commercial deployment requires another rights and licensing review:{" "}
            <strong>{publicAssetPolicy.finalCommercialLicenseReviewRequired ? "required" : "not required"}</strong>.
          </p>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
