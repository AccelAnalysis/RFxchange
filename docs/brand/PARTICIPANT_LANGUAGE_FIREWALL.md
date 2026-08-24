# RFxchange Participant Language Firewall

**Status: GOVERNING PARTICIPANT-LANGUAGE AUTHORITY WHEN MERGED**

**Authority:** Explicit participant/product-owner direction

**Applies to:** Public marketing, acquisition, registration, onboarding, authenticated participant UI, participant notifications, participant help/education, and other ordinary customer-facing copy.

## 1. Purpose

The RFxchange must be truthful without narrating its internal development or governance machinery to participants.

The governing distinction is:

> **Development governance is internal. Product truth is external.**

Participant-facing accuracy means the interface accurately communicates what a participant can see, do, rely upon, and expect. It does not require the interface to expose how implementation, release, acceptance, evidence, governance, architecture, or program management produced that state.

This file governs participant-language interpretation where older brand, product, slice, program, or acceptance documents prescribed internal implementation vocabulary as customer-facing copy.

## 2. Participant-facing accuracy

Participant-facing copy must accurately communicate, when relevant:

- the current user-visible state;
- the action that is actually available;
- meaningful limitations on that action;
- permissions or eligibility that materially affect the participant;
- the consequence of a consequential action;
- the participant's data or business state;
- whether information is confirmed, unknown, unavailable, planned, or incomplete when that distinction matters; and
- the next useful action or recovery path.

Truthfulness should normally be expressed through product behavior and concise business language rather than explanatory governance prose.

Examples:

- If an action is unavailable, disable it or say `Coming soon` / `Not available yet` where explanation is useful.
- If a search returns no results, say what the search found and offer the next useful adjustment.
- If information has not been confirmed, say that directly.
- If an organization has a meaningful verification state, show that specific state where it affects the participant.

Do not add an explanation of release mechanics, acceptance criteria, implementation provenance, or internal authority merely to prove the interface is truthful.

## 3. Internal-language firewall

The following concepts belong in repository documentation, diagnostics, admin/developer tooling, audit records, and release reporting—not ordinary participant-facing copy—unless a separately approved participant use requires the exact concept:

- governance / governed release mechanics;
- canonical source or canonical state;
- implementation slices, stages, waves, gates, packets, lanes, or sequences;
- owning domains or domain authority;
- runtime authority or implementation authority;
- acceptance tests, acceptance manifests, independent acceptance, assurance state, or verification debt;
- exact-head, candidate SHA, source SHA, build identity, commit provenance, or other build metadata;
- tracker, ledger, dependency, branch, PR, deployment, CI, emulator, or release-engineering terminology;
- internal lifecycle/state-machine names;
- internal architecture names when ordinary business language communicates the user meaning; and
- explanatory phrases whose only purpose is to prove that records, geography, organizations, or activity are not fabricated.

Internal identifiers and implementation names may remain in source code. The firewall governs rendered participant language, not private implementation vocabulary.

## 4. Terms that require special care

Some words have legitimate participant meanings and are not globally prohibited.

- `Verified` may describe a specific participant/business verification state when that state actually exists.
- `Authority` may be used when explaining a real legal/organizational authority question that the participant must answer, but not as shorthand for repository governance.
- `Evidence` may describe documents or information a participant supplies, but not acceptance evidence or delivery evidence.
- `Release` may describe a customer-relevant product availability change when useful, but participants should not be taught internal release sequencing.
- `Domain` may describe a web/internet domain when relevant; it should not expose internal product-domain boundaries.

Use the ordinary business meaning, not the implementation meaning.

## 5. Customer-language test

Before customer-facing copy is accepted, ask:

1. Would a business owner understand this without knowing RFxchange's repository or governance model?
2. Does the statement tell the participant something they need to know or do?
3. Is the statement accurate to the actual product state?
4. Could the same truth be communicated more simply in ordinary business language?
5. Does the copy accidentally expose implementation, governance, verification, release, or build machinery?

If item 5 is yes, rewrite the copy unless that internal concept is genuinely necessary to the participant's decision.

## 6. Public marketing rule

Public marketing should lead with customer value, market meaning, and available customer actions.

Do not use public marketing to explain:

- why a feature has or has not passed acceptance;
- which wave, slice, stage, gate, domain, lane, or release sequence owns it;
- that organizations/geography are `real` merely to contrast them with prohibited fabricated development data;
- repository provenance or build metadata; or
- internal governance as a product benefit.

Planned or unavailable product behavior may be labeled simply and accurately, for example `Coming soon`, `In development`, or `Planned`, when that information benefits the prospect.

## 7. Public diagnostics rule

Build identity, source SHA, commit SHA, deployment provenance, CI state, emulator state, acceptance state, and other engineering diagnostics must not be rendered in ordinary public or participant chrome.

Such information belongs in development tooling, observability, support diagnostics, or explicitly administrative surfaces with an actual operational need.

## 8. Copy architecture

Prefer this order:

1. customer outcome or business meaning;
2. current state;
3. useful next action;
4. only the minimum limitation or qualification the participant needs.

Do not append defensive prose simply because an internal authority document contains a longer qualification. Preserve the actual boundary in behavior and concise copy.

## 9. Examples

Avoid:

> A local business growth network beginning with real organization, capability, geography, and activation—then extending through governed releases.

Prefer:

> A local business growth network that helps organizations be found, find opportunity, and build the right connections.

Avoid:

> This capability remains a later governed domain pending acceptance tests.

Prefer, when participant disclosure is useful:

> Coming soon.

Avoid:

> Complete the governed activation journey.

Prefer:

> Finish setting up your organization.

Avoid a footer heading such as:

> Bottom Matter

Prefer:

> Legal

## 10. Enforcement

Participant-facing implementation should include automated regression checks for high-risk internal terms on canonical customer-facing English copy and for engineering diagnostics in public chrome.

Automated checks are a guardrail, not a substitute for judgment. A phrase can violate this authority even if it is not on a prohibited-term list.

When a legitimate participant use requires an otherwise restricted term, document the narrow exception in the test or authority instead of weakening the firewall globally.
