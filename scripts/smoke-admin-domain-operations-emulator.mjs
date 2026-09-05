import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { loadAdminDomainSurface } from "../src/infrastructure/admin/domain-operations-runtime.ts";

assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8080", "This smoke test only runs against the local emulator.");
const app = initializeApp({ projectId: "demo-rfxchange" }, `admin-production-${Date.now()}`);
const db = getFirestore(app);
const suffix = `audit-${Date.now()}`;
const orgA = `${suffix}-a`;
const orgB = `${suffix}-b`;
const organization = (id) => ({ kind: "ORGANIZATION", targetId: id, value: `ORGANIZATION:${id}` });
const global = { kind: "GLOBAL", value: "GLOBAL", targetId: null };
const refs = [];
async function put(collection, id, data) {
  const ref = db.collection(collection).doc(id);
  refs.push(ref);
  await ref.set(data);
}
const load = (key, scope, permissions, extra = {}) => loadAdminDomainSurface({ db, key, scope, permissions, ...extra });
try {
  await put("organizationProfiles", `a-${suffix}`, { organizationId: orgB, displayName: "Other organization" });
  await put("organizationProfiles", `z-${suffix}`, { organizationId: orgA, displayName: "Authorized organization" });
  const directory = await load("organizations", organization(orgA), ["organization.profile.read"], { limit: 1 });
  assert.deepEqual(directory.records.map((row) => row.title), ["Authorized organization"]);
  assert.equal(directory.nextCursor, null);

  await put("geographies", suffix, { name: "Scoped geography", releaseState: "released", fipsCode: "51001" });
  const geography = await load("geographies", { kind: "GEOGRAPHY", targetId: suffix, value: `GEOGRAPHY:${suffix}` }, ["geography.definition.read"]);
  assert.deepEqual(geography.records.map((row) => row.id), [suffix]);
  assert.equal(geography.records[0].facts.find((fact) => fact.label === "FIPS").value, "51001");

  for (const [i, collection] of ["organizationAuthorityClaims", "organizationCredentials"].entries()) {
    for (let j = 0; j < 3; j++) await put(collection, `${suffix}-${j * 2 + i}`, { organizationId: orgA, status: "submitted" });
  }
  const seen = new Set();
  let cursor = null;
  do {
    const page = await load("claims-verification", organization(orgA), ["organization.claim.read", "credibility.organization.verify"], { limit: 1, cursor });
    for (const row of page.records) { const id = `${row.kind}:${row.id}`; assert.equal(seen.has(id), false); seen.add(id); }
    cursor = page.nextCursor;
  } while (cursor);
  assert.equal(seen.size, 6, "Independent collection cursors must not skip or repeat records.");

  await put("users", suffix, { name: "Shared user", primaryEmail: "shared@example.test" });
  await put("organizationMemberships", `${suffix}-member-a`, { userId: suffix, organizationId: orgA, status: "active" });
  await put("organizationMemberships", `${suffix}-member-b`, { userId: suffix, organizationId: orgB, status: "active" });
  const users = await load("users-access", organization(orgA), ["user.profile.read", "user.access.read"]);
  assert.deepEqual(users.records.map((row) => row.title), ["Shared user"]);
  assert.equal(users.records[0].facts.find((fact) => fact.label === "Memberships in this scope").value, "1");
  assert.doesNotMatch(JSON.stringify(users), new RegExp(orgB));

  const before = await load("analytics", global, ["analytics.dashboard.read"]);
  const beforeCount = before.metrics.find((metric) => metric.label === "Active restrictions").value;
  await put("accessRestrictions", `${suffix}-cleared`, { target: { organizationId: orgA }, state: "none" });
  await put("accessRestrictions", `${suffix}-restricted`, { target: { organizationId: orgA }, state: "restricted" });
  const after = await load("analytics", global, ["analytics.dashboard.read"]);
  assert.equal(after.metrics.find((metric) => metric.label === "Active restrictions").value, beforeCount + 1);
  const boundedAnalytics = await load("analytics", organization(orgA), ["analytics.dashboard.read"]);
  assert.deepEqual(boundedAnalytics.metrics, []);
  await assert.rejects(load("data-promotion", global, []), /access denied/);
  console.log("Admin scope, user isolation, pagination, geography, count and promotion negative checks passed.");
} finally {
  await Promise.all(refs.map((ref) => ref.delete()));
  assert.equal((await db.getAll(...refs)).some((doc) => doc.exists), false, "No residual emulator records.");
  await deleteApp(app);
}
