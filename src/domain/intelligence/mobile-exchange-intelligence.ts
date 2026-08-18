export const INTELLIGENCE_RECORD_VISIBILITY_SCOPES = Object.freeze([
  "private",
  "team",
  "organization",
  "public",
] as const);

export type IntelligenceRecordVisibilityScope =
  (typeof INTELLIGENCE_RECORD_VISIBILITY_SCOPES)[number];

export type IntelligenceRecordVisibility =
  | Readonly<{
      scope: "private";
      ownerUserId: string;
      teamId: null;
      organizationId: string;
    }>
  | Readonly<{
      scope: "team";
      ownerUserId: null;
      teamId: string;
      organizationId: string;
    }>
  | Readonly<{
      scope: "organization";
      ownerUserId: null;
      teamId: null;
      organizationId: string;
    }>
  | Readonly<{
      scope: "public";
      ownerUserId: null;
      teamId: null;
      organizationId: null;
    }>;

export interface IntelligenceServerScopeAuthority {
  readonly authoritySource: "server-derived";
  readonly viewerUserId: string;
  readonly viewerOrganizationId: string;
  readonly permittedTeamIds: readonly string[];
  readonly publicRecordsPermitted: boolean;
}

export interface IntelligenceSourceTruth {
  readonly id: "rfxchange-authoritative-organization-network";
  readonly label: "RFxchange authoritative organization discovery";
  readonly authoritySource: "server-derived";
  readonly sourceType: "first-party-authoritative-records";
}

export interface IntelligenceCoverageTruth {
  readonly kind: "bounded-authorized-network-discovery";
  readonly currentPageCount: number;
  readonly projectedCount: number;
  readonly totalMatched: number;
  readonly candidateLimit: number;
  readonly geographyId: string;
  readonly fullMarketMeasure: false;
  readonly caveat: string;
}

export interface IntelligenceRecordTruth {
  readonly recordType: "organization-network-result";
  readonly recordId: string;
  readonly organizationId: string;
  readonly visibility: IntelligenceRecordVisibility;
  readonly source: IntelligenceSourceTruth;
  readonly geography: Readonly<{
    geographyId: string;
    label: string;
    authority: string;
    sourceLayerUrl: string;
  }>;
  readonly vintage: Readonly<{
    sourceVintage: string;
    effectiveAt: string;
    projectedAt: string;
  }>;
  readonly quality: Readonly<{
    status: "authoritative-projection";
    basis: "server-authorized-current-records";
  }>;
  readonly caveats: readonly string[];
  readonly coverage: IntelligenceCoverageTruth;
  readonly authoritySource: "server-derived";
}

export const CURRENT_APPROVED_INTELLIGENCE_LAYER_IDS: readonly string[] = Object.freeze([]);

export const INTELLIGENCE_NETWORK_COVERAGE_CAVEAT =
  "Results cover the current bounded, authorized RFxchange participant discovery set in this geography. They do not measure the full market, economic activity, density, market share, or a market gap.";

function boundedText(value: string, label: string, maximum = 240): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized || normalized.length > maximum) {
    throw new Error(`${label} is invalid.`);
  }
  return normalized;
}

function timestamp(value: string, label: string): string {
  const normalized = boundedText(value, label);
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be ISO compatible.`);
  return new Date(parsed).toISOString();
}

function count(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a non-negative integer.`);
  return value;
}

function sameOrganization(
  visibility: Extract<IntelligenceRecordVisibility, { scope: "organization" }>,
  authority: IntelligenceServerScopeAuthority,
): boolean {
  return visibility.organizationId === authority.viewerOrganizationId;
}

/**
 * Scope checks are intentionally domain-generic, but only current approved records are
 * projected by the Stage 4 adapter. Browser state cannot construct this authority.
 */
export function intelligenceScopeIsAuthorized(
  visibility: IntelligenceRecordVisibility,
  authority: IntelligenceServerScopeAuthority,
): boolean {
  if (authority.authoritySource !== "server-derived") return false;
  if (!authority.viewerUserId.trim() || !authority.viewerOrganizationId.trim()) return false;
  switch (visibility.scope) {
    case "private":
      return visibility.ownerUserId === authority.viewerUserId
        && visibility.organizationId === authority.viewerOrganizationId;
    case "team":
      return visibility.organizationId === authority.viewerOrganizationId
        && authority.permittedTeamIds.includes(visibility.teamId);
    case "organization":
      return sameOrganization(visibility, authority);
    case "public":
      return authority.publicRecordsPermitted;
  }
}

