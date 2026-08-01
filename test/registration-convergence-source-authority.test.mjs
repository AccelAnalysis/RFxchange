import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("registration convergence remains aligned across runtime and canonical authorities", async () => {
  const [
    model,
    client,
    route,
    slice27,
    dependencyMap,
    roadmap,
    tracker,
    slice212,
    providerBrief,
  ] = await Promise.all([
    read("src/domain/organization-profile/model.ts"),
    read("src/components/onboarding/ActivationJourneyClient.tsx"),
    read("app/api/onboarding/activation/route.ts"),
    read("docs/slices/SLICE_2_7_ESSENTIAL_ORGANIZATION_PROFILE.md"),
    read("docs/tracking/RFxchange_DEPENDENCY_MAP.md"),
    read("docs/slices/WAVE_2_ROADMAP.md"),
    read("docs/tracking/RFxchange_MASTER_BUILD_TRACKER.md"),
    read("docs/slices/SLICE_2_12_FIRST_VALUE_AND_OPEN_GATE.md"),
    read("docs/slices/SLICE_3_6_OFFICIAL_RESOURCE_PROVIDER_FOUNDATION.md"),
  ]);

  assert.equal(model.includes('missing.push("organization-type")'), false);
  assert.equal(model.includes('missing.push("participation-role")'), false);
  assert.equal(client.includes("ORGANIZATION_PARTICIPATION_ROLES.map"), false);
  assert.equal(client.includes("ORGANIZATION_BUSINESS_OBJECTIVES.map"), false);
  assert.equal(client.includes("Organization type<select"), false);
  assert.equal(route.includes("participationRoles"), false);
  assert.equal(route.includes("businessObjectives"), false);

  assert.ok(slice27.includes("not collected during activation"));
  assert.ok(slice27.includes("separate application"));
  assert.ok(dependencyMap.includes("`ORG-007`, `ORG-008`, `ORG-009`, `GEO-010`"));
  assert.ok(
    dependencyMap.includes("`EDU-009` First-value pathway selection | none | `EDU-008`"),
  );
  assert.equal(
    dependencyMap.includes(
      "`EDU-009` Objective-based first-value pathway | none | `ORG-011`",
    ),
    false,
  );
  assert.ok(roadmap.includes("post-orientation first-value selection"));
  assert.ok(
    tracker.includes("Registration Convergence Correction — PR #98; no Feature IDs"),
  );
  assert.ok(tracker.includes("PR #75 + PR #98 correction"));
  assert.ok(slice212.includes("It does not depend on `ORG-011`"));
  assert.ok(
    slice212.includes(
      "must not reintroduce business-objective questions into registration",
    ),
  );
  assert.ok(providerBrief.includes("separate application"));
  assert.ok(providerBrief.includes("cannot be self-selected during registration"));
});
