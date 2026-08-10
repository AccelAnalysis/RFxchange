import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const convergedRoutes = [
  "app/api/admin/provider-applications/route.ts",
  "app/api/ai/amacs/disposition/route.ts",
  "app/api/ai/amacs/interpret/route.ts",
  "app/api/auth/session/route.ts",
  "app/api/first-value/route.ts",
  "app/api/network-education/route.ts",
  "app/api/onboarding/activation/route.ts",
  "app/api/onboarding/home-scene/route.ts",
  "app/api/onboarding/spatial-model/route.ts",
  "app/api/organization-enrichment/assets/[assetId]/route.ts",
  "app/api/organization-enrichment/route.ts",
  "app/api/organization-market-profile/route.ts",
  "app/api/orientation/route.ts",
  "app/api/provider-applications/route.ts",
  "app/api/referrals/attach/route.ts",
  "app/api/referrals/route.ts",
  "app/api/resources/route.ts",
];

test("runtime recovery conventions provide loading, not-found, render, and root failure boundaries", () => {
  const loading = read("app/loading.tsx");
  const notFound = read("app/not-found.tsx");
  const renderError = read("app/error.tsx");
  const globalError = read("app/global-error.tsx");

  assert.match(loading, /role="status"/);
  assert.match(loading, /aria-live="polite"/);
  assert.match(notFound, /recovery\.notFoundTitle/);
  assert.match(renderError, /\berror\.digest\b/);
  assert.doesNotMatch(renderError, /\berror\.message\b|\berror\.stack\b/);
  assert.match(globalError, /<html lang=\{locale\}>/);
  assert.match(globalError, /\berror\.digest\b/);
  assert.doesNotMatch(globalError, /\berror\.message\b|\berror\.stack\b/);
});

test("all supported locales carry the new recovery states", () => {
  for (const locale of ["en-US", "es", "fr", "it", "de"]) {
    const dictionary = JSON.parse(read(`src/i18n/messages/recovery/${locale}.json`));
    for (const key of [
      "loadingEyebrow",
      "loadingTitle",
      "loadingBody",
      "notFoundEyebrow",
      "notFoundTitle",
      "notFoundBody",
      "globalEyebrow",
      "globalTitle",
      "globalBody",
    ]) {
      assert.equal(typeof dictionary[key], "string", `${locale}.${key}`);
      assert.ok(dictionary[key].trim().length > 0, `${locale}.${key}`);
    }
  }
});

test("participant and administrative catch paths use the shared API problem boundary", () => {
  for (const route of convergedRoutes) {
    const source = read(route);
    assert.match(source, /apiProblem/, route);
    assert.doesNotMatch(
      source,
      /NextResponse\.json\([\s\S]{0,120}(?:error|cause)\.message/,
      `${route} must not serialize exception messages`,
    );
  }
});

test("referral attachment preserves governed access resolution instead of restarting activation", () => {
  const source = read("app/api/referrals/attach/route.ts");
  const continuation = read("app/acquisition/continue/page.tsx");
  const resolutionBranch = source.indexOf('access.kind === "access-resolution-required"');
  const activationBranch = source.indexOf('access.kind === "unauthenticated"');
  assert.ok(resolutionBranch >= 0);
  assert.ok(activationBranch > resolutionBranch);
  assert.match(source.slice(resolutionBranch, activationBranch), /\/access\/resolve/);
  assert.match(source, /apiProblem/);
  assert.match(source, /status", "attachment-failed"/);
  assert.match(source, /NextResponse\.redirect\(destination, 303\)/);
  assert.match(continuation, /attachmentFailed/);
  assert.match(continuation, /role="alert"/);
});

test("authorized workspace projection gaps reach retryable recovery instead of Join", () => {
  for (const route of [
    "app/geography/canvas/page.tsx",
    "app/orientation/page.tsx",
    "app/first-value/page.tsx",
    "app/organization-profile/page.tsx",
    "app/referrals/page.tsx",
    "app/resources/page.tsx",
  ]) {
    const source = read(route);
    assert.match(source, /ParticipantRouteDependencyUnavailableError/, route);
    assert.doesNotMatch(source, /\?\? redirect\("\/join"\)/, route);
    assert.doesNotMatch(source, /if \(![^\n]+\) redirect\("\/join"\)/, route);
  }

  const join = read("app/join/page.tsx");
  assert.doesNotMatch(join, /createServerAuthenticationBoundary/);
  assert.doesNotMatch(join, /catch\s*\{[\s\S]{0,120}createControlledLocalityPreview/);
  assert.match(join, /access\.kind === "authorized"/);
});

test("the API problem boundary never projects raw causes or stacks", () => {
  const source = read("src/infrastructure/http/api-problem.ts");
  assert.doesNotMatch(source, /input\.cause\.(?:message|stack)/);
  assert.doesNotMatch(source, /JSON\.stringify\(input\.cause\)/);
  assert.match(source, /x-rfxchange-correlation-id/);
  assert.match(source, /x-rfxchange-support-id/);
  assert.match(source, /cache-control/);
});

test("optional acquisition binding distinguishes invalid contexts from outages without reclassifying durable writes", () => {
  const session = read("app/api/auth/session/route.ts");
  const education = read("src/application/network-education/network-education.ts");
  const referral = read("src/application/referrals/referral-create-and-send.ts");

  assert.match(session, /error instanceof AcquisitionContextBindingError/);
  assert.match(session, /\? "rejected"[\s\S]{0,80}: "unavailable"/);
  assert.doesNotMatch(education, /repository\.save[\s\S]{0,180}NetworkEducationError\("conflict"/);
  assert.doesNotMatch(referral, /saveCreateAndSend[\s\S]{0,240}ReferralNetworkError\(\s*"conflict"/);
});

test("orientation preserves expected state conflicts while dependency failures remain retryable", () => {
  const route = read("app/api/orientation/route.ts");
  const model = read("src/domain/orientation/model.ts");
  const repository = read("src/infrastructure/firestore/orientation-journey.ts");

  assert.match(route, /cause instanceof OrientationJourneyStateError/);
  assert.match(route, /stateError\?\.code === "conflict"[\s\S]{0,80}\? 409/);
  assert.match(route, /: 500/);
  assert.match(model, /class OrientationJourneyStateError/);
  assert.match(repository, /Orientation journey changed; reload before continuing/);
});

test("first-value release preserves stale lifecycle conflicts while dependency failures remain retryable", () => {
  const route = read("app/api/first-value/route.ts");
  const service = read("src/application/activation/open-release.ts");
  const repository = read("src/infrastructure/firestore/first-value.ts");

  assert.match(route, /cause instanceof FirstValueStateError/);
  assert.match(route, /stateError\?\.code === "conflict"[\s\S]{0,80}\? 409/);
  assert.match(route, /: 500/);
  assert.match(service, /new FirstValueStateError\([\s\S]{0,40}"conflict"/);
  assert.match(repository, /First-value selection changed; reload before continuing/);
});
