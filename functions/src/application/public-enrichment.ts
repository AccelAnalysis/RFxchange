export type EnrichmentSource = "sam" | "usaspending";
export interface EnrichmentSubject {
  organizationId: string;
  displayName: string;
  uei: string | null;
}
export interface EnrichmentFinding {
  field: "legalName" | "uei" | "registrationStatus" | "award";
  value: string;
  sourceReference: string;
  confidence: number;
}
export interface EnrichmentSourceResult {
  source: EnrichmentSource;
  status: "succeeded" | "no-match" | "unavailable" | "skipped";
  retrievedAt: string;
  findings: EnrichmentFinding[];
  errorCode: string | null;
}
export interface EnrichmentAdapter {
  source: EnrichmentSource;
  lookup(subject: EnrichmentSubject): Promise<EnrichmentSourceResult>;
}
export interface PublicEnrichmentRun {
  id: string;
  organizationId: string;
  startedAt: string;
  completedAt: string;
  status: "ready-for-review" | "partial" | "unavailable" | "no-match";
  sourceResults: EnrichmentSourceResult[];
  conflicts: { field: string; currentValue: string; proposedValue: string; source: EnrichmentSource }[];
  reviewStatus: "pending" | "reviewed";
}

/** Source failures are isolated. Findings never mutate profile, capability or credibility truth. */
export async function enrichPublicOrganization(
  id: string, subject: EnrichmentSubject, adapters: readonly EnrichmentAdapter[],
  now: () => string = () => new Date().toISOString(),
): Promise<PublicEnrichmentRun> {
  const startedAt = now();
  const sourceResults = await Promise.all(adapters.map(async (adapter): Promise<EnrichmentSourceResult> => {
    try { return await adapter.lookup(subject); }
    catch { return { source: adapter.source, status: "unavailable", retrievedAt: now(), findings: [], errorCode: "source-unavailable" }; }
  }));
  const findings = sourceResults.flatMap((result) => result.findings);
  const unavailable = sourceResults.some((result) => result.status === "unavailable");
  const conflicts: PublicEnrichmentRun["conflicts"] = [];
  for (const result of sourceResults) for (const finding of result.findings) {
    const current = finding.field === "legalName" ? subject.displayName : finding.field === "uei" ? subject.uei : null;
    if (current && current.trim().toLowerCase() !== finding.value.trim().toLowerCase()) {
      conflicts.push({ field: finding.field, currentValue: current, proposedValue: finding.value, source: result.source });
    }
  }
  return { id, organizationId: subject.organizationId, startedAt, completedAt: now(),
    status: unavailable ? (findings.length ? "partial" : "unavailable") : findings.length ? "ready-for-review" : "no-match",
    sourceResults, conflicts, reviewStatus: "pending" };
}
