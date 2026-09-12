# SAD runtime closeout — September 12, 2026

Authority: [Platform SAD v1.1](RFxchange_Platform_Solution_Architecture_Document_v1.1.md). Baseline: `177c8fd283e7f82c602ac261471bfb4a84c08fc0` (main after PR #276). Branch: `codex/sad-runtime-closeout-20260912`.

This is a service implementation packet toward the entire SAD, not a certification that the SAD or the product roadmap is complete. Implementation, merge, configured runtime and production acceptance remain distinct. The canonical Feature-ID tracker is unchanged. The concurrent branding/design chat owns the Exchange HIG, map, action rail, account hierarchy and visual acceptance.

## Implemented in this packet

| SAD responsibility | Implementation | Operating entry |
| --- | --- | --- |
| Public procurement enrichment | Concurrent, bounded SAM.gov / USAspending adapters; source-level failure isolation; normalized findings and references; exact UEI checking; conflicts; transactional command replay and fenced leases; append-only started/completed events | Exchange `/organization-profile/public-data`; Admin `/admin/enrichment` |
| Organization-owned evidence | Findings attach to an organization and never write profile, capability, membership, award or credibility truth. Participant profile-management permission is required for checks/review; Admin uses current global organization profile read/update grants and records reasons/audits | Latest ten runs scoped to the requested organization; one composite index |
| Lifecycle automation | Account/activation enrollment; RFx/referral event activity; scheduled state evaluation for finish-setup, retention and win-back; current Auth account, journey, membership and restriction checks | Cloud Functions enrollment/activity triggers and `scheduledLifecycleCommunications`; trusted Exchange worker |
| Purpose, consent and suppression | Explicit marketing purpose; versioned consent history; opt-in defaults; own-account preferences; verified account phone only; channel preferences; STOP/START suppression; configured frequency and local quiet hours | Exchange `/account/communications` |
| Microsoft lifecycle email | Reuses the existing approved-mailbox Microsoft Graph transport; public-only versioned templates and preference link | Same server credential boundary as existing transactional email |
| Telnyx SMS | Server-only adapter; fixed provider endpoint; known-failure retry classification; ambiguous outcomes require reconciliation; bounded Ed25519 webhook verification and replay window | Exchange `/api/communications/telnyx` |
| Delivery processing | Transactional reservation prevents concurrent duplicate sends; recheck immediately before send; max three known-failure attempts; provider-reference mapping; deduplicated callbacks; terminal delivery states do not regress; late references reconcile; unmapped events reach attention state | Admin Communications projections, including lifecycle jobs and callbacks |
| Lifecycle operation | Timing/enablement controls, optimistic version checks and atomic platform audit | Admin `/admin/communications/lifecycle` |
| Curated public help | Keyword retrieval over an explicit public corpus; no model, account lookup, private support lookup or arbitrary URL retrieval; unknown questions receive a truthful fallback | Marketing `/help` |
| Help configuration | Plain-text articles, known public destination allowlist, bounded catalog, publication confirmation, optimistic version and atomic platform audit. Marketing loads only the published projection; bundled public copy is a bounded-time fallback | Admin `/admin/communications/help` |

New collections are enumerated in `src/infrastructure/firestore/sad-runtime-schema.ts`. Existing Firestore rules continue to deny all direct browser reads/writes to them. Mutations use trusted server handlers. Internal hashes are lookup/idempotency controls, not an anonymization or authorization mechanism.

## Configuration and production gates

Production sending is **disabled** in `apphosting.yaml`, and the persisted lifecycle policy defaults to disabled. No provider message, production enrichment lookup, Stripe checkout, payment, webhook creation or deployment was performed by this packet.

The owner supplied the SMS/MMS sender `+18337391819`, messaging profile `4001a095-92f2-46be-963b-35b48e986600` and Ed25519 public key on September 12. These values are now Exchange runtime-only configuration in `apphosting.yaml`; the public key decodes to the expected 32 bytes. The API key remains a Secret Manager runtime binding. The number's messaging-profile assignment, the public key's match to the provider account and toll-free verification status still require provider-side inspection. This packet dispatches text-only SMS lifecycle templates; an MMS attachment workflow is not claimed complete merely because the number supports SMS/MMS.

| Runtime | Required configuration | Acceptance before activation |
| --- | --- | --- |
| Exchange lifecycle worker | `RFXCHANGE_LIFECYCLE_WORKER_SECRET` from Secret Manager; `RFXCHANGE_LIFECYCLE_SEND_MODE=enabled`; HTTPS `RFXCHANGE_EXCHANGE_ORIGIN`; operator-enabled lifecycle policy | Invalid worker credentials denied; allowed, opted-in recipient receives the selected template; withdrawal/STOP and obsolete journey prevent sending; accepted/failed delivery visible |
| Scheduled lifecycle function | Same worker secret; same Exchange origin and explicit send-mode setting in Functions runtime | Authenticated scheduler reaches worker; replay does not duplicate delivery; interruption/unknown outcomes reach attention |
| Microsoft transport | Existing `RFXCHANGE_MICROSOFT_*` environment and approved sender secret binding | Owner-approved recipient/template and actual provider receipt. Existing transactional email configuration alone does not establish lifecycle acceptance |
| Telnyx | Secret `TELNYX_API_KEY`; approved `TELNYX_MESSAGING_PROFILE_ID`, `TELNYX_FROM_NUMBER`, `TELNYX_PUBLIC_KEY`; signed messaging webhook to the Exchange endpoint | Approved messaging account/sender, valid opt-in and verified phone; real signed callback; STOP enforcement, delivery failure and replay evidence. A phone verification/collection flow is not added here |
| Participant/Admin enrichment | Secret `SAM_API_KEY` bound at runtime to each app that executes the adapter; USAspending needs no API credential | Known organization/UEI; real source receipt, mismatch/failure behavior, permission rejection and review evidence |
| Organization-created enrichment function | `SAM_API_KEY` binding and explicit `RFXCHANGE_PUBLIC_ENRICHMENT_MODE=enabled` | Profile creation remains nonblocking; one run/event despite retry; sources remain suggestions |
| Firestore | Deploy the declared organization/latest-run composite index | Tenant-scoped GET succeeds and denies a wrong organization |
| Help | Marketing runtime access to the existing project; authorized Admin publication | Published version appears; invalid/private destinations denied; ordinary/revoked/stale/wrong-scope operators denied |
| Stripe | Separate existing PR #268, correct live price/key, new webhook signing secret and deployed verified webhook | Checkout remains closed until endpoint, paid/unpaid/replayed events, reconciliation and entitlements are accepted |

On September 12 the Stripe connector returned no webhook endpoints for the RFxchange live account `acct_1TyYa4PNrfGaFz2q`. PR #268 was inspected but is not incorporated or claimed complete by this packet.

Automatic approval review initially rejected opening the production Google Cloud Secret Manager console, identifying it as a privileged configuration boundary requiring specific authorization. The owner subsequently explicitly authorized access and configuration of RFxchange's production Secret Manager and Telnyx messaging settings. The Google Cloud page remained unavailable in the cloud browser, and the existing Firebase CLI session was unauthenticated. The Telnyx account uses `jholman@accelanalysis.com`; Google sign-in with a different email reached onboarding, and no terms were accepted or messaging settings changed.

The owner reported creating `TELNYX_API_KEY` version `1` in the existing `rfxchange` project. Exchange `apphosting.yaml` pins that version with runtime-only availability. The owner then ran the command below in Google Cloud Shell and supplied its successful result: `Successfully set IAM bindings on secret TELNYX_API_KEY.` This establishes owner-provided evidence of the backend secret-access grant; it does not establish inspection of the secret value, successful provider authentication or a production rollout. Production sending remains disabled. The authenticated Firebase console confirmed the existing `rfxchange` backend in `us-east4`, its retained cutover release and only the existing build-SHA console override. Its embedded Cloud Shell returned `Site Unavailable`, so this worker did not execute the grant itself.

The completed secret-access command, retained for recovery or an explicitly intended re-grant, is:

```sh
npx firebase-tools apphosting:secrets:grantaccess TELNYX_API_KEY \
  --backend rfxchange --location us-east4 --project rfxchange
```

This command grants access; it does not print or replace the API key and does not deploy an application. The backend is `projects/rfxchange/locations/us-east4/backends/rfxchange`, as established by the existing cutover record. Inspect the rollout's resolved configuration because console variables can override `apphosting.yaml`. Provider-side number/profile and toll-free status checks, the configured webhook, worker-secret binding, provider acceptance and explicit send gates remain outstanding. Do not add placeholder credentials or bind this API key to Marketing, Admin or browser bundles.

The new Functions secret bindings belong only to the functions that need them; existing health/background/payment bindings are unchanged. Selective deployment is required until each new secret exists and access is granted. Do not run a blanket Functions deployment and create substitute secret values to satisfy discovery.

## Remaining SAD work — no silent omissions

| SAD area | Remaining closure work |
| --- | --- |
| Three apps / in-place cutover (5–8, 16–18, 21) | Baseline implementation/deployment evidence is retained. New changes still need their own exact-source builds and production acceptance. No replacement Firebase project or record normalization is introduced |
| Exchange interaction model and design system (6, 20) | Other chat: contextual action rail, empty states, detail hierarchy, map competition, account/profile progression, five-locale and authenticated mobile/intermediate/desktop acceptance |
| Enrichment (9) | Real provider configuration and acceptance; scheduled refresh; suggestion acceptance into canonical fields through existing governed commands; complete Admin conflict/merge/correction workflow; broader registry/website sources and evidence-driven capability suggestion integration |
| Acquisition (10.1–10.2) | Existing marketing first-touch/handoff/acquisition envelopes are retained. Complete lead capture, durable first/last-touch attribution and permitted identity stitching, campaign landing/configuration, conversion reporting and sponsored inventory require further implementation/acceptance |
| Lifecycle (10.3–10.5) | Configured delivery and templates; richer capability-specific/matching-value journeys; actual response-draft/deadline reminders; subscription/entitlement communications; activity coverage beyond Auth, RFx and referral events; locale-specific copy and email unsubscribe/deliverability requirements. This packet supplies three foundational journeys, not all examples in the SAD |
| Admin operating model (11, 19) | Delivery reconciliation commands and suppression support tools; complete campaign/placement, billing override and enrichment conflict workflows; aggregate conversion/attention metrics and operational alert routing; operator acceptance for all new controls |
| Canonical product domains (12) | The RFx/Resources/Intelligence/Capabilities/Trust/Commercial/Institutional roadmap remains governed by its existing Feature IDs and completion rules. The 175/438 assessment is not changed by these service additions |
| Durable events/workflows (13) | Existing domain events are reused; new enrichment events and communication history are durable. Comprehensive representative-event coverage and transactional consumers for unfinished domains remain open |
| Commerce (12.2, 14) | PR #268, real Stripe webhook and signing secret, checkout release, subscription mirror/reconciliation, entitlement/seat/plan/promotion controls and negative acceptance |
| Security, privacy, operations (15, 19–20) | Production credential scope/rotation; configured provider negative tests; collection retention/deletion disposition; communication template/publication review; authenticated browser acceptance. Direct-client denial and consent/provider boundaries have local test evidence |

## Validation and release discipline

Focused tests cover state/consent/frequency/quiet-hour decisions, signature/body/timestamp tampering, ambiguous send failures, public-help destination restrictions, response size bounds and enrichment identity/source minimization.

The full local `npm run check` passed (964 architecture tests, 50 Functions tests, all three production builds and Admin/Marketing production smokes). Expanded production HTTP smokes also passed for every new authenticated page and configuration/data API, including anonymous calls with valid Origin headers, invalid worker credentials and unsigned/unconfigured Telnyx callbacks. These are local runtime checks, not live-provider or authenticated-operator acceptance.

`scripts/smoke-sad-runtime-emulator.mjs` exercises the real Firestore transaction adapters against the demo project: anonymous/authenticated direct-client denial, command replay/tenant separation, concurrent and expired enrichment leases, callback identity conflict, wrong messaging profile, out-of-order STOP/START and delivery events, late/unmapped callback reconciliation, simultaneous workers, consent withdrawal after reservation, retry limits, unknown outcomes and stale organization authority. Provider delivery in this suite is an injected fixture; it sends no live communication. CI runs this suite explicitly.

Run with Java 21 and Node 24:

```sh
npm run check
RFXCHANGE_ENV=development RFXCHANGE_EXPECTED_PROJECT_ID=demo-rfxchange \
  ./node_modules/.bin/firebase emulators:exec --only auth,firestore --project demo-rfxchange \
  'node --experimental-transform-types --experimental-loader ./scripts/node-typescript-source-loader.mjs scripts/smoke-sad-runtime-emulator.mjs'
```

Browser Use could not open the local help page (`ERR_BLOCKED_BY_CLIENT`). No authenticated visual acceptance is claimed. The existing Marketing production smoke includes the new help route; that HTTP smoke does not replace browser acceptance.

Before merge, record exact-head CI. Before activation, complete the corresponding configuration/negative/actual-provider checks above. Rollback: disable lifecycle send mode and the persisted policy, disable automatic enrichment, revert the app/function release if needed, and retain append-only audits/jobs/events for reconciliation. Never reset ambiguous jobs to retry merely because a deployment is rolled back.

## Handoff to the design chat

Shared presentation edits are limited to one account link row, one Marketing footer Help link and two Admin related-action links. New functional routes/components are under `src/components/communications`, Marketing `/help`, Exchange account/public-data subroutes and Admin communications/enrichment subroutes. They use existing semantic tokens. Their English copy and basic form layout still require the design/localization acceptance noted above; no existing map, room action controllers or four-lens composition was changed.

## Adapter references

- [Telnyx webhook verification](https://developers.telnyx.com/docs/development/api-fundamentals/webhooks/receiving-webhooks)
- [Telnyx messaging callbacks](https://developers.telnyx.com/docs/messaging/messages/receiving-webhooks)
- [Telnyx send-message API](https://developers.telnyx.com/api-reference/messages/send-a-message)
- [Telnyx toll-free verification](https://developers.telnyx.com/docs/messaging/toll-free-verification)
- [GSA SAM entity API](https://open.gsa.gov/api/entity-api/)
- [USAspending spending-by-award contract](https://github.com/fedspendingtransparency/usaspending-api/blob/master/usaspending_api/api_contracts/contracts/v2/search/spending_by_award.md)
