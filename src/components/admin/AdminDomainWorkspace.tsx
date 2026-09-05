import Link from "next/link";

import type { AdminDomainSurfaceData } from "@/src/infrastructure/admin/domain-operations-runtime";
import styles from "./AdminDomainWorkspace.module.css";

export function AdminDomainWorkspace({
  data,
  query,
  status,
  selectedId,
  currentPath,
  scope = "GLOBAL",
  cursor = "",
}: Readonly<{
  data: AdminDomainSurfaceData;
  query: string;
  status: string;
  selectedId: string | null;
  currentPath: string;
  scope?: string;
  cursor?: string;
}>) {
  const selected = selectedId
    ? data.records.find((record) => `${record.kind}:${record.id}` === selectedId || record.id === selectedId) ?? null
    : data.records[0] ?? null;

  const scopeHref = (href: string) => {
    const url = new URL(href, "https://rfxchange.invalid");
    url.searchParams.set("scope", scope);
    if (url.pathname === "/admin/organization-claims" && scope.startsWith("GEOGRAPHY:")) url.searchParams.set("geographyId", scope.slice("GEOGRAPHY:".length));
    return `${url.pathname}${url.search}`;
  };
  const pageParams = { scope, ...(query ? { q: query } : {}), ...(status ? { status } : {}) };

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{data.definition.eyebrow}</p>
          <h1>{data.definition.title}</h1>
          <p className={styles.description}>{data.definition.description}</p>
        </div>
        {data.definition.relatedAction && !(data.definition.relatedAction.href === "/admin/organization-claims" && scope.startsWith("ORGANIZATION:")) ? (
          <Link className={styles.secondaryAction} href={scopeHref(data.definition.relatedAction.href)}>
            {data.definition.relatedAction.label}
          </Link>
        ) : null}
      </header>

      {data.metrics.length ? (
        <section className={styles.metrics} aria-label={`${data.definition.title} operating facts`}>
          {data.metrics.map((metric) => metric.href ? (
            <Link key={metric.label} className={styles.metric} href={scopeHref(metric.href)}>
              <strong>{metric.value.toLocaleString()}</strong><span>{metric.label}</span>
            </Link>
          ) : (
            <div key={metric.label} className={styles.metric}><strong>{metric.value.toLocaleString()}</strong><span>{metric.label}</span></div>
          ))}
        </section>
      ) : null}

      {data.definition.searchFields.length || data.definition.key === "data-promotion" ? (
        <form className={styles.filters} action={currentPath} method="get" role="search">
          <input type="hidden" name="scope" value={scope} />
          <label>
            <span className={styles.srOnly}>Search {data.definition.title}</span>
            <input name="q" defaultValue={query} placeholder={data.definition.searchPlaceholder} />
          </label>
          <label>
            <span className={styles.srOnly}>Status</span>
            <input name="status" defaultValue={status} placeholder="Status" />
          </label>
          <button type="submit">Apply</button>
          {(query || status) ? <Link className={styles.clear} href={scopeHref(currentPath)}>Clear</Link> : null}
        </form>
      ) : null}

      {data.records.length ? (
        <div className={styles.split}>
          <section className={styles.list} aria-label={`${data.definition.title} results`}>
            {data.records.map((record) => {
              const href = `${currentPath}?${new URLSearchParams({ ...pageParams, ...(cursor ? { cursor } : {}), selected: `${record.kind}:${record.id}` }).toString()}`;
              return (
                <Link key={`${record.kind}:${record.id}`} className={`${styles.row} ${selected?.id === record.id && selected?.kind === record.kind ? styles.selected : ""}`} href={href}>
                  <span className={styles.rowTop}><strong>{record.title}</strong>{record.attention ? <span className={styles.attention}>Needs attention</span> : null}</span>
                  <span className={styles.kind}>{record.kindLabel}{record.status ? ` · ${record.status}` : ""}</span>
                  {record.subtitle ? <span className={styles.subtitle}>{record.subtitle}</span> : null}
                </Link>
              );
            })}
          </section>

          <aside className={styles.inspector} aria-label="Selected record">
            {selected ? (
              <>
                <p className={styles.eyebrow}>{selected.kindLabel}</p>
                <h2>{selected.title}</h2>
                {selected.status ? <p className={styles.state}>{selected.status}</p> : null}
                {selected.subtitle ? <p className={styles.inspectorSubtitle}>{selected.subtitle}</p> : null}
                <dl className={styles.facts}>
                  {selected.facts.map((fact) => <div key={`${fact.label}:${fact.value}`}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
                </dl>
                {selected.href ? <Link className={styles.primaryAction} href={scopeHref(selected.href)}>Open authoritative record</Link> : null}
              </>
            ) : null}
          </aside>
        </div>
      ) : data.metrics.length ? null : (
        <section className={styles.empty}>
          <h2>{data.nextCursor ? "No matches on this page" : data.definition.emptyTitle}</h2>
          <p>{data.definition.emptyBody}</p>
        </section>
      )}
      {data.nextCursor ? (
        <Link className={styles.more} href={`${currentPath}?${new URLSearchParams({ ...pageParams, cursor: data.nextCursor }).toString()}`}>Next page</Link>
      ) : null}
    </main>
  );
}
