# Registration repair summary

This branch repairs three configured-development registration defects without advancing Wave 2 Feature-ID completion:

- links the legal acceptance checkboxes to readable Terms of Service, Platform Rules, and Privacy Policy routes;
- replaces the Portsmouth-only home-locality selector with server-authoritative U.S. Census TIGERweb locality search/resolution and dynamic boundary support;
- makes email verification observable and refreshes the Firebase ID token/RFxchange server session after provider verification.

See `docs/architecture/REGISTRATION_RUNTIME_REPAIRS_2026_07_31.md` and `docs/slices/REGISTRATION_REPAIR_ACCEPTANCE.md` for authority and acceptance.
