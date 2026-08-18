import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { TEAMING_BOUNDARY_COPY_BY_LOCALE } from "../src/domain/rfx/teaming.ts";

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
  const continuation = read("app/acquisition/continue/page.tsx");
  assert.match(route, /parseAcquisitionContextToken/);
  assert.match(route, /RFXCHANGE_ACQUISITION_COOKIE_NAME/);
  assert.match(route, /\/opportunities\/team-invitations\//);
  assert.match(route, /\/signin\?returnTo=/);
  assert.doesNotMatch(route, /decide|accept|attach|membership|organizationId/);
  assert.match(continuation, /acquisition\.kind === "team-invitation" && access\.state\.lifecycleState === "open-platform"/);
  assert.match(continuation, /\/opportunities\/team-invitations\/\$\{encodeURIComponent\(invitationReference\)\}/);
  assert.doesNotMatch(continuation, /team-invitation[^\n]{0,200}(?:accept|attach)/);
});

test("existing-organization invitees have a current-authority inbox and exact review route", () => {
  const service = read("src/application/rfx/opportunity-teaming-service.ts");
  const page = read("app/opportunities/team-invitations/page.tsx");
  const discovery = read("src/components/rfx/OpportunityDiscoveryWorkspace.tsx");
  assert.match(service, /listByTargetOrganization\(scope\.organizationId\)/);
  assert.match(page, /receivedInvitations/);
  assert.match(discovery, /href="\/opportunities\/team-invitations"/);
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

test("TEM-004 participant copy has exact five-locale parity with the evidenced boundary", () => {
  const locales = ["en-US", "es", "fr", "it", "de"];
  const catalogs = Object.fromEntries(locales.map((locale) => [locale, JSON.parse(read(`src/i18n/messages/rfx/${locale}.json`))]));
  const paths = (value, prefix = "") => Object.entries(value).flatMap(([key, item]) => item && typeof item === "object" ? paths(item, `${prefix}${key}.`) : [`${prefix}${key}`]).sort();
  for (const locale of locales) {
    assert.equal(catalogs[locale].teamInvitation.boundaryBody, TEAMING_BOUNDARY_COPY_BY_LOCALE[locale]);
    assert.deepEqual(paths(catalogs[locale].teaming), paths(catalogs["en-US"].teaming));
    assert.deepEqual(paths(catalogs[locale].teamInvitation), paths(catalogs["en-US"].teamInvitation));
    assert.deepEqual(paths(catalogs[locale].teamInbox), paths(catalogs["en-US"].teamInbox));
  }
});
