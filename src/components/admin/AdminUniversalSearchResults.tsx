import Link from "next/link";

import type { AdminSearchResult } from "../../application/admin/universal-search";

import styles from "./AdminOperatingCore.module.css";

function readable(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminUniversalSearchResults({
  query,
  results,
}: Readonly<{ query: string; results: readonly AdminSearchResult[] }>) {
  return (
    <section className={styles.workspace} aria-labelledby="admin-search-results-heading">
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Administration</p>
          <h1 id="admin-search-results-heading">Search</h1>
          <p className={styles.intro}>
            Search currently implemented administrative destinations. Additional record types will
            enter search as their protected admin runtimes come online.
          </p>
        </div>
        {query.length >= 2 ? (
          <div className={styles.summary} aria-label={`${results.length} search results`}>
            <strong>{results.length}</strong>
            <span>results</span>
          </div>
        ) : null}
      </header>

      <form className={styles.searchForm} action="/admin/search" method="get" role="search">
        <label htmlFor="admin-search-page-input" style={{ position: "absolute", left: "-10000px" }}>
          Search administration
        </label>
        <input
          id="admin-search-page-input"
          name="q"
          type="search"
          minLength={2}
          maxLength={160}
          defaultValue={query}
          placeholder="Organization, provider, or case"
          autoFocus
        />
        <button type="submit">Search</button>
      </form>

      <section className={styles.section} aria-label="Administrative search results">
        {query.length < 2 ? (
          <div className={styles.empty}>
            <strong>Enter at least two characters.</strong>
            <p>Search is permission-filtered before any result is returned.</p>
          </div>
        ) : results.length ? (
          <ul className={styles.searchList}>
            {results.map((result) => (
              <li className={styles.searchResult} key={`${result.category}:${result.id}`}>
                <Link href={result.route}>
                  <strong>{result.title}</strong>
                  {result.secondaryText ? <small>{result.secondaryText}</small> : null}
                </Link>
                <span>{readable(result.category)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <strong>No authorized results found.</strong>
            <p>Try another search term or open one of the available administrative workspaces.</p>
          </div>
        )}
      </section>
    </section>
  );
}
