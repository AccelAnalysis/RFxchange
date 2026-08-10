import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { ImmutableNaicsCatalog } from "../src/infrastructure/naics/immutable-catalog.ts";

const generated = new URL("../src/generated/naics/2022/", import.meta.url);
const marketProfilePanel = await readFile(new URL("../src/components/market-profile/MarketProfilePanel.tsx", import.meta.url), "utf8");
const organizationProfilePage = await readFile(new URL("../app/organization-profile/page.tsx", import.meta.url), "utf8");

async function catalog() {
  const [release, entries] = await Promise.all([
    readFile(new URL("release.json", generated), "utf8").then(JSON.parse),
    readFile(new URL("catalog.json", generated), "utf8").then(JSON.parse),
  ]);
  return new ImmutableNaicsCatalog(release, entries);
}

test("pinned 2022 Census NAICS catalog resolves exact governed six-digit identities", async () => {
  const subject = await catalog();
  const projection = await subject.getProjection();
  assert.equal(projection.release.version, "2022");
  assert.equal(projection.entries.length, 1012);
  assert.deepEqual(await subject.getIndustry("236220", "2022"), {
    code: "236220",
    title: "Commercial and Institutional Building Construction",
  });
  assert.equal(await subject.getIndustry("236220", "2017"), null);
  assert.equal(await subject.getIndustry("999999", "2022"), null);
});

test("NAICS catalog rejects duplicate, malformed, or metadata-inconsistent projections", () => {
  const release = { version: "2022", sourceName: "U.S. Census Bureau", sourceUrl: "https://www.census.gov/naics/source.xlsx", retrievedAt: "2026-08-10", sourceSha256: "a".repeat(64), level: 6, entryCount: 2 };
  assert.throws(() => new ImmutableNaicsCatalog(release, [{ code: "236220", title: "One" }, { code: "236220", title: "Two" }]), /duplicate/);
  assert.throws(() => new ImmutableNaicsCatalog({ ...release, entryCount: 1 }, [{ code: "23622", title: "Malformed" }]), /malformed/);
  assert.throws(() => new ImmutableNaicsCatalog({ ...release, version: "2017" }, [{ code: "236220", title: "Construction" }, { code: "541330", title: "Engineering Services" }]), /metadata/);
});

test("industry revision conflicts refresh and rehydrate the governed selector", () => {
  assert.match(marketProfilePanel, /error instanceof MarketProfileRequestError && error\.status === 409/);
  assert.match(marketProfilePanel, /startTransition\(\(\) => router\.refresh\(\)\)/);
  assert.match(organizationProfilePage, /key=\{`\$\{organizationId\}:industry:\$\{marketProfile\.snapshot\.industry\?\.revision \?\? 0\}`\}/);
});