export function createIntelligenceOrganizationVisibility(
  viewerOrganizationId: string,
): Extract<IntelligenceRecordVisibility, { scope: "organization" }> {
  return Object.freeze({
    scope: "organization",
    ownerUserId: null,
    teamId: null,
    organizationId: boundedText(viewerOrganizationId, "Viewer organization id", 191),
  });
}

export function createIntelligenceCoverageTruth(input: Readonly<{
  currentPageCount: number;
  projectedCount: number;
  totalMatched: number;
  candidateLimit: number;
  geographyId: string;
}>): IntelligenceCoverageTruth {
  const currentPageCount = count(input.currentPageCount, "Current page count");
  const projectedCount = count(input.projectedCount, "Projected count");
  const totalMatched = count(input.totalMatched, "Total matched");
  const candidateLimit = count(input.candidateLimit, "Candidate limit");
  if (projectedCount < currentPageCount) {
    throw new Error("Projected count cannot be smaller than the current authorized page.");
  }
  if (totalMatched < currentPageCount) {
    throw new Error("Total matched cannot be smaller than the current authorized page.");
  }
  if (candidateLimit === 0 || totalMatched > candidateLimit) {
    throw new Error("Bounded coverage must remain within its declared candidate limit.");
  }
  return Object.freeze({
    kind: "bounded-authorized-network-discovery",
    currentPageCount,
    projectedCount,
    totalMatched,
    candidateLimit,
    geographyId: boundedText(input.geographyId, "Coverage geography id", 191),
    fullMarketMeasure: false,
    caveat: INTELLIGENCE_NETWORK_COVERAGE_CAVEAT,
  });
}

export function createIntelligenceRecordTruth(input: Readonly<{
  recordId: string;
  organizationId: string;
  visibility: IntelligenceRecordVisibility;
  scopeAuthority: IntelligenceServerScopeAuthority;
  geographyId: string;
  geographyLabel: string;
  geographyAuthority: string;
  sourceLayerUrl: string;
  sourceVintage: string;
  projectedAt: string;
  caveats?: readonly string[];
  coverage: IntelligenceCoverageTruth;
}>): IntelligenceRecordTruth {
  if (!intelligenceScopeIsAuthorized(input.visibility, input.scopeAuthority)) {
    throw new Error("Intelligence record visibility is not authorized for the current server context.");
  }
  const projectedAt = timestamp(input.projectedAt, "Projection timestamp");
  const organizationId = boundedText(input.organizationId, "Organization id", 191);
  const caveats = Object.freeze([
    ...new Set([
      ...(input.caveats ?? []),
      input.coverage.caveat,
    ].map((value) => boundedText(value, "Intelligence caveat", 500))),
  ]);
  return Object.freeze({
    recordType: "organization-network-result",
    recordId: boundedText(input.recordId, "Intelligence record id", 191),
    organizationId,
    visibility: input.visibility,
    source: Object.freeze({
      id: "rfxchange-authoritative-organization-network",
      label: "RFxchange authoritative organization discovery",
      authoritySource: "server-derived",
      sourceType: "first-party-authoritative-records",
    }),
    geography: Object.freeze({
      geographyId: boundedText(input.geographyId, "Geography id", 191),
      label: boundedText(input.geographyLabel, "Geography label"),
      authority: boundedText(input.geographyAuthority, "Geography authority"),
      sourceLayerUrl: boundedText(input.sourceLayerUrl, "Geography source layer URL", 500),
    }),
    vintage: Object.freeze({
      sourceVintage: boundedText(input.sourceVintage, "Source vintage"),
      effectiveAt: projectedAt,
      projectedAt,
    }),
    quality: Object.freeze({
      status: "authoritative-projection",
      basis: "server-authorized-current-records",
    }),
    caveats,
    coverage: input.coverage,
    authoritySource: "server-derived",
  });
}
