/** Review disposition is distinct from accepting a change to canonical organization identity. */
export type PublicReviewDisposition = "retain-current" | "dismiss-source" | "request-correction";
export function publicReviewDisposition(value: unknown): PublicReviewDisposition {
  if (!["retain-current", "dismiss-source", "request-correction"].includes(String(value))) throw new Error("review-disposition-required");
  return value as PublicReviewDisposition;
}
