# Wave 2 Activation Journey Integration + Runtime Convergence Gate

**Status: required integration/convergence gate; no Feature-ID completion change**

## Purpose

Turn the already-built Wave 2.1–2.8 domain and persistence capabilities into one authoritative runtime before Slices 2.9–2.12 add acquisition continuity, orientation, first value and OPEN.

This gate does not add or mark complete any tracker Feature ID. It repairs composition, routing, authentication/session behavior, surface truthfulness and source-description drift so existing account, geography, organization, location, profile, marker and administrator authorities govern the live application.

## Public versus account boundary

RFxchange is free to join, but the RFxchange application is not public browsing infrastructure. **Public visitors receive the marketing/authentication surface only.**

Canonical rule:

```text
PUBLIC
/         marketing
/join     create an RFxchange account / begin activation
/signin   authenticate an existing account
+ public legal/marketing documents as required

AUTHENTICATED APPLICATION
participant activation and workspaces

AUTHORIZED ADMINISTRATION
authenticated platform administrator + explicit permission + active scoped grant
```

A visitor without an account/session must never receive the participant shell, functional Exchange map, Account workspace, organization workspace, operational tools or administrative UI by typing a URL. Protected participant routes redirect to Sign In; after authentication the persisted lifecycle decides whether the user resumes activation or enters the controlled Exchange.

There is no anonymous functional `/explore` or map-preview exception. Marketing may show static screenshots/illustrations, but those are not application surfaces.

A Free account is a real RFxchange account. Payment is not the base application-access gate; future commercial plans add entitlements to an authenticated participant account.

