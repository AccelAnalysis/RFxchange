# Registration Repair Acceptance

The following configured-development checks are required after repository CI passes:

1. Open each legal policy from registration without losing registration state; confirm Terms, Platform Rules, and Privacy are readable public routes.
2. Search at least one locality outside Portsmouth using a city/county name and state code; confirm the result shows Census source and FIPS/GEOID metadata.
3. Select that locality, continue registration, geocode an address inside it, and confirm the candidate is accepted against that locality's TIGERweb boundary.
4. Complete activation and confirm the controlled map centers/focuses the selected locality rather than Portsmouth.
5. Register a new email account; confirm the initial verification send produces visible feedback.
6. Use Send verification email and confirm the UI acknowledges the send or shows a provider error.
7. Click I verified before verification and confirm the UI explicitly reports that Firebase still sees the address as unverified.
8. Complete the Firebase verification link, return to registration, click I verified, and confirm RFxchange refreshes the ID token/server session and advances to organization resolution.
9. Sign out and sign back in with the verified account; confirm the same verified activation state resumes.

These checks require the selected real Firebase project, browser, email delivery, Mapbox configuration, and live Census network access. Emulator CI cannot substitute for them.
