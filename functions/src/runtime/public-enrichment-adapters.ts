import type { EnrichmentAdapter, EnrichmentFinding, EnrichmentSourceResult, EnrichmentSubject } from "../application/public-enrichment.js";

type Json = Record<string, unknown>;
const object = (value: unknown): Json => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
const text = (value: unknown, max = 200): string | null => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

async function boundedJson(response: Response): Promise<Json> {
  if (!response.ok) throw new Error("source-http-error");
  if (!response.body) throw new Error("source-empty-response");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 1_000_000) throw new Error("source-response-too-large");
      chunks.push(part.value);
    }
  } finally { await reader.cancel(); }
  return object(JSON.parse(Buffer.concat(chunks).toString("utf8")));
}

export function publicEnrichmentAdapters(
  samApiKey: string | undefined, fetcher: typeof fetch = fetch,
  now: () => string = () => new Date().toISOString(),
): readonly EnrichmentAdapter[] {
  const result = (source: "sam" | "usaspending", status: EnrichmentSourceResult["status"], findings: EnrichmentFinding[] = [], errorCode: string | null = null): EnrichmentSourceResult =>
    ({ source, status, retrievedAt: now(), findings, errorCode });
  return [{ source: "sam", async lookup(subject: EnrichmentSubject) {
    if (!samApiKey?.trim()) return result("sam", "unavailable", [], "sam-not-configured");
    const url = new URL("https://api.sam.gov/entity-information/v3/entities");
    url.searchParams.set("api_key", samApiKey);
    url.searchParams.set("includeSections", "entityRegistration");
    url.searchParams.set("size", "5");
    url.searchParams.set(subject.uei ? "ueiSAM" : "legalBusinessName", subject.uei ?? subject.displayName);
    const body = await boundedJson(await fetcher(url, { redirect: "error", signal: AbortSignal.timeout(12_000), headers: { accept: "application/json" } }));
    if (!Array.isArray(body.entityData)) throw new Error("sam-response-invalid");
    const findings: EnrichmentFinding[] = [];
    for (const item of body.entityData.slice(0, 5)) {
      const registration = object(object(item).entityRegistration);
      const uei = text(registration.ueiSAM, 12);
      if (!uei || !/^[A-Z0-9]{12}$/.test(uei)) continue;
      if (subject.uei && uei !== subject.uei) continue;
      const sourceReference = `https://sam.gov/entity/${encodeURIComponent(uei)}/coreData?status=null`;
      const confidence = subject.uei === uei ? 0.98 : 0.5;
      for (const [field, value] of [["uei", uei], ["legalName", text(registration.legalBusinessName)], ["registrationStatus", text(registration.registrationStatus)]] as const) {
        if (value) findings.push({ field, value, sourceReference, confidence });
      }
    }
    return result("sam", findings.length ? "succeeded" : "no-match", findings);
  } }, { source: "usaspending", async lookup(subject: EnrichmentSubject) {
    // A name-only award match can attribute another business's history. Require the exact UEI.
    if (!subject.uei) return result("usaspending", "skipped", [], "uei-required");
    const body = await boundedJson(await fetcher("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(12_000), headers: { "content-type": "application/json" },
      body: JSON.stringify({ filters: { recipient_search_text: [subject.uei], award_type_codes: ["A", "B", "C", "D"] }, fields: ["Award ID", "Recipient UEI", "Description", "Award Amount", "generated_internal_id"], page: 1, limit: 10, sort: "Award Amount", order: "desc" }),
    }));
    if (!Array.isArray(body.results)) throw new Error("usaspending-response-invalid");
    const findings: EnrichmentFinding[] = [];
    for (const item of body.results.slice(0, 10)) {
      const award = object(item);
      if (award["Recipient UEI"] !== subject.uei) continue;
      const awardId = text(award.generated_internal_id, 256);
      const description = text(award.Description, 500);
      const identifier = text(award["Award ID"]);
      if (!awardId || !identifier) continue;
      findings.push({ field: "award", value: `${identifier}${description ? `: ${description}` : ""}`,
        sourceReference: `https://www.usaspending.gov/award/${encodeURIComponent(awardId)}`, confidence: 0.98 });
    }
    return result("usaspending", findings.length ? "succeeded" : "no-match", findings);
  } }];
}
