# Wave 3 Slice 3.5 — Referral Network & Referral Acquisition

## Accepted scope

Slice 3.5 implements `REF-001`, `REF-002`, `REF-003`, `REF-004`, `REF-005`, `EDU-014`, and `ACQ-006`. It creates organization-owned referrals with a controlled lifecycle, exact-recipient consent and education, role-minimized projections, versioned communications, legitimate external acquisition continuity, and real privacy-safe map paths. It does not implement provider routing, paid referrals, public referral feeds, credibility, verified outcomes, teaming, RFx workflows, or any later slice.

## Runtime architecture

- `src/domain/referrals/model.ts` defines the aggregate, explicit draft → sent → accepted → contacted → closed lifecycle, sent → declined/expired alternatives, consent evidence, education acknowledgements, events, command receipts, communication intents, and sender/recipient projections.
- `src/application/referrals/referral-network.ts` re-resolves the current authenticated organization, active membership, restrictions, account state, and `referral.manage` before every command or replay. Expected versions and command fingerprints fail stale or conflicting requests closed.
- `src/infrastructure/firestore/referrals.ts` transactionally persists the mutable aggregate with append-only events, organization audit evidence, idempotent commands, education acknowledgements, and communication correlation. Firestore rules deny direct client access to all five referral collections.
- `app/api/referrals/route.ts`, `app/api/acquisition/referral/route.ts`, and `app/api/referrals/attach/route.ts` expose same-origin authenticated commands, signed acquisition entry, and explicit post-activation attachment. A token preserves context but grants no organization authority or acceptance.
- `ReferralWorkspace` supplies list/detail parity, exact-data education and consent, existing/external recipient composition, lifecycle actions, truthful delivery state/recovery, and accessible map-path alternatives. `MapboxLocalityCanvas` draws a gold relationship path only for a real permitted record with two privacy-safe endpoints.

## Privacy, communications, and acquisition boundaries

The sender selects one named recipient and shares only the approved organization name and participant-authored summary unless a separately supported field is explicitly present. Recipient email, acquisition identity, actor identities, command evidence, and raw communication records never enter public or counterparty projections. Existing organization notification uses only a currently public main contact. External invitation issuance occurs only after the referral transition preflight succeeds and uses the merged versioned transactional-email provider boundary with stable correlation/idempotency.

An external invitation creates a real acquisition context referencing the real referral. Sign-in binds that context to the legitimate activation journey; all ordinary policy, Profile Complete, marker, membership, restriction, geography and OPEN gates remain authoritative. Attachment additionally requires matching normalized authenticated email, exact context/referral correlation, current `referral.manage`, and explicit user action. Attachment does not accept the referral.

## Internationalization, spatial behavior, and accessibility

All platform copy is complete in `en-US`, Spanish, French, Italian, and German; participant-authored names and summaries remain verbatim. Sent, accepted, contacted and closed records can draw a real fixed-endpoint path. External or missing endpoints, draft, declined and expired states retain a textual alternative and draw no path. Status is always explicit text and never depends on color or motion. Desktop `1280px`, intermediate `820px`, and mobile `390px` layouts have no horizontal overflow, keep the referral control above map interaction layers, expose semantic dialog/form/list/detail/status structure, visible focus and reduced-motion/transparency contracts.

## Acceptance evidence

Focused tests cover authority, wrong user/organization, missing permission, restriction, consent, minimum sharing, stale version, command replay, state transitions, expiry, recipient substitution, attachment mismatch/replay, communication correlation, projection minimization, and credibility/outcome neutrality. Firestore emulator acceptance proves direct-client denial, atomic record/event/audit/command persistence, tenant queries, communication result persistence, stale-version rejection, and zero residuals.

Configured acceptance against the selected real Firebase project used two fresh disposable OPEN users and three disposable organizations. It proved:

- an existing-organization referral with exact sharing education, consent, a versioned queued communication intent, synchronized list/detail, two privacy-safe markers and a real Sent path;
- an external referral with no fabricated endpoint/path, signed acquisition entry, context binding to the matching-email OPEN recipient, explicit attachment, recipient acceptance/contact, sender close, and preserved non-verified outcome language;
- all five locales, desktop/intermediate/mobile layouts, zero horizontal overflow, unobstructed referral actions, semantic keyboard/focus contracts, real Mapbox/Census locality presentation, and a clean error console; and
- cleanup of 64 exact Firestore documents and both Auth identities followed by zero record and Auth residuals.

The browser also exposed and acceptance now guards two material regressions: split-map controls no longer cover the referral panel, and Firestore hydration preserves aggregate/communication update timestamps so multiple referrals sort and reload correctly.

The focused validators, Firebase emulator smoke, TypeScript/lint/build gates, and canonical `npm run check` pass on the accepted implementation branch. The configured local environment did not supply the managed Microsoft client secret, so no live-email-delivery claim is made; queued intent, provider failure/retry behavior, accepted replay suppression, and correlation are covered by the merged communications boundary and deterministic tests.

## Completion and handoff

Acceptance supports marking only `REF-001`, `REF-002`, `REF-003`, `REF-004`, `REF-005`, `EDU-014`, and `ACQ-006` Done. The checkpoint is **438 total · 139 Done · 299 Not Started**, Activation **43/43**, and Network **25/38**. PR #130 passed exact-head production CI run `31294774153` on `17e8e66fc11e29bc125bc739d5fad7141da14244`, merged at `516c49627aeff637b02982218f0682c1eea436ad`, and post-merge `main` CI run `31294884142` passed. Dependency authority was recalculated from that merged tree and Slice 3.6 was separately authorized without changing Feature-ID totals.
