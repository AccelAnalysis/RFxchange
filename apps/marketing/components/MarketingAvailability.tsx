import styles from "./MarketingAvailability.module.css";

export interface MarketingAvailabilityItem {
  readonly kind: string;
  readonly status: string;
  readonly title: string;
  readonly detail: string;
}

export interface MarketingAvailabilityContent {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly items: readonly MarketingAvailabilityItem[];
}

export function MarketingAvailability({
  content,
  id = "availability",
}: Readonly<{
  content: MarketingAvailabilityContent;
  id?: string;
}>) {
  const titleId = `${id}-title`;

  return (
    <section id={id} className={styles.section} aria-labelledby={titleId}>
      <div className={styles.wrap}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>{content.eyebrow}</p>
          <h2 id={titleId}>{content.title}</h2>
          <p>{content.description}</p>
        </div>
        <div className={styles.grid}>
          {content.items.map((item) => (
            <article
              className={`${styles.card} ${
                item.kind === "live" ? styles.live : styles.planned
              }`}
              key={item.title}
            >
              <span>{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
