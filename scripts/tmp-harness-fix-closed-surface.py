from pathlib import Path
p=Path('scripts/acceptance-exchange-shell-emulator.mjs')
s=p.read_text()
s=s.replace('let exchangeRoomReopenEvidenceCaptured = false;','let exchangeRoomPhase2RuntimeDetected = false;\nlet exchangeRoomReopenEvidenceCaptured = false;',1)
old='''  const phase2 = options.candidate === true\n    && await evaluate(cdp, `Boolean(document.querySelector('[data-exchange-room-action-grid]'))`);'''
new='''  const phase2SurfacePresent = await evaluate(cdp, `Boolean(document.querySelector('[data-exchange-room-action-grid]'))`);\n  if (phase2SurfacePresent) exchangeRoomPhase2RuntimeDetected = true;\n  const phase2 = exchangeRoomPhase2RuntimeDetected\n    && await evaluate(cdp, `location.pathname === "/geography/canvas"`);'''
if s.count(old)!=1: raise SystemExit('dispatch block mismatch')
s=s.replace(old,new,1)
p.write_text(s)