## Canonical runtime order

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
→ Organization Activated
→ controlled Exchange
→ future orientation/first-value completion
→ future OPEN
```

The runtime order is independent of the order in which Wave 2 slices were engineered.

## Firebase and RFxchange session boundary

The browser uses Firebase Authentication to register/sign in and obtain a Firebase ID token. The server verifies that credential and exchanges it for the HTTP-only RFxchange session cookie. Protected activation mutations and participant/admin routes resolve the RFxchange session rather than trusting browser state.

The ID-token → session-cookie exchange requires a short-lived same-site CSRF nonce. The browser never receives Firebase Admin credentials, Firestore write authority, organization authority, geography authority, marker authority or administrator authority.

Local Next.js development uses the configured real Firebase project by default. The Firebase Auth emulator is used only when `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL` is explicitly configured.

## Canonical participant route resolution

A valid session is necessary but not sufficient to render a participant workspace. Protected runtime resolution must verify, server-side:

1. valid RFxchange session;
2. persisted activation/lifecycle state;
3. active organization membership;
4. requested organization matches the authorized organization context;
5. no active organization or membership restriction.

Anonymous requests return to Sign In. Authenticated users who have not reached `controlled-platform` resume `/join`. Restricted/suspended/terminated states override otherwise eligible lifecycle progression without deleting the underlying lifecycle state.

Direct URL navigation can never grant access or skip activation.

## Resumable activation state

`ActivationJourneyContext` is server-managed orchestration state keyed to the trusted RFxchange user. It preserves only information needed to resume activation, including provisional organization identity, descriptive organization relationship, early policy-acceptance position, organization/membership references and an in-progress location draft.

The organization relationship (`owner`, `executive-officer`, `employee`, `authorized-representative`, `advisor-contractor`, `other`) is descriptive onboarding metadata only. It never grants membership, account control or permissions.

Canonical records remain authoritative. Activation context cannot grant access and is never substituted for the `AccessLifecycleRecord`, geography selection, organization resolution, membership/permission authorization, confirmed location, Profile Complete or marker activation.

## Organization-centered signup and durable tenant timing

The participant joins on behalf of an organization from the first registration screen; RFxchange does not create a usable detached individual participant account.

The phrase “create organization account” describes the user intent, not premature durable tenant creation. The runtime first records provisional organization context, then resolves/searches the entity. A durable new organization tenant is created only after duplicate/entity-resolution safeguards and identity-security requirements pass. Existing organizations enter the authority-claim path instead.

This reconciles the original organization-first journey with the safer current identity architecture.

## Policy acceptance position

The canonical User Journey places Terms / Privacy / Conduct acceptance before geography and before organization membership exists. The existing canonical legal acknowledgement model is organization/membership-scoped. This gate therefore captures the early acceptance position in resumable activation context without fabricating a versioned legal-document record.

The future OPEN gate must re-read and require current canonical Terms, Platform Rules and Privacy acknowledgements. The early integration acceptance cannot satisfy `EDU-010` by itself.

## Orientation position

Slices 2.10 and 2.11 own the full three-organization interactive orientation. Until those slices are implemented, activation provides a clearly labeled bridge at the correct runtime position after home-locality selection and before organization resolution.

Acknowledging the bridge does not complete `EDU-001`–`EDU-008`, persist tutorial completion, or satisfy OPEN. When 2.10/2.11 merge, the real orientation replaces the bridge without reordering onboarding.

## Organization resolution and authority

Organization identity is searched/resolved before a new tenant is created.

For an existing organization, selection creates/continues the authority workflow and never grants management access. Activation pauses until legitimate evidence or administrative review establishes the relationship.

For a participant-created organization, the organization is created only after safeguards pass; the authenticated, email-verified creator is established as the initial primary administrator through the canonical membership/authorization path. This is not Organization Verification and awards no credibility state.

Email verification is required before the organization is actually created/claimed so identity-security failure cannot leave a half-created authority relationship.

## Location and service geography

Home-locality selection calls the server-authorized geography service; browser/map state cannot grant geography authority.

Location capture uses the authorized primary geography, geocoding and authoritative boundary validation. The participant confirms the candidate map position.

Physical location, public precision and service geography remain separate concepts. For minimum low-friction activation, the confirmed home locality initializes the first service geography. The UI must disclose that assumption. Later profile enrichment can expand/refine service territory without changing the organization's home location.

## Canonical participation roles and objectives

Activation must consume the domain vocabularies rather than maintain UI-local subsets.

Participation roles are: Business, Supplier, Buyer, Opportunity/RFx Issuer, Government, EDO, Resource Provider, Chamber/Association, Lender, University/Educational Institution, Nonprofit and Other.

Business objectives include finding/issuing opportunities, finding customers/suppliers/teammates, **sending and receiving referrals**, finding resources/support and exploring the local network.

The current domain intentionally represents referral intent as one `send-receive-referrals` objective. Future workflow behavior may distinguish send versus receive actions, but activation must not omit referral intent.

## Essential profile and marker

Essential registration calls the canonical profile service. A meaningful capability, organization identity/contact, participation roles, business objectives, confirmed location/visibility and service geography drive the derived Profile Complete state.

When Profile Complete is active, the server recalculates marker eligibility. The marker activates only if authority, location, geography participation, completion and restriction policies allow it.

After a real active marker exists, lifecycle advances only through:

```text
organization-registered
→ organization-activated
→ controlled-platform
```

Terminology is deliberate:

- **Organization Activated**: the real marker/activation gate passed.
- **Controlled Exchange**: the authenticated participant may enter the currently released workspace.
- **OPEN**: later education/first-value/legal requirements have been satisfied; Slice 2.12 owns this release.

Internal `nextStep: "complete"` means registration-to-marker activation is complete; it does not mean OPEN.

## Account workspace

The participant Account destination must resolve the authenticated organization and display only real persisted state currently implemented. A production navigation item may be real, clearly disabled as later work, or omitted; it may never lead to a fixture/prototype masquerading as live data.

Later Network, RFx, Trust, Commercial and expanded administration capabilities remain governed by their approved slices.

## Administrative boundary

Every `/admin/*` runtime surface requires:

```text
valid RFxchange session
+ persisted PlatformAdministratorAccount bound to the authenticated provider subject
+ passing privileged administrator security state
+ explicit catalogued permission
+ active matching GLOBAL / GEOGRAPHY / ORGANIZATION / CASE scoped grant
+ satisfied grant conditions where applicable
```

A role label or boolean `isAdmin` is never sufficient. Organization 360 is organization-scoped; geography-scoped claim views may only return records inside the authorized geography. Private evidence and sensitive fields require their own minimum-necessary permissions.

## Reference and preview surfaces

Deterministic preview data/components may remain in source code for automated tests, design evidence and explicitly development-only tooling. They must not be reachable as production participant/admin runtime pages.

Legacy `/organization-resolution`, `/organization-authority`, `/organization-location` and `/organization-activation` URLs are compatibility redirects into the canonical activation/account/workspace state rather than independent preview experiences.

Production runtime must not depend on Harborlight, `200 High St`, Portsmouth preview organizations or equivalent fixture identity.

## Runtime convergence acceptance

The gate must prove both positive and negative paths.

Positive path:

```text
marketing
→ Join
→ Firebase registration
→ RFxchange session
→ policies
→ geography
→ organization resolution/authority
→ confirmed location
→ essential profile
→ real marker active
→ controlled Exchange
→ logout
→ returning Sign In
→ same RFxchange identity / organization / lifecycle
```

Negative paths include:

- anonymous participant URL → Sign In, never participant UI;
- incomplete authenticated account → exact activation continuation, never workspace bypass;
- wrong organization identifier → canonical authorized organization context;
- normal participant → admin URL denied;
- scoped administrator → out-of-scope organization/geography denied;
- restricted participant → normal workspace access denied;
- legacy/reference route → canonical runtime redirect or unavailable production surface.

## Wave 2 consequence

Passing this gate does not complete Wave 2. Slices 2.9–2.12 still own acquisition continuity, full orientation, first value and OPEN. No ACQ/EDU, Network, RFx Core, Trust or Commercial feature is marked Done by runtime convergence work.

The gate is the prerequisite that makes those remaining slices safe to build on one coherent application instead of disconnected feature surfaces.
