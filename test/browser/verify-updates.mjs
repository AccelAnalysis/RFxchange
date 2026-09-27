import assert from "node:assert/strict";
import rfxMessages from "../../src/i18n/messages/rfx/en-US.json" with { type: "json" };
import marketMessages from "../../src/i18n/messages/market-profile/en-US.json" with { type: "json" };
export async function verifyUpdates(browser, origin) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${origin}/update-tests`);
  await page.waitForSelector("#updates-ready", { state: "attached" });
  await page.waitForFunction(() => typeof window.renderUpdate === "function");
  const invitation = {
    id: "invitation-test",
    version: 1,
    status: "pending",
    canDecide: true,
    canRevoke: false,
    opportunityTitle: "Test opportunity",
    leadOrganizationDisplayName: "Lead organization",
    issuerDisplayName: "Issuer",
    responseDeadline: "2026-12-31",
    capabilityLabel: "Planning",
    gapTitle: "Planning gap",
    proposedCapacity: "capability-contributor",
    responsibilitySummary: "Plan delivery",
    targetDisplayName: "Partner",
  };
  let commands = 0;
  await page.route("**/api/opportunities/teaming", async (route) => {
    commands++;
    const body = route.request().postDataJSON();
    await route.fulfill({
      json: {
        invitation: {
          ...invitation,
          version: 2,
          status: body.action === "accept" ? "accepted" : body.action === "revoke" ? "revoked" : "pending",
          canDecide: false,
          canRevoke: body.action === "create",
        },
      },
    });
  });
  await page.evaluate((props) => window.renderUpdate("invitation", props), { invitation });
  await page.locator("input[type=checkbox]").check();
  await page.getByRole("button", { name: rfxMessages.teamInvitation.accept, exact: true }).click();
  await page.waitForSelector('[data-team-invitation-status="accepted"]');
  assert.equal(await page.getByRole("button", { name: rfxMessages.teamInvitation.accept, exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => window.refreshes), 0);
  await page.evaluate(() =>
    window.renderUpdate("teaming", {
      context: {
        opportunityReference: "rfx-test",
        gapReference: "gap-test",
        opportunityTitle: "Test opportunity",
        gapTitle: "Planning gap",
        capabilityLabel: "Planning",
      },
      candidates: [],
      invitations: [],
      serviceAreas: [],
      query: { capacity: "capability-contributor", need: "Plan delivery", serviceArea: "" },
      returnHref: "/opportunities",
    }),
  );
  await page.locator("input[name=recipientDisplayName]").fill("Partner");
  await page.locator("input[name=recipientEmail]").fill("partner@example.test");
  await page
    .locator("form")
    .filter({ has: page.locator("input[name=recipientEmail]") })
    .locator("button[type=submit]")
    .click();
  await page.getByRole("button", { name: rfxMessages.teaming.revoke, exact: true }).waitFor();
  await page.getByRole("button", { name: rfxMessages.teaming.revoke, exact: true }).click();
  await page.waitForFunction(
    () => !Array.from(document.querySelectorAll("button")).some((b) => b.textContent === "Revoke"),
  );
  assert.equal(commands, 3);
  assert.equal(await page.evaluate(() => window.refreshes), 0);
  const snapshot = {
    claims: [],
    pastPerformance: [],
    preferences: null,
    provisionalTerms: [],
    industry: { revision: 1, industries: [{ label: "Old industry" }], naics: [] },
  };
  const current = {
    ...snapshot,
    industry: {
      revision: 2,
      industries: [{ label: "Current industry", visibility: "private" }],
      naics: [
        {
          id: "naics-541611",
          code: "541611",
          title: "Consulting",
          version: "2022",
          source: "participant_selected",
          provenance: "Participant selected from Census 2022 NAICS",
        },
      ],
    },
  };
  const industryCommands = [];
  await page.route("**/api/organization-market-profile**", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: current });
    industryCommands.push(route.request().postDataJSON());
    return route.fulfill({
      status: industryCommands.length === 1 ? 409 : 200,
      json: industryCommands.length === 1 ? { error: "Conflict" } : { saved: true },
    });
  });
  await page.evaluate((props) => window.renderUpdate("market", props), {
    organizationId: "org-a",
    organizationName: "Organization A",
    snapshot,
    catalog: { release: {}, domains: [], families: [], capabilities: [] },
    marketRoles: [],
    serviceGeographies: [],
    naicsCatalog: {
      release: { version: "2022", sourceName: "Census", sourceUrl: "https://example.test" },
      entries: [{ code: "541611", title: "Consulting" }],
    },
  });
  await page.getByRole("button", { name: marketMessages.tabs.industry, exact: true }).click();
  await page.locator("textarea[name=industries]").fill("Stale edit");
  await page
    .locator("form")
    .filter({ has: page.locator("textarea[name=industries]") })
    .locator("button[type=submit]")
    .click();
  await page.waitForFunction(() => document.querySelector("textarea[name=industries]")?.value === "Current industry");
  assert.equal(await page.getByRole("button", { name: /541611\s*Consulting/ }).getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("select[name=visibility]").inputValue(), "private");
  await page
    .locator("form")
    .filter({ has: page.locator("textarea[name=industries]") })
    .locator("button[type=submit]")
    .click();
  await page.getByText(marketMessages.notices.industrySavedTitle, { exact: true }).waitFor();
  assert.equal(industryCommands.length, 2);
  assert.equal(industryCommands[1].input.expectedIndustryRevision, 2);
  assert.equal(industryCommands[1].input.naics[0].code, "541611");
  assert.equal(await page.evaluate(() => window.refreshes), 0);
  assert.deepEqual(errors, []);
  console.log("Actual teaming updates and market-profile conflict recovery passed without route refresh.");
  await page.close();
}
