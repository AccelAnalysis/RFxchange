import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("RSP-007 exposes teammate and Resource actions only from current pursue team-coverable gaps", () => {
  const pursuit = read("src/application/rfx/opportunity-pursuit-service.ts");
  const workspace = read("src/components/rfx/OpportunityAssessmentWorkspace.tsx");
  assert.match(pursuit, /capabilityLabel: observation\?\.capabilityLabel/);
  assert.match(pursuit, /teamCoverageAllowed: Boolean\(observation\?\.teamCoverageAllowed\)/);
  assert.match(workspace, /gap\.current && gap\.teamCoverageAllowed && currentPursuit\?\.decision === "pursue"/);
  assert.match(workspace, /\/teammates\?returnTo=/);
  assert.match(workspace, /\/resources/);
});

test("TEM-001 reuses server-governed Network discovery and never trusts a client candidate projection", () => {
  const page = read("app/opportunities/[reference]/gaps/[gapReference]/teammates/page.tsx");
  const route = read("app/api/opportunities/teaming/route.ts");
  assert.match(page, /loadAuthorizedNetworkDiscovery\(\{ access, mapProjection, capability: context\.capabilityLabel/);
  assert.match(page, /item\.match\.source === "confirmed-structured"/);
  assert.match(page, /item\.organizationId !== context\.organizationId && item\.organizationId !== context\.issuerOrganizationId/);
  assert.match(route, /verifiedCandidate\(scope, reference, gapReference, candidateReference\)/);
  assert.match(route, /focusedOrganizationId: organizationReference/);
  assert.doesNotMatch(route, /body\.matchedCapabilityNames|body\.displayName/);
});

test("RSP-008 delegates to the existing Resources route with opaque non-authorizing context", () => {
  const route = read("app/opportunities/[reference]/gaps/[gapReference]/resources/page.tsx");
  const service = read("src/application/rfx/opportunity-teaming-service.ts");
  assert.match(route, /service\.gapContext/);
  assert.match(route, /redirect\(service\.resourceHref\(context, returnTo\)\)/);
  assert.match(service, /rfxReference: context\.opportunityReference/);
  assert.match(service, /rfxGap: context\.gapReference/);
  assert.match(service, /returnTo: returnHref/);
  assert.doesNotMatch(route, /provider|resourceRepository|Firestore/);
});

test("TEM-003/004 review requires explicit current boundary acknowledgment", () => {
  const review = read("src/components/rfx/OpportunityTeamInvitationReview.tsx");
  const api = read("app/api/opportunities/teaming/route.ts");
  assert.match(review, /checked=\{acknowledged\}/);
  assert.match(review, /disabled=\{busy \|\| !acknowledged\}/);
  assert.match(review, /TEAMING_BOUNDARY_VERSION/);
  assert.match(api, /boundaryVersion: action === "accept" \? Number\(body\.boundaryVersion\) : null/);
  assert.match(api, /boundaryLocale: action === "accept" \? String\(body\.boundaryLocale/);
  assert.match(api, /sameOrigin\(request\)/);
});

test("ACQ-007 entry stores only the acquisition token and returns to review without accepting", () => {
  const route = read("app/api/opportunities/team-invitations/acquire/route.ts");
  assert.match(route, /parseAcquisitionContextToken/);
  assert.match(route, /RFXCHANGE_ACQUISITION_COOKIE_NAME/);
  assert.match(route, /\/opportunities\/team-invitations\//);
  assert.match(route, /\/signin\?returnTo=/);
  assert.doesNotMatch(route, /decide|accept|attach|membership|organizationId/);
});

test("Slice 4.7 workspace remains bounded away from response construction and submission", () => {
  const sources = [
    "src/domain/rfx/teaming.ts",
    "src/application/rfx/opportunity-teaming-service.ts",
    "src/components/rfx/OpportunityTeammateWorkspace.tsx",
    "src/components/rfx/OpportunityTeamInvitationReview.tsx",
  ].map(read).join("\n");
  assert.doesNotMatch(sources, /responseSection|complianceMatrix|submitResponse|submissionReceipt|awardOutcome/);
});
