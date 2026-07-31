# Registration Repair Gate Status

- Scope: legal policy links, Census-authoritative home locality, email verification progression
- Feature IDs: none; repair/integration gate only
- Activation count: unchanged at 31/43
- Branch: `repair/registration-legal-locality-email`
- Repository acceptance: production-ci run #285 passed on the substantive repair head, including guardrails, Functions tests, Firebase emulator smoke tests, architecture/regression tests, typecheck, lint, and production build
- Configured-development/browser acceptance: required after merge against the selected real Firebase project, live email delivery, Mapbox, and Census/TIGERweb before Slice 2.9 begins
