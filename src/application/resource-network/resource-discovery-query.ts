const MAXIMUM_QUERY_TERMS = 20;

export function resourceDiscoveryTerms(value: string | null | undefined): readonly string[] {
  return Object.freeze([
    ...new Set((value ?? "")
      .trim()
      .toLocaleLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((term) => term.length > 1)),
  ].slice(0, MAXIMUM_QUERY_TERMS));
}

export function matchesResourceDiscoveryTerms(
  values: readonly (string | null | undefined)[],
  terms: readonly string[],
): boolean {
  if (!terms.length) return true;
  const corpus = values
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase();
  return terms.every((term) => corpus.includes(term));
}
