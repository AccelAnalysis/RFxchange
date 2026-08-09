# Wave 3 Slice 3.8 — Persistent Network Education

## Accepted scope

Slice 3.8 implements `EDU-016` and `EDU-017`: a reusable post-onboarding Quick Start with Business, Issuer and Resource Provider paths, plus progressively disclosed four-question explainers on consequential live Wave 3 actions. It does not replace onboarding orientation, grant authority, create domain records, simulate future RFx/credibility/commercial behavior, or implement any later slice or Brand Gate.

## Runtime architecture

- `src/application/network-education/catalog.ts` owns a versioned, stable-key catalog for the four ordered paths, live allow-listed deep links, truthful planned stops and eleven consequential-workflow explainer keys.
- `src/domain/network-education/model.ts` owns membership-bound active/dismissed/completed progress, resume position, content and aggregate versions, completed items, viewed/dismissed explainers, immutable events and idempotent command receipts.
- `src/application/network-education/network-education.ts` validates catalog references and command fingerprints without importing organization, referral, provider, acquisition, administrative or future-domain repositories. Recommendations consume current official-provider facts only; they grant nothing.
- `src/infrastructure/firestore/network-education.ts` atomically stores the mutable progress record with one immutable event and command receipt. Firestore rules deny every direct-client read and write to all three education collections.
- `/api/network-education` re-resolves the authenticated participant, exact active membership, OPEN lifecycle and current restrictions for reads and writes. `/quick-start` server-renders the current snapshot and the existing participant shell before client mutation begins.

Education is scoped to the exact RFxchange user, organization and membership. Switching organizations creates a separate aggregate. Completing, dismissing, reopening or viewing education cannot advance lifecycle, change permissions, create provider/issuer status, mutate a business record, publish analytics or unlock a future route.

## Participant experience and explainers

Quick Start teaches **Understandable → Discoverable → Connectable → Actionable**. Business is the neutral recommendation; only a current `official-resource-provider` fact recommends the Resource Provider path. Every participant may review every path, while future RFx, credibility, paid training/certification, commercial and institutional items remain visibly planned and have no live link.

The shared `WorkflowExplainer` uses native nonmodal `details` disclosure and answers:

1. What is this?
2. Why does it matter here?
3. What happens if I do this?
4. What happens next?

The eleven explainers cover capability suggestion and confirmation, credential evidence, media visibility, additional locations, referral consent and response, provider application, provider connection and response, and provider resource publication. Platform-controlled copy ships in `en-US`, Spanish, French, Italian and German; participant-authored organization/provider/referral text remains verbatim.

## Acceptance evidence

Focused architecture tests cover stable path ordering, exact current/future links, provider-only recommendation, membership-separated durable state, dismiss/reopen/version behavior, idempotent replay, stale rejection, all eleven four-question explainers, nonmodal placement and domain-repository isolation. The canonical local gate passed with **438/438 architecture tests**, **19/19 Functions tests**, typecheck and production build; lint reported only the 13 inherited warnings. PR #139 production CI run `31303300038` passed on substantive head `a5c15238c175ce6010e7942d6ed2f3ecafb11fe3`, including the complete emulator chain and production build.

Firestore emulator acceptance proved atomic progress/event/command persistence, durable resume, idempotent replay, stale-version rejection, direct-client denial for all three collections and zero residual emulator records. CI now runs both the previously omitted Slice 3.7 resource-network smoke and the Slice 3.8 education smoke.

Configured-browser acceptance on 2026-08-09 used fresh disposable records in the selected real Firebase project for an approved Official Resource Provider and a separate non-provider business organization. It proved:

- provider and business recommendations followed current organization facts while manual Business, Issuer and Resource Provider path selection changed no authority;
- all four paths rendered, current Wave 3 links resolved, and future RFx/credibility/commercial/training items remained unavailable;
- one completed Quick Start item, dismissal, reload, resume and reopen persisted with exact user/organization/membership binding;
- a keyboard-opened capability explainer exposed all four required questions before the owning action, stayed nonmodal and remained reopenable;
- profile, referral, resource and provider-application routes rendered their applicable explainers or truthful permission boundary;
- education persistence produced two aggregates and seven matched immutable events/command receipts, while provider status remained unchanged, the non-provider received no provider status and no provider application/domain record was created;
- 1440×900 desktop, 900×800 intermediate and 390×844 mobile layouts had no horizontal overflow; reduced motion was active without loss of state; keyboard focus order and screen-reader landmarks were coherent; and the scoped WCAG 2 A/AA audit reported zero violations after completed-item contrast was corrected;
- `en-US`, Spanish, French, Italian and German each rendered the localized Quick Start heading and current education copy; and
- browser error capture returned no page errors or framework overlay, with only normal development HMR/React informational messages in the console.

Cleanup deleted all **16** configured education progress/event/command records and verified zero residual education records. The supporting resource-network and provider-foundation cleanup passes then returned zero residual Firestore records and zero residual Auth identities. No Storage object was created.

## Architecture discoveries and deferrals

The Slice 3.7 emulator smoke existed but was absent from the production CI emulator chain; this slice adds it alongside the education smoke so future changes exercise both accepted domains. No dependency edge changed.

Brand Gate B6b remains intentionally pending: no specific brief, prerequisite or bounded convergence defect was established. Wave 3 closeout remains a separate evidence reconciliation after this implementation merges and post-merge production CI passes. Wave 4, B6c, credibility, commercial, Intelligence Dark, Presentation Mode, sound and haptics were not begun.
