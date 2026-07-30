import type { AdminSearchResult } from "../../application/admin/universal-search";

export function AdminUniversalSearchResults({
  query,
  results,
}: Readonly<{ query: string; results: readonly AdminSearchResult[] }>) {
  return (
    <section aria-labelledby="admin-search-results-heading">
      <h1 id="admin-search-results-heading">Search results</h1>
      <p>{results.length} results for “{query}”.</p>
      <ul>
        {results.map((result) => (
          <li key={`${result.category}:${result.id}`}>
            <a href={result.route}>
              <strong>{result.title}</strong>
              {result.secondaryText ? <span> — {result.secondaryText}</span> : null}
              <span> ({result.category})</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
