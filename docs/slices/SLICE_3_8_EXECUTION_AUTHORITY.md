# Slice 3.8 — Persistent Network Education execution authority

**Status: IMPLEMENTED, ACCEPTED, EXACT-HEAD CI PASSED — MERGE/POST-MERGE CI REQUIRED BEFORE CLOSEOUT**

## Recalculated merged baseline

Slice 3.8 authority is recalculated from merged `main` at `25baba600d6e1913a8941570f7348454d2e6941d` after:

- Slice 3.7 passed exact-head production CI run `31300282317` on `0776aaf59856dd5ab2ef5f8fe3b8e9eec5713cbe`;
- PR #137 merged the accepted Slice 3.7 implementation at `25baba600d6e1913a8941570f7348454d2e6941d`; and
- post-merge production CI run `31300395073` passed on `main`.

The canonical tracker is **438 total · 150 Done · 288 Not Started**, Activation **43/43**, and Network **36/38**. Slices 3.2–3.7 now supply the real controlled Network, AMACS-backed market profile, organization enrichment, referral, provider-application, provider-routing, request-communication and provider-resource behaviors that persistent education may explain. The dependency map therefore identifies `EDU-016` and `EDU-017` as the only remaining Network features and the earliest eligible product slice. This documentation-only recalculation changes no Feature-ID completion state and no dependency edge.

## Conditional Brand Gate B6b decision

Brand Gate B6b remains **Not Started / intentionally pending**. The post-Slice-3.7 inspection found:

- no specific B6b execution brief exists;
- no merged authority makes B6b a prerequisite for Slice 3.8 or Wave 3 closeout;
- organization discovery, referrals and provider resources already consume shared participant shells and authoritative live records;
- Slice 3.7 added a real service-territory field and provider request context without fabricating opportunity, credibility or outcome objects; and
- no concrete, bounded convergence defect requires a separate visual gate before participants can receive persistent education.

The planning roadmap alone cannot authorize a broad lens rewrite. The canonical Slice 3.8 brief explicitly permits implementation against the current completed Network baseline while B6b remains pending. Therefore this phase does not create a B6b implementation PR, changes no Brand Gate or Feature-ID status, and preserves B6b for a later explicit brief if a bounded convergence need is established. B6c, B7–B10 and every later capability remain unstarted.

## Authorized Feature IDs

- `EDU-016` — reusable Quick Start and Business, Issuer and Resource Provider learning paths; and
- `EDU-017` — contextual workflow explainers over consequential live Wave 3 actions.

Implementation must remain bounded by `SLICE_3_8_PERSISTENT_NETWORK_EDUCATION.md`, the merged Content and Messaging System corrections in PRs #134 and #135, the current organization/referral/provider authorities and the existing production abstractions inspected for this recalculation.

## Required production reuse

Slice 3.8 extends rather than replaces:

- the shared participant navigation, Spatial Workspace, Operational Workspace, responsive sheets, semantic state panels and existing localization provider;
- the completed Wave 2 synthetic orientation aggregate, which remains separate, visibly synthetic and immutable after OPEN;
- current participant-route resolution, active organization membership, lifecycle/restriction and server-session authority;
- Slice 3.3 confirmed AMACS 0.5.0 market-profile claims and the non-authoritative AI/AMACS suggestion/disposition boundary;
- Slice 3.4 credential, media and additional-location privacy/provenance boundaries;
- Slice 3.5 referral consent, exact sharing, lifecycle and first-use education acknowledgement;
- Slice 3.6 provider application/status/profile authority and scoped administrative review;
- Slice 3.7 provider discovery, request, redirect, communication, resource and invitation behavior; and
- existing Firestore server repositories, direct-client default-deny rules, immutable event evidence and command-idempotency patterns.

Education state cannot satisfy an authorization check, advance lifecycle, modify an organization/profile/referral/provider/resource record, create an analytics outcome or replace the owning workflow command.

## Binding implementation decisions

### Versioned education catalog and state (`EDU-016`)

Define one versioned RFxchange-controlled catalog for Quick Start plus Business, Issuer and Resource Provider paths. Catalog entries use stable keys, localized interface copy, ordering, live/future availability, four-question explanation where applicable and validated internal deep links. Content version changes must preserve prior progress evidence and explicitly expose the new current version; they cannot silently reinterpret a completion.

Persist education progress separately for the exact RFxchange user and organization membership context. The state supports active, dismissed and completed presentation plus item/path progress, resume position, version, timestamps and idempotent commands. Reopening remains available after dismissal or completion. A user acting through another organization receives a distinct progress context. Direct-client mutation is denied; server commands re-resolve the current session, exact active membership, lifecycle and restriction state before writing education progress.

Quick Start teaches **Understandable → Discoverable → Connectable → Actionable** and links only to current authorized workflows. Business is the neutral default recommendation. Official Resource Provider status may recommend the provider path, and current provider facts may tailor its live links, but the recommendation grants nothing. The Issuer path may explain universal future issuer participation and the Need → Capability relationship, but Wave 4 RFx creation is visibly unavailable and has no simulated action or intent persistence.

Deep links are allow-listed repository routes. Current paths may include the organization profile/enrichment workspace, Network discovery, referrals, provider application and Resources. Future RFx, credibility, commercial and institutional items render as unavailable/planned with no fabricated records, authority or analytics.

### Contextual four-question explainers (`EDU-017`)

Use one versioned, localized explainer catalog and shared progressively disclosed primitive. Each consequential explainer answers:

