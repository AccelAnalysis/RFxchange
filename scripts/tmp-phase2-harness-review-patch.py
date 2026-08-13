from pathlib import Path

path = Path("scripts/acceptance-exchange-shell-emulator.mjs")
source = path.read_text()
start_marker = "let exchangeRoomReopenEvidenceCaptured = false;"
end_marker = "\n\nasync function clickUtility"
if source.count(start_marker) != 1:
    raise SystemExit(f"Expected one Phase 2 harness block, found {source.count(start_marker)}.")
start = source.index(start_marker)
end = source.index(end_marker, start)
replacement = r'''const EXCHANGE_ROOM_ACTION_IDS_BY_LENS = Object.freeze({
  "opportunities-rfx": Object.freeze([
    "opportunities.find",
    "opportunities.create-rfx",
    "opportunities.pursue-respond",
    "opportunities.team",
  ]),
  resources: Object.freeze([
    "resources.find-providers",
    "resources.browse-resources",
    "resources.my-requests",
    "resources.provider-status",
  ]),
  intelligence: Object.freeze([
    "intelligence.organizations",
    "intelligence.capabilities",
    "intelligence.locations",
    "intelligence.layers",
  ]),
  referrals: Object.freeze([
    "referrals.new",
    "referrals.sent",
    "referrals.received",
    "referrals.starred",
  ]),
});

let exchangeRoomReopenEvidenceCaptured = false;

async function exchangeRoomLensSnapshot(cdp) {
  return evaluate(cdp, `(() => {
    const activeKey = sessionStorage.getItem("rfxchange:participant-spatial:active");
    let spatial = null;
    try {
      spatial = activeKey ? JSON.parse(sessionStorage.getItem(activeKey) || "null") : null;
    } catch {
      spatial = null;
    }
    const grid = document.querySelector('[data-exchange-room-action-grid]');
    const currentLens = document.querySelector('[data-participant-navigation] a[data-participant-lens][aria-current="page"]');
    const actions = [...(grid?.querySelectorAll('[data-exchange-room-action]') || [])]
      .map((action) => ({
        id: action.dataset.exchangeRoomAction || null,
        state: action.dataset.actionState || null,
        disabledReason: action.dataset.disabledReason || null,
        tagName: action.tagName,
        disabled: action.matches(':disabled') || action.getAttribute('aria-disabled') === 'true',
        href: action.getAttribute('href'),
      }));
    return {
      phase2: Boolean(grid),
      pathname: location.pathname,
      search: location.search,
      activeLens: grid?.dataset.activeLens || currentLens?.dataset.participantLens || null,
      currentLens: currentLens?.dataset.participantLens || null,
      actions,
      panelOpen: spatial?.panelOpen ?? Boolean(document.querySelector('#organization-detail-panel')),
      selection: spatial?.selection ?? null,
      camera: spatial?.camera ?? null,
      geographyId: spatial?.scope?.geographyId ?? null,
      scope: spatial?.scope ?? null,
      shellInstance: document.querySelector('[data-participant-shell="persistent"]')?.dataset.participantShellInstance || null,
      navigationEntries: performance.getEntriesByType("navigation").length,
      wholeLensDisabled: [...document.querySelectorAll('[data-participant-navigation] a[data-participant-lens]')]
        .some((lens) => lens.getAttribute('aria-disabled') === 'true' || lens.dataset.availability === 'unavailable'),
    };
  })()`);
}

async function clickExchangeRoomLens(cdp, id, href, expectedPath, { latencyMs = 0 } = {}) {
  const deepLink = new URL(href, "https://participant.invalid");
  assert.equal(deepLink.pathname, expectedPath, `${id} lost its truthful dedicated-route deep link.`);

  const before = await exchangeRoomLensSnapshot(cdp);
  assert.equal(before.phase2, true, `${id} did not expose the Phase 2 Exchange Room controller.`);
  assert.equal(before.pathname, "/geography/canvas", `${id} started outside the Exchange Room.`);
  assert.equal(before.wholeLensDisabled, false, "A permanent lens was disabled as a whole.");

  if (!exchangeRoomReopenEvidenceCaptured) {
    if (before.panelOpen) {
      const closed = await evaluate(cdp, `(() => {
        const close = [...document.querySelectorAll('#organization-detail-panel button[type="button"]')]
          .find((button) => button.textContent?.includes('×'));
        if (!close) return false;
        close.click();
        return true;
      })()`);
      assert.equal(closed, true, "Could not close the Exchange Room action surface before reopen acceptance.");
      await waitForExpression(
        cdp,
        `!document.querySelector('[data-exchange-room-action-grid]')`,
        "closed Exchange Room action surface",
      );
    }
    exchangeRoomReopenEvidenceCaptured = true;
  }

  const continuityBefore = await exchangeRoomLensSnapshot(cdp);
  if (latencyMs > 0) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: latencyMs,
      downloadThroughput: 1_000_000,
      uploadThroughput: 1_000_000,
      connectionType: "wifi",
    });
  }
  const wallStartedAt = performance.now();
  await beginObservation(cdp);
  const immediate = await evaluate(cdp, `(async () => {
    const link = document.querySelector('[data-participant-navigation] a[data-participant-lens="${id}"]');
    if (!link) return { found: false };
    const shell = document.querySelector('[data-participant-shell="persistent"]');
    const shellInstance = shell?.dataset.participantShellInstance || null;
    link.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return {
      found: true,
      pathname: location.pathname,
      search: location.search,
      shellInstance,
      navigationEntries: performance.getEntriesByType("navigation").length,
    };
  })()`);
  assert.equal(immediate.found, true, `Missing enabled ${id} lens.`);
  assert.equal(immediate.pathname, "/geography/canvas", `${id} abandoned the Exchange Room on primary activation.`);
  assert.equal(immediate.search, continuityBefore.search, `${id} changed shared Room query context during primary activation.`);

  await waitForExpression(
    cdp,
    `document.querySelector('[data-exchange-room-action-grid]')?.dataset.activeLens === ${JSON.stringify(id)}
      && document.querySelectorAll('[data-exchange-room-action-grid] [data-exchange-room-action]').length === 4`,
    `${id} in-Room lens/action projection`,
  );
  const after = await exchangeRoomLensSnapshot(cdp);
  const observation = await finishObservation(cdp);
  const durationMs = performance.now() - wallStartedAt;
  if (latencyMs > 0) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
      connectionType: "none",
    });
  }

  assert.equal(after.pathname, "/geography/canvas", `${id} changed the Exchange Room pathname.`);
  assert.equal(after.search, continuityBefore.search, `${id} discarded shared Room query context.`);
  assert.equal(after.activeLens, id, `${id} did not become the active Exchange Room lens.`);
  assert.equal(after.currentLens, id, `${id} did not project current lens semantics.`);
  assert.deepEqual(
    after.actions.map((action) => action.id),
    EXCHANGE_ROOM_ACTION_IDS_BY_LENS[id],
    `${id} did not expose the canonical ordered four-action identity contract.`,
  );
  for (const action of after.actions) {
    assert.ok(action.state === "active" || action.state === "disabled", `${action.id} exposed an invalid action state.`);
    if (action.state === "disabled") {
      assert.equal(action.tagName, "BUTTON", `${action.id} disabled state was not rendered as a button.`);
      assert.equal(action.disabled, true, `${action.id} disabled state remained actionable.`);
      assert.equal(action.href, null, `${action.id} disabled state retained a usable href.`);
      assert.ok(
        ["not-operational", "not-applicable", "not-authorized"].includes(action.disabledReason),
        `${action.id} disabled state lost its governed reason.`,
      );
    } else {
      assert.equal(action.disabled, false, `${action.id} active state was disabled.`);
      assert.equal(action.disabledReason, null, `${action.id} active state retained a disabled reason.`);
      assert.ok(action.tagName === "A" || action.tagName === "BUTTON", `${action.id} active state used an invalid control.`);
      if (action.tagName === "A") assert.ok(action.href, `${action.id} active link lost its href.`);
    }
  }
  assert.equal(after.panelOpen, true, `${id} did not leave/reopen the action surface.`);
  assert.equal(after.wholeLensDisabled, false, "A permanent lens became disabled as a whole.");
  assert.deepEqual(after.selection, continuityBefore.selection, `${id} changed the selected organization.`);
  assert.deepEqual(after.camera, continuityBefore.camera, `${id} changed the persisted camera.`);
  assert.equal(after.geographyId, continuityBefore.geographyId, `${id} changed geography context.`);
  assert.deepEqual(after.scope, continuityBefore.scope, `${id} changed participant spatial scope.`);
  assert.equal(after.shellInstance, continuityBefore.shellInstance, `${id} remounted the persistent Exchange shell.`);
  assert.equal(after.navigationEntries, continuityBefore.navigationEntries, `${id} caused a document navigation.`);
  assert.equal(observation.takeover, false, `${id} triggered a root takeover.`);

  return {
    ...observation,
    durationMs,
    contentSettlementMs: durationMs,
    immediatePendingFeedback: false,
    immediateRouteCommitted: false,
    immediateContentPreserved: true,
    phase2InRoom: true,
    lens: id,
    actionIds: after.actions.map((action) => action.id),
    actionStates: after.actions.map((action) => action.state),
    selectedOrganizationId: after.selection?.organizationId ?? null,
    geographyId: after.geographyId,
  };
}

async function clickLens(cdp, id, expectedPath, options = {}) {
  const href = await evaluate(cdp, `document.querySelector('[data-participant-navigation] a[data-participant-lens="${id}"]')?.getAttribute("href") || null`);
  assert.ok(href, `Missing enabled ${id} lens.`);
  const phase2 = options.candidate === true
    && await evaluate(cdp, `Boolean(document.querySelector('[data-exchange-room-action-grid]'))`);
  return phase2
    ? clickExchangeRoomLens(cdp, id, href, expectedPath, options)
    : clickHref(cdp, href, expectedPath, options);
}'''
path.write_text(source[:start] + replacement + source[end:])
