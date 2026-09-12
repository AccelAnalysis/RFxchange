# SAD + Design v2 conformance closeout

Date: 2026-09-12. Base: `177c8fd283e7f82c602ac261471bfb4a84c08fc0` (PR #276).

The in-place three-app modernization and core v2 token foundation are deployed. This candidate addresses interface hierarchy. It does not certify the complete SAD, earn optional independent `Verified` assurance, change Feature-ID completion, or establish a production release.

Authority: [Brand & Interface Design System v2.0](RFxchange_Brand_Interface_Design_System_v2.0.md), [SAD v1.1](../architecture/RFxchange_Platform_Solution_Architecture_Document_v1.1.md), current repository `AGENTS.md` and Four-Lens completion governance. The uploaded historical START-HERE file does not override current repository governance.

## Interface candidate

| Surface | Change | Boundary preserved |
| --- | --- | --- |
| Intelligence map | One search form; one contextual four-position action rail at the top of the results/detail surface. No lower-left floating action grid. Marker and row activation open the selected organization detail. | Server-authorized discovery, selected organization, camera, lens and query state. |
| Results and details | Desktop has a persistent 420–480px edge panel; compact screens use a sheet. Empty searches show one inline sentence. Ordinary shared records use rows. Detail metadata, capabilities and contact information use headings and dividers. | Existing record actions, data provenance and unavailable-action reasons. |
| Map presentation | The Exchange basemap suppresses ambient place, road, transit and POI labels. Street mode restores them. Secondary view and basemap controls sit behind a single disclosure. | Authoritative locality geometry, geographic marker anchors, selection layers and map camera behavior. |
| Account/Profile | Progressive identity, AMACS, public presence, locations and settings sections. Saved capabilities precede entry; catalog and assisted entry appear one at a time. | Existing authorized loaders, streaming optional-panel failure isolation and save handlers. |
| Public capability summary | Uses the existing public capability projection. Private, network-only and suspended claims are excluded. | No new disclosure policy or invented verification badge. Badge setup remains unavailable. |
| Shared presentation | Additional legacy participant color literals use semantic v2 tokens. Missing token aliases are supplied. New copy exists in all five governed locales. | Domain status semantics, membership, scoped access and the three-app separation. |

The adaptive Intelligence panel switches at 1025px. Shared mobile sheets used by other lenses retain their 760px switch, preventing duplicate intermediate-width surfaces introduced by this change. Existing lens-specific panel breakpoints remain unchanged. The permanent lens composition remains RFx / Resources / Intelligence / Capabilities / Menu.

## Acceptance and release state

Source assertions that previously required two controllers and two search forms have been replaced with assertions for one adaptive composition. Authorization, privacy, geography and action-applicability checks remain in place.

Local validation results and exact candidate CI are recorded in the pull request. Compilation and source checks do not substitute for visual or authenticated runtime acceptance. The local preview URL was rejected by the browser service URL policy; no authenticated visual pass is claimed from that attempt.

Before certifying interaction convergence, exercise the actual candidate with an authorized participant and configured Mapbox at mobile (390px), intermediate (768px and 1024px) and desktop (1440px) widths:

- Select markers and rows; verify details and actions agree on organization and only one action rail is visible.
- Close details, return to results, search, filter, page results and switch lenses; confirm selection, camera, query and result position survive as intended.
- Check a zero-result query, restricted access, long organization names and long localized action labels.
- Use keyboard focus, sheet controls, reduced motion/transparency and all five locales. Confirm menus, forms and details remain reachable without clipped or overlapping controls.
- Exercise Account/Profile sections, AMACS entry switching and real authorized saves. Compare the public summary with public, network-only, private and suspended claims; confirm readiness is not presented as verification.
- Check console errors and actual layout at all sizes. Record the tested commit and environment.

Merge, production rollout and post-rollout authenticated acceptance are separate states. A production release must use the repository's exact-commit build/deploy process and applicable current release gates. This document makes no fresh production-map acceptance claim.

## SAD runtime backlog

These remain service/domain work, not problems that can be completed by changing labels, cards or navigation. Reconcile each item against its canonical feature requirements before implementation; this list creates no new Feature IDs.

| Area | Runtime completion boundary |
| --- | --- |
| Telnyx SMS | Server-side adapter, managed credentials, consent-aware dispatch, verified callbacks, idempotency, retries and delivery/failure audit. Demonstrate configured sending and failure handling before enabling a participant action. |
| Lifecycle, retention and win-back | Durable event/state evaluation, activation/retention/win-back journeys, cancellation and suppression checks at execution, retry/deduplication, Admin controls and auditable outcomes. |
| Communication consent and suppression | Channel/purpose consent history, unsubscribe/STOP handling, suppression precedence and cross-channel orchestration. Journey scheduling and dispatch must respect current state. |
| Public help/chatbot | Curated published help content, a working public interaction surface, safe escalation and implemented Admin content/support configuration. No unsupported account actions or invented answers. |
| SAM.gov / USAspending enrichment | Server adapters with provenance, identity matching, refresh/queue controls, rate-limit/failure behavior and reviewable persisted results. A named adapter in the SAD is not runtime evidence. |
| Stripe production commerce | Reconcile PR #268, configure webhook secret, deploy and verify webhook, enable checkout only under real commercial readiness, and demonstrate reconciliation, idempotency and negative cases. |
| Admin operating domains | Connect enrichment queues, communication/lifecycle controls, campaigns/attribution, commerce/billing/support and health views to their real service domains with scoped authorization and audit. |
| Trust, Commercial and Institutional roadmap | Execute canonical requirement packets and their dependency/evidence rules. Public credibility/badge configuration belongs to its actual source domain; profile completeness does not award a badge. |

Feature tracker totals remain unchanged by this interface work. Full SAD completion requires implemented, configured and exercised runtime for the applicable requirements; neither the historical cutover nor this candidate satisfies that claim on its own.
