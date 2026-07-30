import type { AdminUniversalSearchResponse } from "../../application/admin/universal-search";

export interface AdminUniversalSearchProps {
  readonly response?: AdminUniversalSearchResponse | null;
}

export function AdminUniversalSearch({ response = null }: AdminUniversalSearchProps) {
  return (
    <section className="admin-universal-search" aria-label="Universal administrative search">
      <form action="/admin/search" method="get" role="search">
        <label htmlFor="admin-global-search">Search the platform</label>
        <div>
          <input
            id="admin-global-search"
            name="q"
            type="search"
            maxLength={256}
            defaultValue={response?.query ?? ""}
            placeholder="Organization, user, email, RFx, referral, case, UEI, CAGE, Stripe ID…"
          />
          <button type="submit">Search</button>
        </div>
      </form>

      {response ? (
        <div className="admin-universal-search-results" aria-live="polite">
          <p>{response.total} result{response.total === 1 ? "" : "s"}</p>
          <ol>
            {response.results.map((result) => (
              <li key={`${result.kind}:${result.id}`}>
                <a href={result.href}>
                  <strong>{result.title}</strong>
                  <span>{result.kind.replaceAll("-", " ")} · {result.id}</span>
                  {result.subtitle ? <span>{result.subtitle}</span> : null}
                </a>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
