export interface OpaqueOpportunityCandidate {
  readonly reference: string;
}

function stableReference(value: string): string {
  const reference = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(reference)) {
    throw new Error("Opportunity reference is invalid.");
  }
  return reference;
}

/**
 * This token is deliberately non-authorizing and need not be secret or tamper-proof. It only
 * preserves a syntactically valid navigation candidate until authentication. Every consumer must
 * revalidate current participant/publication authority before disclosing an opportunity payload.
 */
export function serializeOpaqueOpportunityCandidate(reference: string): string {
  return `candidate.v1.${Buffer.from(stableReference(reference), "utf8").toString("base64url")}`;
}

export function parseOpaqueOpportunityCandidate(
  value: string | null | undefined,
): OpaqueOpportunityCandidate | null {
  if (!value?.startsWith("candidate.v1.")) return null;
  try {
    const encoded = value.slice("candidate.v1.".length);
    return Object.freeze({
      reference: stableReference(Buffer.from(encoded, "base64url").toString("utf8")),
    });
  } catch {
    return null;
  }
}
