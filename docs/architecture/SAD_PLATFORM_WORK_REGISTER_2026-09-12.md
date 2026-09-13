# SAD platform work without new provider credentials

Owner direction: complete work available on the existing platform first; defer new third-party credentials, IDs and provider onboarding. Branding and shared Exchange presentation belong to the other chat. Base: `eb0923a764b2943b98d84b1dac4733077a0ce9c0` (includes design PR #277).

This register separates implementation work from provider activation. It does not reclassify unfinished product domains as credential blockers or claim the whole SAD complete.

## Current implementation batch

| Area | Implemented behavior | Release/activation boundary |
| --- | --- | --- |
| Communication operations | Authorized Admin can hold/release optional messaging, close failed/ambiguous jobs without resending, and reconcile stored signed callbacks. Atomic audit, command replay, optimistic version and current-job checks. Counts label their recent 100-record window. | App release; real operator acceptance. No send is initiated by these controls. |
| Consent and withdrawal | Email includes a hashed, address-scoped withdrawal capability. Public GET shows confirmation; POST withdraws. Used-link replay cannot undo a later explicit subscription. Provider suppression is preserved; support holds remain independent. | App release; actual email rendering/delivery acceptance remains provider work. List-Unsubscribe transport headers are not claimed implemented. |
| Lifecycle localization | Setup, retention and win-back content in en-US, es, fr, it and de; saved communication preference uses the current interface locale. No private draft or organization details in templates. | App release; sending remains disabled. |
| Activity coverage | Existing RFx/referral activity plus canonical organization profile and provider-network events refresh activity monotonically. | New Functions exports require selective release. No new provider credential is needed for the event handlers themselves. |
| Campaign content | Authorized draft/publish/archive with fixed registration CTA, public campaign pages, atomic audit and stale-write/replay protection. Published copy is operator supplied; no fabricated campaign is seeded. | Admin + Marketing app release; operator supplies/approves actual campaign copy. |
| Attribution | Existing first-touch cookie plus latest-touch handoff. Authenticated account records preserve original first touch and refresh last touch. Reported values confer no authority. Counts show issued/bound/resumed from the latest 500 acquisition contexts. | Exchange + Marketing app release. Counts do not imply paid conversion or full lifetime analytics. |
| Enrichment review | Admin records keep-current, dismiss-source or request-correction disposition with reason and optimistic version. Source conflicts show current/proposed values. Correction links to the governed organization surface. Admin review reasons are excluded from participant projection. | App release. Review never writes canonical identity, capabilities or verification status. |

## Additional internal work remains eligible without new credentials

These items are not blocked merely because a provider account is unfinished. They remain implementation work; the current batch does not certify them complete.

- Lead capture and lead operating lifecycle, with truthful consent and abuse controls; expanded attribution for activation, organization and actual paid conversion.
- Campaign geography/capability/partner targeting and governed sponsored placement inventory. Paid placement must remain separate from neutral matching and credibility.
- Capability-specific and actual draft/deadline journeys, using current domain permission checks and purpose-specific communication policy; billing/entitlement communications tied to real commercial events.
- Canonical enrichment suggestion acceptance, conflict correction/merge commands, additional source adapters, scheduled refresh and evidence-backed AMACS suggestions. A reviewed record is not an accepted canonical change.
- Full aggregate funnel/health metrics, persisted alert ownership/acknowledgement and retention/deletion disposition through existing preservation policy authority.
- Complete billing overrides, seats/plans/promotions, moderation/support and remaining Trust/Commercial/Institutional domains, each under its canonical feature/dependency requirements.
- Authenticated operator/participant acceptance and selective deployment of credential-independent Functions.

## Provider activation pass

| Integration | Remaining external input or action |
| --- | --- |
| Telnyx | Toll-free verification approval, correct account/profile/number assignment and webhook configuration; real opted-in delivery/callback/STOP evidence. API secret v1 and access grant were reported created by owner; do not ask for them again. |
| Microsoft lifecycle transport | Existing sender is implemented. Configure worker delivery path, verify lifecycle rendering and unsubscribe behavior with an owner-approved recipient; implement any required transport-specific deliverability headers correctly. |
| Lifecycle worker | Shared worker credential and explicit scheduler/Exchange mode configuration. This is our own platform configuration, not a third-party account purchase; defer only if access/configuration is unavailable. |
| SAM.gov | Obtain/bind real API credential and complete real-source acceptance. |
| USAspending | Public API requires no API key; runtime acceptance and refresh operation remain work we can perform with existing access. |
| Stripe | Separate PR #268 and actual webhook/signing secret; current live price/account verification, reconciliation and approved transaction acceptance. No fabricated secret or paid status. |

## Validation and containment

Focused domain tests and the Firestore emulator exercise no live communications or payments. New collections remain denied to direct clients. Production sending remains disabled. Rollback reverts this app release; retain consent records, suppressions and audit history. Never clear suppressions or reset ambiguous jobs to retry to undo a rollout.

Implementation, merge, app release, Functions release and actual-provider acceptance are distinct states. Release evidence belongs here when observed, not inferred from a successful build.

## Release and hosted-write correction

PR #282 merged as `3b390843856b7a0dc0be7681dc34d3a02b8e366e`. Exact-head CI `34718463781` and merged-main CI `34718758532` passed. Exchange `build-2026-09-12-005`, Marketing `build-2026-09-12-004`, and Admin `build-2026-09-12-005` each succeeded with source and resolved `RFXCHANGE_BUILD_SHA` equal to that merge. Automatic rollouts remained disabled; Exchange resolved lifecycle send mode remained `disabled`. Later design/PWA releases may supersede these historical rollouts.

Production acceptance reached authenticated campaign and communication-operations pages and the public email-withdrawal confirmation page. Saving an unpublished organization-setup campaign exposed a `403 POST /api/admin/campaigns` in App Hosting runtime/CDN logs; a fresh campaign list remained empty. This is a material acceptance failure, not a completed save journey.

The follow-up corrects the thirteen affected SAD, profile, enrichment and RFx attachment browser-write routes to compare Origin with the fixed application-specific public origin, rather than App Hosting's internal request URL. Host and forwarding headers never select the trusted origin. Cross-app, missing, malformed and attacker origins fail closed; loopback development is unavailable in production. Existing session, permission, grant and transaction checks remain mandatory. Campaign error feedback now preserves the server's bounded error explanation instead of collapsing origin/permission failures into a version-conflict message.

Regression coverage includes simulated internal-listener requests, forged forwarding headers, cross-app rejection and actual production-build HTTP requests that pass the Origin boundary but still deny anonymous writes. The corrected hosted save journey and release remain pending until observed; no provider messaging or payment is used for this acceptance.
