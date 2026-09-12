# SMS consent and policy publication

Owner instruction: publish a URL for Telnyx opt-in workflow evidence, update SMS/privacy/service terms, allocate participant responsibilities, add arbitration and cap liability at fees paid.

## Public destinations

- Marketing `/sms`: public workflow description linking to the actual authenticated `/account/communications` form. It renders the same SMS consent/disclosure components as that form; opening it never records consent. Telnyx accepts a public webpage describing the opt-in workflow in its image-URL field.
- Marketing `/privacy` and `/terms`: September 12, 2026 policies. Previous policy content remains available under `/policies/2026-07-31/{privacy,terms,platform-rules}`.

## Consent and legal boundaries

- Explicit SMS checkbox, optional purchase-independent consent, message types/frequency, rates, STOP, support email and links to SMS terms/privacy are visible regardless of phone availability. Verified account phone remains required. No phone-verification flow is fabricated.
- Communication consent changes to v2. Prior choices are cleared in the form for renewed review; the dispatcher already rejects old consent versions. Historical stored events are preserved.
- Platform policy version changes to `2026.09.12`. Onboarding legal acceptance rejects missing/stale submitted policy versions before recording acceptance. The existing current-version activation gate requires renewed acceptance; no historical record is relabeled. These terms do not retroactively bind people merely through publication or modify unrelated contracts.
- Terms add participating Company/affiliate protections, user responsibilities, third-party/data/assistance caveats, proportionate third-party-claim indemnity, exclusions of consequential damages and an aggregate affected-service fees-paid cap. Mandatory-law exceptions remain explicit. Free-service zero cap applies only where lawful.
- Disputes: 30-day notice/discussion, then binding AAA arbitration under applicable commercial/consumer rules, preserving small claims, agency complaints, statutory court elections and necessary protective relief. No claim of guaranteed enforceability or legal review is made.
- Privacy separately describes actual data handling, source enrichment, Google/Firebase, Microsoft email, Telnyx, maps and conditional Stripe use; excludes mobile consent/data from third-party marketing; preserves statutory privacy/security duties and request rights.

## Containment and remaining provider work

SMS remains disabled. No outbound text, credential rotation, provider verification submission, purchase or legal acceptance on behalf of another user occurs in this change. HELP-keyword and welcome-message provider configuration remains unconfirmed; public instructions use the actual support email rather than promise an unconfigured automatic HELP response. Live delivery, toll-free approval, worker secret and phone-verification onboarding remain separately tracked. The public URL is workflow evidence, not proof of Telnyx approval.

Release from reviewed merged main only after CI, with each affected backend's build SHA pinned and predecessor retained. Rollback must preserve all historical acceptance/consent events. Reverting a published agreement cannot silently erase the version a user actually accepted; use a forward correction for legal content already accepted. If a technical rollout must be rolled back, keep sends disabled and preserve published policy history.

## Sources checked

- https://support.telnyx.com/en/articles/16290008-toll-free-submission-guide
- https://support.telnyx.com/en/articles/10729979-toll-free-verification-request-guide
- https://www.law.cornell.edu/uscode/text/9/2
- https://law.lis.virginia.gov/vacode/title8.01/chapter21/section8.01-581.01/
- https://law.lis.virginia.gov/vacode/title59.1/chapter53/section59.1-578/ (non-waivable rights when applicable)
- https://www.adr.org/industries/commercial/
- https://www.adr.org/industries/consumer/

Legal wording is owner-directed product drafting, not counsel certification. Applicability and enforceability depend on the agreement, assent, facts and law.
