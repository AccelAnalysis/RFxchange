# Wave 2 Activation Journey Integration Gate

**Status: integration gate; no Feature-ID completion change**

## Purpose

Turn the already-built Wave 2.1–2.8 domain and persistence capabilities into one real participant journey from the public **Join** action to the organization's real marker.

This gate does not add or mark complete any tracker Feature ID. It integrates existing account, geography, organization, location, profile and marker authorities so the Wave 2 exit can be tested as a real new-user flow rather than as disconnected reference surfaces.

## Canonical runtime order

The gate preserves the normalized User Journey order:

```text
Public Join
→ Firebase account + first RFxchange user
→ required policy acceptance position
→ home locality selection
→ orientation position
→ find / claim / create organization
→ organization authority
→ confirmed location
→ essential registration
→ Profile Complete
→ real marker activation
→ controlled Exchange
```

The runtime order is independent of the order in which Wave 2 slices were engineered.

## Firebase and session boundary

The browser uses Firebase Authentication only to register/sign in and obtain a Firebase ID token. Protected activation mutations use the RFxchange server session cookie created by `FirebaseServerSessionBoundary`.

The ID-token → session-cookie exchange requires a short-lived same-site CSRF nonce. The browser never receives Firebase Admin credentials, Firestore write authority, organization authority, geography authority or marker authority.

Local Next.js development uses the configured real Firebase project by default. The Firebase Auth emulator is used only when `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL` is explicitly configured. This prevents real local acceptance from silently targeting an emulator when `.env.local` contains production/development Firebase web configuration.

## Resumable activation state

`ActivationJourneyContext` is server-managed orchestration state keyed to the trusted RFxchange user. It preserves only the information required to resume the activation UX, including provisional organization name, early policy-acceptance position, organization/membership references and an in-progress location draft.

Canonical domain records remain authoritative. The activation context cannot grant access and is never substituted for:

- the `AccessLifecycleRecord`;
- primary geography selection;
- organization resolution;
- membership/permission authorization;
- confirmed organization location;
- Profile Complete;
- marker activation.

## Policy acceptance position

The canonical User Journey places Terms / Privacy / Conduct acceptance before geography and before organization membership exists. The existing legal acknowledgement model is organization/membership-scoped. Therefore this gate captures the participant's early acceptance position in resumable activation context without fabricating versioned legal-document records.

The future OPEN gate must still re-read and require the canonical current Terms, Platform Rules and Privacy acknowledgements. This integration evidence must never satisfy `EDU-010` by itself.

## Orientation position

Slices 2.10 and 2.11 own the full three-organization interactive orientation. Until those slices are implemented, the activation gate provides a clearly labeled orientation bridge at the correct runtime position: after home locality selection and before organization resolution.

Acknowledging the bridge:

- does not complete `EDU-001`–`EDU-008`;
- does not persist tutorial completion;
- does not satisfy OPEN;
- exists only so the registration-to-marker path can be exercised before the tutorial slices land.

When 2.10/2.11 merge, the real orientation replaces this bridge without reordering the rest of onboarding.

## Organization resolution and authority

Organization identity is searched/resolved before a new tenant is created.

Existing organization:

- participant selects the existing match;
- an organization-authority claim is created with real pending evidence or administrative review;
- selection never grants management access;
- activation pauses at authority review until the existing authority workflow establishes the relationship.

Participant-created organization:

- the organization is created only after duplicate/entity-resolution safeguards pass;
- the authenticated, email-verified creator is established as the initial `primary-administrator`;
- membership, authorization, lifecycle transition and organization audit evidence commit atomically;
- this creator path is not Organization Verification and does not award a credibility state.

Email verification is required before the organization is actually created/claimed, preventing a failed identity-security check from leaving a half-created organization relationship.

## Location and geography

Home-locality selection calls `PrimaryOperatingGeographyService`; browser/map state cannot select a geography.

Location capture calls `OrganizationLocationService` with the server-authorized primary geography, U.S. Census Geocoder and authoritative TIGER boundary repository. Candidates outside the selected locality are rejected by the existing application service. The participant confirms the returned geographic candidate on the Mapbox canvas.

Physical location, public precision and service geography remain separate. The confirmed home geography becomes the initial service geography during the minimum activation path and can be enriched later.

## Essential profile and marker

Essential registration calls `EssentialOrganizationProfileService`. A meaningful capability, organization identity/contact, participation roles, business objectives, confirmed location/visibility and service geography drive the existing derived Profile Complete state.

When Profile Complete is active, the server calls `OrganizationMarkerActivationService`. The marker is activated only if existing authority, location, geography participation, completion and restriction policies all allow it.

After a real active marker exists, the access lifecycle advances only through:

```text
organization-registered
→ organization-activated
→ controlled-platform
```

This gate never advances `open-platform`. First value and OPEN remain Slice 2.12 responsibilities.

## Reference surfaces

Existing Slice 2.3–2.8 deterministic preview/reference pages may remain for acceptance and design evidence. The public `/join` route is the integrated participant enrollment surface and must not depend on Harborlight, `200 High St`, or other preview fixture state.

## Wave 2 acceptance consequence

After this gate, the registration half of the Wave 2 exit can be tested with a virgin Firebase identity and a new organization:

```text
no RFxchange user/org
→ account
→ home locality
→ new organization
→ creator authority
→ real geocode confirmation
→ essential profile
→ Profile Complete
→ real active marker
→ controlled Exchange
```

Wave 2 itself is not complete until Slices 2.9–2.12 merge and the full end-to-end exit condition—including orientation, first value and OPEN gating—is reverified.