1. What is this?
2. Why does it matter here?
3. What happens if I do this?
4. What happens next?

Apply explainers before commitment on the live Wave 3 surfaces that own profile/capability confirmation, interpretation suggestion disposition, credential/evidence and media visibility, additional locations, referral send/accept/decline and consent, provider application, provider connection/accept/decline/redirect, request communication and provider resource publication/withdrawal. The owning action remains available without a repetitive modal wall; an explainer may be reopened and its viewed/dismissed state may be remembered independently of domain state.

Copy must preserve suggestion versus confirmed claim, claim versus evidence/verification, private versus public publication, referral/provider connection versus acceptance/service/outcome and Official Resource Provider versus Organization Verification/credibility/payment. Platform-controlled strings ship in `en-US`, Spanish, French, Italian and German. Participant-authored content remains verbatim.

### Synthetic, analytics and future-domain isolation

Slice 3.8 does not need new synthetic records. If an explanatory example is necessary, it uses the existing deterministic tutorial boundary, is visibly labeled and cannot enter live collections, discovery, analytics, credibility or outcomes. Education progress itself is not a product outcome and no new analytics/event pipeline is authorized. Tests must prove education commands cannot call or mutate organization, referral, provider, acquisition, RFx, credibility, commercial or administrative repositories.

No opportunity beacon, RFx composer, issuer permission, provider approval, Organization Verification, credibility seal, paid entitlement, Intelligence Dark, Presentation Mode, sound or haptic runtime may be created by this slice.

## Participant experience and accessibility

Expose Quick Start as a reusable participant destination without replacing the completed onboarding orientation. Preserve one clear next action, calm progressive disclosure, keyboard-visible focus and existing participant shells. Desktop, intermediate and mobile layouts must reflow without horizontal overflow; screen readers receive structural path progress, current/recommended state, availability and complete explainer questions. Reduced motion disables nonessential travel and transitions while preserving all state and meaning. Dismiss/resume/reopen behavior must survive reload and sign-in re-entry.

Empty, unavailable, permission, stale-version, save-failure and recovery messages follow the Content and Messaging System and never claim intent was saved unless it was persisted. Platform copy is localized through the existing five-locale boundary; authored organization/provider/referral text is never automatically translated.

## Acceptance evidence required before completion

Automated, emulator and configured-browser acceptance must prove:

1. versioned Quick Start and all three role paths, stable ordering, exact deep links and truthful unavailable future paths;
2. durable per-user/per-organization resume, dismiss, reopen, completion and content-version behavior with idempotency, immutable evidence and direct-client denial;
3. role/provider recommendation without permission, status, lifecycle or domain-state coupling;
4. all contextual explainers answer the four required questions before consequential actions without blocking or replacing the action;
5. education state cannot mutate or grant organization, issuer, provider, referral, administrative, verification, credibility, commercial or future-workflow authority;
6. AMACS and AI copy preserves ordinary-language entry, non-authoritative suggestion, human confirmation and separate authoritative write;
7. synthetic/tutorial and analytics isolation, with no new live or public example records;
8. loading, empty, validation, permission, unavailable, stale/conflict, save-failure and recovery behavior;
9. desktop, intermediate, mobile, keyboard, screen-reader, 200% reflow, reduced-motion, five-locale and clean-console behavior; and
10. configured business, approved-provider and non-provider journeys with exact Auth/Firestore/Storage cleanup and zero residuals.

Run focused validators and emulator acceptance plus the canonical full local gate:

```bash
npm run check
```

Production CI must pass on the exact PR head and again on merged `main` before Wave 3 closeout is recalculated.

## Implementation and acceptance result

The bounded implementation now satisfies `EDU-016` and `EDU-017`. The versioned catalog, membership-bound aggregate, immutable events and commands, direct-client denial, Quick Start destination, four role paths, allow-listed live links, truthful future stops, eleven shared explainers and five localized namespaces are present. Focused tests, Firestore emulator acceptance, the canonical local repository gate and configured-browser acceptance passed; detailed evidence is recorded in `docs/architecture/WAVE_3_SLICE_3_8.md`.

The configured pass used approved-provider and non-provider business contexts, all four paths, persistence/re-entry, live workflow explainers, desktop/intermediate/mobile layouts, keyboard/screen-reader structure, reduced motion and all five locales. Cleanup removed 16 education records and the complete supporting Firestore/Auth fixture footprint with zero residuals. Education created no provider application or other domain record and changed no organization, provider, issuer or administrative authority.

The canonical tracker advances only `EDU-016` and `EDU-017` to Done: **438 total · 152 Done · 286 Not Started**, Activation **43/43**, Network **38/38**. PR #139 production CI run `31303300038` passed on substantive head `a5c15238c175ce6010e7942d6ed2f3ecafb11fe3`. Wave 3 is not declared closed by that arithmetic; merge, post-merge production CI and the separately authorized closeout reconciliation remain required.

## Explicit non-scope

This authority does not permit B6b implementation, Wave 4 first-RFx education (`EDU-011`–`EDU-013`), endorsement education (`EDU-015`), opportunity/RFx creation or beacons, teaming, verification, credibility, paid training or certification, commercial entitlement, B6c, Intelligence Dark, Presentation Mode, production sound or haptics.

Wave 3 closeout remains a separate evidence reconciliation after Slice 3.8 merges and post-merge production CI passes. No Wave 4 or later production work may begin under this authority.
