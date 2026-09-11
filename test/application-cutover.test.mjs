import assert from "node:assert/strict";
import test from "node:test";
import { applicationOrigins, legacyApplicationDestination } from "../src/application/platform/application-origins.ts";

test("legacy public and Admin destinations stay on their project-owned applications", () => {
  const marketing = legacyApplicationDestination("/businesses", "fall_launch", "fr");
  assert.equal(marketing.origin, applicationOrigins.marketing);
  assert.equal(marketing.searchParams.get("utm_campaign"), "fall_launch");
  assert.equal(marketing.searchParams.get("locale"), "fr");
  const admin = legacyApplicationDestination("/admin/cases/case-123", "ignored", "fr");
  assert.equal(admin.href, `${applicationOrigins.admin}/admin/cases/case-123`);
  for (const path of ["//evil.example", "/admin\\evil", "/admin?token=secret", "/join", "/signin", "/api/auth/session", "/opportunities", "/resources", "/geography/canvas", "/capabilities"]) {
    assert.equal(legacyApplicationDestination(path), null, path);
  }
  assert.equal(legacyApplicationDestination("/", "bad value", "xx").search, "");
});
