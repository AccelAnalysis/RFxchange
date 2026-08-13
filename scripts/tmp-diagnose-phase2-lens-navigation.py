from pathlib import Path

path = Path("scripts/acceptance-exchange-shell-emulator.mjs")
source = path.read_text()
source = source.replace(
    '  assert.equal(immediate.search, continuityBefore.search, `${id} changed shared Room query context during primary activation.`);',
    '  const immediateSearch = immediate.search;',
    1,
)
needle = '''  await waitForExpression(
    cdp,
    `document.querySelector('[data-exchange-room-action-grid]')?.dataset.activeLens === ${JSON.stringify(id)}
      && document.querySelectorAll('[data-exchange-room-action-grid] [data-exchange-room-action]').length === 4`,
    `${id} in-Room lens/action projection`,
  );
  const after = await exchangeRoomLensSnapshot(cdp);'''
replacement = '''  await waitForExpression(
    cdp,
    `document.querySelector('[data-exchange-room-action-grid]')?.dataset.activeLens === ${JSON.stringify(id)}
      && document.querySelectorAll('[data-exchange-room-action-grid] [data-exchange-room-action]').length === 4`,
    `${id} in-Room lens/action projection`,
  );
  await wait(Math.max(800, latencyMs + 350));
  const after = await exchangeRoomLensSnapshot(cdp);'''
if needle not in source:
    raise SystemExit("Phase 2 post-click snapshot seam not found")
source = source.replace(needle, replacement, 1)
source = source.replace(
    '  assert.equal(after.search, continuityBefore.search, `${id} discarded shared Room query context.`);',
    '''  if (after.pathname !== "/geography/canvas") {
    throw new Error(`${id} delayed navigation escaped the Room: ${after.pathname}${after.search}; before=${continuityBefore.pathname}${continuityBefore.search}; immediateSearch=${immediateSearch}`);
  }''',
    1,
)
path.write_text(source)
