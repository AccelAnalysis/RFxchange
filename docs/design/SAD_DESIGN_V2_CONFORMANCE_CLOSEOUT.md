# SAD + Design v2 conformance closeout

Date: 2026-09-12. Base: `177c8fd283e7f82c602ac261471bfb4a84c08fc0` (PR #276).

Continuation: reconciled with `0792558769f0ad15cfdbb9f33aeed8681d9bfa8f` after PRs #278–#281. The SMS consent wording, renewed-consent gate and current/archived policies from #281 are preserved verbatim; legal publication remains in its canonical English copy. Those PRs supply real service implementations and app releases for the lifecycle, Telnyx, enrichment and curated-help foundation. Their remaining provider/configuration and domain boundaries are recorded in [SAD runtime closeout](../architecture/SAD_RUNTIME_CLOSEOUT_2026-09-12.md); the original assessment that these services existed only in the SAD is no longer current.

The in-place three-app modernization and core v2 token foundation are deployed. This candidate addresses interface hierarchy and incorporates the explicitly authorized HIG/Product Simplification pass. It does not certify the complete SAD, earn optional independent `Verified` assurance, change Feature-ID completion, or establish a production release.

Authority: [Brand & Interface Design System v2.0](RFxchange_Brand_Interface_Design_System_v2.0.md), [SAD v1.1](../architecture/RFxchange_Platform_Solution_Architecture_Document_v1.1.md), current repository `AGENTS.md`, the participant-language firewall, the explicit 2026-09-12 HIG/Product Simplification direction, and Four-Lens completion governance. Where older presentation guidance required a permanently visible lens action rail, this pass supersedes that presentation detail while preserving the action registry, authorization and domain contracts. The uploaded historical START-HERE file does not override current repository governance.

## Interface candidate

| Surface | Change | Boundary preserved |
| --- | --- | --- |
| Intelligence map | One compact search/filter surface. No lower-left floating action grid. Selecting a desktop marker opens an anchored organization popover with the useful available actions; compact layouts use the shared sheet. Lens changes do not reopen a detail surface the participant closed. | Server-authorized discovery, selected organization, camera, lens and query state; canonical action identities remain server-authorized. |
| Results and details | Desktop keeps the edge result/detail composition while record actions follow the selected record rather than occupying permanent map chrome. Empty searches show one restrained inline status. Detail metadata, capabilities and contact information use headings and dividers instead of nested card stacks. | Existing record actions, data provenance and unavailable-action reasons; four-position action identity remains available in the expanded detail context where required. |
| Map presentation | The ordinary Exchange opens in a flat 2D camera and suppresses ambient place, road, transit and POI labels. 3D remains an explicit map option. Secondary view and basemap controls sit behind one disclosure. | Authoritative locality geometry, geographic marker anchors, selection layers and persisted participant camera choices. |
| Account/Profile | Organization Profile is a business-profile portal: Overview, Capabilities, Credentials & badges, Locations, Media and Preferences. Overview shows section setup progress, the next useful step and a public-profile preview. | Existing authorized loaders, public projection rules and save handlers. Profile progress is not verification. |
| Progressive editing | Capability, industry, past-performance, credential, additional-location, media and preference editing opens as focused dialog/sheet tasks rather than permanent full-page forms. Technical storage/provenance fields are removed from ordinary participant editing. | Existing APIs, authorization, data models and private/public visibility boundaries. |
| Public capability summary | Uses the existing public capability, credential and profile-asset projections. Private, network-only, suspended or unpublished records are excluded. | No new disclosure policy or invented verification badge. Badge display remains tied to the real source status. |
| Participant language | Network, market-profile, organization-enrichment and Resource Provider English is simplified to customer meaning, state and next action. Regression guards reject known system-heavy phrases such as `Matching explains profile overlap`, `Browse Domain → Family → Capability`, raw private asset IDs and authorization-count language. | Truthful limitations and source boundaries remain available where they affect a decision; internal governance remains in repository/admin diagnostics. |
| Sign-out handoff | Uses browser navigation for the public entry that redirects to Marketing, avoiding an Exchange RSC request across the app boundary. | Existing client sign-out, server-session DELETE and participant-context cleanup calls. |
| Shared presentation | Additional legacy participant color literals use semantic v2 tokens. Missing token aliases are supplied. New copy exists through the governed locale fallback architecture. | Domain status semantics, membership, scoped access and the three-app separation. |
| New service surfaces | Communications preferences sit under Settings; public-data review remains reachable from Organization Profile. Forms use stacked labels, 44–48px controls, one primary action and quieter secondary actions. Help articles and prior source checks use progressive disclosures. | Existing consent/version checks, scoped enrichment commands, published Admin copy and help destination allowlist. Published custom help articles are never replaced by bundled translations. |

The adaptive Intelligence panel switches at 1025px. Shared mobile sheets used by other lenses retain their 760px switch, preventing duplicate intermediate-width surfaces introduced by this change. Existing lens-specific panel breakpoints remain unchanged. The permanent lens composition remains RFx / Resources / Intelligence / Capabilities / Menu.

## Acceptance and release state

Source assertions that previously required permanently visible action rails have been replaced with assertions for contextual selected-record actions and preserved disclosure state. Authorization, privacy, geography and action-applicability checks remain in place. The historical configured-browser baseline is adapted only for the candidate presentation contract; its baseline behavior remains intact for comparison.

Local validation results and exact candidate CI are recorded in the pull request. Compilation and source checks do not substitute for visual or authenticated runtime acceptance. This implementation lane does not self-promote the work to `Verified`.

Before independently certifying interaction convergence, exercise the actual candidate with an authorized participant and configured Mapbox at mobile (390px), intermediate (768px and 1024px) and desktop (1440px) widths:

- Select markers and rows; verify desktop marker popovers are anchored to the selected organization, compact selection opens the sheet, and actions agree with the selected organization.
- Close details, return to results, search, filter, page results and switch lenses; confirm a closed detail remains closed and selection, camera, query and result position survive as intended.
- Check a zero-result query, restricted access, long organization names and long localized action labels.
- Use keyboard focus, sheet controls, reduced motion/transparency and all five locales. Confirm menus, forms, marker alternatives and details remain reachable without clipped or overlapping controls.
- Exercise Organization Profile Overview, Capabilities, Credentials & badges, Locations, Media and Preferences. Verify focused task sheets save through the existing authorized handlers and the public preview excludes non-public records.
- Confirm profile setup progress and badge/status presentation never imply verification that the underlying domain has not awarded.
- Check console errors and actual layout at all sizes. Record the tested commit and environment.

Merge, production rollout and post-rollout authenticated acceptance are separate states. A production release must use the repository's exact-commit build/deploy process and applicable current release gates. This document makes no fresh production-map acceptance claim.

## SAD runtime backlog

These remain service/domain work, not problems that can be completed by changing labels, cards or navigation. Reconcile each item against its canonical feature requirements before implementation; this list creates no new Feature IDs.

| Area | Runtime completion boundary |
| --- | --- |
| Telnyx SMS | Adapter, callback verification, replay/delivery processing and runtime secret/profile/sender bindings now exist. Provider assignment, toll-free verification, signed delivery/STOP acceptance and authorized configured sending remain open. |
| Lifecycle, retention and win-back | Three foundational journeys, state/consent evaluation, retry/deduplication and Admin timing controls now exist. Worker credentials, selective Functions deployment, actual delivery and the richer SAD journeys remain open. |
| Communication consent and suppression | Versioned purpose/channel preferences and STOP/START processing now exist. Real provider negative acceptance and the remaining unsubscribe/deliverability requirements remain open. Sending stays disabled. |
| Public help/chatbot | Curated retrieval, published public content and Admin configuration now exist. This candidate localizes the bundled guide and service controls; authenticated operator/publication acceptance and broader support escalation remain distinct. |
| SAM.gov / USAspending enrichment | Bounded adapters, organization-owned source findings, review and Admin entry points now exist. SAM credentials, actual provider acceptance, refresh scheduling and complete conflict/acceptance workflows remain open. |
| Stripe production commerce | Reconcile PR #268, configure webhook secret, deploy and verify webhook, enable checkout only under real commercial readiness, and demonstrate reconciliation, idempotency and negative cases. |
| Admin operating domains | Connect enrichment queues, communication/lifecycle controls, campaigns/attribution, commerce/billing/support and health views to their real service domains with scoped authorization and audit. |
| Trust, Commercial and Institutional roadmap | Execute canonical requirement packets and their dependency/evidence rules. Public credibility/badge configuration belongs to its actual source domain; profile completeness does not award a badge. |

Feature tracker totals remain unchanged by this interface work. Full SAD completion requires implemented, configured and exercised runtime for the applicable requirements; neither the historical cutover nor this candidate satisfies that claim on its own.
