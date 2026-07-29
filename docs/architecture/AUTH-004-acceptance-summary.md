# AUTH-004 acceptance summary

Tracker requirement: implement email verification where required, password reset/provider recovery, session revocation, disabled-user handling, and account-security transitions.

Tracker acceptance: authentication lifecycle states integrate with RFxchange access/restriction states, and disabled or revoked identities cannot exercise organization access.

Evidence in this slice:

- provider-neutral account/security snapshot and policy evaluation;
- verified-email requirement before organization access;
- browser email-verification and password-recovery adapters;
- server account inspection, session revocation, disable, and restore operations;
- disable always revokes refresh tokens;
- restore does not restore prior credentials;
- AUTH-003 maps disabled/revoked Firebase errors explicitly;
- organization-access eligibility composes authentication state, credential currency, membership state, and ARC-008 restriction state;
- unit and emulator-backed acceptance tests;
- production composition exports and architecture guardrail.

AUTH-005 remains responsible for the comprehensive Auth + Firestore rules/tenancy/permission scenario matrix.
