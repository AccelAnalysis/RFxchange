# Phase 2 configured-browser harness debt

PR #191 intentionally does not modify the generic configured-browser harness at `scripts/acceptance-exchange-shell-emulator.mjs`.

The canonical harness still expects ordinary permanent-lens clicks to navigate to dedicated routes such as `/opportunities`, `/resources`, and `/referrals`. Activated Exchange Room Phase 2 instead requires the permanent lens selector to remain in the persistent Exchange Room while changing lens/action context and preserving map/camera/selection state.

This is a shared Control Room test-authority seam, not permission for Lane 01 to restore obsolete navigation behavior or weaken the Phase 2 runtime.

Control Room must reconcile the generic harness separately while preserving dedicated domain-route hrefs as governed deep links where still authoritative.
