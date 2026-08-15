import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("restricted participants cannot render the activation surface for legal remediation", async () => {
  const join = await read("app/join/page.tsx");
  const restricted = join.indexOf('access.kind === "restricted"');
  const activation = join.indexOf("SpatialActivationExperience", join.indexOf("export default"));
  assert.ok(restricted >= 0, "Join must explicitly classify restricted participants.");
  assert.match(join.slice(restricted, activation), /redirect\(`/, "Restricted participants must leave Join before activation renders.");
});

test("bound incomplete activation revalidates restrictions before consequential activation writes", async () => {
  const runtime = await read("src/infrastructure/auth/participant-route-runtime.ts");
  const overlay = runtime.indexOf("revalidateBoundActivationRestriction");
  const binding = runtime.indexOf('resolution.kind !== "activation-required"', overlay);
  const membershipRead = runtime.indexOf("foundation.users.memberships.getById", overlay);
  const restrictions = runtime.indexOf("dependencies.loadRestrictions(membership)", overlay);
  const restrictedResult = runtime.indexOf('kind: "restricted" as const', overlay);
  const resolver = runtime.indexOf("return revalidateBoundActivationRestriction(resolution, dependencies)");
  assert.ok(overlay >= 0 && binding > overlay);
  assert.ok(membershipRead > binding, "Bound activation must re-read the exact membership before proceeding.");
  assert.ok(restrictions > membershipRead, "Bound activation must load organization/membership restrictions.");
  assert.ok(restrictedResult > restrictions, "Active restriction must become a restricted route result.");
  assert.ok(resolver > restrictedResult, "Production participant routing must apply the bound-activation restriction overlay.");
});

test("accept-legal revalidates current access, restriction state, lifecycle, and legal step", async () => {
  const route = await read("app/api/onboarding/activation/route.ts");
  const acceptLegal = route.indexOf('case "accept-legal"');
  const nextCase = route.indexOf('case "search-geographies"', acceptLegal);
  const block = route.slice(acceptLegal, nextCase);
  assert.match(block, /resolveParticipantRoute\(\{ sessionCookie \}\)/);
  assert.match(block, /access\.kind === "restricted"/);
  assert.match(block, /status: 403/);
  assert.match(block, /access\.state\.lifecycleState === "controlled-platform"/);
  assert.match(block, /currentState\.nextStep !== "legal"/);
  assert.ok(block.indexOf("resolveParticipantRoute") < block.indexOf("service.acceptLegal"));
  assert.ok(block.indexOf('currentState.nextStep !== "legal"') < block.indexOf("service.acceptLegal"));
});
